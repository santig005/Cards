'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, and, gte, count } from 'drizzle-orm'
import { normalizePhoneToE164 } from '@/lib/loyalty'

// Anti-spam: tope de clientes nuevos por negocio en una ventana corta.
const NEW_CUSTOMER_WINDOW_MS = 60_000
const MAX_NEW_CUSTOMERS_PER_WINDOW = 30

const rawPhoneSchema = z
  .string()
  .min(7, 'El número debe tener al menos 7 dígitos')
  .regex(/^\+?[0-9\s\-()]+$/, 'Solo se permiten números, espacios y el símbolo +')

type RequestOtpResult = { phone: string } | { error: string }
type VerifyOtpResult = { cardId: string } | { error: string }

/**
 * Paso 1: valida negocio + programa y dispara el OTP por WhatsApp.
 * Devuelve el teléfono normalizado para reusarlo en la verificación.
 */
export async function requestOtp(slug: string, phoneRaw: string): Promise<RequestOtpResult> {
  const parsed = rawPhoneSchema.safeParse(phoneRaw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Número de teléfono inválido' }
  }
  const phone = normalizePhoneToE164(parsed.data)
  if (!phone) return { error: 'Número de teléfono inválido' }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1)
  if (!tenant) return { error: 'Negocio no encontrado' }

  const [program] = await db
    .select()
    .from(loyaltyPrograms)
    .where(and(eq(loyaltyPrograms.tenantId, tenant.id), eq(loyaltyPrograms.isActive, true)))
    .limit(1)
  if (!program) return { error: 'Este negocio no tiene un programa de fidelización activo' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'whatsapp' },
  })

  if (error) {
    return { error: 'No pudimos enviar el código. Verificá tu número e intentá de nuevo.' }
  }

  return { phone }
}

/**
 * Paso 2: verifica el código, crea la sesión del cliente y vincula su ficha
 * (customers.auth_user_id) + tarjeta. El teléfono ya viene en E.164 del paso 1.
 *
 * La escritura corre por la conexión de servicio porque el cliente recién está
 * "reclamando" su ficha (que pudo crearse sin auth_user_id): RLS aún no lo deja
 * verla. Está acotada por el teléfono YA verificado vía OTP.
 */
export async function verifyOtp(
  slug: string,
  phone: string,
  token: string
): Promise<VerifyOtpResult> {
  const code = token.replace(/\D/g, '')
  if (code.length < 4) return { error: 'Ingresá el código completo.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
  if (error || !data.user) return { error: 'Código incorrecto o vencido.' }
  const user = data.user

  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1)
    if (!tenant) return { error: 'Negocio no encontrado' }

    const [program] = await db
      .select()
      .from(loyaltyPrograms)
      .where(and(eq(loyaltyPrograms.tenantId, tenant.id), eq(loyaltyPrograms.isActive, true)))
      .limit(1)
    if (!program) return { error: 'Este negocio no tiene un programa de fidelización activo' }

    // Buscar / crear / reclamar la ficha del cliente.
    let [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenant.id), eq(customers.phone, phone)))
      .limit(1)

    if (!customer) {
      const since = new Date(Date.now() - NEW_CUSTOMER_WINDOW_MS)
      const [recent] = await db
        .select({ value: count() })
        .from(customers)
        .where(and(eq(customers.tenantId, tenant.id), gte(customers.createdAt, since)))

      if ((recent?.value ?? 0) >= MAX_NEW_CUSTOMERS_PER_WINDOW) {
        return { error: 'Demasiados registros nuevos. Probá de nuevo en un minuto.' }
      }

      const [newCustomer] = await db
        .insert(customers)
        .values({ tenantId: tenant.id, phone, authUserId: user.id })
        .returning()
      if (!newCustomer) return { error: 'No se pudo crear el cliente' }
      customer = newCustomer
    } else if (customer.authUserId !== user.id) {
      // Vincular (o re-vincular) la ficha al usuario verificado por este teléfono.
      await db.update(customers).set({ authUserId: user.id }).where(eq(customers.id, customer.id))
    }

    // Buscar / crear la tarjeta.
    let [card] = await db
      .select()
      .from(loyaltyCards)
      .where(
        and(
          eq(loyaltyCards.tenantId, tenant.id),
          eq(loyaltyCards.customerId, customer.id),
          eq(loyaltyCards.programId, program.id)
        )
      )
      .limit(1)

    if (!card) {
      const [newCard] = await db
        .insert(loyaltyCards)
        .values({ tenantId: tenant.id, customerId: customer.id, programId: program.id })
        .returning()
      if (!newCard) return { error: 'No se pudo crear la tarjeta' }
      card = newCard
    }

    return { cardId: card.id }
  } catch {
    return { error: 'Ocurrió un error inesperado. Intentá de nuevo.' }
  }
}

/** Cierra la sesión del cliente y vuelve al landing del negocio. */
export async function logoutCustomer(slug: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/c/${slug}`)
}

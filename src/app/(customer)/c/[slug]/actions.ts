'use server'

import { z } from 'zod'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'

const phoneSchema = z
  .string()
  .min(7, 'El número debe tener al menos 7 dígitos')
  .regex(/^\+?[0-9\s\-()]+$/, 'Solo se permiten números, espacios y el símbolo +')
  .transform((val) => val.replace(/[\s\-()]/g, ''))

type GetOrCreateCardResult =
  | { cardId: string; error?: never }
  | { cardId?: never; error: string }

export async function getOrCreateCard(
  slug: string,
  phone: string
): Promise<GetOrCreateCardResult> {
  // 1. Validate phone
  const parsed = phoneSchema.safeParse(phone)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Número de teléfono inválido' }
  }
  const cleanPhone = parsed.data

  try {
    // 2. Find tenant by slug
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1)

    if (!tenant) {
      return { error: 'Negocio no encontrado' }
    }

    // 3. Find active loyalty program
    const [program] = await db
      .select()
      .from(loyaltyPrograms)
      .where(and(eq(loyaltyPrograms.tenantId, tenant.id), eq(loyaltyPrograms.isActive, true)))
      .limit(1)

    if (!program) {
      return { error: 'Este negocio no tiene un programa de fidelización activo' }
    }

    // 4. Find or create customer
    let [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenant.id), eq(customers.phone, cleanPhone)))
      .limit(1)

    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          tenantId: tenant.id,
          phone: cleanPhone,
        })
        .returning()

      if (!newCustomer) {
        return { error: 'No se pudo crear el cliente' }
      }
      customer = newCustomer
    }

    // 5. Find or create loyalty card
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
        .values({
          tenantId: tenant.id,
          customerId: customer.id,
          programId: program.id,
          currentStamps: 0,
          totalRedeemed: 0,
        })
        .returning()

      if (!newCard) {
        return { error: 'No se pudo crear la tarjeta' }
      }
      card = newCard
    }

    // 6. Return cardId
    return { cardId: card.id }
  } catch {
    return { error: 'Ocurrió un error inesperado. Intentá de nuevo.' }
  }
}

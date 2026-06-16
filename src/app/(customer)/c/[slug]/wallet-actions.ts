'use server'

import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { db } from '@/lib/drizzle/db'
import { loyaltyCards, customers, tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { createSaveUrlForCard } from '@/lib/wallet/google'

type WalletResult = { url: string } | { error: string }

/**
 * Verifica, vía RLS, que el usuario autenticado sea dueño de `cardId`.
 * Si la tarjeta no existe o no pertenece al usuario autenticado, devuelve null.
 * Mismo patrón que `verifyCardOwnership` en push-actions.ts.
 */
async function verifyCardOwnership(
  userId: string,
  cardId: string
): Promise<{ tenantId: string; customerId: string; programId: string } | null> {
  return withAuth(userId, async (tx) => {
    const [card] = await tx
      .select({
        tenantId: loyaltyCards.tenantId,
        customerId: loyaltyCards.customerId,
        programId: loyaltyCards.programId,
      })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.id, cardId))
      .limit(1)
    return card ?? null
  })
}

/**
 * Genera la URL de "Save to Google Wallet" para la tarjeta del cliente.
 * Autentica al usuario, verifica ownership de la tarjeta via RLS y llama al
 * servicio de wallet. Devuelve `{ url }` en caso de éxito o `{ error }` con
 * un código de error que el componente cliente puede traducir.
 */
export async function getWalletSaveUrl(cardId: string): Promise<WalletResult> {
  // Autenticar al usuario con Supabase Auth.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // Verificar que la tarjeta pertenece al usuario autenticado (via RLS).
  const owner = await verifyCardOwnership(user.id, cardId)
  if (!owner) return { error: 'cardNotFound' }

  // Cargar los datos completos necesarios para construir el pase.
  const [cardRows, customerRows, tenantRows, programRows] = await Promise.all([
    db
      .select({ id: loyaltyCards.id, currentStamps: loyaltyCards.currentStamps })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.id, cardId))
      .limit(1),
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      })
      .from(customers)
      .where(eq(customers.id, owner.customerId))
      .limit(1),
    db
      .select({ id: tenants.id, name: tenants.name, logoUrl: tenants.logoUrl })
      .from(tenants)
      .where(eq(tenants.id, owner.tenantId))
      .limit(1),
    db
      .select({
        stampsRequired: loyaltyPrograms.stampsRequired,
        rewardDescription: loyaltyPrograms.rewardDescription,
      })
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, owner.programId))
      .limit(1),
  ])

  const card = cardRows[0]
  const customer = customerRows[0]
  const tenant = tenantRows[0]
  const program = programRows[0]

  // Si algún dato falta, algo está inconsistente en la DB.
  if (!card || !customer || !tenant || !program) {
    return { error: 'cardNotFound' }
  }

  // Llamar al servicio de Google Wallet (no-op-safe si no está configurado).
  const result = await createSaveUrlForCard({
    card: { id: card.id, currentStamps: card.currentStamps },
    customer: { id: customer.id, name: customer.name, phone: customer.phone ?? '' },
    tenant: { id: tenant.id, name: tenant.name, logoUrl: tenant.logoUrl },
    program: {
      stampsRequired: program.stampsRequired,
      rewardDescription: program.rewardDescription,
    },
  })

  if (!result) return { error: 'notConfigured' }

  return { url: result.url }
}

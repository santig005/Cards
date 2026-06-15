import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth, type DbTransaction } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import type { User } from '@supabase/supabase-js'

type Tenant = typeof tenants.$inferSelect
type Program = typeof loyaltyPrograms.$inferSelect

/**
 * Verifies the request comes from an authenticated tenant owner and returns
 * the user, tenant, and active program. Redirects to /login on any failure.
 *
 * Use at the top of every dashboard Server Component instead of repeating
 * the createClient → getUser → withAuth → select tenant+program pattern.
 */
export async function requireTenant(): Promise<{
  user: User
  tenant: Tenant
  program: Program | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, user.id))
      .limit(1)
    if (!tenant) return null

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.tenantId, tenant.id))
      .limit(1)

    return { tenant, program: program ?? null }
  })

  if (!result) redirect('/login')
  return { user, tenant: result.tenant, program: result.program }
}

/** Error shape returned by the Server Action helpers below. */
export type TenantActionError = { error: string }

function isTenantActionError(value: unknown): value is TenantActionError {
  return typeof value === 'object' && value !== null && 'error' in value
}

/**
 * Server Action counterpart of {@link requireTenant}: instead of redirecting on
 * failure (which throws and is wrong inside an action returning a result), it
 * returns a localized `{ error }`. Use when an action must interleave work
 * outside the RLS transaction (e.g. uploading a file between reads and writes).
 */
export async function getAuthedTenant(): Promise<
  { user: User; tenant: Tenant } | TenantActionError
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const t = await getTranslations('errors')
  if (!user) return { error: t('unauthorized') }

  const [tenant] = await withAuth(user.id, (tx) =>
    tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
  )
  if (!tenant) return { error: t('businessNotFound') }

  return { user, tenant }
}

/**
 * Runs `run` inside a single RLS-scoped transaction with the authenticated user
 * and their tenant already resolved. Collapses the
 * `createClient → getUser → withAuth → select tenant` boilerplate repeated in
 * every Server Action whose work fits in one transaction.
 *
 * Returns `{ error }` (localized) if the user is unauthenticated or has no
 * tenant; otherwise returns whatever `run` returns.
 */
export async function withTenantTx<T>(
  run: (ctx: { user: User; tenant: Tenant; tx: DbTransaction }) => Promise<T>
): Promise<T | TenantActionError> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const t = await getTranslations('errors')
  if (!user) return { error: t('unauthorized') }

  return withAuth(user.id, async (tx) => {
    const [tenant] = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, user.id))
      .limit(1)
    if (!tenant) return { error: t('businessNotFound') } as TenantActionError
    return run({ user, tenant, tx })
  })
}

export { isTenantActionError }

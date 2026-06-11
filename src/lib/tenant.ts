import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
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

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { PosterView } from './poster-view'

export default async function PosterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return null
    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.tenantId, tenant.id))
      .limit(1)
    return { tenant, program: program ?? null }
  })

  if (!result) redirect('/login')
  const { tenant, program } = result
  // El afiche necesita un programa activo para mostrar la recompensa.
  if (!program) redirect('/dashboard/qr')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const clientUrl = `${appUrl}/c/${tenant.slug}`

  return (
    <PosterView
      tenantName={tenant.name}
      logoUrl={tenant.logoUrl}
      rewardDescription={program.rewardDescription}
      stampsRequired={program.stampsRequired}
      url={clientUrl}
    />
  )
}

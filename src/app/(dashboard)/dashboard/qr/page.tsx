import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRDisplay } from './qr-display'

export default async function QRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('qr')

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const clientUrl = `${appUrl}/c/${tenant!.slug}`

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitleNoProgram')}</p>
        </div>
        <Card padding="lg" className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="font-semibold text-gray-800">{t('configFirst')}</h2>
          <p className="text-sm text-gray-500">
            {t('configFirstBody')}
          </p>
          <Link href="/dashboard/onboarding">
            <Button size="md">{t('configCta')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card padding="lg" className="border-amber-100 shadow-xl shadow-amber-50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shrink-0" />
              <span className="text-sm font-semibold text-amber-700">{tenant!.name}</span>
            </div>
          </div>
          <QRDisplay url={clientUrl} tenantName={tenant!.name} />
        </Card>

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div className="text-sm">
            <span className="font-semibold text-amber-800">{t('stampsToWin', { count: program.stampsRequired })}</span>
            <span className="text-amber-700"> {t('toWin')} </span>
            <span className="text-amber-700">{program.rewardDescription}</span>
          </div>
        </div>

        <Link href="/dashboard/qr/poster" className="block mt-4">
          <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
            {t('generatePoster')}
          </Button>
        </Link>

        <div className="mt-4 text-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">{t('backToDashboard')}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

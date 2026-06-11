import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, loyaltyCards } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomerList } from './customer-list'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('customers')

  const base = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return null
    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.tenantId, tenant.id))
      .limit(1)
    return { tenant, program: program ?? null }
  })

  if (!base) redirect('/login')
  const { tenant, program } = base

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('subtitle')}</p>
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

  const customerList = await withAuth(user.id, (tx) =>
    tx
      .select({
        customerId: customers.id,
        phone: customers.phone,
        name: customers.name,
        email: customers.email,
        createdAt: customers.createdAt,
        cardId: loyaltyCards.id,
        currentStamps: loyaltyCards.currentStamps,
        totalRedeemed: loyaltyCards.totalRedeemed,
      })
      .from(customers)
      .leftJoin(loyaltyCards, eq(loyaltyCards.customerId, customers.id))
      .where(eq(customers.tenantId, tenant.id))
  )

  const count = customerList.length
  const registeredLabel =
    count === 1 ? t('registeredOne', { count }) : t('registeredOther', { count })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {count > 0 ? registeredLabel : t('subtitle')}
          </p>
        </div>
        <Link href="/dashboard/qr">
          <Button variant="secondary" size="sm">{t('shareQr')}</Button>
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🏅</span>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">{t('stampsToWin', { count: program.stampsRequired })}</span>{' '}
          {t('toWin')}{' '}
          <span className="font-medium">{program.rewardDescription}</span>
        </p>
      </div>

      <CustomerList customers={customerList} stampsRequired={program.stampsRequired} />
    </div>
  )
}

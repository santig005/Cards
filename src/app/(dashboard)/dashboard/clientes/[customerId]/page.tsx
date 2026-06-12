import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { withAuth } from '@/lib/drizzle/db'
import { customers, loyaltyCards, loyaltyPrograms, stampEvents } from '@/lib/drizzle/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireTenant } from '@/lib/tenant'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ customerId: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params
  const { user, tenant } = await requireTenant()
  const t = await getTranslations('customerDetail')
  const locale = await getLocale()

  const data = await withAuth(user.id, async (tx) => {
    const [customer] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)

    if (!customer || customer.tenantId !== tenant.id) return null

    const [card] = await tx
      .select()
      .from(loyaltyCards)
      .where(and(eq(loyaltyCards.customerId, customerId), eq(loyaltyCards.tenantId, tenant.id)))
      .limit(1)

    const program = card
      ? (await tx.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.id, card.programId)).limit(1))[0]
      : undefined

    const events = await tx
      .select()
      .from(stampEvents)
      .where(eq(stampEvents.customerId, customerId))
      .orderBy(desc(stampEvents.createdAt))
      .limit(100)

    return { customer, card: card ?? null, program: program ?? null, events }
  })

  if (!data) notFound()
  const { customer, card, program, events } = data

  const displayName = customer.name ?? customer.phone ?? 'Cliente'
  const currentStamps = card?.currentStamps ?? 0
  const stampsRequired = program?.stampsRequired ?? 0
  const totalRedeemed = card?.totalRedeemed ?? 0

  const dateFmt = new Intl.DateTimeFormat(tenant.locale ?? locale, {
    timeZone: tenant.timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-muted hover:text-amber-600 text-sm transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('backToCustomers')}
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 flex items-center justify-center shrink-0">
          <span className="text-amber-700 dark:text-amber-400 font-bold text-xl">{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-fg truncate">{displayName}</h1>
          <p className="text-sm text-muted">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ''}
          </p>
          <p className="text-xs text-muted mt-0.5">{t('since', { date: dateFmt.format(new Date(customer.createdAt)) })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-amber-100 dark:border-amber-500/20">
          <p className="text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
            {currentStamps}
            <span className="text-base text-muted">/{stampsRequired || '—'}</span>
          </p>
          <p className="text-sm text-muted mt-0.5">{t('currentStamps')}</p>
        </Card>
        <Card padding="md" className="border-emerald-100 dark:border-emerald-500/20">
          <p className="text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{totalRedeemed}</p>
          <p className="text-sm text-muted mt-0.5">{t('totalRedemptions')}</p>
        </Card>
        <Card padding="md">
          <p className="text-3xl font-bold tabular-nums text-fg">{events.length}</p>
          <p className="text-sm text-muted mt-0.5">{t('eventsCount')}</p>
        </Card>
      </div>

      {program && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎁</span>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{t('stampsToReward', { count: program.stampsRequired })}</span>{' '}
            <span className="font-medium">{program.rewardDescription}</span>
          </p>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-fg mb-3">{t('history')}</h2>
        {events.length === 0 ? (
          <Card padding="lg" className="text-center py-10">
            <p className="text-sm text-muted">{t('noActivity')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => {
              const isRedeem = ev.eventType === 'redeem'
              return (
                <Card key={ev.id} padding="sm" className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isRedeem ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-amber-100 dark:bg-amber-500/15'
                    }`}
                  >
                    {isRedeem ? '🎁' : '🏅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {isRedeem ? t('rewardRedeemed') : t('stampRegistered')}
                    </p>
                    <p className="text-xs text-muted">{dateFmt.format(new Date(ev.createdAt))}</p>
                  </div>
                  {isRedeem && (
                    <Badge variant="success" className="text-xs">
                      {t('redeemBadge')}
                    </Badge>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

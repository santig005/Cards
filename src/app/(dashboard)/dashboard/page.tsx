import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { withAuth } from '@/lib/drizzle/db'
import { customers, stampEvents, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, and, count, gte, sql } from 'drizzle-orm'
import { requireTenant } from '@/lib/tenant'
import { buildLast7Days } from '@/lib/analytics'
import { Users, Award, Gift, QrCode, Rocket, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const { user, tenant, program } = await requireTenant()
  const t = await getTranslations('dashboard')
  const locale = await getLocale()

  let customerCount = 0
  let stampCount = 0
  let redeemCount = 0
  let analytics: {
    byDay: { label: string; count: number }[]
    newCustomers7d: number
    returningCount: number
    redemptionRate: number
  } | null = null

  if (program) {
    const stats = await withAuth(user.id, async (tx) => {
      const [customerResult] = await tx
        .select({ value: count() })
        .from(customers)
        .where(eq(customers.tenantId, tenant.id))

      const [stampResult] = await tx
        .select({ value: count() })
        .from(stampEvents)
        .where(and(eq(stampEvents.tenantId, tenant.id), eq(stampEvents.eventType, 'stamp')))

      const cards = await tx
        .select({ totalRedeemed: loyaltyCards.totalRedeemed })
        .from(loyaltyCards)
        .where(eq(loyaltyCards.tenantId, tenant.id))

      const redeemedCustomers = cards.filter((c) => (c.totalRedeemed ?? 0) > 0).length
      const total = customerResult?.value ?? 0
      const redemptionRate = total > 0 ? Math.round((redeemedCustomers / total) * 100) : 0

      const TZ = tenant.timezone
      const now = new Date()
      const since = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
      const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const rawByDay = await tx
        .select({
          day: sql<string>`to_char((${stampEvents.createdAt} at time zone 'UTC') at time zone ${TZ}, 'YYYY-MM-DD')`,
          value: count(),
        })
        .from(stampEvents)
        .where(
          and(
            eq(stampEvents.tenantId, tenant.id),
            eq(stampEvents.eventType, 'stamp'),
            gte(stampEvents.createdAt, since)
          )
        )
        .groupBy(sql`1`)

      const [newCustomersResult] = await tx
        .select({ value: count() })
        .from(customers)
        .where(and(eq(customers.tenantId, tenant.id), gte(customers.createdAt, since7)))

      const perCustomer = await tx
        .select({ customerId: stampEvents.customerId, value: count() })
        .from(stampEvents)
        .where(and(eq(stampEvents.tenantId, tenant.id), eq(stampEvents.eventType, 'stamp')))
        .groupBy(stampEvents.customerId)

      const dayMap = new Map(rawByDay.map((r) => [r.day, Number(r.value)]))

      return {
        customerCount: total,
        stampCount: stampResult?.value ?? 0,
        redeemCount: cards.reduce((sum, c) => sum + (c.totalRedeemed ?? 0), 0),
        analytics: {
          byDay: buildLast7Days(now, dayMap, TZ, tenant.locale ?? locale),
          newCustomers7d: newCustomersResult?.value ?? 0,
          returningCount: perCustomer.filter((r) => Number(r.value) > 1).length,
          redemptionRate,
        },
      }
    })

    customerCount = stats.customerCount
    stampCount = stats.stampCount
    redeemCount = stats.redeemCount
    analytics = stats.analytics
  }

  const weekTotal = analytics?.byDay.reduce((s, d) => s + d.count, 0) ?? 0
  const maxDay = analytics ? Math.max(1, ...analytics.byDay.map((d) => d.count)) : 1

  const REWARD_LABELS: Record<string, string> = {
    free_product: t('rewardFreeProduct'),
    discount_percent: t('rewardDiscountPercent'),
    two_for_one: t('rewardTwoForOne'),
    custom: t('rewardCustom'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-fg">{tenant.name}</h1>
            <Badge variant="gold">{t('active')}</Badge>
          </div>
          <p className="text-muted text-sm mt-1">{t('welcome')}</p>
        </div>
      </div>

      {!program ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 p-8 text-white shadow-e2">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '18px 18px',
              borderRadius: '16px',
            }}
          />
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3">
              <Rocket className="w-6 h-6" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('setupTitle')}</h2>
            <p className="text-amber-100 text-sm mb-6 max-w-md">{t('setupBody')}</p>
            <Link href="/dashboard/onboarding">
              <Button variant="secondary" size="lg" className="bg-white text-amber-700 border-0 hover:bg-amber-50 shadow-lg">
                {t('setupCta')}
              </Button>
            </Link>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t('statCustomers'), value: customerCount, Icon: Users, accent: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300', description: t('statCustomersDesc') },
              { label: t('statStamps'), value: stampCount, Icon: Award, accent: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', description: t('statStampsDesc') },
              { label: t('statRedemptions'), value: redeemCount, Icon: Gift, accent: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', description: t('statRedemptionsDesc') },
            ].map(({ label, value, Icon, accent, description }) => (
              <Card key={label} padding="md" className="card-hover">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <p className="text-3xl font-bold tabular-nums text-fg">{value}</p>
                <p className="text-sm font-medium text-fg mt-0.5">{label}</p>
                <p className="text-xs text-muted mt-0.5">{description}</p>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  {t('activeProgram')}
                </p>
                <p className="font-semibold text-fg">
                  {program.stampsRequired} {t('stampPlural')} → {REWARD_LABELS[program.rewardType] ?? program.rewardType}
                </p>
                <p className="text-sm text-muted mt-0.5">{program.rewardDescription}</p>
              </div>
              <Link href="/dashboard/onboarding">
                <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700">
                  <Pencil className="w-3.5 h-3.5" /> {t('edit')}
                </Button>
              </Link>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/qr" className="flex-1">
              <Button size="xl" className="w-full gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
                <QrCode className="w-5 h-5" strokeWidth={2.2} />
                <span>{t('viewQr')}</span>
              </Button>
            </Link>
            <Link href="/dashboard/clientes" className="flex-1">
              <Button variant="outline" size="xl" className="w-full gap-2.5">
                <Users className="w-5 h-5" strokeWidth={2.2} />
                <span>{t('registerStamp')}</span>
              </Button>
            </Link>
          </div>

          {analytics && (
            <Card padding="md" className="border-amber-100 dark:border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wide">{t('analyticsTitle')}</p>
                  <p className="font-semibold text-fg">{t('analyticsSubtitle')}</p>
                </div>
                <span className="text-sm font-medium text-amber-700">{t('thisWeek', { count: weekTotal })}</span>
              </div>

              <div className="flex items-end justify-between gap-2 h-28">
                {analytics.byDay.map((d, i) => {
                  const pct = Math.round((d.count / maxDay) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                      <div className="w-full flex items-end justify-center flex-1">
                        <div
                          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-amber-400 to-amber-500 transition-all duration-300"
                          style={{ height: `${d.count > 0 ? Math.max(pct, 8) : 3}%` }}
                          title={`${d.count} ${d.count === 1 ? t('stampSingular') : t('stampPlural')}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted tabular-nums">{d.count}</span>
                      <span className="text-[10px] text-muted">{d.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-lg font-bold text-fg tabular-nums">{analytics.newCustomers7d}</p>
                  <p className="text-xs text-muted">{t('newCustomers7d')}</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-lg font-bold text-fg tabular-nums">{analytics.returningCount}</p>
                  <p className="text-xs text-muted">{t('returningCustomers')}</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-lg font-bold text-fg tabular-nums">{analytics.redemptionRate}%</p>
                  <p className="text-xs text-muted">{t('redemptionRate')}</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

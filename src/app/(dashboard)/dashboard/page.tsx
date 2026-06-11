import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, stampEvents, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, and, count, gte, sql } from 'drizzle-orm'
import { buildLast7Days } from '@/lib/analytics'
import { Users, Award, Gift, QrCode, Rocket, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return null

    const [program] = await tx
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.tenantId, tenant.id))
      .limit(1)

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
      const [customerResult] = await tx
        .select({ value: count() })
        .from(customers)
        .where(eq(customers.tenantId, tenant.id))

      const [stampResult] = await tx
        .select({ value: count() })
        .from(stampEvents)
        .where(and(eq(stampEvents.tenantId, tenant.id), eq(stampEvents.eventType, 'stamp')))

      customerCount = customerResult?.value ?? 0
      stampCount = stampResult?.value ?? 0

      const cards = await tx
        .select({ totalRedeemed: loyaltyCards.totalRedeemed })
        .from(loyaltyCards)
        .where(eq(loyaltyCards.tenantId, tenant.id))

      redeemCount = cards.reduce((sum, c) => sum + (c.totalRedeemed ?? 0), 0)

      // Tasa de canje: % de clientes que ya canjearon al menos un premio.
      const redeemedCustomers = cards.filter((c) => (c.totalRedeemed ?? 0) > 0).length
      const redemptionRate = customerCount > 0 ? Math.round((redeemedCustomers / customerCount) * 100) : 0

      // ── Analytics: últimos 7 días en hora local de Colombia ──
      const TZ = 'America/Bogota'
      const now = new Date()
      const nowMs = now.getTime()
      // Ventana amplia (8 días) para no perder el primer día por el offset horario;
      // el bucketing exacto lo hace el to_char en zona local + el mapeo por clave.
      const since = new Date(nowMs - 8 * 24 * 60 * 60 * 1000)
      const since7 = new Date(nowMs - 7 * 24 * 60 * 60 * 1000)

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

      // Clientes recurrentes = con más de un sello registrado.
      const perCustomer = await tx
        .select({ customerId: stampEvents.customerId, value: count() })
        .from(stampEvents)
        .where(and(eq(stampEvents.tenantId, tenant.id), eq(stampEvents.eventType, 'stamp')))
        .groupBy(stampEvents.customerId)
      const returningCount = perCustomer.filter((r) => Number(r.value) > 1).length

      const dayMap = new Map(rawByDay.map((r) => [r.day, Number(r.value)]))
      const byDay = buildLast7Days(now, dayMap, TZ)

      analytics = {
        byDay,
        newCustomers7d: newCustomersResult?.value ?? 0,
        returningCount,
        redemptionRate,
      }
    }

    return { tenant, program: program ?? null, customerCount, stampCount, redeemCount, analytics }
  })

  if (!data) redirect('/login')
  const { tenant, program, customerCount, stampCount, redeemCount, analytics } = data

  const weekTotal = analytics?.byDay.reduce((s, d) => s + d.count, 0) ?? 0
  const maxDay = analytics ? Math.max(1, ...analytics.byDay.map((d) => d.count)) : 1

  const REWARD_LABELS: Record<string, string> = {
    free_product: '🎁 Producto gratis',
    discount_percent: '💰 Descuento (%)',
    two_for_one: '2️⃣ 2x1',
    custom: '✏️ Personalizado',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">{tenant!.name}</h1>
            <Badge variant="gold">Activo</Badge>
          </div>
          <p className="text-stone-500 text-sm mt-1">Bienvenido a tu panel de fidelización</p>
        </div>
      </div>

      {!program ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 p-8 text-white shadow-e2">
          {/* Dot pattern overlay */}
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
            <h2 className="text-xl font-bold mb-2">Configurá tu programa de fidelización</h2>
            <p className="text-amber-100 text-sm mb-6 max-w-md">
              Aún no tenés un programa activo. Configurá las recompensas y comenzá a fidelizar
              a tus clientes hoy mismo.
            </p>
            <Link href="/dashboard/onboarding">
              <Button variant="secondary" size="lg" className="bg-white text-amber-700 border-0 hover:bg-amber-50 shadow-lg">
                Configurar mi programa →
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
              { label: 'Clientes', value: customerCount, Icon: Users, accent: 'bg-stone-100 text-stone-600', description: 'Total registrados' },
              { label: 'Sellos dados', value: stampCount, Icon: Award, accent: 'bg-amber-100 text-amber-700', description: 'Acumulados' },
              { label: 'Canjes', value: redeemCount, Icon: Gift, accent: 'bg-emerald-100 text-emerald-700', description: 'Recompensas entregadas' },
            ].map(({ label, value, Icon, accent, description }) => (
              <Card key={label} padding="md" className="card-hover">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <p className="text-3xl font-bold tabular-nums text-stone-800">{value}</p>
                <p className="text-sm font-medium text-stone-700 mt-0.5">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{description}</p>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">
                  Programa activo
                </p>
                <p className="font-semibold text-stone-800">
                  {program.stampsRequired} sellos → {REWARD_LABELS[program.rewardType] ?? program.rewardType}
                </p>
                <p className="text-sm text-stone-500 mt-0.5">{program.rewardDescription}</p>
              </div>
              <Link href="/dashboard/onboarding">
                <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              </Link>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/qr" className="flex-1">
              <Button size="xl" className="w-full gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
                <QrCode className="w-5 h-5" strokeWidth={2.2} />
                <span>Ver mi QR</span>
              </Button>
            </Link>
            <Link href="/dashboard/clientes" className="flex-1">
              <Button variant="outline" size="xl" className="w-full gap-2.5">
                <Users className="w-5 h-5" strokeWidth={2.2} />
                <span>Registrar sello</span>
              </Button>
            </Link>
          </div>

          {analytics && (
            <Card padding="md" className="border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Actividad</p>
                  <p className="font-semibold text-gray-800">Sellos últimos 7 días</p>
                </div>
                <span className="text-sm font-medium text-amber-700">{weekTotal} esta semana</span>
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
                          title={`${d.count} ${d.count === 1 ? 'sello' : 'sellos'}`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums">{d.count}</span>
                      <span className="text-[10px] text-gray-400">{d.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-lg font-bold text-stone-800 tabular-nums">{analytics.newCustomers7d}</p>
                  <p className="text-xs text-gray-500">Clientes nuevos (7d)</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-lg font-bold text-stone-800 tabular-nums">{analytics.returningCount}</p>
                  <p className="text-xs text-gray-500">Clientes recurrentes</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-lg font-bold text-stone-800 tabular-nums">{analytics.redemptionRate}%</p>
                  <p className="text-xs text-gray-500">Tasa de canje</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

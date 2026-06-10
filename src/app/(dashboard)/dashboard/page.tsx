import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, stampEvents, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, and, count } from 'drizzle-orm'
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
    }

    return { tenant, program: program ?? null, customerCount, stampCount, redeemCount }
  })

  if (!data) redirect('/login')
  const { tenant, program, customerCount, stampCount, redeemCount } = data

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
            <h1 className="text-2xl font-bold text-gray-900">{tenant!.name}</h1>
            <Badge variant="gold">Activo</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">Bienvenido a tu panel de fidelización</p>
        </div>
      </div>

      {!program ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800 p-8 text-white shadow-lg shadow-amber-200">
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
            <div className="text-4xl mb-3">🚀</div>
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
              {
                label: 'Clientes',
                value: customerCount,
                icon: '👥',
                bg: 'bg-white border-l-4 border-amber-400',
                iconBg: 'bg-stone-100',
                valueColor: 'text-stone-700',
                description: 'Total registrados',
              },
              {
                label: 'Sellos dados',
                value: stampCount,
                icon: '🏅',
                bg: 'bg-white border-l-4 border-amber-500',
                iconBg: 'bg-amber-100',
                valueColor: 'text-amber-700',
                description: 'Acumulados',
              },
              {
                label: 'Canjes',
                value: redeemCount,
                icon: '🎁',
                bg: 'bg-white border-l-4 border-emerald-500',
                iconBg: 'bg-emerald-100',
                valueColor: 'text-emerald-700',
                description: 'Recompensas entregadas',
              },
            ].map((stat) => (
              <Card key={stat.label} padding="md" className={`${stat.bg} border-0 card-hover`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center text-lg`}>
                    {stat.icon}
                  </div>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.description}</p>
              </Card>
            ))}
          </div>

          <Card padding="md" className="border-amber-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Programa activo
                </p>
                <p className="font-semibold text-gray-800">
                  {program.stampsRequired} sellos → {REWARD_LABELS[program.rewardType] ?? program.rewardType}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{program.rewardDescription}</p>
              </div>
              <Link href="/dashboard/onboarding">
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">Editar ⚙️</Button>
              </Link>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/qr" className="flex-1">
              <Button size="xl" className="w-full gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
                <span className="text-xl">📱</span>
                <span>Ver mi QR</span>
              </Button>
            </Link>
            <Link href="/dashboard/clientes" className="flex-1">
              <Button variant="outline" size="xl" className="w-full gap-3">
                <span className="text-xl">👥</span>
                <span>Registrar sello</span>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, stampEvents, loyaltyCards } from '@/lib/drizzle/schema'
import { eq, count } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.ownerId, user!.id),
  })

  if (!tenant) redirect('/login')

  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.tenantId, tenant!.id),
  })

  let customerCount = 0
  let stampCount = 0
  let redeemCount = 0

  if (program) {
    const [customerResult] = await db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.tenantId, tenant!.id))

    const [stampResult] = await db
      .select({ value: count() })
      .from(stampEvents)
      .where(eq(stampEvents.tenantId, tenant!.id))

    customerCount = customerResult?.value ?? 0
    stampCount = stampResult?.value ?? 0

    const cards = await db
      .select({ totalRedeemed: loyaltyCards.totalRedeemed })
      .from(loyaltyCards)
      .where(eq(loyaltyCards.tenantId, tenant!.id))

    redeemCount = cards.reduce((sum, c) => sum + (c.totalRedeemed ?? 0), 0)
  }

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
            <Badge variant="success">Activo</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">Bienvenido a tu panel de fidelización</p>
        </div>
      </div>

      {!program ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-white shadow-lg shadow-violet-200">
          <div className="relative z-10">
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="text-xl font-bold mb-2">Configurá tu programa de fidelización</h2>
            <p className="text-violet-100 text-sm mb-6 max-w-md">
              Aún no tenés un programa activo. Configurá las recompensas y comenzá a fidelizar
              a tus clientes hoy mismo.
            </p>
            <Link href="/dashboard/onboarding">
              <Button variant="secondary" size="lg" className="bg-white text-violet-700 border-0 hover:bg-violet-50 shadow-lg">
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
              { label: 'Clientes', value: customerCount, emoji: '👥', color: 'text-violet-600' },
              { label: 'Sellos entregados', value: stampCount, emoji: '🏅', color: 'text-amber-500' },
              { label: 'Canjes', value: redeemCount, emoji: '🎁', color: 'text-emerald-500' },
            ].map((stat) => (
              <Card key={stat.label} padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <span className="text-2xl">{stat.emoji}</span>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="md" className="border-violet-100">
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
                <Button variant="ghost" size="sm">Editar ⚙️</Button>
              </Link>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/qr" className="flex-1">
              <Button size="lg" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-200 text-base">
                📱 Ver mi QR
              </Button>
            </Link>
            <Link href="/dashboard/clientes" className="flex-1">
              <Button variant="secondary" size="lg" className="w-full text-base">
                👥 Dar sello a cliente
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

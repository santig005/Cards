import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms, customers, loyaltyCards } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StampButton } from './stamp-button'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.ownerId, user.id),
  })

  if (!tenant) redirect('/login')

  const program = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.tenantId, tenant!.id),
  })

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestioná los sellos de tus clientes</p>
        </div>
        <Card padding="lg" className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="font-semibold text-gray-800">Configurá tu programa primero</h2>
          <p className="text-sm text-gray-500">
            Antes de gestionar clientes, configurá tu programa de fidelización.
          </p>
          <Link href="/dashboard/onboarding">
            <Button size="md">Configurar programa</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const customerList = await db
    .select({
      customerId: customers.id,
      phone: customers.phone,
      name: customers.name,
      email: customers.email,
      cardId: loyaltyCards.id,
      currentStamps: loyaltyCards.currentStamps,
      totalRedeemed: loyaltyCards.totalRedeemed,
    })
    .from(customers)
    .leftJoin(loyaltyCards, eq(loyaltyCards.customerId, customers.id))
    .where(eq(customers.tenantId, tenant!.id))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customerList.length > 0
              ? `${customerList.length} cliente${customerList.length !== 1 ? 's' : ''} registrado${customerList.length !== 1 ? 's' : ''}`
              : 'Gestioná los sellos de tus clientes'}
          </p>
        </div>
        <Link href="/dashboard/qr">
          <Button variant="secondary" size="sm">📱 Compartir QR</Button>
        </Link>
      </div>

      {/* Search hint — visual only */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <div className="h-10 pl-9 pr-4 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-400 flex items-center shadow-sm">
          Buscar cliente por nombre o teléfono...
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-xl">🏅</span>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">{program.stampsRequired} sellos</span> para ganar:{' '}
          <span className="font-medium">{program.rewardDescription}</span>
        </p>
      </div>

      {customerList.length === 0 ? (
        <Card padding="lg" className="text-center space-y-4 py-16">
          <div className="text-6xl">👥</div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Aún no tenés clientes</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Compartí tu QR para que tus clientes empiecen a acumular sellos.
              ¡El primer cliente está a un escaneo de distancia!
            </p>
          </div>
          <Link href="/dashboard/qr">
            <Button size="md" className="bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-200">
              Ver mi QR 📱
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {customerList.map((c, index) => {
            const displayName = c.name ?? c.phone ?? c.email ?? 'Cliente'
            const currentStamps = c.currentStamps ?? 0
            const progress = Math.min((currentStamps / program.stampsRequired) * 100, 100)
            const staggerClass = index < 5 ? `animate-fade-up stagger-${index + 1}` : ''

            return (
              <Card key={c.customerId} padding="md" className={`hover:shadow-md transition-all duration-150 ${staggerClass}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-violet-600 font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                      <span className="text-xs font-medium text-gray-500 shrink-0">
                        {currentStamps}/{program.stampsRequired} sellos
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {c.totalRedeemed != null && c.totalRedeemed > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">
                        🎁 {c.totalRedeemed} canje{c.totalRedeemed !== 1 ? 's' : ''} total{c.totalRedeemed !== 1 ? 'es' : ''}
                      </p>
                    )}
                  </div>
                  {c.cardId ? (
                    <StampButton
                      cardId={c.cardId}
                      currentStamps={currentStamps}
                      stampsRequired={program.stampsRequired}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Sin tarjeta</span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

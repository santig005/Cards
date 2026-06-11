import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/drizzle/db'
import { tenants, customers, loyaltyCards, loyaltyPrograms, stampEvents } from '@/lib/drizzle/schema'
import { and, desc, eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ customerId: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('customerDetail')

  const data = await withAuth(user.id, async (tx) => {
    const [tenant] = await tx.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    if (!tenant) return null

    const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1)
    // RLS ya aísla por tenant; este check es defensa en profundidad.
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

  // Format date using Intl — locale-aware but no server-side locale injection needed for date display
  const dateFmt = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-amber-600 text-sm transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('backToCustomers')}
      </Link>

      {/* Encabezado del cliente */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
          <span className="text-amber-700 font-bold text-xl">{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
          <p className="text-sm text-gray-500">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{t('since', { date: dateFmt.format(new Date(customer.createdAt)) })}</p>
        </div>
      </div>

      {/* Estado de la tarjeta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-amber-100">
          <p className="text-3xl font-bold tabular-nums text-amber-700">
            {currentStamps}
            <span className="text-base text-gray-400">/{stampsRequired || '—'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{t('currentStamps')}</p>
        </Card>
        <Card padding="md" className="border-emerald-100">
          <p className="text-3xl font-bold tabular-nums text-emerald-700">{totalRedeemed}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t('totalRedemptions')}</p>
        </Card>
        <Card padding="md">
          <p className="text-3xl font-bold tabular-nums text-stone-700">{events.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t('eventsCount')}</p>
        </Card>
      </div>

      {program && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎁</span>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{t('stampsToReward', { count: program.stampsRequired })}</span>{' '}
            <span className="font-medium">{program.rewardDescription}</span>
          </p>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">{t('history')}</h2>
        {events.length === 0 ? (
          <Card padding="lg" className="text-center py-10">
            <p className="text-sm text-gray-500">{t('noActivity')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => {
              const isRedeem = ev.eventType === 'redeem'
              return (
                <Card key={ev.id} padding="sm" className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isRedeem ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}
                  >
                    {isRedeem ? '🎁' : '🏅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {isRedeem ? t('rewardRedeemed') : t('stampRegistered')}
                    </p>
                    <p className="text-xs text-gray-400">{dateFmt.format(new Date(ev.createdAt))}</p>
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

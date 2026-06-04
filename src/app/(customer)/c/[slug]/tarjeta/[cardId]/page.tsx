import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/drizzle/db'
import { loyaltyCards, tenants, loyaltyPrograms, customers } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ slug: string; cardId: string }>
}

function getStampGridClass(stampsRequired: number): string {
  if (stampsRequired <= 5) return 'grid grid-cols-5 gap-2.5 justify-items-center'
  if (stampsRequired <= 10) return 'grid grid-cols-5 gap-2.5 justify-items-center'
  if (stampsRequired <= 12) return 'grid grid-cols-6 gap-2.5 justify-items-center'
  return 'flex flex-wrap gap-2.5 justify-center'
}

function StampGrid({
  currentStamps,
  stampsRequired,
}: {
  currentStamps: number
  stampsRequired: number
}) {
  const stamps = Array.from({ length: stampsRequired })
  const gridClass = getStampGridClass(stampsRequired)

  return (
    <div
      className={gridClass}
      role="list"
      aria-label={`${currentStamps} de ${stampsRequired} sellos`}
    >
      {stamps.map((_, i) => {
        const isFilled = i < currentStamps
        return (
          <div
            key={i}
            role="listitem"
            aria-label={isFilled ? 'Sello acumulado' : 'Sello pendiente'}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${
                isFilled
                  ? 'bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.4)] scale-100'
                  : 'bg-white/10 border border-white/20 scale-95 opacity-70'
              }
            `}
          >
            {isFilled && (
              <svg
                className="w-5 h-5 text-amber-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function CardPage({ params }: PageProps) {
  const { slug, cardId } = await params

  // Fetch the loyalty card
  const [card] = await db
    .select()
    .from(loyaltyCards)
    .where(eq(loyaltyCards.id, cardId))
    .limit(1)

  if (!card) {
    notFound()
  }

  // Fetch related data in parallel
  const [tenantResult, programResult, customerResult] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, card.tenantId)).limit(1),
    db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.id, card.programId)).limit(1),
    db.select().from(customers).where(eq(customers.id, card.customerId)).limit(1),
  ])

  const tenant = tenantResult[0]
  const program = programResult[0]
  const customer = customerResult[0]

  // Verify tenant slug matches URL param (security)
  if (!tenant || tenant.slug !== slug) {
    notFound()
  }

  if (!program || !customer) {
    notFound()
  }

  const isRedeemable = card.currentStamps >= program.stampsRequired
  const progressPercent = Math.min(
    Math.round((card.currentStamps / program.stampsRequired) * 100),
    100
  )

  const cardBackground = isRedeemable
    ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'
    : 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 40%, #6d28d9 70%, #7c3aed 100%)'

  const cardShadow = isRedeemable
    ? '0 25px 50px -12px rgba(6, 78, 59, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
    : '0 25px 50px -12px rgba(109, 40, 217, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)'

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-violet-950 to-gray-950 flex flex-col items-center py-8 px-4 gap-5">
      {/* Page header */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <Link
          href={`/c/${slug}`}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </Link>
        {customer.name ? (
          <span className="text-white/60 text-sm">{customer.name}</span>
        ) : customer.phone ? (
          <span className="text-white/60 text-sm">{customer.phone}</span>
        ) : null}
      </div>

      {/* Card wrapper — redeemable pulse ring */}
      <div className="w-full max-w-sm relative">
        {isRedeemable && (
          <div
            className="absolute inset-0 rounded-[28px] animate-ping bg-emerald-400/20 z-0"
            style={{ animationDuration: '2s' }}
          />
        )}

        {/* THE CARD */}
        <div
          className="relative rounded-[28px] overflow-hidden p-6 shadow-2xl z-10"
          style={{ background: cardBackground, boxShadow: cardShadow }}
        >
          {/* Dot pattern texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative z-10 space-y-5">
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-xs uppercase tracking-widest font-medium ${
                    isRedeemable ? 'text-emerald-300' : 'text-violet-300'
                  }`}
                >
                  Sellio
                </p>
                <h1 className="text-2xl font-bold text-white mt-0.5">{tenant.name}</h1>
                {customer.phone && (
                  <p className="text-white/50 text-xs mt-0.5">{customer.phone}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white shrink-0">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Redeemable banner */}
            {isRedeemable && (
              <div className="glass rounded-2xl p-4 text-center border border-white/20">
                <p className="text-white font-bold text-base">¡Recompensa lista!</p>
                <p className="text-emerald-100 text-sm mt-0.5">
                  Mostrá esta pantalla al cajero para reclamar tu premio
                </p>
              </div>
            )}

            {/* Stamp grid */}
            <StampGrid
              currentStamps={card.currentStamps}
              stampsRequired={program.stampsRequired}
            />

            {/* Progress bar + count */}
            <div className="space-y-2">
              <div
                className="h-2 rounded-full bg-white/15 overflow-hidden"
                role="progressbar"
                aria-valuenow={card.currentStamps}
                aria-valuemin={0}
                aria-valuemax={program.stampsRequired}
              >
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">
                  <span className="text-white font-semibold">{card.currentStamps}</span>
                  {' / '}
                  {program.stampsRequired} sellos
                </span>
                {card.totalRedeemed > 0 && (
                  <Badge variant="info" className="text-xs px-2 py-0.5">
                    {card.totalRedeemed} {card.totalRedeemed === 1 ? 'canje' : 'canjes'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward info card */}
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
              🎁
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                Próxima recompensa
              </p>
              <p className="font-semibold text-gray-900 text-sm">{program.rewardDescription}</p>
              <div className="mt-2 space-y-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {isRedeemable
                    ? '¡Recompensa lista para canjear!'
                    : `${program.stampsRequired - card.currentStamps} sellos para tu premio`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save link tip */}
      <p className="text-white/40 text-xs text-center max-w-xs px-4">
        💡 Guardá este link en tu celular para ver tu tarjeta cuando quieras
      </p>

      {/* Footer */}
      <footer className="pb-2 text-center">
        <p className="text-xs text-white/30">
          Powered by <span className="text-violet-400 font-medium">Sellio</span>
        </p>
      </footer>
    </main>
  )
}

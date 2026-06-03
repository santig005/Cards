import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/drizzle/db'
import { loyaltyCards, tenants, loyaltyPrograms, customers } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ slug: string; cardId: string }>
}

function StampGrid({
  currentStamps,
  stampsRequired,
}: {
  currentStamps: number
  stampsRequired: number
}) {
  const stamps = Array.from({ length: stampsRequired })

  return (
    <div
      className="flex flex-wrap gap-2.5 justify-center"
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
              w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-300
              ${
                isFilled
                  ? 'bg-amber-400 shadow-lg shadow-amber-400/40 scale-100'
                  : 'border-2 border-white/30 bg-white/10 scale-95 opacity-70'
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

  return (
    <main className="min-h-screen bg-violet-50 flex flex-col items-center justify-center p-4 gap-6">
      {/* Card */}
      <div className="w-full max-w-sm">
        {isRedeemable ? (
          /* Redeemable state — emerald gradient */
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 p-8 shadow-2xl shadow-emerald-300/50">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-200 text-xs uppercase tracking-widest font-medium">
                    Sellio
                  </p>
                  <h1 className="text-2xl font-bold text-white mt-0.5">{tenant.name}</h1>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Redeemable banner */}
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30">
                <p className="text-4xl mb-2">🎁</p>
                <p className="text-white font-bold text-lg">¡Recompensa lista!</p>
                <p className="text-emerald-100 text-sm mt-1">
                  Mostrá esta pantalla al cajero para reclamar tu premio
                </p>
              </div>

              {/* Stamp grid */}
              <StampGrid
                currentStamps={card.currentStamps}
                stampsRequired={program.stampsRequired}
              />

              {/* Reward description */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-emerald-200 text-xs uppercase tracking-wider font-medium mb-1">
                  Tu recompensa
                </p>
                <p className="text-white font-semibold">{program.rewardDescription}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-200">
                  <span className="text-white font-bold">{card.currentStamps}</span> /{' '}
                  {program.stampsRequired} sellos
                </span>
                {card.totalRedeemed > 0 && (
                  <span className="text-emerald-200">
                    {card.totalRedeemed} canje{card.totalRedeemed !== 1 ? 's' : ''} realizados
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal state — violet gradient */
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 p-8 shadow-2xl shadow-violet-300/40">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-violet-300 text-xs uppercase tracking-widest font-medium">
                    Sellio
                  </p>
                  <h1 className="text-2xl font-bold text-white mt-0.5">{tenant.name}</h1>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Stamp count */}
              <div className="text-center space-y-1">
                <p className="text-violet-300 text-xs uppercase tracking-wider">Tus sellos</p>
                <p className="text-white">
                  <span className="text-5xl font-bold tabular-nums">{card.currentStamps}</span>
                  <span className="text-violet-300 text-xl">/{program.stampsRequired}</span>
                </p>
              </div>

              {/* Stamp grid */}
              <StampGrid
                currentStamps={card.currentStamps}
                stampsRequired={program.stampsRequired}
              />

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={card.currentStamps}
                    aria-valuemin={0}
                    aria-valuemax={program.stampsRequired}
                  />
                </div>
                <p className="text-violet-300 text-xs text-right">
                  {program.stampsRequired - card.currentStamps} sellos para tu premio
                </p>
              </div>

              {/* Reward description */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-violet-300 text-xs uppercase tracking-wider font-medium mb-1">
                  Próxima recompensa
                </p>
                <p className="text-white font-semibold">{program.rewardDescription}</p>
              </div>

              {/* Stats */}
              {card.totalRedeemed > 0 && (
                <p className="text-violet-300 text-sm text-center">
                  {card.totalRedeemed} canje{card.totalRedeemed !== 1 ? 's' : ''} realizados
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {isRedeemable && (
          <Badge variant="success" className="text-sm px-3 py-1">
            Recompensa disponible
          </Badge>
        )}
        {card.totalRedeemed > 0 && (
          <Badge variant="info" className="text-sm px-3 py-1">
            {card.totalRedeemed} {card.totalRedeemed === 1 ? 'canje' : 'canjes'} realizados
          </Badge>
        )}
        {customer.name && (
          <Badge variant="default" className="text-sm px-3 py-1">
            {customer.name}
          </Badge>
        )}
      </div>

      {/* Back button */}
      <Link
        href={`/c/${slug}`}
        className="text-violet-600 text-sm font-medium hover:text-violet-800 transition-colors underline underline-offset-4"
      >
        ← Volver a {tenant.name}
      </Link>

      {/* Footer */}
      <footer className="pb-2 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="text-violet-500 font-medium">Sellio</span>
        </p>
      </footer>
    </main>
  )
}

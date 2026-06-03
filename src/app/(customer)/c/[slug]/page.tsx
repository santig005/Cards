import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { PhoneForm } from './phone-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

function StampPreview({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-9 h-9 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default async function CustomerLandingPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch tenant and active program in parallel
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)

  if (!tenant) {
    return (
      <main className="min-h-screen bg-violet-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800">Negocio no encontrado</h1>
          <p className="text-gray-500">
            El enlace que visitaste no corresponde a ningún negocio registrado en Sellio.
          </p>
        </div>
      </main>
    )
  }

  const [program] = await db
    .select()
    .from(loyaltyPrograms)
    .where(and(eq(loyaltyPrograms.tenantId, tenant.id), eq(loyaltyPrograms.isActive, true)))
    .limit(1)

  if (!program) {
    return (
      <main className="min-h-screen bg-violet-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-6xl">😴</div>
          <h1 className="text-2xl font-bold text-gray-800">{tenant.name}</h1>
          <p className="text-gray-500">
            Este negocio no tiene un programa de fidelización activo por el momento.
          </p>
        </div>
      </main>
    )
  }

  const stampsToShow = Math.min(program.stampsRequired, 12)

  return (
    <main className="min-h-screen bg-violet-50 flex flex-col items-center justify-between p-4">
      {/* Hero header */}
      <div className="w-full max-w-sm pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 text-violet-400 text-sm font-medium mb-6 bg-white/60 px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="text-violet-500">✦</span>
          <span>Sellio</span>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-purple-700 p-8 shadow-2xl shadow-violet-300/40">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

          <div className="relative z-10 space-y-6">
            {/* Business name */}
            <div>
              {tenant.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={tenant.logoUrl}
                  alt={`Logo de ${tenant.name}`}
                  className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 ring-2 ring-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <p className="text-violet-200 text-sm mt-1">Programa de fidelización</p>
            </div>

            {/* Reward info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-left">
              <p className="text-violet-200 text-xs uppercase tracking-wider font-medium mb-1">
                Recompensa
              </p>
              <p className="text-white font-semibold text-base leading-snug">
                {program.rewardDescription}
              </p>
              <p className="text-violet-300 text-sm mt-2">
                Acumulá{' '}
                <span className="text-amber-300 font-bold">{program.stampsRequired} sellos</span> y
                reclamá tu premio
              </p>
            </div>

            {/* Stamp preview */}
            <div className="space-y-2">
              <p className="text-violet-300 text-xs text-center uppercase tracking-wider">
                Vista previa
              </p>
              <StampPreview count={stampsToShow} />
              {program.stampsRequired > 12 && (
                <p className="text-violet-300 text-xs text-center">
                  +{program.stampsRequired - 12} más
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone form card */}
      <div className="w-full max-w-sm py-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-100/60 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">¿Ya sos cliente?</h2>
            <p className="text-gray-500 text-sm">
              Ingresá tu número de celular para ver o crear tu tarjeta de fidelización.
            </p>
          </div>

          <PhoneForm slug={slug} />
        </div>
      </div>

      {/* Footer */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by{' '}
          <span className="text-violet-500 font-medium">Sellio</span>
        </p>
      </footer>
    </main>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.ownerId, user.id),
  })

  if (!tenant) redirect('/login')

  const existingProgram = await db.query.loyaltyPrograms.findFirst({
    where: eq(loyaltyPrograms.tenantId, tenant.id),
  })

  const isEditing = !!existingProgram

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {isEditing ? '✓' : '1'}
            </div>
            <p className="text-violet-200 text-sm">
              {isEditing ? 'Editando programa' : 'Configuración inicial'}
            </p>
          </div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editá tu programa' : 'Configurá tu programa'}
          </h1>
          <p className="text-violet-200 text-sm mt-1">
            {isEditing ? 'Los cambios se aplican de inmediato' : 'Solo tomará 2 minutos ⚡'}
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Cuenta', 'Programa', 'Listo'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    i === 1
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-300'
                      : i === 0
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i === 1 ? 'text-violet-700' : i === 0 ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
                {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        <Card padding="lg" className="shadow-xl shadow-violet-100/50 border-violet-100">
          <OnboardingForm
            defaultBusinessName={tenant.name}
            existingProgram={existingProgram ?? undefined}
          />
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Podés cambiar esta configuración cuando quieras.
        </p>
      </div>
    </div>
  )
}

import { getTranslations, getLocale } from 'next-intl/server'
import { requireTenant } from '@/lib/tenant'
import { Card } from '@/components/ui/card'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const { tenant, program: existingProgram } = await requireTenant()
  const t = await getTranslations('onboarding')
  const uiLocale = (await getLocale()) as 'es' | 'en' | 'pt'

  const isEditing = !!existingProgram
  const steps = [t('stepAccount'), t('stepProgram'), t('stepReady')]

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {isEditing ? '✓' : '1'}
            </div>
            <p className="text-amber-100 text-sm">
              {isEditing ? t('editingLabel') : t('initialSetup')}
            </p>
          </div>
          <h1 className="text-2xl font-bold">
            {isEditing ? t('editTitle') : t('createTitle')}
          </h1>
          <p className="text-amber-100 text-sm mt-1">
            {isEditing ? t('editSubtitle') : t('createSubtitle')}
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    i === 1
                      ? 'bg-amber-500 text-stone-950 shadow-sm shadow-amber-300'
                      : i === 0
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-2 text-muted'
                  }`}
                >
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    i === 1 ? 'text-amber-700 dark:text-amber-400' : i === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
                  }`}
                >
                  {step}
                </span>
                {i < 2 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        <Card padding="lg" className="border-amber-100 dark:border-amber-500/20">
          <OnboardingForm
            defaultBusinessName={tenant.name}
            defaultLogoUrl={tenant.logoUrl ?? undefined}
            existingProgram={existingProgram ?? undefined}
            defaultCountryCode={tenant.countryCode}
            defaultTimezone={tenant.timezone}
            defaultLocale={(tenant.locale as 'es' | 'en' | 'pt') ?? 'es'}
            uiLocale={uiLocale}
          />
        </Card>

        <p className="text-center text-xs text-muted mt-6">{t('changeLater')}</p>
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProgram } from './actions'

interface ExistingProgram {
  stampsRequired: number
  rewardType: string
  rewardDescription: string
}

interface OnboardingFormProps {
  defaultBusinessName: string
  defaultLogoUrl?: string
  existingProgram?: ExistingProgram
}

type RewardType = 'free_product' | 'discount_percent' | 'two_for_one' | 'custom'

export function OnboardingForm({ defaultBusinessName, defaultLogoUrl, existingProgram }: OnboardingFormProps) {
  const t = useTranslations('onboarding')
  const [selectedReward, setSelectedReward] = useState<RewardType>(
    (existingProgram?.rewardType as RewardType) ?? 'free_product'
  )
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultLogoUrl ?? null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const REWARD_OPTIONS: {
    value: RewardType
    emoji: string
    labelKey: 'rewardFreeProductLabel' | 'rewardDiscountLabel' | 'rewardTwoForOneLabel' | 'rewardCustomLabel'
    descKey: 'rewardFreeProductDesc' | 'rewardDiscountDesc' | 'rewardTwoForOneDesc' | 'rewardCustomDesc'
  }[] = [
    { value: 'free_product', emoji: '🎁', labelKey: 'rewardFreeProductLabel', descKey: 'rewardFreeProductDesc' },
    { value: 'discount_percent', emoji: '💰', labelKey: 'rewardDiscountLabel', descKey: 'rewardDiscountDesc' },
    { value: 'two_for_one', emoji: '2️⃣', labelKey: 'rewardTwoForOneLabel', descKey: 'rewardTwoForOneDesc' },
    { value: 'custom', emoji: '✏️', labelKey: 'rewardCustomLabel', descKey: 'rewardCustomDesc' },
  ]

  const placeholderMap: Record<RewardType, string> = {
    free_product: t('rewardFreeProductPlaceholder'),
    discount_percent: t('rewardDiscountPlaceholder'),
    two_for_one: t('rewardTwoForOnePlaceholder'),
    custom: t('rewardCustomPlaceholder'),
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createProgram(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Logo */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-fg">{t('logoLabel')}</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoPreview} alt={t('logoAlt')} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-amber-300 dark:text-amber-500/70">🏪</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? t('changeLogo') : t('uploadLogo')}
            </Button>
            <span className="text-xs text-muted">{t('logoHint')}</span>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Business name */}
      <div>
        <Input
          name="businessName"
          label={t('businessNameLabel')}
          defaultValue={defaultBusinessName}
          placeholder={t('businessNamePlaceholder')}
          required
        />
      </div>

      {/* Stamps required */}
      <div>
        <Input
          name="stampsRequired"
          label={t('stampsLabel')}
          type="number"
          defaultValue={String(existingProgram?.stampsRequired ?? 10)}
          min={3}
          max={30}
          hint={t('stampsHint')}
          required
        />
      </div>

      {/* Reward type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-fg">{t('rewardTypeLabel')}</p>
        <input type="hidden" name="rewardType" value={selectedReward} />
        <div className="grid grid-cols-2 gap-3">
          {REWARD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedReward(option.value)}
              className={`relative flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                selectedReward === option.value
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 shadow-sm'
                  : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2'
              }`}
            >
              {selectedReward === option.value && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-xs">
                  ✓
                </span>
              )}
              <span className="text-2xl">{option.emoji}</span>
              <span
                className={`text-sm font-semibold ${
                  selectedReward === option.value ? 'text-amber-700 dark:text-amber-400' : 'text-fg'
                }`}
              >
                {t(option.labelKey)}
              </span>
              <span className="text-xs text-muted leading-snug">{t(option.descKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reward description */}
      <div className="space-y-1.5">
        <label htmlFor="rewardDescription" className="text-sm font-medium text-fg">
          {selectedReward === 'custom' ? t('rewardDescLabelCustom') : t('rewardDescLabel')}
        </label>
        <textarea
          id="rewardDescription"
          name="rewardDescription"
          rows={3}
          defaultValue={existingProgram?.rewardDescription ?? ''}
          placeholder={placeholderMap[selectedReward]}
          required
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-fg transition-colors hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 resize-none bg-surface placeholder:text-muted"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        loading={isPending}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]"
      >
        {existingProgram ? t('saveChanges') : t('startUsing')}
      </Button>
    </form>
  )
}

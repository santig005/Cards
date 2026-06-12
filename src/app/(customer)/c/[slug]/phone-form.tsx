'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getCountry, DEFAULT_COUNTRY } from '@/lib/countries'
import { getLegalNoticeKey } from '@/lib/legal'
import { requestOtp, verifyOtp } from './actions'

interface PhoneFormProps {
  slug: string
  /** ISO 3166-1 alpha-2 country code of the business (drives legal notice + dial code hint). */
  countryCode?: string
}

type Step = 'phone' | 'code'

export function PhoneForm({ slug, countryCode = DEFAULT_COUNTRY }: PhoneFormProps) {
  const router = useRouter()
  const t = useTranslations('customer.form')
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState('') // teléfono normalizado (E.164) del paso 1
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const country = getCountry(countryCode) ?? getCountry(DEFAULT_COUNTRY)!
  const legalKey = getLegalNoticeKey(countryCode)

  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(undefined)
    setLoading(true)
    try {
      const result = await requestOtp(slug, phone)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSentTo(result.phone)
      setStep('code')
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError(undefined)
    setLoading(true)
    try {
      const result = await verifyOtp(slug, sentTo, code)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(`/c/${slug}/tarjeta/${result.cardId}`)
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  function backToPhone(): void {
    setStep('phone')
    setCode('')
    setError(undefined)
  }

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">{t('sentTo', { phone: sentTo })}</p>
        <Input
          type="text"
          label={t('codeLabel')}
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error}
          hint={t('codeHint')}
          disabled={loading}
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          className="h-12 text-base tracking-[0.3em] text-center font-semibold"
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={code.replace(/\D/g, '').length < 4}
          className="w-full"
        >
          {loading ? t('verifying') : t('verify')}
        </Button>
        <button
          type="button"
          onClick={backToPhone}
          disabled={loading}
          className="text-center text-xs text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-50"
        >
          ← {t('changeNumber')}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
      {/* Phone input with dial code prefix badge */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700 select-none">
          {t('phoneLabel')}
        </label>
        <div className="flex items-center gap-2">
          <span
            className="flex h-12 items-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-fg shrink-0 select-none"
            title={country.nameEn}
          >
            {country.flag} +{country.dialCode}
          </span>
          <input
            type="tel"
            placeholder="300 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            autoComplete="tel"
            inputMode="tel"
            className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-fg placeholder:text-muted transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
            </svg>
            {error}
          </p>
        )}
        <p className="text-xs text-gray-400">{t('phoneHint')}</p>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={phone.trim().length < 7}
        className="w-full"
      >
        {loading ? t('sending') : t('continue')}
      </Button>
      <p className="text-center text-xs text-gray-400 pt-1 leading-relaxed">{t(legalKey)}</p>
    </form>
  )
}

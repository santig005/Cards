'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { requestOtp, verifyOtp } from './actions'

interface PhoneFormProps {
  slug: string
}

type Step = 'phone' | 'code'

export function PhoneForm({ slug }: PhoneFormProps) {
  const router = useRouter()
  const t = useTranslations('customer.form')
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState('') // teléfono normalizado (E.164) del paso 1
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
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

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
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

  function backToPhone() {
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
      <Input
        type="tel"
        label={t('phoneLabel')}
        placeholder="+57 300 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={error}
        hint={t('phoneHint')}
        disabled={loading}
        autoComplete="tel"
        inputMode="tel"
        className="h-12 text-base"
      />
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
      <p className="text-center text-xs text-gray-400 pt-1 leading-relaxed">{t('habeas')}</p>
    </form>
  )
}

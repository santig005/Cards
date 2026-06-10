'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { requestOtp, verifyOtp } from './actions'

interface PhoneFormProps {
  slug: string
}

type Step = 'phone' | 'code'

export function PhoneForm({ slug }: PhoneFormProps) {
  const router = useRouter()
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
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
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
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
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
        <div className="text-sm text-gray-600">
          Te enviamos un código por WhatsApp a{' '}
          <span className="font-semibold text-gray-900">{sentTo}</span>.
        </div>
        <Input
          type="text"
          label="Código de verificación"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error}
          hint="Revisá tu WhatsApp e ingresá el código de 6 dígitos"
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
          {loading ? 'Verificando...' : 'Ver mi tarjeta'}
        </Button>
        <button
          type="button"
          onClick={backToPhone}
          disabled={loading}
          className="text-center text-xs text-gray-400 hover:text-amber-600 transition-colors disabled:opacity-50"
        >
          ← Usar otro número
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
      <Input
        type="tel"
        label="Tu número de celular"
        placeholder="+57 300 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={error}
        hint="Te enviaremos un código por WhatsApp para identificarte"
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
        {loading ? 'Enviando código...' : 'Continuar con WhatsApp'}
      </Button>
      <p className="text-center text-xs text-gray-400 pt-1 leading-relaxed">
        Al continuar aceptás el tratamiento de tu número según la Ley 1581 de 2012
        (Habeas Data). No compartimos tu información con terceros.
      </p>
    </form>
  )
}

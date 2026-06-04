'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getOrCreateCard } from './actions'

interface PhoneFormProps {
  slug: string
}

export function PhoneForm({ slug }: PhoneFormProps) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(undefined)
    setLoading(true)

    try {
      const result = await getOrCreateCard(slug, phone)

      if (result.error) {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        type="tel"
        label="Tu número de celular"
        placeholder="+57 300 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={error}
        hint="Solo necesitamos tu número para identificarte"
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
        {loading ? 'Buscando tu tarjeta...' : 'Ver mi tarjeta'}
      </Button>
      <p className="text-center text-xs text-gray-400 pt-1">
        No compartimos tu número con terceros
      </p>
    </form>
  )
}

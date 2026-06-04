'use client'

import { useState, useTransition } from 'react'
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
  existingProgram?: ExistingProgram
}

const REWARD_OPTIONS = [
  {
    value: 'free_product',
    emoji: '🎁',
    label: 'Producto gratis',
    description: 'El cliente recibe un producto sin costo',
  },
  {
    value: 'discount_percent',
    emoji: '💰',
    label: 'Descuento (%)',
    description: 'Porcentaje de descuento en su próxima compra',
  },
  {
    value: 'two_for_one',
    emoji: '2️⃣',
    label: '2x1',
    description: 'Lleva dos y paga uno',
  },
  {
    value: 'custom',
    emoji: '✏️',
    label: 'Personalizado',
    description: 'Definí tu propia recompensa',
  },
] as const

type RewardType = 'free_product' | 'discount_percent' | 'two_for_one' | 'custom'

export function OnboardingForm({ defaultBusinessName, existingProgram }: OnboardingFormProps) {
  const [selectedReward, setSelectedReward] = useState<RewardType>(
    (existingProgram?.rewardType as RewardType) ?? 'free_product'
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
      {/* Business name */}
      <div>
        <Input
          name="businessName"
          label="Nombre del negocio"
          defaultValue={defaultBusinessName}
          placeholder="Ej: Café del Centro"
          required
        />
      </div>

      {/* Stamps required */}
      <div>
        <Input
          name="stampsRequired"
          label="¿Cuántos sellos para la recompensa?"
          type="number"
          defaultValue={String(existingProgram?.stampsRequired ?? 10)}
          min={3}
          max={30}
          hint="Entre 3 y 30 sellos"
          required
        />
      </div>

      {/* Reward type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Tipo de recompensa</p>
        <input type="hidden" name="rewardType" value={selectedReward} />
        <div className="grid grid-cols-2 gap-3">
          {REWARD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedReward(option.value)}
              className={`relative flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                selectedReward === option.value
                  ? 'border-amber-500 bg-amber-50 shadow-sm shadow-amber-100'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
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
                  selectedReward === option.value ? 'text-amber-700' : 'text-gray-800'
                }`}
              >
                {option.label}
              </span>
              <span className="text-xs text-gray-500 leading-snug">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reward description */}
      <div className="space-y-1.5">
        <label htmlFor="rewardDescription" className="text-sm font-medium text-gray-700">
          {selectedReward === 'custom'
            ? 'Describí tu recompensa personalizada'
            : 'Descripción de la recompensa'}
        </label>
        <textarea
          id="rewardDescription"
          name="rewardDescription"
          rows={3}
          defaultValue={existingProgram?.rewardDescription ?? ''}
          placeholder={
            selectedReward === 'free_product'
              ? 'Ej: Un café americano mediano'
              : selectedReward === 'discount_percent'
              ? 'Ej: 15% de descuento en tu próxima compra'
              : selectedReward === 'two_for_one'
              ? 'Ej: 2x1 en bebidas frías'
              : 'Describí la recompensa que vas a ofrecer…'
          }
          required
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 resize-none bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
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
        {existingProgram ? 'Guardar cambios' : 'Comenzar a usar Sellio 🚀'}
      </Button>
    </form>
  )
}

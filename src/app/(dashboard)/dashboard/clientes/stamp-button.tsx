'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { addStamp } from './actions'

interface StampButtonProps {
  cardId: string
  currentStamps: number
  stampsRequired: number
}

export function StampButton({ cardId, currentStamps, stampsRequired }: StampButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'redeem' | 'error' } | null>(null)

  function handleAddStamp() {
    startTransition(async () => {
      const result = await addStamp(cardId)
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else if (result.redeemed) {
        setToast({
          message: `🎉 ¡Recompensa canjeada! ${result.rewardDescription ?? ''}`,
          type: 'redeem',
        })
      } else {
        setToast({ message: '✅ Sello registrado', type: 'success' })
      }
      setTimeout(() => setToast(null), 3000)
    })
  }

  const remaining = stampsRequired - currentStamps

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="primary"
        loading={isPending}
        onClick={handleAddStamp}
        className="shrink-0"
      >
        {remaining === 1 ? '🎁 Último sello' : `+1 Sello`}
      </Button>
      {toast && (
        <div
          className={`absolute right-0 top-10 z-20 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium shadow-lg transition-all ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-700'
              : toast.type === 'redeem'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

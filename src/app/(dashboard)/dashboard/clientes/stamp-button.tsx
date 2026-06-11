'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { addStamp, redeemReward, undoLastStamp } from './actions'
import { fireConfetti } from '@/components/features/confetti-trigger'

interface StampButtonProps {
  cardId: string
  currentStamps: number
  stampsRequired: number
}

type Toast = { message: string; type: 'success' | 'redeem' | 'error' }

export function StampButton({ cardId, currentStamps, stampsRequired }: StampButtonProps) {
  const t = useTranslations('customerItem')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<Toast | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  const isFull = currentStamps >= stampsRequired
  const remaining = stampsRequired - currentStamps

  function flash(toastData: Toast, withUndo = false) {
    setToast(toastData)
    setCanUndo(withUndo)
    setTimeout(() => {
      setToast(null)
      setCanUndo(false)
    }, 4000)
  }

  function handleAddStamp() {
    startTransition(async () => {
      const result = await addStamp(cardId)
      if ('error' in result) {
        flash({ message: result.error, type: 'error' })
      } else if (result.full) {
        flash({ message: t('toastCardFull'), type: 'redeem' }, true)
      } else {
        flash({ message: t('toastStampAdded'), type: 'success' }, true)
      }
    })
  }

  function handleRedeem() {
    startTransition(async () => {
      const result = await redeemReward(cardId)
      if ('error' in result) {
        flash({ message: result.error, type: 'error' })
      } else {
        flash({ message: t('toastRewardDelivered', { reward: result.rewardDescription }), type: 'redeem' })
        fireConfetti()
      }
    })
  }

  function handleUndo() {
    startTransition(async () => {
      const result = await undoLastStamp(cardId)
      flash(
        'error' in result
          ? { message: result.error, type: 'error' }
          : { message: t('toastUndone'), type: 'success' }
      )
    })
  }

  return (
    <div className="relative">
      {isFull ? (
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={handleRedeem}
          className="shrink-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
        >
          {t('redeem')}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={handleAddStamp}
          className="shrink-0"
        >
          {remaining === 1 ? t('lastStamp') : t('addStamp')}
        </Button>
      )}

      {toast && (
        <div
          className={`absolute right-0 top-10 z-20 flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium shadow-lg transition-all ${
            toast.type === 'error'
              ? 'bg-red-100 text-red-700'
              : toast.type === 'redeem'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {toast.message}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={isPending}
              className="underline underline-offset-2 hover:opacity-70 disabled:opacity-50"
            >
              {t('undo')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

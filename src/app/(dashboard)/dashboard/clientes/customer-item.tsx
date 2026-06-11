'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StampButton } from './stamp-button'
import { updateCustomer, deleteCustomer } from './actions'

export interface CustomerRow {
  customerId: string
  phone: string
  name: string | null
  email: string | null
  createdAt: Date
  cardId: string | null
  currentStamps: number | null
  totalRedeemed: number | null
}

interface CustomerItemProps {
  customer: CustomerRow
  stampsRequired: number
  index: number
}

export function CustomerItem({ customer, stampsRequired, index }: CustomerItemProps) {
  const t = useTranslations('customerItem')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(customer.name ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const displayName = customer.name ?? customer.phone ?? customer.email ?? 'Cliente'
  const currentStamps = customer.currentStamps ?? 0
  const progress = Math.min((currentStamps / stampsRequired) * 100, 100)
  const staggerClass = index < 5 ? `animate-fade-up stagger-${index + 1}` : ''

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const r = await updateCustomer(customer.customerId, { name, email })
      if ('error' in r) setError(r.error)
      else setEditing(false)
    })
  }

  function handleDelete() {
    if (
      !window.confirm(t('confirmDelete', { name: displayName }))
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await deleteCustomer(customer.customerId)
      if ('error' in r) setError(r.error)
      // Si sale bien, revalidatePath refresca la lista y esta fila desaparece.
    })
  }

  return (
    <Card padding="md" className={`hover:shadow-md transition-all duration-150 ${staggerClass}`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
          <span className="text-amber-700 font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            <span className="text-xs font-medium text-gray-500 shrink-0">
              {t('stampsOf', { current: currentStamps, required: stampsRequired })}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {customer.totalRedeemed != null && customer.totalRedeemed > 0 && (
            <p className="text-xs text-emerald-600 mt-1">
              {t('redemptionsTotal', { count: customer.totalRedeemed })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/dashboard/clientes/${customer.customerId}`}
            aria-label="Ver detalle del cliente"
            title="Ver detalle"
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v)
              setError(null)
            }}
            aria-label="Editar cliente"
            title="Editar"
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {customer.cardId ? (
            <StampButton
              cardId={customer.cardId}
              currentStamps={currentStamps}
              stampsRequired={stampsRequired}
            />
          ) : (
            <span className="text-xs text-gray-400">{t('noCard')}</span>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('nameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              disabled={isPending}
            />
            <Input
              label={t('emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              disabled={isPending}
            />
          </div>
          <p className="text-xs text-gray-400">{t('phoneReadonly', { phone: customer.phone })}</p>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={isPending}
              className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={isPending}>
                {t('cancel')}
              </Button>
              <Button type="button" size="sm" onClick={handleSave} loading={isPending}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

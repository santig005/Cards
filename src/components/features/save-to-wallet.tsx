'use client'

/**
 * Botón "Add to Google Wallet" para la tarjeta del cliente.
 * Al hacer click genera la URL del pase vía server action y redirige al usuario.
 * Si el servicio no está configurado (prop `enabled = false`), no renderiza nada.
 *
 * Nota: el ícono SVG inline es un placeholder. Se puede reemplazar por el asset
 * oficial de Google (https://developers.google.com/wallet/generic/resources/branding)
 * cuando se tenga acceso aprobado al programa de Google Wallet Issuer.
 */

import { useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getWalletSaveUrl } from '@/app/(customer)/c/[slug]/wallet-actions'

export interface SaveToWalletProps {
  cardId: string
  /** Debe ser true solo si `isGoogleWalletConfigured()` devuelve true en el servidor. */
  enabled: boolean
}

export function SaveToWallet({ cardId, enabled }: SaveToWalletProps) {
  const t = useTranslations('wallet')
  const [isPending, startTransition] = useTransition()
  // Mensaje de error localizado para mostrar debajo del botón sin romper la UI.
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Si el servicio de Google Wallet no está configurado, el botón no aparece.
  if (!enabled) return null

  function handleClick(): void {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const result = await getWalletSaveUrl(cardId)

        if ('url' in result) {
          // Redirigir al flujo de Google para guardar el pase.
          window.location.href = result.url
          return
        }

        // El servicio devolvió un error; mostrar mensaje localizado al usuario.
        if (result.error === 'notConfigured') {
          setErrorMsg(t('notConfigured'))
        } else {
          setErrorMsg(t('error'))
        }
      } catch {
        setErrorMsg(t('error'))
      }
    })
  }

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={t('addToWallet')}
        className="w-full flex items-center justify-center gap-2.5 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white text-sm font-semibold rounded-xl py-3 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {/* Ícono SVG inline de wallet — reemplazar con asset oficial de Google si se aprueba */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M16 12a2 2 0 0 1 2-2h2v4h-2a2 2 0 0 1-2-2z" fill="currentColor" stroke="none" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>

        <span>{isPending ? t('adding') : t('addToWallet')}</span>
      </button>

      {/* Error inline: solo visible cuando ocurre un fallo, sin romper el layout */}
      {errorMsg && (
        <p className="mt-2 text-xs text-red-500 text-center" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}

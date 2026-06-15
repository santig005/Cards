'use client'

/**
 * Componente de opt-in para notificaciones Web Push.
 * Maneja tres estados: no suscrito, suscrito, permiso denegado.
 * Re-ofrece el prompt tras REOFFER_AFTER_VISITS visitas si fue descartado.
 */

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  isPushSupported,
  subscribeToPush,
  getCurrentSubscription,
} from '@/lib/push/client'
import {
  savePushSubscription,
  deletePushSubscription,
  updateNotificationPrefs,
} from '@/app/(customer)/c/[slug]/push-actions'

// Cantidad de visitas que deben pasar antes de re-ofrecer el prompt tras ser descartado.
const REOFFER_AFTER_VISITS = 3

// Clave en localStorage para persistir estado del prompt.
const STORAGE_KEY = 'sellio_push_prompt'

interface PushOptInProps {
  cardId: string
  vapidPublicKey: string
  initialPrefs: { notifyReward: boolean; notifyNewStamp: boolean }
}

// Datos que persisten en localStorage.
interface PromptStorage {
  dismissed: boolean
  visitsSinceDismiss: number
}

/** Lee el estado de localStorage de forma segura (falla en modo incógnito). */
function readStorage(): PromptStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { dismissed: false, visitsSinceDismiss: 0 }
    return JSON.parse(raw) as PromptStorage
  } catch {
    return { dismissed: false, visitsSinceDismiss: 0 }
  }
}

/** Escribe en localStorage de forma segura. */
function writeStorage(data: PromptStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // modo incógnito u otros errores: ignorar silenciosamente
  }
}

export function PushOptIn({ cardId, vapidPublicKey, initialPrefs }: PushOptInProps) {
  const t = useTranslations('pushOptIn')

  // Estado de permiso del navegador.
  const [permission, setPermission] = useState<NotificationPermission>('default')
  // Si existe suscripción activa en el pushManager.
  const [isSubscribed, setIsSubscribed] = useState(false)
  // Si el componente ya terminó de inicializar (para evitar flash).
  const [ready, setReady] = useState(false)
  // Si mostrar el prompt de opt-in (gestionado por lógica de re-oferta).
  const [showPrompt, setShowPrompt] = useState(false)
  // Preferencias granulares controladas.
  const [prefs, setPrefs] = useState(initialPrefs)
  // Mensaje de error localizado para el usuario.
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // useTransition para operaciones asíncronas de suscribir/desuscribir.
  const [isPending, startTransition] = useTransition()
  // Loading independiente para cada toggle de preferencia.
  const [prefLoading, setPrefLoading] = useState(false)

  // Soporte detectado una sola vez en tiempo de render (no cambia durante la vida del componente).
  const supported = isPushSupported() && !!vapidPublicKey

  // Inicialización: leer estado real del navegador y lógica de re-oferta.
  // Solo corre cuando el entorno soporta Web Push. Todo setState queda dentro del
  // callback async para satisfacer react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!supported) return

    // Capturar el permiso actual antes del await para evitar condiciones de carrera.
    const currentPermission = Notification.permission

    // Verificar suscripción activa (async); actualizar todo el estado de una vez.
    getCurrentSubscription().then((sub) => {
      setPermission(currentPermission)
      setIsSubscribed(!!sub)

      if (currentPermission === 'default') {
        // Lógica de re-oferta: incrementar visitas y decidir si mostrar prompt.
        const stored = readStorage()
        if (!stored.dismissed) {
          // Primera vez o nunca descartó: mostrar prompt.
          setShowPrompt(true)
        } else {
          const newVisits = stored.visitsSinceDismiss + 1
          writeStorage({ dismissed: true, visitsSinceDismiss: newVisits })
          if (newVisits >= REOFFER_AFTER_VISITS) {
            // Suficientes visitas: re-ofrecer y resetear contador.
            writeStorage({ dismissed: false, visitsSinceDismiss: 0 })
            setShowPrompt(true)
          }
        }
      }

      setReady(true)
    })
  }, [supported])

  // No renderiza nada si el navegador no soporta Push o no hay clave VAPID.
  if (!supported) return null
  // Espera a que termine la inicialización para evitar flash de UI incorrecto.
  if (!ready) return null

  // --- Manejo de suscripción ---

  function handleEnable(): void {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const result = await Notification.requestPermission()
        setPermission(result)

        if (result !== 'granted') return

        const sub = await subscribeToPush(vapidPublicKey)
        const saveResult = await savePushSubscription(cardId, sub)

        if ('error' in saveResult) {
          setErrorMsg(t('error'))
          return
        }

        setIsSubscribed(true)
        setShowPrompt(false)
        // Limpiar estado de re-oferta una vez suscrito.
        writeStorage({ dismissed: false, visitsSinceDismiss: 0 })
      } catch {
        setErrorMsg(t('error'))
      }
    })
  }

  function handleNotNow(): void {
    setShowPrompt(false)
    writeStorage({ dismissed: true, visitsSinceDismiss: 0 })
  }

  function handleDisable(): void {
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const sub = await getCurrentSubscription()
        if (sub) {
          await sub.unsubscribe()
          await deletePushSubscription(sub.endpoint)
        }
        // Nota: desuscribirse NO revoca el permiso del navegador (sigue 'granted').
        // No tocamos `permission`; con la suscripción en false, el prompt de
        // "volver a activar" se muestra (ver condición de render más abajo).
        setIsSubscribed(false)
        setShowPrompt(true)
        writeStorage({ dismissed: false, visitsSinceDismiss: 0 })
      } catch {
        setErrorMsg(t('error'))
      }
    })
  }

  async function handleTogglePref(
    key: 'notifyReward' | 'notifyNewStamp',
    value: boolean
  ): Promise<void> {
    setErrorMsg(null)
    const previousPrefs = prefs
    // Actualización optimista.
    const nextPrefs = { ...prefs, [key]: value }
    setPrefs(nextPrefs)
    setPrefLoading(true)

    try {
      const result = await updateNotificationPrefs(cardId, nextPrefs)
      if ('error' in result) {
        // Revertir si falla.
        setPrefs(previousPrefs)
        setErrorMsg(t('error'))
      }
    } catch {
      setPrefs(previousPrefs)
      setErrorMsg(t('error'))
    } finally {
      setPrefLoading(false)
    }
  }

  // --- Renderizado por estado ---

  // Estado: permiso denegado explícitamente por el navegador.
  if (permission === 'denied') {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
              🔕
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                {t('title')}
              </p>
              <p className="text-sm text-gray-500">{t('denied')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado: ya suscrito con permiso otorgado → mostrar toggles de preferencias.
  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
              🔔
            </div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('subscribed')}
            </p>
          </div>

          {/* Toggle: recompensa lista */}
          <div className="flex items-center justify-between py-1">
            <label
              htmlFor="pref-reward"
              className="text-sm text-gray-700 select-none cursor-pointer"
            >
              {t('prefReward')}
            </label>
            <button
              id="pref-reward"
              role="switch"
              aria-checked={prefs.notifyReward}
              aria-label={t('prefReward')}
              disabled={prefLoading || isPending}
              onClick={() => handleTogglePref('notifyReward', !prefs.notifyReward)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 ${
                prefs.notifyReward ? 'bg-amber-400' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  prefs.notifyReward ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle: nuevo sello */}
          <div className="flex items-center justify-between py-1">
            <label
              htmlFor="pref-stamp"
              className="text-sm text-gray-700 select-none cursor-pointer"
            >
              {t('prefNewStamp')}
            </label>
            <button
              id="pref-stamp"
              role="switch"
              aria-checked={prefs.notifyNewStamp}
              aria-label={t('prefNewStamp')}
              disabled={prefLoading || isPending}
              onClick={() => handleTogglePref('notifyNewStamp', !prefs.notifyNewStamp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 ${
                prefs.notifyNewStamp ? 'bg-amber-400' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  prefs.notifyNewStamp ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Error inline */}
          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

          {/* Botón discreto para desactivar */}
          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={handleDisable}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {isPending ? '...' : t('disable')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado: se ofrece activar. Cubre permiso 'default' (con lógica de re-oferta)
  // y también 'granted' sin suscripción activa (p.ej. tras desactivar o si la
  // suscripción expiró), para que siempre haya forma de volver a suscribirse.
  if (!isSubscribed && (showPrompt || permission === 'granted')) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('title')}
              </p>
              <p className="text-sm text-gray-700 mb-3">{t('description')}</p>

              {/* Error inline */}
              {errorMsg && <p className="text-xs text-red-500 mb-2">{errorMsg}</p>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={isPending}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-stone-950 text-sm font-semibold rounded-xl py-2 px-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? t('enabling') : t('enableButton')}
                </button>
                {permission === 'default' && (
                  <button
                    type="button"
                    onClick={handleNotNow}
                    disabled={isPending}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 px-2 py-2"
                  >
                    {t('notNow')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Estado: 'default' pero el prompt fue descartado y aún no se re-ofrece → no renderiza.
  return null
}

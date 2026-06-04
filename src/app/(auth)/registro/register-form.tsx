'use client'

import { useActionState } from 'react'
import { register } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const StoreIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <path
      d="M1.5 6.5V13a.5.5 0 0 0 .5.5h4V10h4v3.5h4a.5.5 0 0 0 .5-.5V6.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1 4l1-1.5h12L15 4l-1 2.5c-.4.6-1.4.6-2 0a1.2 1.2 0 0 1-2 0 1.2 1.2 0 0 1-2 0 1.2 1.2 0 0 1-2 0C5.4 7.1 4.4 7.1 4 6.5L3 4H1z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const EmailIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.25" />
    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
)

const LockIcon = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    <circle cx="8" cy="10.5" r="1" fill="currentColor" />
  </svg>
)

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => register(formData),
    null as { error?: string; success?: string } | null
  )

  if (state?.success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="none">
            <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900">¡Casi listo!</p>
        <p className="text-sm text-gray-500">{state.success}</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <Input
        name="businessName"
        type="text"
        label="Nombre del negocio"
        required
        placeholder="Ej: Café El Rincón"
        icon={StoreIcon}
      />
      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        placeholder="tu@negocio.com"
        icon={EmailIcon}
      />
      <Input
        name="password"
        type="password"
        label="Contraseña"
        required
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        icon={LockIcon}
      />

      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="xl"
        loading={pending}
        className="w-full mt-2"
      >
        Crear cuenta gratis →
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        ✓ Sin tarjeta de crédito · ✓ Cancelás cuando quieras
      </p>
    </form>
  )
}

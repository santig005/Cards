'use client'

import { useActionState } from 'react'
import { register } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => register(formData),
    null as { error?: string; success?: string } | null
  )

  if (state?.success) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">📬</div>
        <p className="font-semibold text-gray-900">¡Casi listo!</p>
        <p className="text-sm text-gray-500 mt-2">{state.success}</p>
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
      />
      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        placeholder="tu@negocio.com"
      />
      <Input
        name="password"
        type="password"
        label="Contraseña"
        required
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
      />

      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span>⚠️</span> {state.error}
        </div>
      )}

      <Button type="submit" loading={pending} className="w-full" size="lg">
        Crear cuenta gratis
      </Button>

      <p className="text-center text-xs text-gray-400">
        Al registrarte aceptás los términos de uso de Sellio.
      </p>
    </form>
  )
}

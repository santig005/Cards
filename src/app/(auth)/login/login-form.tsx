'use client'

import { useActionState } from 'react'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => login(formData),
    null
  )

  return (
    <form action={action} className="space-y-4">
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
        autoComplete="current-password"
        placeholder="••••••••"
      />

      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span>⚠️</span> {state.error}
        </div>
      )}

      <Button type="submit" loading={pending} className="w-full" size="lg">
        Ingresar
      </Button>
    </form>
  )
}

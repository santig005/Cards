'use client'

import { useActionState } from 'react'
import { register } from '../actions'

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => register(formData),
    null as { error?: string; success?: string } | null
  )

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del negocio
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Café El Rincón"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu@negocio.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}

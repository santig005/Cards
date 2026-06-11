'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { login } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

export function LoginForm() {
  const t = useTranslations('auth')
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => login(formData),
    null
  )

  return (
    <form action={action} className="space-y-4">
      <Input
        name="email"
        type="email"
        label={t('emailLabel')}
        required
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        icon={EmailIcon}
      />
      <div className="space-y-1.5">
        <Input
          name="password"
          type="password"
          label={t('passwordLabel')}
          required
          autoComplete="current-password"
          placeholder={t('passwordPlaceholder')}
          icon={LockIcon}
        />
        <div className="text-right">
          <button
            type="button"
            className="text-xs text-stone-400 hover:text-amber-400 transition-colors"
          >
            {t('forgotPassword')}
          </button>
        </div>
      </div>

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
        {t('loginCta')}
      </Button>
    </form>
  )
}

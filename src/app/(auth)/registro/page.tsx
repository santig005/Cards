import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { RegisterForm } from './register-form'

export default async function RegisterPage() {
  const t = await getTranslations('auth')

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8">
        {/* Mobile logo — only visible when left panel is hidden */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <span className="text-stone-950 text-sm font-bold">S</span>
          </div>
          <span className="font-bold text-fg">Sellio</span>
        </div>

        <h2 className="text-2xl font-bold text-fg">{t('registerTitle')}</h2>
        <p className="text-muted text-sm mt-1">
          {t('registerSubtitle')}
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted mt-6">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-amber-600 font-semibold hover:text-amber-700">
          {t('loginLink')}
        </Link>
      </p>
    </div>
  )
}

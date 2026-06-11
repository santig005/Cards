import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from './login-form'

export default async function LoginPage() {
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

        <h2 className="text-2xl font-bold text-fg">{t('loginTitle')}</h2>
        <p className="text-muted text-sm mt-1">{t('loginSubtitle')}</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted mt-6">
        {t('noAccount')}{' '}
        <Link href="/registro" className="text-amber-600 font-semibold hover:text-amber-700">
          {t('registerLink')}
        </Link>
      </p>
    </div>
  )
}

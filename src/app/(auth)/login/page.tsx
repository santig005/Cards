import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8">
        {/* Mobile logo — only visible when left panel is hidden */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="font-bold text-gray-900">Sellio</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h2>
        <p className="text-gray-500 text-sm mt-1">Ingresá a tu panel de fidelización</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-violet-600 font-semibold hover:text-violet-700">
          Registrá tu negocio →
        </Link>
      </p>
    </div>
  )
}

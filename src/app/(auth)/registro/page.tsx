import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-8">
        {/* Mobile logo — only visible when left panel is hidden */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <span className="text-stone-950 text-sm font-bold">S</span>
          </div>
          <span className="font-bold text-gray-900">Sellio</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Empezá gratis hoy</h2>
        <p className="text-gray-500 text-sm mt-1">
          Configurá tu programa en menos de 2 minutos
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-amber-600 font-semibold hover:text-amber-700">
          Iniciá sesión →
        </Link>
      </p>
    </div>
  )
}

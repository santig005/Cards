import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Registrá tu negocio</h2>
      <p className="text-sm text-gray-500 mb-6">Gratis para siempre en el plan básico.</p>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
          Iniciá sesión →
        </Link>
      </p>
    </div>
  )
}

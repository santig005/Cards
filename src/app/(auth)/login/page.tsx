import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Iniciá sesión</h2>
      <LoginForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-violet-600 hover:text-violet-700 font-semibold">
          Registrá tu negocio →
        </Link>
      </p>
    </div>
  )
}

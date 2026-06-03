import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
      <LoginForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="text-blue-600 hover:underline font-medium">
          Registrá tu negocio
        </Link>
      </p>
    </div>
  )
}

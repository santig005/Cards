import Link from 'next/link'
import { RegisterForm } from './register-form'

export default function RegisterPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Registrá tu negocio</h2>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}

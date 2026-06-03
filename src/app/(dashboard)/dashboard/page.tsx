import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { logout } from '@/app/(auth)/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tenant = user
    ? await db.query.tenants.findFirst({ where: eq(tenants.ownerId, user.id) })
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tenant ? tenant.name : 'Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Panel de administración</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Clientes', value: '0' },
          { label: 'Sellos entregados', value: '0' },
          { label: 'Canjes', value: '0' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

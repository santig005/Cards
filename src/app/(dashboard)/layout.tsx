import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { SidebarNav } from '@/components/features/sidebar-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tenant = user
    ? await db.query.tenants.findFirst({ where: eq(tenants.ownerId, user.id) })
    : null

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <SidebarNav tenantName={tenant?.name ?? 'Sellio'} userEmail={user.email ?? ''} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-bold text-gray-900">Sellio</span>
          </div>
          <span className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

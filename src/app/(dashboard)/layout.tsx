import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { SidebarNav } from '@/components/features/sidebar-nav'
import { MobileBottomNav } from '@/components/features/mobile-bottom-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [tenant] = user
    ? await db.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1)
    : []

  return (
    <div className="min-h-screen bg-[#fafafe] flex">
      {/* Sidebar */}
      <SidebarNav tenantName={tenant?.name ?? 'Sellio'} userEmail={user.email ?? ''} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-amber-100 px-4 h-14 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)]">
              <span className="text-stone-950 text-xs font-bold">S</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Sellio</span>
          </div>
          <span className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </div>
  )
}

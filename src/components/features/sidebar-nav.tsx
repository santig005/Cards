'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'

interface SidebarNavProps {
  tenantName: string
  userEmail: string
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊', exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', emoji: '👥', exact: false },
  { href: '/dashboard/qr', label: 'Mi QR', emoji: '📱', exact: false },
  { href: '/dashboard/onboarding', label: 'Programa', emoji: '⚙️', exact: false },
]

export function SidebarNav({ tenantName, userEmail }: SidebarNavProps) {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen sticky top-0 h-screen">
      {/* Logo / Brand */}
      <div className="py-5 px-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)] shrink-0">
            <span className="text-stone-950 font-bold text-base">S</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{tenantName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.35)] pl-3 pr-3'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800 px-3'
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className="mx-3 mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 text-xs shrink-0">
          ✦
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 leading-tight">Plan Básico</p>
          <p className="text-[10px] text-amber-500">Gratis para siempre</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <span className="text-base">🚪</span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

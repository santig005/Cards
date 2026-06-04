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
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-200 shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{tenantName}</p>
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
                  ? 'bg-violet-50 text-violet-700 shadow-sm border-l-2 border-violet-500 pl-[10px] pr-3'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-3'
              }`}
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-3 py-3 border-t border-gray-100 mt-auto">
        <div className="bg-violet-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-violet-700">Plan Básico</p>
            <p className="text-xs text-gray-400">Gratis para siempre</p>
          </div>
          <span className="text-violet-500 text-xs">✦</span>
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

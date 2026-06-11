'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { NAV_ITEMS, isNavActive } from './nav-items'

interface SidebarNavProps {
  tenantName: string
  userEmail: string
}

export function SidebarNav({ tenantName, userEmail }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border min-h-screen sticky top-0 h-screen">
      {/* Logo / Brand */}
      <div className="py-5 px-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)] shrink-0">
            <span className="text-stone-950 font-bold text-base">S</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm leading-tight truncate">{tenantName}</p>
            <p className="text-xs text-stone-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-500" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className="mx-3 mb-3 rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-2 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 text-xs shrink-0">
          ✦
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-700 leading-tight">Plan Básico</p>
          <p className="text-[10px] text-amber-600/80">Gratis para siempre</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

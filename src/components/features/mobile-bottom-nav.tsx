'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊', exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', emoji: '👥', exact: false },
  { href: '/dashboard/qr', label: 'Mi QR', emoji: '📱', exact: false },
  { href: '/dashboard/onboarding', label: 'Programa', emoji: '⚙️', exact: false },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors duration-150 ${
              active ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-lg leading-none">{item.emoji}</span>
            <span>{item.label}</span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-amber-500 rounded-t-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

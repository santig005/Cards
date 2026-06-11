'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { NAV_ITEMS, isNavActive } from './nav-items'

export function MobileBottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-border flex z-20">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href, item.exact)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors duration-150 ${
              active ? 'text-amber-600' : 'text-muted hover:text-fg'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
            <span>{t(item.labelKey)}</span>
            {active && <span className="absolute bottom-0 w-8 h-0.5 bg-amber-500 rounded-t-full" />}
          </Link>
        )
      })}
    </nav>
  )
}

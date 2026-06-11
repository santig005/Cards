import { LayoutDashboard, Users, QrCode, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  labelKey: 'dashboard' | 'customers' | 'myQr' | 'program'
  icon: LucideIcon
  exact: boolean
}

// Fuente única de la navegación (evita drift entre sidebar y bottom-nav).
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clientes', labelKey: 'customers', icon: Users, exact: false },
  { href: '/dashboard/qr', labelKey: 'myQr', icon: QrCode, exact: false },
  { href: '/dashboard/onboarding', labelKey: 'program', icon: Settings, exact: false },
]

export function isNavActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname.startsWith(href)
}

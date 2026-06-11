import { LayoutDashboard, Users, QrCode, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact: boolean
}

// Fuente única de la navegación (evita drift entre sidebar y bottom-nav).
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users, exact: false },
  { href: '/dashboard/qr', label: 'Mi QR', icon: QrCode, exact: false },
  { href: '/dashboard/onboarding', label: 'Programa', icon: Settings, exact: false },
]

export function isNavActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname.startsWith(href)
}

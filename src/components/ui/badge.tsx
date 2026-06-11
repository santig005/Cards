import { type HTMLAttributes } from 'react'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'dark'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  default: 'bg-stone-100 text-stone-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-600',
  gold:    'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950',
  dark:    'bg-stone-900 text-amber-400 border border-amber-500/20',
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

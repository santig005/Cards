import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'dark'
type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold hover:from-amber-400 hover:to-amber-500 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.45)] hover:shadow-[0_6px_20px_-2px_rgb(245_158_11_/_0.6)]',
  secondary: 'bg-surface text-fg border border-border hover:bg-surface-2 hover:border-border-strong shadow-sm',
  ghost:     'text-muted hover:bg-surface-2 hover:text-fg',
  danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  outline:   'bg-surface text-fg border border-border hover:bg-surface-2 hover:border-border-strong shadow-sm',
  dark:      'bg-stone-900 text-amber-400 border border-amber-500/20 hover:bg-stone-800 hover:border-amber-500/40 shadow-sm',
}

const sizes: Record<Size, string> = {
  xs: 'h-7  px-2.5 text-xs  rounded-lg  gap-1',
  sm: 'h-8  px-3   text-xs  rounded-lg  gap-1.5',
  md: 'h-10 px-4   text-sm  rounded-xl  gap-2',
  lg: 'h-11 px-5   text-sm  rounded-xl  gap-2',
  xl: 'h-12 px-6   text-base rounded-2xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-150 ease-out select-none
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin shrink-0 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-[0_4px_12px_-2px_rgb(124_58_237_/_0.35)] hover:shadow-[0_6px_16px_-2px_rgb(124_58_237_/_0.45)]',
  secondary: 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 hover:border-violet-300 shadow-sm',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger:    'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  outline:   'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 bg-white',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
  xl: 'h-12 px-6 text-base rounded-2xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        select-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin shrink-0 h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

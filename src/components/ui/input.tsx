import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  dark?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, dark = false, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className={`text-sm font-medium select-none ${dark ? 'text-stone-300' : 'text-fg'}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              h-11 w-full rounded-xl text-sm transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? 'pl-10 pr-3' : 'px-3.5'}
              ${dark
                ? 'bg-stone-800 border border-stone-700 text-stone-100 placeholder:text-stone-500 hover:border-stone-600'
                : 'bg-surface border text-fg placeholder:text-muted'
              }
              ${error
                ? 'border-red-400 focus:ring-red-300/40'
                : dark ? '' : 'border-border hover:border-border-strong'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z"/>
            </svg>
            {error}
          </p>
        )}
        {hint && !error && <p className={`text-xs ${dark ? 'text-stone-500' : 'text-muted'}`}>{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

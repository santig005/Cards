import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' | 'gold'
  hover?: boolean
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' }

const variants = {
  light: 'bg-white border border-stone-100 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.06),0_1px_2px_-1px_rgb(0_0_0_/_0.04)]',
  dark:  'bg-stone-900 border border-amber-500/10',
  gold:  'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20',
}

export function Card({ padding = 'md', variant = 'light', hover = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

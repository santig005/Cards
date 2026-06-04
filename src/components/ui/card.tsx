import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  glass?: boolean
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
  xl:   'p-8',
}

export function Card({ padding = 'md', hover = false, glass = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border
        ${glass
          ? 'bg-white/80 backdrop-blur-sm border-white/60 shadow-lg'
          : 'bg-white border-gray-100 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.07),0_1px_2px_-1px_rgb(0_0_0_/_0.04)]'
        }
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

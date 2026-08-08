import type { ReactNode } from 'react'
import clsx from 'clsx'

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={clsx(
        'glass rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]',
        hover && 'transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  )
}

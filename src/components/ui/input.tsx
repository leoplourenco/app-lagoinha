import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-2xl border border-white/15 bg-panel-2 px-3 text-sm text-white placeholder:text-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        className,
      )}
      {...props}
    />
  )
}

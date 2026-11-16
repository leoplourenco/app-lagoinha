import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-sky-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
        className,
      )}
      {...props}
    />
  )
}

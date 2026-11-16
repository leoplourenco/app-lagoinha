import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-2xl border border-white/15 bg-panel-2 px-3 py-2 text-sm text-white placeholder:text-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        className,
      )}
      {...props}
    />
  )
}

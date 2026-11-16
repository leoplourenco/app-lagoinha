import { labelService } from '../lib/timezone'
import type { ServiceEvent } from '../types/database'
import { cn } from '../lib/utils'

export function ServicePicker({
  events,
  value,
  onChange,
}: {
  events: ServiceEvent[]
  value: string | null
  onChange: (id: string) => void
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/20 px-3 py-3 text-sm text-muted">
        Nenhum culto disponível.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">Culto</p>
      <div className="grid gap-2">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onChange(event.id)}
            className={cn(
              'rounded-xl border px-3 py-3 text-left text-sm transition',
              value === event.id 
                ? 'border-gold bg-gold/20'
                : 'border-white/15 bg-white/5 hover:bg-white/10',
            )}
          >
            {labelService(event.title, event.starts_at)}
          </button>
        ))}
      </div>
    </div>
  )
}

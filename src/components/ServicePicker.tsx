import { useMemo } from 'react'
import {
  dayKeySp,
  formatEventDay,
  formatEventTime,
} from '../lib/timezone'
import type { ServiceEvent } from '../types/database'
import { cn } from '../lib/utils'

export function ServicePicker({
  events,
  value,
  onChange,
  label = 'Data e horário',
}: {
  events: ServiceEvent[]
  value: string | null
  onChange: (id: string) => void
  label?: string
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ServiceEvent[]>()
    for (const event of events) {
      const key = dayKeySp(event.starts_at)
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    return [...map.entries()].map(([key, list]) => ({
      key,
      dayLabel: formatEventDay(list[0].starts_at),
      events: [...list].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ),
    }))
  }, [events])

  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/20 px-3 py-3 text-sm text-muted">
        Nenhum culto/evento disponível. Peça ao admin para cadastrar data e horário.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.key} className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gold">{group.dayLabel}</p>
            <div className="grid gap-2">
              {group.events.map((event) => {
                const title = event.title?.trim()
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onChange(event.id)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left transition',
                      value === event.id
                        ? 'border-gold bg-gold/20'
                        : 'border-white/15 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <p className="text-base font-semibold text-white">
                      {formatEventTime(event.starts_at)}
                    </p>
                    {title ? (
                      <p className="mt-0.5 text-sm text-muted">{title}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted">Evento / culto</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

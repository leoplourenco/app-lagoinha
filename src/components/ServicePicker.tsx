import { useMemo } from 'react'
import { formatEventWhen } from '../lib/timezone'
import type { ServiceEvent } from '../types/database'

export function ServicePicker({
  events,
  value,
  onChange,
  label = 'Culto / evento',
}: {
  events: ServiceEvent[]
  value: string | null
  onChange: (id: string) => void
  label?: string
}) {
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      ),
    [events],
  )

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/20 px-3 py-3 text-sm text-muted">
        Nenhum culto/evento disponível. Peça ao admin para cadastrar data e horário.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">{label}</p>
      <select
        className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm text-white"
        value={value ?? ''}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value)
        }}
      >
        <option value="" disabled>
          Selecione o culto / evento
        </option>
        {sorted.map((event) => {
          const title = event.title?.trim()
          const when = formatEventWhen(event.starts_at)
          return (
            <option key={event.id} value={event.id}>
              {title ? `${when} · ${title}` : when}
            </option>
          )
        })}
      </select>
    </div>
  )
}

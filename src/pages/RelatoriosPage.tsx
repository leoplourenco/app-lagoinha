import { useEffect, useState } from 'react'
import { ServicePicker } from '../components/ServicePicker'
import { EmptyState } from '../components/ui/empty-state'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

type CheckinRow = {
  id: string
  checked_at: string
  method: string
  profile?: Profile
}

type AttendanceRow = {
  id: string
  status: string
  arrived_at: string | null
  profile?: Profile
}

export function RelatoriosPage() {
  const { todayEvents, upcomingEvents, events, activeEvent } = useServiceEvents()
  const list = todayEvents.length > 0 ? todayEvents : upcomingEvents.length ? upcomingEvents : events
  const [eventId, setEventId] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  useEffect(() => {
    if (!eventId) return
    void (async () => {
      const [c, a] = await Promise.all([
        supabase
          .from('church_checkins')
          .select('id, checked_at, method, profile:profiles(*)')
          .eq('event_id', eventId)
          .order('checked_at'),
        supabase
          .from('sala_attendance')
          .select('id, status, arrived_at, profile:profiles(*)')
          .eq('event_id', eventId)
          .order('arrived_at'),
      ])
      if (c.error || a.error) {
        setError(c.error?.message || a.error?.message || 'Erro')
        return
      }
      setCheckins(
        ((c.data as unknown as CheckinRow[]) ?? []).map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        })),
      )
      setAttendance(
        ((a.data as unknown as AttendanceRow[]) ?? []).map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        })),
      )
    })()
  }, [eventId])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Relatórios</h2>
        <p className="mt-1 text-sm text-muted">Presença e check-in por culto.</p>
      </div>

      <ServicePicker events={list} value={eventId} onChange={setEventId} />

      <section className="space-y-2">
        <h3 className="font-semibold">Check-ins da igreja ({checkins.length})</h3>
        {checkins.length === 0 ? (
          <EmptyState title="Nenhum check-in neste culto" />
        ) : (
          checkins.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              {row.profile?.full_name} · {row.method} · {formatSp(row.checked_at, 'HH:mm')}
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Porta da Sala ({attendance.length})</h3>
        {attendance.length === 0 ? (
          <EmptyState title="Nenhuma baixa neste culto" />
        ) : (
          attendance.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              {row.profile?.full_name} · {row.status}
              {row.arrived_at ? ` · ${formatSp(row.arrived_at, 'HH:mm')}` : ''}
            </div>
          ))
        )}
      </section>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

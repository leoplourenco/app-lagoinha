import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { ServicePicker } from '../../components/ServicePicker'
import { useAuth } from '../../context/AuthContext'
import { useServiceEvents } from '../../hooks/useServiceEvents'
import { formatSp } from '../../lib/timezone'
import { supabase } from '../../lib/supabase'
import type { Profile, ScheduleSlot } from '../../types/database'

type Row = {
  user_id: string
  role_label: string
  profile?: Profile
  attendanceId?: string
  status: 'pending' | 'liberated'
  arrived_at?: string | null
}

export function SalaPresencaPage() {
  const { user, isSalaLeader, memberships } = useAuth()
  const { todayEvents, upcomingEvents, activeEvent } = useServiceEvents()
  const events = todayEvents.length > 0 ? todayEvents : upcomingEvents
  const [eventId, setEventId] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const salaMinistryId = memberships.find((m) => m.ministry?.slug === 'sala')?.ministry_id

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  async function load() {
    if (!eventId || !salaMinistryId) return
    setError(null)
    const [{ data: slots, error: slotErr }, { data: attendance, error: attErr }] =
      await Promise.all([
        supabase
          .from('schedule_slots')
          .select('*, profile:profiles(*)')
          .eq('event_id', eventId)
          .eq('ministry_id', salaMinistryId),
        supabase.from('sala_attendance').select('*').eq('event_id', eventId),
      ])

    if (slotErr || attErr) {
      setError(slotErr?.message || attErr?.message || 'Erro ao carregar')
      return
    }

    const attMap = new Map(
      ((attendance as { id: string; user_id: string; status: 'pending' | 'liberated'; arrived_at: string | null }[]) ?? []).map(
        (a) => [a.user_id, a],
      ),
    )

    setRows(
      ((slots as (ScheduleSlot & { profile?: Profile | Profile[] })[]) ?? []).map((slot) => {
        const profile = Array.isArray(slot.profile) ? slot.profile[0] : slot.profile
        const att = attMap.get(slot.user_id)
        return {
          user_id: slot.user_id,
          role_label: slot.role_label,
          profile,
          attendanceId: att?.id,
          status: att?.status ?? 'pending',
          arrived_at: att?.arrived_at,
        }
      }),
    )
  }

  useEffect(() => {
    void load()
  }, [eventId, salaMinistryId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.profile?.full_name.toLowerCase().includes(q))
  }, [rows, query])

  async function liberate(row: Row) {
    if (!user || !eventId) return
    setError(null)
    setMessage(null)
    try {
      if (row.attendanceId) {
        const { error: err } = await supabase
          .from('sala_attendance')
          .update({
            status: 'liberated',
            arrived_at: new Date().toISOString(),
            liberated_by: user.id,
          })
          .eq('id', row.attendanceId)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('sala_attendance').insert({
          event_id: eventId,
          user_id: row.user_id,
          status: 'liberated',
          arrived_at: new Date().toISOString(),
          liberated_by: user.id,
        })
        if (err) throw err
      }
      setMessage(`Baixa: ${row.profile?.full_name}`)
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha de rede. Tente de novo.'
      setError(`${msg} — sem fila offline no V1; confira a conexão e tente outra vez.`)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Presença na porta</h2>
        <p className="mt-1 text-sm text-muted">
          Lista da escala do culto. Voluntário offline? Ele fala o nome — você busca e dá baixa.
        </p>
      </div>

      <ServicePicker events={events} value={eventId} onChange={setEventId} />

      <Input
        className="h-12 text-base font-semibold"
        placeholder="Buscar pelo nome"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!isSalaLeader ? (
        <p className="text-sm text-amber-100">Somente líder/admin liberam na porta.</p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Ninguém na escala deste culto"
          description="Monte a escala da Sala ou ajuste a busca pelo nome."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div
              key={row.user_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium">{row.profile?.full_name}</p>
                <p className="text-sm text-muted">{row.role_label || 'sem rótulo'}</p>
                {row.status === 'liberated' && row.arrived_at ? (
                  <p className="text-xs text-emerald-200">
                    Liberado {formatSp(row.arrived_at, 'HH:mm')}
                  </p>
                ) : (
                  <p className="text-xs text-amber-100">Aguardando</p>
                )}
              </div>
              {isSalaLeader && row.status !== 'liberated' ? (
                <Button size="sm" onClick={() => void liberate(row)}>
                  Dar baixa
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

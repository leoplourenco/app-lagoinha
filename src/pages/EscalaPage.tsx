import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { ServicePicker } from '../components/ServicePicker'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { canManageMinistry, leaderMemberships, leaderMinistryIds } from '../lib/roles'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import type { Ministry, Profile, ScheduleSlot } from '../types/database'

type SlotRow = ScheduleSlot & {
  profile?: Profile
  ministry?: Ministry
}

const SUGGESTED_LABELS = ['porta', 'café', 'recepção']

export function EscalaPage() {
  const { user, isLeader, memberships, isAdmin } = useAuth()
  const canManage = isLeader || isAdmin
  const managedIds = useMemo(() => leaderMinistryIds(memberships), [memberships])
  const { schedulableEvents, activeEvent } = useServiceEvents()
  const events = schedulableEvents
  const [eventId, setEventId] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [members, setMembers] = useState<(Profile & { user_id: string })[]>([])
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([])
  const [ministryId, setMinistryId] = useState('')
  const [userId, setUserId] = useState('')
  const [roleLabel, setRoleLabel] = useState('porta')
  const [error, setError] = useState<string | null>(null)

  const leaderMinistries = useMemo(() => {
    if (isAdmin) {
      return allMinistries.map((m) => ({
        ministry_id: m.id,
        ministry: m,
        role: 'leader' as const,
      }))
    }
    return leaderMemberships(memberships)
  }, [isAdmin, allMinistries, memberships])

  useEffect(() => {
    if (!isAdmin) return
    void supabase
      .from('ministries')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => setAllMinistries((data as Ministry[]) ?? []))
  }, [isAdmin])

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  useEffect(() => {
    if (!leaderMinistries.length) {
      if (ministryId) setMinistryId('')
      return
    }
    const stillValid = leaderMinistries.some((m) => m.ministry_id === ministryId)
    if (!ministryId || !stillValid) {
      setMinistryId(leaderMinistries[0].ministry_id)
    }
  }, [leaderMinistries, ministryId])

  async function loadSlots() {
    if (!eventId || !user) return
    let query = supabase
      .from('schedule_slots')
      .select('*, profile:profiles(*), ministry:ministries(*)')
      .eq('event_id', eventId)
      .order('created_at')

    if (isAdmin) {
      // admin vê a escala completa do culto
    } else if (canManage && managedIds.length > 0) {
      // líder: só ministérios que lidera + slots pessoais (ex.: voluntário em outro)
      query = query.or(
        `ministry_id.in.(${managedIds.join(',')}),user_id.eq.${user.id}`,
      )
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
      return
    }
    setSlots(
      ((data as SlotRow[]) ?? []).map((s) => ({
        ...s,
        profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
        ministry: Array.isArray(s.ministry) ? s.ministry[0] : s.ministry,
      })),
    )
  }

  async function loadMembers(mid: string) {
    const { data } = await supabase
      .from('ministry_members')
      .select('user_id, profile:profiles(*)')
      .eq('ministry_id', mid)
    setMembers(
      ((data as { user_id: string; profile: Profile | Profile[] }[]) ?? []).map((row) => {
        const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
        return profile
      }).filter(Boolean) as Profile[],
    )
  }

  useEffect(() => {
    void loadSlots()
  }, [eventId, user, canManage, isAdmin, managedIds.join(',')])

  useEffect(() => {
    if (ministryId) void loadMembers(ministryId)
  }, [ministryId])

  async function addSlot(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!eventId || !ministryId || !userId) {
      setError('Escolha culto, ministério e voluntário.')
      return
    }
    if (!canManageMinistry(memberships, ministryId, isAdmin)) {
      setError('Você só pode montar escala nos ministérios que lidera.')
      return
    }
    const { error: err } = await supabase.from('schedule_slots').insert({
      event_id: eventId,
      ministry_id: ministryId,
      user_id: userId,
      role_label: roleLabel.trim() || 'função',
    })
    if (err) {
      setError(err.message)
      return
    }
    setUserId('')
    await loadSlots()
  }

  async function removeSlot(slot: SlotRow) {
    if (!canManageMinistry(memberships, slot.ministry_id, isAdmin)) {
      setError('Você só pode remover escala dos ministérios que lidera.')
      return
    }
    await supabase.from('schedule_slots').delete().eq('id', slot.id)
    await loadSlots()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Escala</h2>
        <p className="mt-1 text-sm text-muted">
          Escolha o culto/evento pela data e horário (qualquer dia). Depois monte a
          escala com rótulo (porta, café, recepção…).
        </p>
      </div>

      <ServicePicker
        events={events}
        value={eventId}
        onChange={setEventId}
        label="Culto / evento por data e horário"
      />

      {canManage ? (
        <form onSubmit={addSlot} className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="font-semibold">Montar escala</p>
          <select
            className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
            value={ministryId}
            onChange={(e) => setMinistryId(e.target.value)}
          >
            {leaderMinistries.map((m) => (
              <option key={m.ministry_id} value={m.ministry_id}>
                {m.ministry?.name ?? m.ministry_id}
              </option>
            ))}
          </select>
          <select
            className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Voluntário</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_LABELS.map((label) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={roleLabel === label ? 'default' : 'outline'}
                onClick={() => setRoleLabel(label)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Input
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="Rótulo da função"
          />
          <Button type="submit" className="w-full">
            Adicionar na escala
          </Button>
        </form>
      ) : null}

      {slots.length === 0 ? (
        <EmptyState
          title="Nada na escala deste culto"
          description="Peça ao líder para te adicionar…"
        />
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium">
                  {slot.profile?.full_name ?? 'Voluntário'}
                  {slot.user_id === user?.id ? ' (você)' : ''}
                </p>
                <p className="text-sm text-muted">
                  {slot.ministry?.name} · {slot.role_label || 'sem rótulo'}
                </p>
                <p className="text-xs text-muted">
                  {eventId ? formatSp(events.find((e) => e.id === eventId)?.starts_at ?? '') : ''}
                </p>
              </div>
              {canManageMinistry(memberships, slot.ministry_id, isAdmin) ? (
                <Button size="sm" variant="ghost" onClick={() => void removeSlot(slot)}>
                  Remover
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

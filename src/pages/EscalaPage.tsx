import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { ServicePicker } from '../components/ServicePicker'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import {
  buildSpecialService,
  upcomingStandardServices,
  type ProposedService,
} from '../lib/serviceDefaults'
import { findOrCreateServiceEvent } from '../lib/serviceEvents'
import { canManageMinistry, leaderMemberships, leaderMinistryIds } from '../lib/roles'
import { formatEventWhen, formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import type { Ministry, Profile, ScheduleSlot, ServiceEvent } from '../types/database'

type SlotRow = ScheduleSlot & {
  profile?: Profile
  ministry?: Ministry
}

const SUGGESTED_LABELS = ['porta', 'café', 'recepção']

export function EscalaPage() {
  const { user, isLeader, memberships, isAdmin } = useAuth()
  const canManage = isLeader || isAdmin
  const managedIds = useMemo(() => leaderMinistryIds(memberships), [memberships])
  const { schedulableEvents, activeEvent, refresh } = useServiceEvents()
  const standardOptions = useMemo(() => upcomingStandardServices(2), [])

  const [mode, setMode] = useState<'padrao' | 'especial'>('padrao')
  const [eventId, setEventId] = useState<string | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<ProposedService | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [specialWhen, setSpecialWhen] = useState('')
  const [specialTitle, setSpecialTitle] = useState('')
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([])
  const [ministryId, setMinistryId] = useState('')
  const [userId, setUserId] = useState('')
  const [roleLabel, setRoleLabel] = useState('porta')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

  const selectedEvent: ServiceEvent | null = useMemo(() => {
    if (!eventId) return null
    return schedulableEvents.find((e) => e.id === eventId) ?? null
  }, [eventId, schedulableEvents])

  useEffect(() => {
    if (!isAdmin) return
    void supabase
      .from('ministries')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => setAllMinistries((data as Ministry[]) ?? []))
  }, [isAdmin])

  // Voluntário: pré-seleciona culto ativo. Líder escolhe na mão.
  useEffect(() => {
    if (canManage) return
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [canManage, activeEvent, eventId])

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
    if (!eventId || !user) {
      setSlots([])
      return
    }
    let query = supabase
      .from('schedule_slots')
      .select('*, profile:profiles(*), ministry:ministries(*)')
      .eq('event_id', eventId)
      .order('created_at')

    if (isAdmin) {
      // admin vê tudo
    } else if (canManage && managedIds.length > 0) {
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
      ((data as { user_id: string; profile: Profile | Profile[] }[]) ?? [])
        .map((row) => (Array.isArray(row.profile) ? row.profile[0] : row.profile))
        .filter(Boolean) as Profile[],
    )
  }

  useEffect(() => {
    void loadSlots()
  }, [eventId, user, canManage, isAdmin, managedIds.join(',')])

  useEffect(() => {
    if (ministryId) void loadMembers(ministryId)
  }, [ministryId])

  async function selectProposed(proposed: ProposedService) {
    setError(null)
    setMessage(null)
    setSelecting(true)
    const { event, error: err } = await findOrCreateServiceEvent(
      proposed.startsAtIso,
      proposed.title,
    )
    setSelecting(false)
    if (err || !event) {
      setError(err || 'Não foi possível abrir este culto.')
      return
    }
    setSelectedMeta(proposed)
    setEventId(event.id)
    setMessage(`Escala de ${proposed.dayLabel} · ${proposed.timeLabel}`)
    await refresh()
  }

  async function useSpecial(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!specialWhen) {
      setError('Informe dia, mês e horário do evento.')
      return
    }
    await selectProposed(buildSpecialService(specialWhen, specialTitle))
  }

  async function addSlot(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!eventId || !ministryId || !userId) {
      setError('Escolha o horário, o ministério e o voluntário.')
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

  const headerWhen =
    selectedMeta
      ? `${selectedMeta.dayLabel} · ${selectedMeta.timeLabel}`
      : selectedEvent
        ? formatEventWhen(selectedEvent.starts_at)
        : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Escala</h2>
        <p className="mt-1 text-sm text-muted">
          {canManage
            ? 'Escolha o culto padrão ou um evento especial; depois encaixe os voluntários.'
            : 'Veja em qual data/horário você está escalado.'}
        </p>
      </div>

      {canManage ? (
        <section className="space-y-3 rounded-2xl border border-white/15 bg-panel p-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'padrao' ? 'default' : 'outline'}
              onClick={() => setMode('padrao')}
            >
              Cultos padrão
            </Button>
            <Button
              type="button"
              variant={mode === 'especial' ? 'default' : 'outline'}
              onClick={() => setMode('especial')}
            >
              Evento especial
            </Button>
          </div>

          {mode === 'padrao' ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                Quarta 20:15 · Sábado 19:30 · Domingo 09:00 e 18:00
              </p>
              <div className="grid gap-2">
                {standardOptions.map((opt) => {
                  const active =
                    selectedMeta?.key === opt.key ||
                    (selectedEvent &&
                      Math.abs(
                        new Date(selectedEvent.starts_at).getTime() -
                          new Date(opt.startsAtIso).getTime(),
                      ) < 60_000)
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={selecting}
                      onClick={() => void selectProposed(opt)}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-left transition',
                        active
                          ? 'border-gold bg-gold/20'
                          : 'border-white/15 bg-white/5 hover:bg-white/10',
                      )}
                    >
                      <p className="font-semibold text-white">
                        {opt.dayLabel} · {opt.timeLabel}
                      </p>
                      <p className="text-sm text-muted">{opt.title}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={useSpecial} className="space-y-3">
              <p className="text-sm text-muted">
                Fora da grade? Informe o dia, o mês e o horário na mão.
              </p>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gold">
                  Data e horário
                </p>
                <Input
                  type="datetime-local"
                  value={specialWhen}
                  onChange={(e) => setSpecialWhen(e.target.value)}
                  required
                />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-gold">
                  Nome (opcional)
                </p>
                <Input
                  value={specialTitle}
                  onChange={(e) => setSpecialTitle(e.target.value)}
                  placeholder="Vigília, conferência, ensaio…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={selecting}>
                {selecting ? 'Abrindo…' : 'Usar esta data e horário'}
              </Button>
            </form>
          )}
        </section>
      ) : (
        <ServicePicker
          events={schedulableEvents}
          value={eventId}
          onChange={setEventId}
          label="Culto / evento por data e horário"
        />
      )}

      {headerWhen ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gold">Montando escala de</p>
          <p className="font-semibold text-white">{headerWhen}</p>
          {selectedMeta && !selectedMeta.isStandard ? (
            <p className="text-sm text-muted">{selectedMeta.title}</p>
          ) : null}
        </div>
      ) : canManage ? (
        <EmptyState
          title="Escolha quando"
          description="Toque em um culto padrão ou cadastre um evento especial."
        />
      ) : null}

      {canManage && eventId ? (
        <form onSubmit={addSlot} className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="font-semibold">Adicionar voluntário</p>
          {leaderMinistries.length > 1 ? (
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
          ) : null}
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
            placeholder="Função na escala"
          />
          <Button type="submit" className="w-full">
            Adicionar na escala
          </Button>
        </form>
      ) : null}

      {eventId ? (
        slots.length === 0 ? (
          <EmptyState
            title="Nada nesta data/horário"
            description={
              canManage
                ? 'Adicione o primeiro voluntário acima.'
                : 'Peça ao líder para te colocar na escala.'
            }
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gold">Quem está nesta escala</p>
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
                  {!canManage ? (
                    <p className="text-xs text-muted">
                      {formatSp(selectedEvent?.starts_at ?? '')}
                    </p>
                  ) : null}
                </div>
                {canManageMinistry(memberships, slot.ministry_id, isAdmin) ? (
                  <Button size="sm" variant="ghost" onClick={() => void removeSlot(slot)}>
                    Remover
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : null}

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

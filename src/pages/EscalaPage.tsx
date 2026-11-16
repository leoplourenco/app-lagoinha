import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { ServicePicker } from '../components/ServicePicker'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import {
  STANDARD_SERVICES,
  buildSpecialService,
  currentSpYearMonth,
  formatYearMonthLabel,
  shiftYearMonth,
  standardServicesForMonth,
  type ProposedService,
} from '../lib/serviceDefaults'
import { findOrCreateServiceEvent } from '../lib/serviceEvents'
import { rolesForMinistrySlug } from '../lib/ministryRoles'
import { canManageMinistry, leaderMemberships, leaderMinistryIds } from '../lib/roles'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import type { Ministry, Profile, ScheduleSlot } from '../types/database'

type SlotRow = ScheduleSlot & {
  profile?: Profile
  ministry?: Ministry
  event?: { starts_at: string; title: string }
}

export function EscalaPage() {
  const { user, isLeader, memberships, isAdmin } = useAuth()
  const canManage = isLeader || isAdmin
  const managedIds = useMemo(() => leaderMinistryIds(memberships), [memberships])
  const { schedulableEvents, activeEvent, refresh } = useServiceEvents()
  const initialYm = useMemo(() => currentSpYearMonth(), [])

  const [mode, setMode] = useState<'padrao' | 'especial'>('padrao')
  const [viewYear, setViewYear] = useState(initialYm.year)
  const [viewMonth, setViewMonth] = useState(initialYm.month)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [optionsCache, setOptionsCache] = useState<Record<string, ProposedService>>({})
  const [specialExtras, setSpecialExtras] = useState<ProposedService[]>([])
  const [eventId, setEventId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [specialWhen, setSpecialWhen] = useState('')
  const [specialTitle, setSpecialTitle] = useState('')
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([])
  const [ministryId, setMinistryId] = useState('')
  const [userId, setUserId] = useState('')
  const [roleLabel, setRoleLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const monthOptions = useMemo(
    () => standardServicesForMonth(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const monthLabel = useMemo(
    () => formatYearMonthLabel(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const isCurrentMonth =
    viewYear === initialYm.year && viewMonth === initialYm.month

  useEffect(() => {
    setOptionsCache((prev) => {
      const next = { ...prev }
      for (const opt of monthOptions) next[opt.key] = opt
      for (const opt of specialExtras) next[opt.key] = opt
      return next
    })
  }, [monthOptions, specialExtras])

  const selectedOptions = useMemo(
    () =>
      selectedKeys
        .map((key) => optionsCache[key])
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime(),
        ),
    [selectedKeys, optionsCache],
  )

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

  const currentMinistry = useMemo(() => {
    const fromLeader = leaderMinistries.find((m) => m.ministry_id === ministryId)?.ministry
    if (fromLeader) return fromLeader
    return allMinistries.find((m) => m.id === ministryId) ?? null
  }, [leaderMinistries, allMinistries, ministryId])

  const roleOptions = useMemo(
    () => rolesForMinistrySlug(currentMinistry?.slug),
    [currentMinistry?.slug],
  )

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

  useEffect(() => {
    if (roleOptions.length === 0) {
      setRoleLabel('')
      return
    }
    if (!roleOptions.includes(roleLabel)) {
      setRoleLabel(roleOptions[0])
    }
  }, [roleOptions, roleLabel])

  async function loadSlotsForEvents(ids: string[]) {
    if (!user || ids.length === 0) {
      setSlots([])
      return
    }
    let query = supabase
      .from('schedule_slots')
      .select('*, profile:profiles(*), ministry:ministries(*), event:service_events(starts_at, title)')
      .in('event_id', ids)
      .order('created_at')

    if (!canManage) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
      return
    }

    const rows = ((data as SlotRow[]) ?? []).map((s) => ({
      ...s,
      profile: Array.isArray(s.profile) ? s.profile[0] : s.profile,
      ministry: Array.isArray(s.ministry) ? s.ministry[0] : s.ministry,
      event: Array.isArray(s.event) ? s.event[0] : s.event,
    }))

    setSlots(
      rows.sort(
        (a, b) =>
          new Date(a.event?.starts_at ?? 0).getTime() -
          new Date(b.event?.starts_at ?? 0).getTime(),
      ),
    )
  }

  async function loadMembers(mid: string) {
    // Só voluntários DESTE ministério
    const { data } = await supabase
      .from('ministry_members')
      .select('user_id, profile:profiles(*)')
      .eq('ministry_id', mid)
    setMembers(
      ((data as { user_id: string; profile: Profile | Profile[] }[]) ?? [])
        .map((row) => (Array.isArray(row.profile) ? row.profile[0] : row.profile))
        .filter(Boolean) as Profile[],
    )
    setUserId('')
  }

  useEffect(() => {
    if (canManage) return
    void loadSlotsForEvents(eventId ? [eventId] : [])
  }, [eventId, user, canManage, isAdmin, managedIds.join(',')])

  useEffect(() => {
    if (ministryId) void loadMembers(ministryId)
  }, [ministryId])

  function toggleKey(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
    setMessage(null)
    setError(null)
  }

  function selectByStandardId(standardId: string) {
    const keys = monthOptions
      .filter((o) => o.standardId === standardId)
      .map((o) => o.key)
    setSelectedKeys((prev) => [...new Set([...prev, ...keys])])
    setMode('padrao')
    setMessage(null)
  }

  function goMonth(delta: number) {
    const next = shiftYearMonth(viewYear, viewMonth, delta)
    // Não volta para meses totalmente no passado
    if (
      delta < 0 &&
      (next.year < initialYm.year ||
        (next.year === initialYm.year && next.month < initialYm.month))
    ) {
      return
    }
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  function clearSelection() {
    setSelectedKeys([])
    setSlots([])
    setMessage(null)
  }

  async function addSpecial(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!specialWhen) {
      setError('Informe dia, mês e horário do evento.')
      return
    }
    const proposed = buildSpecialService(specialWhen, specialTitle)
    setSpecialExtras((prev) =>
      prev.some((p) => p.key === proposed.key) ? prev : [...prev, proposed],
    )
    setSelectedKeys((prev) =>
      prev.includes(proposed.key) ? prev : [...prev, proposed.key],
    )
    setSpecialWhen('')
    setSpecialTitle('')
    setMessage(`Evento especial marcado: ${proposed.dayLabel} · ${proposed.timeLabel}`)
    setMode('padrao')
  }

  async function resolveEventIds(options: ProposedService[]) {
    const ids: string[] = []
    for (const opt of options) {
      const { event, error: err } = await findOrCreateServiceEvent(
        opt.startsAtIso,
        opt.title,
      )
      if (err || !event) throw new Error(err || `Falha em ${opt.title}`)
      ids.push(event.id)
    }
    return ids
  }

  async function addSlot(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!canManage) return

    if (selectedOptions.length === 0 || !ministryId || !userId) {
      setError('Marque um ou mais cultos, depois escolha o voluntário.')
      return
    }
    if (!canManageMinistry(memberships, ministryId, isAdmin)) {
      setError('Você só pode montar escala nos ministérios que lidera.')
      return
    }
    if (roleOptions.length > 0 && !roleOptions.includes(roleLabel)) {
      setError('Escolha uma função do seu ministério.')
      return
    }
    if (!roleLabel.trim()) {
      setError('Escolha a função na escala.')
      return
    }

    setSelecting(true)
    try {
      const eventIds = await resolveEventIds(selectedOptions)

      // Colisão: pessoa já escalada naquele culto (qualquer ministério)
      const { data: existing, error: existErr } = await supabase
        .from('schedule_slots')
        .select('id, event_id, ministry_id, role_label, ministry:ministries(name)')
        .eq('user_id', userId)
        .in('event_id', eventIds)

      if (existErr) {
        setError(existErr.message)
        return
      }

      type ExistingRow = {
        id: string
        event_id: string
        ministry_id: string
        role_label: string
        ministry?: { name: string } | { name: string }[]
      }

      const existingRows = ((existing as ExistingRow[]) ?? []).map((row) => ({
        ...row,
        ministry: Array.isArray(row.ministry) ? row.ministry[0] : row.ministry,
      }))

      const byEvent = new Map(existingRows.map((r) => [r.event_id, r]))
      const toInsert: {
        event_id: string
        ministry_id: string
        user_id: string
        role_label: string
      }[] = []
      const toUpdate: { id: string }[] = []
      const blocked: string[] = []

      selectedOptions.forEach((opt, idx) => {
        const eid = eventIds[idx]
        const hit = byEvent.get(eid)
        const label = `${opt.dayLabel} · ${opt.timeLabel}`
        if (!hit) {
          toInsert.push({
            event_id: eid,
            ministry_id: ministryId,
            user_id: userId,
            role_label: roleLabel.trim(),
          })
          return
        }
        if (hit.ministry_id === ministryId) {
          toUpdate.push({ id: hit.id })
          return
        }
        blocked.push(
          `${label} — já em ${hit.ministry?.name ?? 'outro ministério'} (${hit.role_label})`,
        )
      })

      if (toUpdate.length > 0) {
        await supabase
          .from('schedule_slots')
          .update({ role_label: roleLabel.trim() })
          .in(
            'id',
            toUpdate.map((r) => r.id),
          )
      }

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase.from('schedule_slots').insert(toInsert)
        if (insertErr) {
          if (insertErr.message.toLowerCase().includes('duplicate') || insertErr.code === '23505') {
            setError(
              'Essa pessoa já está escalada em um dos cultos por outro ministério. Escolha outras datas.',
            )
          } else {
            setError(insertErr.message)
          }
          return
        }
      }

      const volunteer = members.find((m) => m.user_id === userId)?.full_name ?? 'Voluntário'
      const ok = toInsert.length + toUpdate.length
      const parts = [
        ok > 0
          ? `${volunteer}: ${ok} culto${ok > 1 ? 's' : ''} em ${currentMinistry?.name ?? 'seu ministério'} · ${roleLabel}`
          : null,
        blocked.length > 0 ? `Bloqueado(s): ${blocked.join(' | ')}` : null,
      ].filter(Boolean)

      if (ok === 0 && blocked.length > 0) {
        setError(blocked.join('\n'))
      } else {
        setMessage(parts.join('\n'))
        if (blocked.length > 0) setError(`${blocked.length} culto(s) já ocupados por outro ministério.`)
      }

      await refresh()
      await loadSlotsForEvents(eventIds)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao escalar')
    } finally {
      setSelecting(false)
    }
  }

  async function removeSlot(slot: SlotRow) {
    if (!canManageMinistry(memberships, slot.ministry_id, isAdmin)) {
      setError('Você só remove escala do ministério que lidera.')
      return
    }
    await supabase.from('schedule_slots').delete().eq('id', slot.id)
    if (canManage && selectedOptions.length > 0) {
      try {
        const ids = await resolveEventIds(selectedOptions)
        await loadSlotsForEvents(ids)
      } catch {
        setSlots((prev) => prev.filter((s) => s.id !== slot.id))
      }
    } else if (eventId) {
      await loadSlotsForEvents([eventId])
    }
  }

  async function previewSelected() {
    if (selectedOptions.length === 0) {
      setSlots([])
      return
    }
    setSelecting(true)
    setError(null)
    try {
      const ids = await resolveEventIds(selectedOptions)
      await refresh()
      await loadSlotsForEvents(ids)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar escalas')
    } finally {
      setSelecting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Escala</h2>
        <p className="mt-1 text-sm text-muted">
          {canManage
            ? 'Só funções do seu ministério. A mesma pessoa não pode ficar em dois ministérios no mesmo culto.'
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isCurrentMonth}
                  onClick={() => goMonth(-1)}
                >
                  ←
                </Button>
                <p className="text-sm font-semibold capitalize text-gold">{monthLabel}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => goMonth(1)}>
                  →
                </Button>
              </div>
              <p className="text-xs text-muted">
                Lista do mês. Marque vários e troque de mês se precisar.
              </p>
              <div className="flex flex-wrap gap-2">
                {STANDARD_SERVICES.map((def) => (
                  <Button
                    key={def.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => selectByStandardId(def.id)}
                  >
                    Todos {def.title}
                  </Button>
                ))}
                {selectedKeys.length > 0 ? (
                  <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                    Limpar
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2">
                {monthOptions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/20 px-3 py-3 text-sm text-muted">
                    Nenhum culto restante neste mês.
                  </p>
                ) : (
                  monthOptions.map((opt) => {
                    const active = selectedKeys.includes(opt.key)
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={selecting}
                        onClick={() => toggleKey(opt.key)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition',
                          active
                            ? 'border-gold bg-gold/20'
                            : 'border-white/15 bg-white/5 hover:bg-white/10',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs',
                            active
                              ? 'border-gold bg-gold text-ink'
                              : 'border-white/30 text-transparent',
                          )}
                        >
                          ✓
                        </span>
                        <span>
                          <p className="font-semibold text-white">
                            {opt.dayLabel} · {opt.timeLabel}
                          </p>
                          <p className="text-sm text-muted">{opt.title}</p>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={addSpecial} className="space-y-3">
              <p className="text-sm text-muted">
                Fora da grade? Informe o dia, o mês e o horário — entra na seleção junto
                com os padrão.
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
              <Button type="submit" className="w-full">
                Marcar este evento na seleção
              </Button>
            </form>
          )}

          {selectedOptions.length > 0 ? (
            <div className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-gold">
                {selectedOptions.length} culto
                {selectedOptions.length > 1 ? 's' : ''} selecionado
                {selectedOptions.length > 1 ? 's' : ''}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {selectedOptions.slice(0, 8).map((o) => (
                  <li key={o.key}>
                    {o.dayLabel} · {o.timeLabel} · {o.title}
                  </li>
                ))}
                {selectedOptions.length > 8 ? (
                  <li>+ {selectedOptions.length - 8} outros</li>
                ) : null}
              </ul>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={selecting}
                onClick={() => void previewSelected()}
              >
                Ver quem já está nesses cultos
              </Button>
            </div>
          ) : null}
        </section>
      ) : (
        <ServicePicker
          events={schedulableEvents}
          value={eventId}
          onChange={setEventId}
          label="Culto / evento por data e horário"
        />
      )}

      {canManage && selectedOptions.length > 0 ? (
        <form onSubmit={addSlot} className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4">
          <p className="font-semibold">
            Escala · {currentMinistry?.name ?? 'seu ministério'}
          </p>
          <p className="text-xs text-muted">
            Só funções deste ministério. Voluntários listados são da equipe dele.
          </p>

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
            <option value="">Voluntário do ministério</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-gold">Função</p>
            {roleOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((label) => (
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
            ) : (
              <Input
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                placeholder="Função na escala"
              />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={selecting}>
            {selecting
              ? 'Escalando…'
              : `Escalar em ${selectedOptions.length} culto${selectedOptions.length > 1 ? 's' : ''}`}
          </Button>
        </form>
      ) : null}

      {!canManage && !eventId ? null : slots.length === 0 ? (
        canManage && selectedOptions.length === 0 ? (
          <EmptyState
            title="Marque os cultos"
            description="Selecione um ou mais cultos padrão (ou um especial) para montar a escala."
          />
        ) : (
          <EmptyState
            title="Nada nestes cultos ainda"
            description={
              canManage
                ? 'Escolha o voluntário e a função do seu ministério.'
                : 'Peça ao líder para te colocar na escala.'
            }
          />
        )
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gold">Quem está na escala</p>
          {slots.map((slot) => {
            const mine = canManageMinistry(memberships, slot.ministry_id, isAdmin)
            const otherMinistry = canManage && !mine
            return (
              <div
                key={slot.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border px-3 py-3',
                  otherMinistry
                    ? 'border-rose-400/30 bg-rose-500/10'
                    : 'border-white/10 bg-white/5',
                )}
              >
                <div>
                  <p className="font-medium">
                    {slot.profile?.full_name ?? 'Voluntário'}
                    {slot.user_id === user?.id ? ' (você)' : ''}
                  </p>
                  <p className="text-sm text-muted">
                    {slot.ministry?.name} · {slot.role_label || 'sem rótulo'}
                    {otherMinistry ? ' · outro ministério' : ''}
                  </p>
                  <p className="text-xs text-muted">
                    {slot.event?.starts_at
                      ? `${formatSp(slot.event.starts_at, 'EEEE, dd/MM · HH:mm')} · ${slot.event.title}`
                      : null}
                  </p>
                </div>
                {mine ? (
                  <Button size="sm" variant="ghost" onClick={() => void removeSlot(slot)}>
                    Remover
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {message ? (
        <p className="whitespace-pre-line text-sm text-emerald-200">{message}</p>
      ) : null}
      {error ? (
        <p className="whitespace-pre-line text-sm text-rose-200">{error}</p>
      ) : null}
    </div>
  )
}

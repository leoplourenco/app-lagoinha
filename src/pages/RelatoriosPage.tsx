import { useEffect, useMemo, useState } from 'react'
import { ServicePicker } from '../components/ServicePicker'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { leaderMinistryIds, leaderMinistryNames } from '../lib/roles'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

type CheckinRow = {
  id: string
  checked_at: string
  method: string
  user_id: string
  profile?: Profile
}

type AttendanceRow = {
  id: string
  status: string
  arrived_at: string | null
  profile?: Profile
}

type TeamSlot = {
  id: string
  user_id: string
  role_label: string | null
  ministry?: { name: string } | null
  profile?: Profile
}

export function RelatoriosPage() {
  const { memberships, isAdmin, isSalaMember } = useAuth()
  const managedIds = useMemo(() => leaderMinistryIds(memberships), [memberships])
  const managedNames = useMemo(() => leaderMinistryNames(memberships), [memberships])
  const { schedulableEvents, activeEvent } = useServiceEvents()
  const list = schedulableEvents
  const [eventId, setEventId] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<CheckinRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>([])
  const [error, setError] = useState<string | null>(null)

  const showSala = isAdmin || isSalaMember

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  useEffect(() => {
    if (!eventId) return
    void (async () => {
      setError(null)

      if (isAdmin) {
        const [c, a] = await Promise.all([
          supabase
            .from('church_checkins')
            .select('id, checked_at, method, user_id, profile:profiles(*)')
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
        setTeamSlots([])
        return
      }

      // Líder: só a equipe dos ministérios que lidera
      if (managedIds.length === 0) {
        setCheckins([])
        setAttendance([])
        setTeamSlots([])
        return
      }

      const { data: membersData, error: membersErr } = await supabase
        .from('ministry_members')
        .select('user_id')
        .in('ministry_id', managedIds)

      if (membersErr) {
        setError(membersErr.message)
        return
      }

      const teamUserIds = [
        ...new Set(((membersData as { user_id: string }[]) ?? []).map((m) => m.user_id)),
      ]

      const [slotsRes, checkinsRes, attendanceRes] = await Promise.all([
        supabase
          .from('schedule_slots')
          .select('id, user_id, role_label, ministry:ministries(name), profile:profiles(*)')
          .eq('event_id', eventId)
          .in('ministry_id', managedIds)
          .order('created_at'),
        teamUserIds.length
          ? supabase
              .from('church_checkins')
              .select('id, checked_at, method, user_id, profile:profiles(*)')
              .eq('event_id', eventId)
              .in('user_id', teamUserIds)
              .order('checked_at')
          : Promise.resolve({ data: [], error: null }),
        showSala
          ? supabase
              .from('sala_attendance')
              .select('id, status, arrived_at, profile:profiles(*)')
              .eq('event_id', eventId)
              .order('arrived_at')
          : Promise.resolve({ data: [], error: null }),
      ])

      if (slotsRes.error || checkinsRes.error || attendanceRes.error) {
        setError(
          slotsRes.error?.message ||
            checkinsRes.error?.message ||
            attendanceRes.error?.message ||
            'Erro',
        )
        return
      }

      setTeamSlots(
        ((slotsRes.data as unknown as TeamSlot[]) ?? []).map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
          ministry: Array.isArray(row.ministry) ? row.ministry[0] : row.ministry,
        })),
      )
      setCheckins(
        ((checkinsRes.data as unknown as CheckinRow[]) ?? []).map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        })),
      )
      setAttendance(
        ((attendanceRes.data as unknown as AttendanceRow[]) ?? []).map((row) => ({
          ...row,
          profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        })),
      )
    })()
  }, [eventId, isAdmin, managedIds, showSala])

  const checkedUserIds = useMemo(
    () => new Set(checkins.map((c) => c.user_id)),
    [checkins],
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Relatórios</h2>
        <p className="mt-1 text-sm text-muted">
          {isAdmin
            ? 'Presença e check-in por data/horário (visão completa).'
            : managedNames.length
              ? `Escopo: ${managedNames.join(' · ')}`
              : 'Presença só dos ministérios que você lidera.'}
        </p>
      </div>

      <ServicePicker
        events={list}
        value={eventId}
        onChange={setEventId}
        label="Culto / evento por data e horário"
      />

      {!isAdmin ? (
        <section className="space-y-2">
          <h3 className="font-semibold">Escala da minha equipe ({teamSlots.length})</h3>
          {teamSlots.length === 0 ? (
            <EmptyState title="Ninguém da sua equipe neste culto" />
          ) : (
            teamSlots.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                {row.profile?.full_name} · {row.ministry?.name} · {row.role_label || 'função'}
                {checkedUserIds.has(row.user_id) ? ' · check-in ok' : ' · sem check-in'}
              </div>
            ))
          )}
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="font-semibold">
          {isAdmin ? `Check-ins da igreja (${checkins.length})` : `Check-ins da equipe (${checkins.length})`}
        </h3>
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

      {showSala ? (
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
      ) : null}

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

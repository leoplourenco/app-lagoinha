import { useEffect, useState } from 'react'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import type { ScheduleSlot } from '../types/database'

const DISMISS_KEY = 'lagoinha-install-card-dismissed'

export function HomePage() {
  const { user, isAdmin, isSalaMember, isHostMember, isLeader } = useAuth()
  const { activeEvent, todayEvents, loading } = useServiceEvents()
  const [slots, setSlots] = useState<(ScheduleSlot & { ministry?: { name: string } })[]>([])
  const [checkedIn, setCheckedIn] = useState(false)
  const [showInstall, setShowInstall] = useState(
    () => localStorage.getItem(DISMISS_KEY) !== '1',
  )

  useEffect(() => {
    if (!user || !activeEvent) return
    void (async () => {
      const [{ data: schedule }, { data: checkin }] = await Promise.all([
        supabase
          .from('schedule_slots')
          .select('*, ministry:ministries(name)')
          .eq('user_id', user.id)
          .eq('event_id', activeEvent.id),
        supabase
          .from('church_checkins')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', activeEvent.id)
          .maybeSingle(),
      ])
      setSlots(
        ((schedule as (ScheduleSlot & { ministry?: { name: string } | { name: string }[] })[]) ?? []).map(
          (s) => ({
            ...s,
            ministry: Array.isArray(s.ministry) ? s.ministry[0] : s.ministry,
          }),
        ),
      )
      setCheckedIn(Boolean(checkin))
    })()
  }, [user, activeEvent])

  return (
    <div className="space-y-5">
      {showInstall ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gold-soft">Instale na tela inicial</p>
              <p className="mt-1 text-sm text-muted">
                Opcional — acesso mais rápido no culto.
              </p>
              <Link to="/instalar" className="mt-2 inline-block text-sm font-semibold text-gold underline">
                Como instalar
              </Link>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-muted hover:text-white"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1')
                setShowInstall(false)
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      <Link
        to="/checkin"
        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1c140e] px-4 py-4"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gold">Próximo culto</p>
          {loading ? (
            <p className="font-semibold">Carregando…</p>
          ) : activeEvent ? (
            <>
              <p className="truncate font-semibold text-white">{activeEvent.title}</p>
              <p className="text-sm text-muted">{formatSp(activeEvent.starts_at)}</p>
            </>
          ) : (
            <p className="font-semibold text-white">Nenhum culto próximo</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-gold" />
      </Link>

      {activeEvent ? (
        <div className="flex flex-wrap gap-2">
          <Badge>{checkedIn ? 'Check-in feito neste culto' : 'Sem check-in neste culto'}</Badge>
          {todayEvents.length > 1 ? (
            <Badge>{todayEvents.length} cultos hoje</Badge>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-brand text-xl text-gold">Minha escala</h3>
        {slots.length === 0 ? (
          <EmptyState
            title="Você ainda não está na escala"
            description="Peça ao líder para te adicionar à equipe e à escala."
          />
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-2xl border border-white/10 bg-panel px-4 py-3"
            >
              <p className="font-medium">{slot.ministry?.name ?? 'Ministério'}</p>
              <p className="text-sm text-muted">Função: {slot.role_label || 'sem rótulo'}</p>
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        {isSalaMember ? <QuickLink to="/sala" label="Sala" /> : null}
        {isHostMember ? <QuickLink to="/host" label="Host" /> : null}
        {isLeader ? <QuickLink to="/equipe" label="Equipe" /> : null}
        {isLeader ? <QuickLink to="/relatorios" label="Relatórios" /> : null}
        {isAdmin ? <QuickLink to="/admin" label="Admin" /> : null}
        <QuickLink to="/config" label="Mais" />
      </section>
    </div>
  )
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/10 bg-panel px-4 py-5 text-sm font-semibold text-white hover:border-gold/40"
    >
      <span className="text-gold">{label}</span>
    </Link>
  )
}

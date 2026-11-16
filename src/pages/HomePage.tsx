import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { formatSp, labelService } from '../lib/timezone'
import { supabase } from '../lib/supabase'
import type { ScheduleSlot } from '../types/database'

const DISMISS_KEY = 'lagoinha-install-card-dismissed'

export function HomePage() {
  const { profile, user, isAdmin, isSalaMember, isHostMember, isLeader } = useAuth()
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
        <div className="rounded-2xl border border-amber-200/30 bg-amber-400/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-50">Instale na tela inicial</p>
              <p className="mt-1 text-sm text-amber-50/80">
                Opcional — acesso mais rápido no culto. Veja o passo a passo quando quiser.
              </p>
              <Link to="/instalar" className="mt-2 inline-block text-sm font-semibold underline">
                Como instalar
              </Link>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-amber-50/90 hover:bg-white/10"
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

      <section className="rounded-3xl border border-white/15 bg-white/10 p-5">
        <p className="text-sm text-sky-100/70">Culto atual</p>
        {loading ? (
          <p className="mt-2">Carregando cultos…</p>
        ) : activeEvent ? (
          <>
            <h2 className="mt-1 font-display text-2xl">{activeEvent.title}</h2>
            <p className="text-sm text-sky-100/80">{formatSp(activeEvent.starts_at)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{checkedIn ? 'Check-in feito neste culto' : 'Sem check-in neste culto'}</Badge>
              {todayEvents.length > 1 ? (
                <Badge className="bg-sky-500/30">
                  {todayEvents.length} cultos hoje (manhã/noite)
                </Badge>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/checkin"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800"
              >
                Fazer check-in
              </Link>
              <Link
                to="/escala"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:bg-white/10"
              >
                Ver escala
              </Link>
            </div>
          </>
        ) : (
          <EmptyState
            title="Nenhum culto próximo"
            description="Peça ao admin para cadastrar manhã/noite."
          />
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl">Minha escala neste culto</h3>
        {slots.length === 0 ? (
          <EmptyState
            title="Você ainda não está na escala"
            description="Peça ao líder para te adicionar à equipe e à escala."
          />
        ) : (
          slots.map((slot) => (
            <div
              key={slot.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <p className="font-medium">{slot.ministry?.name ?? 'Ministério'}</p>
              <p className="text-sm text-sky-100/80">
                Função: {slot.role_label || 'sem rótulo'}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        {isSalaMember ? (
          <QuickLink to="/sala" label="Sala de Voluntários" />
        ) : null}
        {isHostMember ? <QuickLink to="/host" label="Host" /> : null}
        {isLeader ? <QuickLink to="/equipe" label="Equipe" /> : null}
        {isLeader ? <QuickLink to="/relatorios" label="Relatórios" /> : null}
        {isAdmin ? <QuickLink to="/admin" label="Admin" /> : null}
        <QuickLink to="/config" label="Config" />
      </section>

      {activeEvent ? (
        <p className="text-xs text-sky-100/60">
          Culto ativo: {labelService(activeEvent.title, activeEvent.starts_at)} · olá,{' '}
          {profile?.full_name}
        </p>
      ) : null}
    </div>
  )
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-5 text-sm font-semibold hover:bg-white/15"
    >
      {label}
    </Link>
  )
}

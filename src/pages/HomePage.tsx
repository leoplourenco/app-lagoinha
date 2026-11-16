import { useEffect, useState, type ComponentType } from 'react'
import {
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  QrCode,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { formatSp } from '../lib/timezone'
import { leaderMinistryNames, roleTitle } from '../lib/roles'
import { supabase } from '../lib/supabase'
import type { ScheduleSlot } from '../types/database'

const DISMISS_KEY = 'lagoinha-install-card-dismissed'

export function HomePage() {
  const {
    user,
    memberships,
    isAdmin,
    isSalaMember,
    isHostMember,
    isLeader,
  } = useAuth()
  const { activeEvent, todayEvents, loading } = useServiceEvents()
  const [slots, setSlots] = useState<(ScheduleSlot & { ministry?: { name: string } })[]>([])
  const [checkedIn, setCheckedIn] = useState(false)
  const [showInstall, setShowInstall] = useState(
    () => localStorage.getItem(DISMISS_KEY) !== '1',
  )

  const title = roleTitle({ isAdmin, isLeader })
  const leaderMinistries = leaderMinistryNames(memberships)

  useEffect(() => {
    if (isAdmin || !user || !activeEvent) return
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
  }, [user, activeEvent, isAdmin])

  if (isAdmin) {
    return (
      <div className="space-y-5">
        <Badge className="bg-gold/25 text-gold">Perfil: Admin</Badge>

        <section className="space-y-3">
          <h3 className="font-brand text-2xl text-gold">Painel admin</h3>
          <p className="text-sm text-muted">
            Você está acima dos líderes. Escolha o que quer gerenciar:
          </p>

          <Link
            to="/admin/ministerios"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-panel px-4 py-5 hover:border-gold/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Ministérios</p>
              <p className="text-sm text-muted">Ver todos os ministérios e seus líderes</p>
            </div>
          </Link>

          <Link
            to="/admin/relatorios"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-panel px-4 py-5 hover:border-gold/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Relatórios</p>
              <p className="text-sm text-muted">Presença e check-in por culto</p>
            </div>
          </Link>

          <Link
            to="/admin/usuarios"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-panel px-4 py-5 hover:border-gold/40"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Usuários</p>
              <p className="text-sm text-muted">Promover ou remover líderes</p>
            </div>
          </Link>
        </section>

        <Link
          to="/admin/ferramentas"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-muted hover:border-gold/40 hover:text-gold"
        >
          <QrCode className="h-5 w-5" />
          QR imprimível e cultos
        </Link>

        <Link
          to="/config"
          className="block text-center text-sm font-semibold text-gold underline"
        >
          Perfil e config
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={isLeader ? 'bg-gold/25 text-gold' : undefined}>
          Perfil: {title}
        </Badge>
        {leaderMinistries.length > 0 ? (
          <Badge>{leaderMinistries.join(' · ')}</Badge>
        ) : null}
      </div>

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
        to={isLeader ? '/escala' : '/checkin'}
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

      {isLeader ? (
        <section className="space-y-3">
          <h3 className="font-brand text-xl text-gold">Painel do líder</h3>
          <p className="text-sm text-muted">
            Monte a escala, cuide da equipe e veja a presença do culto.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              to="/escala"
              title="Montar escala"
              hint="Rótulos por função"
              icon={ClipboardList}
            />
            <ActionCard to="/equipe" title="Equipe" hint="Adicionar voluntários" icon={Users} />
            <ActionCard
              to="/relatorios"
              title="Relatórios"
              hint="Presença por culto"
              icon={ClipboardList}
            />
            <ActionCard
              to="/checkin/manual"
              title="Check-in manual"
              hint="Buscar pelo nome"
              icon={CheckSquare}
            />
            {isSalaMember ? (
              <ActionCard to="/sala" title="Sala" hint="Porta, estoque, café" icon={Users} />
            ) : null}
            {isHostMember ? (
              <ActionCard to="/host" title="Host" hint="Agenda e cardápio" icon={Users} />
            ) : null}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <h3 className="font-brand text-xl text-gold">Área do voluntário</h3>
          <p className="text-sm text-muted">
            Faça check-in no culto e veja onde você serve.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              to="/checkin"
              title="Check-in"
              hint="QR do culto"
              icon={CheckSquare}
            />
            <ActionCard
              to="/escala"
              title="Minha escala"
              hint="Função no culto"
              icon={ClipboardList}
            />
            {isSalaMember ? (
              <ActionCard to="/sala" title="Sala" hint="Operação do culto" icon={Users} />
            ) : null}
            {isHostMember ? (
              <ActionCard to="/host" title="Host" hint="Convidados" icon={Users} />
            ) : null}
          </div>
          {memberships.length === 0 ? (
            <EmptyState
              title="Você ainda não está em um ministério"
              description="Peça ao líder para te adicionar à equipe depois do cadastro."
            />
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-brand text-xl text-gold">Minha escala neste culto</h3>
        {slots.length === 0 ? (
          <EmptyState
            title="Você ainda não está na escala"
            description={
              isLeader
                ? 'Monte a escala em Escalas ou peça a outro líder.'
                : 'Peça ao líder para te adicionar à equipe e à escala.'
            }
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

      <QuickLink to="/config" label="Perfil e config" />
    </div>
  )
}

function ActionCard({
  to,
  title,
  hint,
  icon: Icon,
}: {
  to: string
  title: string
  hint: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/10 bg-panel px-4 py-4 hover:border-gold/40"
    >
      <Icon className="mb-2 h-5 w-5 text-gold" />
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Link>
  )
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-white/10 bg-panel px-4 py-4 text-sm font-semibold text-gold hover:border-gold/40"
    >
      {label}
    </Link>
  )
}

import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarDays,
  CheckSquare,
  Coffee,
  Home,
  Settings,
  Shield,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { roleTitle } from '../../lib/roles'
import { cn } from '../../lib/utils'
import { friendlyTodayLabel } from '../../lib/timezone'
import { GoldWaves } from '../brand/GoldWaves'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
    isActive ? 'text-gold' : 'text-muted hover:text-white',
  )

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function AppShell() {
  const { profile, isAdmin, isLeader, isSalaMember, isHostMember } = useAuth()
  const title = roleTitle({ isAdmin, isLeader })

  const items: NavItem[] = [
    { to: '/', label: 'Início', icon: Home, end: true },
    { to: '/escala', label: 'Escalas', icon: CalendarDays },
    { to: '/checkin', label: 'Check-in', icon: CheckSquare },
  ]

  if (isSalaMember) {
    items.push({ to: '/sala', label: 'Sala', icon: Coffee })
  } else if (isHostMember) {
    items.push({ to: '/host', label: 'Host', icon: Utensils })
  } else if (isLeader) {
    items.push({ to: '/equipe', label: 'Equipe', icon: Users })
  }

  if (isAdmin) {
    items.push({ to: '/admin', label: 'Admin', icon: Shield })
  }

  // Só um "Mais" — e só se ainda couber / não for admin-only sem config
  if (!items.some((i) => i.to === '/config')) {
    items.push({ to: '/config', label: 'Mais', icon: Settings })
  }

  // No máximo 5 abas (admin + sala: Início Escalas Check-in Sala Admin; Config no home)
  const navItems = items.slice(0, 5)

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink text-white">
      <GoldWaves />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24 pt-5">
        <header className="mb-5">
          <div className="mb-4 flex items-center gap-3">
            <img
              src="/brand/logo-icon.png"
              alt="Lagoinha"
              className="h-10 w-10 rounded-full object-cover"
            />
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Lagoinha</p>
          </div>
          <h1 className="mt-1 font-brand text-3xl tracking-tight text-white">
            {isAdmin ? 'Olá, admin!' : isLeader ? 'Olá, líder!' : 'Olá, equipe!'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {profile?.full_name} · {title} · {friendlyTodayLabel()}
          </p>
          <p className="mt-1 text-sm text-muted">Que Deus abençoe nosso ministério.</p>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/90 backdrop-blur-md">
        <div
          className="mx-auto grid max-w-lg gap-1 px-2 py-2"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

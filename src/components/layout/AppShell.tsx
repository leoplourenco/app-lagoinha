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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import { friendlyTodayLabel } from '../../lib/timezone'
import { GoldWaves } from '../brand/GoldWaves'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
    isActive ? 'text-gold' : 'text-muted hover:text-white',
  )

export function AppShell() {
  const { profile, isAdmin, isLeader, isSalaMember, isHostMember } = useAuth()

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
          <h1 className="mt-1 font-brand text-3xl tracking-tight text-white">Olá, equipe!</h1>
          <p className="mt-1 text-sm text-muted">
            {profile?.full_name} · {friendlyTodayLabel()}
          </p>
          <p className="mt-1 text-sm text-muted">Que Deus abençoe nosso ministério.</p>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          <NavLink to="/" end className={linkClass}>
            <Home className="h-4 w-4" />
            Início
          </NavLink>
          <NavLink to="/escala" className={linkClass}>
            <CalendarDays className="h-4 w-4" />
            Escalas
          </NavLink>
          <NavLink to="/checkin" className={linkClass}>
            <CheckSquare className="h-4 w-4" />
            Check-in
          </NavLink>
          {isSalaMember ? (
            <NavLink to="/sala" className={linkClass}>
              <Coffee className="h-4 w-4" />
              Sala
            </NavLink>
          ) : isHostMember ? (
            <NavLink to="/host" className={linkClass}>
              <Utensils className="h-4 w-4" />
              Host
            </NavLink>
          ) : isLeader ? (
            <NavLink to="/equipe" className={linkClass}>
              <Users className="h-4 w-4" />
              Equipe
            </NavLink>
          ) : (
            <NavLink to="/config" className={linkClass}>
              <Settings className="h-4 w-4" />
              Mais
            </NavLink>
          )}
          {isAdmin ? (
            <NavLink to="/admin" className={linkClass}>
              <Shield className="h-4 w-4" />
              Admin
            </NavLink>
          ) : (
            <NavLink to="/config" className={linkClass}>
              <Settings className="h-4 w-4" />
              Mais
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  )
}

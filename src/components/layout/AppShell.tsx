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

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
    isActive ? 'bg-white/15 text-white' : 'text-sky-100/70 hover:bg-white/10 hover:text-white',
  )

export function AppShell() {
  const { profile, isAdmin, isLeader, isSalaMember, isHostMember } = useAuth()

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_#0ea5e9_0%,_#0c4a6e_45%,_#082f49_100%)] text-white">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-24 pt-5">
        <header className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">
            Igreja Batista da Lagoinha
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">App Lagoinha</h1>
          <p className="mt-1 text-sm text-sky-100/80">
            {profile?.full_name} · {friendlyTodayLabel()}
          </p>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-sky-950/90 backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          <NavLink to="/" end className={linkClass}>
            <Home className="h-4 w-4" />
            Início
          </NavLink>
          <NavLink to="/checkin" className={linkClass}>
            <CheckSquare className="h-4 w-4" />
            Check-in
          </NavLink>
          <NavLink to="/escala" className={linkClass}>
            <CalendarDays className="h-4 w-4" />
            Escala
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
              Config
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
              Config
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  )
}

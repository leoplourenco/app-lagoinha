import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({
  requireAdmin,
  requireLeader,
  requireSala,
  requireHost,
}: {
  requireAdmin?: boolean
  requireLeader?: boolean
  requireSala?: boolean
  requireHost?: boolean
}) {
  const {
    loading,
    session,
    isAdmin,
    isLeader,
    isSalaMember,
    isHostMember,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sky-950 text-sky-100">
        Carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />
  if (requireLeader && !isLeader) return <Navigate to="/" replace />
  if (requireSala && !isSalaMember) return <Navigate to="/" replace />
  if (requireHost && !isHostMember) return <Navigate to="/" replace />

  return <Outlet />
}

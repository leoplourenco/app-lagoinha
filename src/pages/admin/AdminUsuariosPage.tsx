import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import type { Ministry, MinistryMember, Profile } from '../../types/database'

type MemberRow = MinistryMember & { ministry?: Ministry }

export function AdminUsuariosPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    const [u, m, mem] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('ministries').select('*').eq('active', true).order('name'),
      supabase.from('ministry_members').select('*, ministry:ministries(*)'),
    ])
    if (u.error || m.error || mem.error) {
      setError(u.error?.message || m.error?.message || mem.error?.message || 'Erro')
      return
    }
    setUsers((u.data as Profile[]) ?? [])
    setMinistries((m.data as Ministry[]) ?? [])
    setMembers(
      ((mem.data as MemberRow[]) ?? []).map((row) => ({
        ...row,
        ministry: Array.isArray(row.ministry) ? row.ministry[0] : row.ministry,
      })),
    )
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, query])

  function membershipsFor(userId: string) {
    return members.filter((m) => m.user_id === userId)
  }

  async function setLeader(user: Profile, ministryId: string, asLeader: boolean) {
    setMessage(null)
    setError(null)
    const existing = members.find(
      (m) => m.user_id === user.user_id && m.ministry_id === ministryId,
    )

    if (existing) {
      const { error: err } = await supabase
        .from('ministry_members')
        .update({ role: asLeader ? 'leader' : 'volunteer' })
        .eq('id', existing.id)
      if (err) {
        setError(err.message)
        return
      }
    } else if (asLeader) {
      const { error: err } = await supabase.from('ministry_members').insert({
        user_id: user.user_id,
        ministry_id: ministryId,
        role: 'leader',
      })
      if (err) {
        setError(err.message)
        return
      }
    }

    const ministryName = ministries.find((m) => m.id === ministryId)?.name ?? 'ministério'
    setMessage(
      asLeader
        ? `${user.full_name} agora é líder de ${ministryName}.`
        : `${user.full_name} deixou de ser líder de ${ministryName}.`,
    )
    await load()
  }

  async function setAdmin(user: Profile, value: boolean) {
    setMessage(null)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_admin: value })
      .eq('user_id', user.user_id)
    if (err) {
      setError(err.message)
      return
    }
    setMessage(
      value
        ? `${user.full_name} promovido a admin do app.`
        : `${user.full_name} removido de admin.`,
    )
    await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin" className="text-sm text-gold underline">
          ← Voltar ao admin
        </Link>
        <h2 className="mt-2 font-brand text-2xl text-gold">Usuários</h2>
        <p className="mt-1 text-sm text-muted">
          Promova alguém a líder de um ministério ou remova a liderança. Admin do app é separado.
        </p>
      </div>

      <Input
        placeholder="Buscar por nome ou e-mail"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" />
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => {
            const userMemberships = membershipsFor(user.user_id)
            return (
              <div key={user.user_id} className="rounded-2xl border border-white/10 bg-panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{user.full_name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.is_admin ? <Badge>Admin</Badge> : null}
                    {userMemberships
                      .filter((m) => m.role === 'leader')
                      .map((m) => (
                        <Badge key={m.id}>Líder · {m.ministry?.name}</Badge>
                      ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gold">Liderança por ministério</p>
                  {ministries.map((ministry) => {
                    const mem = userMemberships.find((m) => m.ministry_id === ministry.id)
                    const isLeader = mem?.role === 'leader'
                    return (
                      <div
                        key={ministry.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{ministry.name}</p>
                          <p className="text-xs text-muted">
                            {isLeader
                              ? 'É líder'
                              : mem
                                ? 'É voluntário'
                                : 'Fora da equipe'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isLeader ? 'outline' : 'default'}
                          onClick={() => void setLeader(user, ministry.id, !isLeader)}
                        >
                          {isLeader ? 'Remover líder' : 'Tornar líder'}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 text-xs text-muted">
                    Admin do app ≠ líder de ministério. Use isso só para pastores/admins globais.
                  </p>
                  <Button
                    size="sm"
                    variant={user.is_admin ? 'outline' : 'secondary'}
                    onClick={() => void setAdmin(user, !user.is_admin)}
                  >
                    {user.is_admin ? 'Remover admin do app' : 'Promover a admin do app'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import type { Ministry, MinistryMember, Profile } from '../../types/database'

type MemberRow = MinistryMember & { ministry?: Ministry }

export function AdminUsuariosPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [query, setQuery] = useState('')
  const [openUserId, setOpenUserId] = useState<string | null>(null)
  const [addMinistryId, setAddMinistryId] = useState('')
  const [addAsLeader, setAddAsLeader] = useState(false)
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

  function toggleOpen(userId: string) {
    setOpenUserId((prev) => (prev === userId ? null : userId))
    setAddMinistryId('')
    setAddAsLeader(false)
    setMessage(null)
    setError(null)
  }

  async function makeLeader(user: Profile, ministryId: string) {
    setMessage(null)
    setError(null)
    const existing = members.find(
      (m) => m.user_id === user.user_id && m.ministry_id === ministryId,
    )
    const ministryName = ministries.find((m) => m.id === ministryId)?.name ?? 'ministério'

    if (existing) {
      const { error: err } = await supabase
        .from('ministry_members')
        .update({ role: 'leader' })
        .eq('id', existing.id)
      if (err) {
        setError(err.message)
        return
      }
    } else {
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

    setMessage(`${user.full_name} agora é líder de ${ministryName}.`)
    await load()
  }

  async function makeVolunteer(user: Profile, ministryId: string) {
    setMessage(null)
    setError(null)
    const existing = members.find(
      (m) => m.user_id === user.user_id && m.ministry_id === ministryId,
    )
    const ministryName = ministries.find((m) => m.id === ministryId)?.name ?? 'ministério'

    if (existing) {
      const { error: err } = await supabase
        .from('ministry_members')
        .update({ role: 'volunteer' })
        .eq('id', existing.id)
      if (err) {
        setError(err.message)
        return
      }
    } else {
      const { error: err } = await supabase.from('ministry_members').insert({
        user_id: user.user_id,
        ministry_id: ministryId,
        role: 'volunteer',
      })
      if (err) {
        setError(err.message)
        return
      }
    }

    setMessage(`${user.full_name} é voluntário de ${ministryName}.`)
    setAddMinistryId('')
    setAddAsLeader(false)
    await load()
  }

  async function removeFromMinistry(user: Profile, ministryId: string) {
    setMessage(null)
    setError(null)
    const existing = members.find(
      (m) => m.user_id === user.user_id && m.ministry_id === ministryId,
    )
    if (!existing) return

    const { error: err } = await supabase
      .from('ministry_members')
      .delete()
      .eq('id', existing.id)
    if (err) {
      setError(err.message)
      return
    }

    const ministryName = ministries.find((m) => m.id === ministryId)?.name ?? 'ministério'
    setMessage(`${user.full_name} foi desvinculado de ${ministryName}.`)
    await load()
  }

  async function addToMinistry(user: Profile) {
    if (!addMinistryId) {
      setError('Escolha um ministério.')
      return
    }
    if (addAsLeader) await makeLeader(user, addMinistryId)
    else await makeVolunteer(user, addMinistryId)
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
          Toque na pessoa para gerenciar. Só aparece o que ela já tem + opção de vincular
          outro ministério.
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
        <div className="space-y-2">
          {filtered.map((user) => {
            const userMemberships = membershipsFor(user.user_id)
            const open = openUserId === user.user_id
            const availableMinistries = ministries.filter(
              (m) => !userMemberships.some((mem) => mem.ministry_id === m.id),
            )

            return (
              <div
                key={user.user_id}
                className={cn(
                  'rounded-2xl border bg-panel',
                  open ? 'border-gold/40' : 'border-white/10',
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => toggleOpen(user.user_id)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{user.full_name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.is_admin ? <Badge>Admin</Badge> : null}
                      {userMemberships.length === 0 && !user.is_admin ? (
                        <span className="text-xs text-muted">Sem ministério</span>
                      ) : null}
                      {userMemberships.map((m) => (
                        <Badge key={m.id}>
                          {m.role === 'leader' ? 'Líder' : 'Vol.'} · {m.ministry?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-gold">{open ? '▲' : '▼'}</span>
                </button>

                {open ? (
                  <div className="space-y-3 border-t border-white/10 px-4 py-4">
                    {userMemberships.length === 0 ? (
                      <p className="text-sm text-muted">Ainda não está em nenhum ministério.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-wide text-gold">
                          Ministérios vinculados
                        </p>
                        {userMemberships.map((mem) => (
                          <div
                            key={mem.id}
                            className="flex flex-col gap-2 rounded-xl bg-black/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {mem.ministry?.name ?? 'Ministério'}
                              </p>
                              <p className="text-xs text-muted">
                                {mem.role === 'leader' ? 'Líder' : 'Voluntário'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {mem.role === 'volunteer' ? (
                                <Button
                                  size="sm"
                                  onClick={() => void makeLeader(user, mem.ministry_id)}
                                >
                                  Tornar líder
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void makeVolunteer(user, mem.ministry_id)}
                                >
                                  Só voluntário
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void removeFromMinistry(user, mem.ministry_id)}
                              >
                                Desvincular
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {availableMinistries.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-3">
                        <p className="text-xs uppercase tracking-wide text-gold">
                          Vincular ministério
                        </p>
                        <select
                          className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
                          value={addMinistryId}
                          onChange={(e) => setAddMinistryId(e.target.value)}
                        >
                          <option value="">Escolher ministério…</option>
                          {availableMinistries.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-muted">
                          <input
                            type="checkbox"
                            checked={addAsLeader}
                            onChange={(e) => setAddAsLeader(e.target.checked)}
                            className="rounded border-white/30"
                          />
                          Já como líder
                        </label>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={!addMinistryId}
                          onClick={() => void addToMinistry(user)}
                        >
                          Vincular
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Já está em todos os ministérios.</p>
                    )}

                    <div className="border-t border-white/10 pt-3">
                      <p className="mb-2 text-xs text-muted">
                        Admin do app ≠ líder de ministério.
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
                ) : null}
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

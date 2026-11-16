import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { canManageMinistry, leaderMemberships } from '../lib/roles'
import { supabase } from '../lib/supabase'
import type { Ministry, MinistryMember, Profile } from '../types/database'

type MemberRow = MinistryMember & { profile?: Profile }

export function EquipePage() {
  const { memberships, isAdmin } = useAuth()
  const [allMinistries, setAllMinistries] = useState<Ministry[]>([])
  const [ministryId, setMinistryId] = useState('')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<Profile[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const leaderMinistries = useMemo(() => {
    if (isAdmin) {
      return allMinistries.map((m) => ({
        ministry_id: m.id,
        ministry: m,
        role: 'leader' as const,
      }))
    }
    return leaderMemberships(memberships)
  }, [isAdmin, allMinistries, memberships])

  useEffect(() => {
    if (!isAdmin) return
    void supabase
      .from('ministries')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => {
        setAllMinistries((data as Ministry[]) ?? [])
      })
  }, [isAdmin])

  useEffect(() => {
    if (!leaderMinistries.length) {
      if (ministryId) setMinistryId('')
      return
    }
    const stillValid = leaderMinistries.some((m) => m.ministry_id === ministryId)
    if (!ministryId || !stillValid) {
      setMinistryId(leaderMinistries[0].ministry_id)
    }
  }, [leaderMinistries, ministryId])

  async function loadMembers() {
    if (!ministryId) {
      setMembers([])
      return
    }
    if (!canManageMinistry(memberships, ministryId, isAdmin)) {
      setError('Você só pode gerir a equipe dos ministérios que lidera.')
      setMembers([])
      return
    }
    const { data, error: err } = await supabase
      .from('ministry_members')
      .select('*, profile:profiles(*)')
      .eq('ministry_id', ministryId)
      .order('created_at')
    if (err) {
      setError(err.message)
      return
    }
    setMembers(
      ((data as MemberRow[]) ?? []).map((m) => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] : m.profile,
      })),
    )
  }

  useEffect(() => {
    void loadMembers()
  }, [ministryId, isAdmin, memberships])

  async function searchCandidates() {
    const q = query.trim().toLowerCase()
    const { data } = await supabase.from('profiles').select('*').order('full_name').limit(50)
    const rows = ((data as Profile[]) ?? []).filter(
      (p) =>
        !members.some((m) => m.user_id === p.user_id) &&
        (!q ||
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)),
    )
    setCandidates(rows.slice(0, 15))
  }

  async function addMember(profile: Profile, role: 'volunteer' | 'leader' = 'volunteer') {
    setError(null)
    setMessage(null)
    if (!canManageMinistry(memberships, ministryId, isAdmin)) {
      setError('Você só pode adicionar pessoas nos ministérios que lidera.')
      return
    }
    const { error: err } = await supabase.from('ministry_members').insert({
      ministry_id: ministryId,
      user_id: profile.user_id,
      role,
    })
    if (err) {
      setError(err.message)
      return
    }
    setMessage(`${profile.full_name} adicionado à equipe.`)
    setQuery('')
    setCandidates([])
    await loadMembers()
  }

  async function setRole(member: MemberRow, role: 'volunteer' | 'leader') {
    if (!canManageMinistry(memberships, member.ministry_id, isAdmin)) {
      setError('Você só pode alterar papéis nos ministérios que lidera.')
      return
    }
    await supabase.from('ministry_members').update({ role }).eq('id', member.id)
    await loadMembers()
  }

  async function removeMember(member: MemberRow) {
    if (!canManageMinistry(memberships, member.ministry_id, isAdmin)) {
      setError('Você só pode remover pessoas dos ministérios que lidera.')
      return
    }
    await supabase.from('ministry_members').delete().eq('id', member.id)
    await loadMembers()
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    void searchCandidates()
  }

  if (!isAdmin && leaderMinistries.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="font-brand text-2xl">Equipe</h2>
        <EmptyState
          title="Sem ministério para gerir"
          description="Você precisa ser líder de pelo menos um ministério."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Equipe</h2>
        <p className="mt-1 text-sm text-muted">
          Só dá para adicionar quem já se cadastrou no app. Você gerencia apenas o(s)
          ministério(s) que lidera.
        </p>
      </div>

      <select
        className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
        value={ministryId}
        onChange={(e) => setMinistryId(e.target.value)}
      >
        {leaderMinistries.map((m) => (
          <option key={m.ministry_id} value={m.ministry_id}>
            {m.ministry?.name ?? m.ministry_id}
          </option>
        ))}
      </select>

      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder="Buscar voluntário cadastrado"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {candidates.length > 0 ? (
        <div className="space-y-2">
          {candidates.map((c) => (
            <div
              key={c.user_id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium">{c.full_name}</p>
                <p className="text-xs text-muted">{c.email}</p>
              </div>
              <Button size="sm" onClick={() => void addMember(c)}>
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {members.length === 0 ? (
        <EmptyState
          title="Equipe vazia"
          description="Peça ao voluntário para se cadastrar e depois adicione aqui."
        />
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium">{m.profile?.full_name}</p>
                <p className="text-xs text-muted">
                  {m.role === 'leader' ? 'Líder' : 'Voluntário'} · {m.profile?.email}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void setRole(m, m.role === 'leader' ? 'volunteer' : 'leader')
                  }
                >
                  {m.role === 'leader' ? 'Tornar voluntário' : 'Tornar líder'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void removeMember(m)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

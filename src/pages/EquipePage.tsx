import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { MinistryMember, Profile } from '../types/database'

type MemberRow = MinistryMember & { profile?: Profile }

export function EquipePage() {
  const { memberships, isAdmin } = useAuth()
  const leaderMinistries = memberships.filter((m) => isAdmin || m.role === 'leader')
  const [ministryId, setMinistryId] = useState(leaderMinistries[0]?.ministry_id ?? '')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<Profile[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadMembers() {
    if (!ministryId) return
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
  }, [ministryId])

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
    await supabase.from('ministry_members').update({ role }).eq('id', member.id)
    await loadMembers()
  }

  async function removeMember(id: string) {
    await supabase.from('ministry_members').delete().eq('id', id)
    await loadMembers()
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    void searchCandidates()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Equipe</h2>
        <p className="mt-1 text-sm text-sky-100/80">
          Só dá para adicionar quem já se cadastrou no app.
        </p>
      </div>

      <select
        className="h-11 w-full rounded-xl border border-white/15 bg-sky-950/60 px-3 text-sm"
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
                <p className="text-xs text-sky-100/70">{c.email}</p>
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
                <p className="text-xs text-sky-100/70">
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
                <Button size="sm" variant="ghost" onClick={() => void removeMember(m.id)}>
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

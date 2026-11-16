import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { supabase } from '../../lib/supabase'
import type { Ministry, MinistryMember, Profile } from '../../types/database'

type LeaderRow = MinistryMember & { profile?: Profile }

export function AdminMinisteriosPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [leadersByMinistry, setLeadersByMinistry] = useState<Record<string, LeaderRow[]>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [{ data: mins, error: mErr }, { data: members, error: memErr }] = await Promise.all([
        supabase.from('ministries').select('*').order('name'),
        supabase
          .from('ministry_members')
          .select('*, profile:profiles(*)')
          .eq('role', 'leader'),
      ])
      if (mErr || memErr) {
        setError(mErr?.message || memErr?.message || 'Erro ao carregar')
        return
      }
      setMinistries((mins as Ministry[]) ?? [])
      const map: Record<string, LeaderRow[]> = {}
      for (const row of (members as LeaderRow[]) ?? []) {
        const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
        const item = { ...row, profile }
        map[row.ministry_id] = [...(map[row.ministry_id] ?? []), item]
      }
      setLeadersByMinistry(map)
    })()
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin" className="text-sm text-gold underline">
          ← Voltar ao admin
        </Link>
        <h2 className="mt-2 font-brand text-2xl text-gold">Ministérios</h2>
        <p className="mt-1 text-sm text-muted">Visão de todos os ministérios e quem lidera cada um.</p>
      </div>

      {ministries.length === 0 ? (
        <EmptyState title="Nenhum ministério" description="Rode o seed do schema.sql" />
      ) : (
        <div className="space-y-3">
          {ministries.map((m) => {
            const leaders = leadersByMinistry[m.id] ?? []
            return (
              <div key={m.id} className="rounded-2xl border border-white/10 bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{m.name}</p>
                    <p className="text-xs text-muted">slug: {m.slug}</p>
                  </div>
                  <Badge className={m.active ? undefined : 'bg-rose-500/30 text-rose-100'}>
                    {m.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-gold">Líderes</p>
                  {leaders.length === 0 ? (
                    <p className="text-sm text-muted">Nenhum líder ainda.</p>
                  ) : (
                    leaders.map((l) => (
                      <p key={l.id} className="text-sm text-white">
                        {l.profile?.full_name ?? 'Sem nome'}
                        <span className="text-muted"> · {l.profile?.email}</span>
                      </p>
                    ))
                  )}
                </div>
                <Link
                  to="/admin/usuarios"
                  className="mt-3 inline-block text-sm font-semibold text-gold underline"
                >
                  Gerenciar líderes em Usuários
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  )
}

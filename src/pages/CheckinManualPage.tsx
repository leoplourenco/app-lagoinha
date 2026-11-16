import { useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ServicePicker } from '../components/ServicePicker'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

export function CheckinManualPage() {
  const { user } = useAuth()
  const { todayEvents, upcomingEvents, activeEvent } = useServiceEvents()
  const events = todayEvents.length > 0 ? todayEvents : upcomingEvents.slice(0, 6)
  const [eventId, setEventId] = useState<string | null>(activeEvent?.id ?? null)
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Profile[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people.slice(0, 20)
    return people
      .filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
      )
      .slice(0, 20)
  }, [people, query])

  async function search() {
    setError(null)
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
      .limit(100)
    if (err) {
      setError(err.message)
      return
    }
    setPeople((data as Profile[]) ?? [])
  }

  async function mark(person: Profile) {
    if (!user || !eventId) {
      setError('Selecione o culto.')
      return
    }
    setMessage(null)
    setError(null)
    const { error: err } = await supabase.from('church_checkins').insert({
      user_id: person.user_id,
      event_id: eventId,
      method: 'manual',
      created_by: user.id,
    })
    if (err) {
      if (err.code === '23505') setMessage(`${person.full_name} já fez check-in neste culto.`)
      else setError(err.message)
      return
    }
    setMessage(`Check-in manual: ${person.full_name}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Check-in manual</h2>
        <p className="mt-1 text-sm text-sky-100/80">
          Busque pelo nome e marque no culto selecionado.
        </p>
      </div>

      <ServicePicker
        events={events}
        value={eventId}
        onChange={setEventId}
      />

      <div className="flex gap-2">
        <Input
          placeholder="Buscar pelo nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (people.length === 0) void search()
          }}
        />
        <Button variant="outline" onClick={() => void search()}>
          Buscar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Ninguém encontrado" description="Digite o nome do voluntário." />
      ) : (
        <div className="space-y-2">
          {filtered.map((person) => (
            <div
              key={person.user_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium">{person.full_name}</p>
                <p className="text-xs text-sky-100/70">{person.email}</p>
              </div>
              <Button size="sm" onClick={() => void mark(person)}>
                Marcar
              </Button>
            </div>
          ))}
        </div>
      )}

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

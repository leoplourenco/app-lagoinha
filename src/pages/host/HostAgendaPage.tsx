import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { GuestStatus, GuestType, HostGuest } from '../../types/database'

const STATUSES: GuestStatus[] = ['previsto', 'chegou', 'concluido', 'cancelado']
const TYPES: GuestType[] = ['pastor', 'cantor', 'outro']

export function HostAgendaPage() {
  const { user, isHostLeader } = useAuth()
  const [guests, setGuests] = useState<HostGuest[]>([])
  const [name, setName] = useState('')
  const [guestType, setGuestType] = useState<GuestType>('outro')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error: err } = await supabase
      .from('host_guests')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setGuests((data as HostGuest[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function createGuest(e: FormEvent) {
    e.preventDefault()
    if (!isHostLeader) return
    const { error: err } = await supabase.from('host_guests').insert({
      name: name.trim(),
      guest_type: guestType,
      contact: contact.trim() || null,
      notes: notes.trim() || null,
      status: 'previsto',
      created_by: user?.id,
    })
    if (err) {
      setError(err.message)
      return
    }
    setName('')
    setContact('')
    setNotes('')
    await load()
  }

  async function setStatus(guest: HostGuest, status: GuestStatus) {
    const { error: err } = await supabase
      .from('host_guests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', guest.id)
    if (err) setError(err.message)
    else await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Agenda de convidados</h2>
        <p className="mt-1 text-sm text-muted">
          Membro marca “chegou”; líder/admin faz o CRUD da visita.
        </p>
      </div>

      {isHostLeader ? (
        <form onSubmit={createGuest} className="space-y-2 rounded-2xl border border-white/15 bg-white/10 p-4">
          <Input
            placeholder="Nome do convidado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select
            className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
            value={guestType}
            onChange={(e) => setGuestType(e.target.value as GuestType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input
            placeholder="Contato"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <Textarea
            placeholder="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Adicionar visita
          </Button>
        </form>
      ) : null}

      {guests.length === 0 ? (
        <EmptyState title="Nenhuma visita cadastrada" />
      ) : (
        <div className="space-y-3">
          {guests.map((guest) => (
            <div key={guest.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{guest.name}</p>
                  <p className="text-sm text-muted">{guest.guest_type}</p>
                  {guest.contact ? (
                    <p className="text-xs text-muted">{guest.contact}</p>
                  ) : null}
                </div>
                <Badge>{guest.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={guest.status === status ? 'default' : 'outline'}
                    onClick={() => void setStatus(guest, status)}
                    disabled={!isHostLeader && status !== 'chegou' && status !== guest.status}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

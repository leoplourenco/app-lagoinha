import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { useAuth } from '../context/AuthContext'
import { formatSp } from '../lib/timezone'
import { supabase } from '../lib/supabase'

type UnavailRow = {
  id: string
  unavailable_on: string
  note: string | null
}

export function DisponibilidadePage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<UnavailRow[]>([])
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    if (!user) return
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: err } = await supabase
      .from('volunteer_unavailability')
      .select('id, unavailable_on, note')
      .eq('user_id', user.id)
      .gte('unavailable_on', today)
      .order('unavailable_on', { ascending: true })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setRows((data as UnavailRow[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [user?.id])

  async function addDate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!user || !date) {
      setError('Escolha a data em que você não pode servir.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('volunteer_unavailability').upsert(
      {
        user_id: user.id,
        unavailable_on: date,
        note: note.trim() || null,
      },
      { onConflict: 'user_id,unavailable_on' },
    )
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setDate('')
    setNote('')
    setMessage('Data marcada como indisponível.')
    await load()
  }

  async function removeRow(id: string) {
    setError(null)
    const { error: err } = await supabase
      .from('volunteer_unavailability')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setMessage('Data removida.')
    await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl text-gold">Minha disponibilidade</h2>
        <p className="mt-1 text-sm text-muted">
          Marque os dias em que você não pode servir. O líder vê isso ao montar a escala.
        </p>
      </div>

      <form
        onSubmit={addDate}
        className="space-y-3 rounded-2xl border border-white/15 bg-panel p-4"
      >
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gold">Data</p>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gold">
            Motivo (opcional)
          </p>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Viagem, trabalho, saúde…"
          />
        </div>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Salvando…' : 'Marcar como indisponível'}
        </Button>
      </form>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gold">Próximas indisponibilidades</h3>
        {loading ? (
          <p className="text-sm text-muted">Carregando…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhuma data marcada"
            description="Quando não puder servir, adicione o dia acima."
          />
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
            >
              <div>
                <p className="font-medium capitalize">
                  {formatSp(`${row.unavailable_on}T12:00:00`, 'EEEE, dd/MM/yyyy')}
                </p>
                {row.note ? <p className="text-sm text-muted">{row.note}</p> : null}
              </div>
              <Button size="sm" variant="ghost" onClick={() => void removeRow(row.id)}>
                Remover
              </Button>
            </div>
          ))
        )}
      </section>

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

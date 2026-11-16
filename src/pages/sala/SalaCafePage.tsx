import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { ServicePicker } from '../../components/ServicePicker'
import { useAuth } from '../../context/AuthContext'
import { useServiceEvents } from '../../hooks/useServiceEvents'
import { supabase } from '../../lib/supabase'
import type { CoffeeTodo } from '../../types/database'

export function SalaCafePage() {
  const { user } = useAuth()
  const { todayEvents, upcomingEvents, activeEvent } = useServiceEvents()
  const events = todayEvents.length > 0 ? todayEvents : upcomingEvents
  const [eventId, setEventId] = useState<string | null>(null)
  const [todos, setTodos] = useState<CoffeeTodo[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  async function load() {
    if (!eventId) return
    const { data, error: err } = await supabase
      .from('coffee_todos')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order')
    if (err) setError(err.message)
    else setTodos((data as CoffeeTodo[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [eventId])

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    if (!eventId) return
    const { error: err } = await supabase.from('coffee_todos').insert({
      event_id: eventId,
      title: title.trim(),
      sort_order: todos.length + 1,
    })
    if (err) {
      setError(err.message)
      return
    }
    setTitle('')
    await load()
  }

  async function toggle(todo: CoffeeTodo) {
    await supabase
      .from('coffee_todos')
      .update({
        done: !todo.done,
        completed_at: !todo.done ? new Date().toISOString() : null,
        completed_by: !todo.done ? user?.id : null,
      })
      .eq('id', todo.id)
    await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">To-do dos cafés</h2>
        <p className="mt-1 text-sm text-sky-100/80">Checklist por culto.</p>
      </div>

      <ServicePicker events={events} value={eventId} onChange={setEventId} />

      <form onSubmit={addTodo} className="flex gap-2">
        <Input
          placeholder="Nova tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Button type="submit">Add</Button>
      </form>

      {todos.length === 0 ? (
        <EmptyState title="Sem tarefas neste culto" />
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <button
              key={todo.id}
              type="button"
              onClick={() => void toggle(todo)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  todo.done ? 'border-emerald-300 bg-emerald-500/40' : 'border-white/30'
                }`}
              >
                {todo.done ? '✓' : ''}
              </span>
              <span className={todo.done ? 'line-through opacity-70' : ''}>{todo.title}</span>
            </button>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { HostGuest, HostGuestMenu, HostMenuItem } from '../../types/database'

export function HostCardapioPage() {
  const { isHostLeader } = useAuth()
  const [items, setItems] = useState<HostMenuItem[]>([])
  const [guests, setGuests] = useState<HostGuest[]>([])
  const [guestMenus, setGuestMenus] = useState<HostGuestMenu[]>([])
  const [name, setName] = useState('')
  const [guestId, setGuestId] = useState('')
  const [menuItemId, setMenuItemId] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [i, g, gm] = await Promise.all([
      supabase.from('host_menu_items').select('*').order('name'),
      supabase.from('host_guests').select('*').order('created_at', { ascending: false }),
      supabase.from('host_guest_menu').select('*'),
    ])
    if (i.error || g.error || gm.error) {
      setError(i.error?.message || g.error?.message || gm.error?.message || 'Erro')
      return
    }
    setItems((i.data as HostMenuItem[]) ?? [])
    setGuests((g.data as HostGuest[]) ?? [])
    setGuestMenus((gm.data as HostGuestMenu[]) ?? [])
    if (!guestId && g.data?.[0]) setGuestId((g.data[0] as HostGuest).id)
    if (!menuItemId && i.data?.[0]) setMenuItemId((i.data[0] as HostMenuItem).id)
  }

  useEffect(() => {
    void load()
  }, [])

  async function addBaseItem(e: FormEvent) {
    e.preventDefault()
    if (!isHostLeader) return
    const { error: err } = await supabase.from('host_menu_items').insert({
      name: name.trim(),
      active: true,
    })
    if (err) {
      setError(err.message)
      return
    }
    setName('')
    await load()
  }

  async function linkToGuest() {
    if (!isHostLeader || !guestId || !menuItemId) return
    const { error: err } = await supabase.from('host_guest_menu').insert({
      guest_id: guestId,
      menu_item_id: menuItemId,
    })
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  const selectedGuestItems = guestMenus
    .filter((gm) => gm.guest_id === guestId)
    .map((gm) => items.find((i) => i.id === gm.menu_item_id))
    .filter(Boolean) as HostMenuItem[]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Cardápio do visitante</h2>
        <p className="mt-1 text-sm text-muted">Itens base + cardápio por visita.</p>
      </div>

      {isHostLeader ? (
        <form onSubmit={addBaseItem} className="flex gap-2">
          <Input
            placeholder="Novo item base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Button type="submit">Add</Button>
        </form>
      ) : null}

      <section className="space-y-2">
        <h3 className="font-semibold">Itens base</h3>
        {items.length === 0 ? (
          <EmptyState title="Sem itens" />
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              {item.name}
              {item.description ? (
                <span className="text-sm text-muted"> — {item.description}</span>
              ) : null}
            </div>
          ))
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4">
        <h3 className="font-semibold">Por visita</h3>
        <select
          className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
          value={guestId}
          onChange={(e) => setGuestId(e.target.value)}
        >
          {guests.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {isHostLeader ? (
          <div className="flex gap-2">
            <select
              className="h-11 w-full rounded-xl border border-white/15 bg-panel-2 px-3 text-sm"
              value={menuItemId}
              onChange={(e) => setMenuItemId(e.target.value)}
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => void linkToGuest()}>
              Vincular
            </Button>
          </div>
        ) : null}
        {selectedGuestItems.length === 0 ? (
          <EmptyState title="Nenhum item nesta visita" />
        ) : (
          selectedGuestItems.map((item) => (
            <div key={item.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
              {item.name}
            </div>
          ))
        )}
      </section>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

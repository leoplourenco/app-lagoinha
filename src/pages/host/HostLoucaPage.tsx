import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { HostDishwareItem } from '../../types/database'

export function HostLoucaPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<HostDishwareItem[]>([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [minimum, setMinimum] = useState('0')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error: err } = await supabase
      .from('host_dishware_items')
      .select('*')
      .order('name')
    if (err) setError(err.message)
    else setItems((data as HostDishwareItem[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function addItem(e: FormEvent) {
    e.preventDefault()
    const { error: err } = await supabase.from('host_dishware_items').insert({
      name: name.trim(),
      quantity: Number(quantity),
      minimum: Number(minimum),
      unit: 'un',
      updated_by: user?.id,
    })
    if (err) {
      setError(err.message)
      return
    }
    setName('')
    await load()
  }

  async function updateQty(item: HostDishwareItem, next: number) {
    await supabase
      .from('host_dishware_items')
      .update({
        quantity: next,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('id', item.id)
    await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Inventário de louça</h2>
        <p className="mt-1 text-sm text-sky-100/80">Separado do estoque da cozinha da Sala.</p>
      </div>

      <form onSubmit={addItem} className="space-y-2 rounded-2xl border border-white/15 bg-white/10 p-4">
        <Input placeholder="Item" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qtd"
          />
          <Input
            type="number"
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
            placeholder="Mínimo"
          />
        </div>
        <Button type="submit" className="w-full">
          Adicionar
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="Sem louça cadastrada" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const low = Number(item.quantity) <= Number(item.minimum)
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-sky-100/70">
                    {item.quantity} {item.unit} · mín. {item.minimum}
                  </p>
                  {low ? <Badge className="mt-1 bg-rose-500/40">Alerta</Badge> : null}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void updateQty(item, Number(item.quantity) - 1)}
                  >
                    −
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void updateQty(item, Number(item.quantity) + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

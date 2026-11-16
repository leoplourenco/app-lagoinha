import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { KitchenItem } from '../../types/database'

export function SalaEstoquePage() {
  const { user } = useAuth()
  const [items, setItems] = useState<KitchenItem[]>([])
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [unit, setUnit] = useState('un')
  const [minimum, setMinimum] = useState('0')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error: err } = await supabase
      .from('kitchen_items')
      .select('*')
      .order('name')
    if (err) setError(err.message)
    else setItems((data as KitchenItem[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function addItem(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const { error: err } = await supabase.from('kitchen_items').insert({
      name: name.trim(),
      quantity: Number(quantity),
      unit,
      minimum: Number(minimum),
      updated_by: user?.id,
    })
    if (err) {
      setError(err.message)
      return
    }
    setName('')
    setQuantity('0')
    await load()
  }

  async function updateQty(item: KitchenItem, next: number) {
    await supabase
      .from('kitchen_items')
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
        <h2 className="font-display text-2xl">Estoque da cozinha</h2>
        <p className="mt-1 text-sm text-sky-100/80">Itens com alerta quando abaixo do mínimo.</p>
      </div>

      <form onSubmit={addItem} className="space-y-2 rounded-2xl border border-white/15 bg-white/10 p-4">
        <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qtd"
          />
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unidade" />
          <Input
            type="number"
            step="0.1"
            value={minimum}
            onChange={(e) => setMinimum(e.target.value)}
            placeholder="Mínimo"
          />
        </div>
        <Button type="submit" className="w-full">
          Adicionar item
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState title="Estoque vazio" />
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
                  {low ? <Badge className="mt-1 bg-rose-500/40">Abaixo do mínimo</Badge> : null}
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

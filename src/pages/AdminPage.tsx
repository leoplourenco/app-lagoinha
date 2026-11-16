import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { supabase } from '../lib/supabase'
import type { ChurchQrCode, Ministry, Profile, ServiceEvent } from '../types/database'

export function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [qr, setQr] = useState<ChurchQrCode | null>(null)
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [title, setTitle] = useState('Domingo manhã')
  const [startsAt, setStartsAt] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  async function load() {
    const [u, m, q, e] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('ministries').select('*').order('name'),
      supabase.from('church_qr_codes').select('*').eq('active', true).limit(1).maybeSingle(),
      supabase.from('service_events').select('*').order('starts_at', { ascending: false }).limit(20),
    ])
    setUsers((u.data as Profile[]) ?? [])
    setMinistries((m.data as Ministry[]) ?? [])
    setQr((q.data as ChurchQrCode | null) ?? null)
    setEvents((e.data as ServiceEvent[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function promoteAdmin(user: Profile, value: boolean) {
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_admin: value })
      .eq('user_id', user.user_id)
    if (err) {
      setError(err.message)
      return
    }
    setMessage(
      value
        ? `${user.full_name} promovido a admin.`
        : `${user.full_name} removido de admin.`,
    )
    await load()
  }

  async function createEvent() {
    setError(null)
    if (!startsAt) {
      setError('Informe data/hora do culto.')
      return
    }
    const iso = new Date(startsAt).toISOString()
    const { error: err } = await supabase.from('service_events').insert({
      title,
      starts_at: iso,
    })
    if (err) {
      setError(err.message)
      return
    }
    setMessage('Culto criado.')
    await load()
  }

  function printQr() {
    if (!printRef.current) return
    const win = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>QR Check-in Lagoinha</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#0c4a6e}
        h1{margin:0 0 8px;font-size:28px}
        p{margin:0 0 24px;color:#334155}
        .box{display:inline-block;padding:24px;border:2px solid #0c4a6e;border-radius:16px}
        .code{margin-top:16px;font-family:ui-monospace,monospace;font-size:14px}
      </style></head><body>
      <h1>App Lagoinha</h1>
      <p>${qr?.label ?? 'Check-in igreja'}</p>
      <div class="box">${printRef.current.innerHTML}
        <div class="code">${qr?.code ?? ''}</div>
      </div>
      <p style="margin-top:24px">Cole nos pontos estratégicos · check-in por culto</p>
      </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-brand text-2xl">Admin</h2>
        <p className="mt-1 text-sm text-muted">
          Promover admins, cultos e QR imprimível para os pontos da igreja.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <h3 className="font-semibold">QR imprimível</h3>
        {qr ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div ref={printRef} className="rounded-xl bg-white p-4">
              <QRCodeCanvas value={qr.code} size={180} includeMargin />
            </div>
            <p className="text-xs text-muted">{qr.code}</p>
            <Button onClick={printQr}>Imprimir QR</Button>
          </div>
        ) : (
          <EmptyState title="Sem QR ativo" description="Rode o seed do schema.sql" />
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4">
        <h3 className="font-semibold">Novo culto</h3>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
        <Input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <Button onClick={() => void createEvent()}>Criar culto</Button>
        <div className="space-y-2 pt-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
              {event.title} · {new Date(event.starts_at).toLocaleString('pt-BR')}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Ministérios</h3>
        {ministries.map((m) => (
          <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-muted">
              slug: {m.slug} · {m.active ? 'ativo' : 'inativo'}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Usuários / promover admin</h3>
        <p className="text-sm text-muted">
          Pastores se cadastram como usuário normal; você promove depois.
        </p>
        {users.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-xs text-muted">
                {user.email}
                {user.is_admin ? ' · admin' : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant={user.is_admin ? 'outline' : 'default'}
              onClick={() => void promoteAdmin(user, !user.is_admin)}
            >
              {user.is_admin ? 'Remover admin' : 'Promover admin'}
            </Button>
          </div>
        ))}
      </section>

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  )
}

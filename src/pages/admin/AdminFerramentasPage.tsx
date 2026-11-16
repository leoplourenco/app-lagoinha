import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { EmptyState } from '../../components/ui/empty-state'
import { formatEventWhen } from '../../lib/timezone'
import { supabase } from '../../lib/supabase'
import type { ChurchQrCode, ServiceEvent } from '../../types/database'

export function AdminFerramentasPage() {
  const [qr, setQr] = useState<ChurchQrCode | null>(null)
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  async function load() {
    const [q, e] = await Promise.all([
      supabase.from('church_qr_codes').select('*').eq('active', true).limit(1).maybeSingle(),
      supabase.from('service_events').select('*').order('starts_at', { ascending: false }).limit(40),
    ])
    setQr((q.data as ChurchQrCode | null) ?? null)
    setEvents((e.data as ServiceEvent[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function createEvent() {
    setError(null)
    setMessage(null)
    if (!startsAt) {
      setError('Informe a data e o horário do evento.')
      return
    }
    const label = title.trim() || 'Culto / evento'
    const { error: err } = await supabase.from('service_events').insert({
      title: label,
      starts_at: new Date(startsAt).toISOString(),
    })
    if (err) {
      setError(err.message)
      return
    }
    setMessage(`Evento criado: ${formatEventWhen(new Date(startsAt).toISOString())}`)
    setTitle('')
    await load()
  }

  function printQr() {
    if (!printRef.current || !qr) return
    const win = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>QR Check-in Lagoinha</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:32px;color:#0c4a6e}
        h1{margin:0 0 8px;font-size:28px}
        .box{display:inline-block;padding:24px;border:2px solid #0c4a6e;border-radius:16px}
        .code{margin-top:16px;font-family:ui-monospace,monospace;font-size:14px}
      </style></head><body>
      <h1>App Lagoinha</h1>
      <p>${qr.label}</p>
      <div class="box">${printRef.current.innerHTML}<div class="code">${qr.code}</div></div>
      </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/admin" className="text-sm text-gold underline">
          ← Voltar ao admin
        </Link>
        <h2 className="mt-2 font-brand text-2xl text-gold">Ferramentas</h2>
        <p className="mt-1 text-sm text-muted">QR de check-in e cadastro de cultos/eventos.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-panel p-4">
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
          <EmptyState title="Sem QR ativo" />
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-panel p-4">
        <h3 className="font-semibold">Novo culto / evento</h3>
        <p className="text-sm text-muted">
          Cadastre por data e horário — pode ser domingo, quarta, sexta, vigília,
          especial etc.
        </p>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gold">Data e horário</p>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-gold">
            Nome (opcional)
          </p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Vigília, Conferência, Culto de jovens…"
          />
        </div>
        <Button onClick={() => void createEvent()} className="w-full">
          Criar por data e horário
        </Button>
        <div className="space-y-2 pt-2">
          <p className="text-xs uppercase tracking-wide text-muted">Últimos cadastrados</p>
          {events.length === 0 ? (
            <EmptyState title="Nenhum evento ainda" />
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-xl bg-black/30 px-3 py-2 text-sm">
                <p className="font-medium text-white">{formatEventWhen(event.starts_at)}</p>
                <p className="text-xs text-muted">{event.title}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  )
}

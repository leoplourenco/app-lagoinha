import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ServicePicker } from '../components/ServicePicker'
import { useAuth } from '../context/AuthContext'
import { useServiceEvents } from '../hooks/useServiceEvents'
import { supabase } from '../lib/supabase'

export function CheckinPage() {
  const { user, isLeader } = useAuth()
  const { todayEvents, upcomingEvents, activeEvent } = useServiceEvents()
  const events = todayEvents.length > 0 ? todayEvents : upcomingEvents.slice(0, 4)
  const [eventId, setEventId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cameraDenied, setCameraDenied] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!eventId && activeEvent) setEventId(activeEvent.id)
  }, [activeEvent, eventId])

  useEffect(() => {
    return () => {
      void stopScanner()
    }
  }, [])

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function doCheckin(method: 'qr' | 'manual', code?: string) {
    setError(null)
    setMessage(null)
    if (!user || !eventId) {
      setError('Selecione o culto (manhã ou noite).')
      return
    }

    if (method === 'qr') {
      const { data: qr, error: qrErr } = await supabase
        .from('church_qr_codes')
        .select('code')
        .eq('active', true)
        .eq('code', code || '')
        .maybeSingle()
      if (qrErr || !qr) {
        setError('QR inválido. Use o QR impresso da igreja ou peça check-in manual.')
        return
      }
    }

    const { error: insertErr } = await supabase.from('church_checkins').insert({
      user_id: user.id,
      event_id: eventId,
      method,
      created_by: user.id,
    })

    if (insertErr) {
      if (insertErr.code === '23505') {
        setMessage('Check-in já feito neste culto. No outro culto do dia você pode marcar de novo.')
      } else {
        setError(insertErr.message)
      }
      return
    }

    setMessage('Check-in registrado neste culto.')
    await stopScanner()
  }

  async function startScanner() {
    setError(null)
    setMessage(null)
    if (!eventId) {
      setError('Escolha o culto antes de escanear.')
      return
    }
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      setScanning(true)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          await doCheckin('qr', decoded.trim())
        },
        () => undefined,
      )
    } catch {
      setCameraDenied(true)
      setScanning(false)
      setError('Câmera negada ou indisponível. Use check-in manual com o líder.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Check-in por culto</h2>
        <p className="mt-1 text-sm text-muted">
          Manhã e noite são cultos separados. Quem serve nos dois faz dois check-ins.
        </p>
      </div>

      <ServicePicker events={events} value={eventId} onChange={setEventId} />

      <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <div id="qr-reader" className="overflow-hidden rounded-xl" />
        <div className="mt-3 flex flex-wrap gap-2">
          {!scanning ? (
            <Button onClick={() => void startScanner()}>Escanear QR</Button>
          ) : (
            <Button variant="outline" onClick={() => void stopScanner()}>
              Parar câmera
            </Button>
          )}
          <Button variant="secondary" onClick={() => void doCheckin('qr', 'lagoinha-checkin-v1')}>
            Confirmar QR padrão
          </Button>
        </div>
        {cameraDenied ? (
          <p className="mt-3 text-sm text-amber-100">
            Câmera negada → peça ao líder o check-in manual.
          </p>
        ) : null}
      </div>

      {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      {isLeader ? (
        <Link to="/checkin/manual" className="block text-sm font-semibold underline">
          Check-in manual (líder/admin)
        </Link>
      ) : null}
    </div>
  )
}

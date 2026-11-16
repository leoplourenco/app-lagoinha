import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { dayKeySp, nowInSp } from '../lib/timezone'
import type { ServiceEvent } from '../types/database'

export function useServiceEvents() {
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('service_events')
      .select('*')
      .order('starts_at', { ascending: true })

    if (err) {
      setError(err.message)
      setEvents([])
    } else {
      setEvents((data as ServiceEvent[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const todayKey = dayKeySp(nowInSp())

  const todayEvents = useMemo(
    () => events.filter((e) => dayKeySp(e.starts_at) === todayKey),
    [events, todayKey],
  )

  /** Próximos eventos (qualquer dia) — janela de 3h atrás até o futuro. */
  const upcomingEvents = useMemo(() => {
    const now = nowInSp().getTime()
    return events
      .filter((e) => new Date(e.starts_at).getTime() >= now - 3 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [events])

  /**
   * Lista para montar escala/relatório: próximos por data/hora.
   * Não trava em “só hoje” — permite sexta, sábado, especial etc.
   */
  const schedulableEvents = useMemo(() => {
    if (upcomingEvents.length > 0) return upcomingEvents
    return [...events]
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .slice(0, 12)
  }, [upcomingEvents, events])

  const activeEvent = useMemo(() => {
    if (todayEvents.length === 1) return todayEvents[0]
    if (todayEvents.length === 0) return upcomingEvents[0] ?? null

    const now = nowInSp().getTime()
    return (
      [...todayEvents].sort(
        (a, b) =>
          Math.abs(new Date(a.starts_at).getTime() - now) -
          Math.abs(new Date(b.starts_at).getTime() - now),
      )[0] ?? null
    )
  }, [todayEvents, upcomingEvents])

  return {
    events,
    todayEvents,
    upcomingEvents,
    schedulableEvents,
    activeEvent,
    loading,
    error,
    refresh,
  }
}

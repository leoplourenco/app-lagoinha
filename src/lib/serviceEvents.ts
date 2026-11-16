import { supabase } from './supabase'
import type { ServiceEvent } from '../types/database'

/** Busca culto no mesmo minuto ou cria (líder/admin). */
export async function findOrCreateServiceEvent(
  startsAtIso: string,
  title: string,
): Promise<{ event: ServiceEvent | null; error: string | null }> {
  const t = new Date(startsAtIso).getTime()
  const from = new Date(t - 60_000).toISOString()
  const to = new Date(t + 60_000).toISOString()

  const { data: existing, error: findErr } = await supabase
    .from('service_events')
    .select('*')
    .gte('starts_at', from)
    .lte('starts_at', to)
    .order('starts_at', { ascending: true })
    .limit(1)

  if (findErr) return { event: null, error: findErr.message }

  const found = (existing as ServiceEvent[] | null)?.[0]
  if (found) return { event: found, error: null }

  const { data: created, error: createErr } = await supabase
    .from('service_events')
    .insert({
      starts_at: startsAtIso,
      title: title.trim() || 'Culto / evento',
    })
    .select('*')
    .single()

  if (createErr) return { event: null, error: createErr.message }
  return { event: created as ServiceEvent, error: null }
}

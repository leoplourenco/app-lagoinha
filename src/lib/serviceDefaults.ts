import { fromZonedTime } from 'date-fns-tz'
import { APP_TZ, dayKeySp, formatEventTime, formatSp } from './timezone'

/** Grade fixa da igreja (America/Sao_Paulo). weekday: 0=dom … 6=sáb */
export const STANDARD_SERVICES = [
  { id: 'quarta', weekday: 3, hour: 20, minute: 15, title: 'Culto Fé' },
  { id: 'sabado', weekday: 6, hour: 19, minute: 30, title: 'Legacy' },
  { id: 'domingo-manha', weekday: 0, hour: 9, minute: 0, title: 'Domingo manhã' },
  { id: 'domingo-noite', weekday: 0, hour: 18, minute: 0, title: 'Domingo noite' },
] as const

export type ProposedService = {
  key: string
  title: string
  startsAtIso: string
  dayLabel: string
  timeLabel: string
  isStandard: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Interpreta data/hora civil em SP e devolve ISO UTC. */
export function spCivilToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const local = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
  return fromZonedTime(local, APP_TZ).toISOString()
}

export function datetimeLocalToIso(value: string) {
  const [datePart, timePart] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return spCivilToIso(y, m, d, hh, mm)
}

function addCalendarDays(year: number, month: number, day: number, amount: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + amount))
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  }
}

function jsWeekdaySp(year: number, month: number, day: number) {
  // 'i' = 1 Mon … 7 Sun
  const isoDay = Number(formatSp(spCivilToIso(year, month, day, 12, 0), 'i'))
  return isoDay === 7 ? 0 : isoDay
}

/**
 * Próximas ocorrências da grade padrão (ex.: 2 semanas), ordenadas.
 */
export function upcomingStandardServices(weeks = 2): ProposedService[] {
  const now = Date.now()
  const [y0, m0, d0] = dayKeySp(new Date()).split('-').map(Number)
  const out: ProposedService[] = []

  for (let offset = 0; offset < weeks * 7; offset++) {
    const { year, month, day } = addCalendarDays(y0, m0, d0, offset)
    const weekday = jsWeekdaySp(year, month, day)

    for (const def of STANDARD_SERVICES) {
      if (def.weekday !== weekday) continue
      const startsAtIso = spCivilToIso(year, month, day, def.hour, def.minute)
      if (new Date(startsAtIso).getTime() < now - 30 * 60 * 1000) continue

      out.push({
        key: `${def.id}-${dayKeySp(startsAtIso)}`,
        title: def.title,
        startsAtIso,
        dayLabel: formatSp(startsAtIso, 'EEEE, dd/MM'),
        timeLabel: formatEventTime(startsAtIso),
        isStandard: true,
      })
    }
  }

  return out.sort(
    (a, b) => new Date(a.startsAtIso).getTime() - new Date(b.startsAtIso).getTime(),
  )
}

export function buildSpecialService(
  datetimeLocal: string,
  title?: string,
): ProposedService {
  const startsAtIso = datetimeLocalToIso(datetimeLocal)
  return {
    key: `special-${startsAtIso}`,
    title: title?.trim() || 'Evento especial',
    startsAtIso,
    dayLabel: formatSp(startsAtIso, 'EEEE, dd/MM'),
    timeLabel: formatEventTime(startsAtIso),
    isStandard: false,
  }
}

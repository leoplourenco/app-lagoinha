import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const APP_TZ = 'America/Sao_Paulo'

export function nowInSp() {
  return toZonedTime(new Date(), APP_TZ)
}

export function formatSp(date: string | Date, pattern = "dd/MM/yyyy HH:mm") {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, APP_TZ, pattern, { locale: ptBR })
}

export function formatSpDay(date: string | Date) {
  return formatSp(date, "EEEE, dd/MM")
}

export function startOfDaySp(date = new Date()) {
  const zoned = toZonedTime(date, APP_TZ)
  return startOfDay(zoned)
}

export function dayKeySp(date: string | Date) {
  return formatSp(date, 'yyyy-MM-dd')
}

export function isSameSpDay(a: string | Date, b: string | Date) {
  return dayKeySp(a) === dayKeySp(b)
}

export function addDaysSp(date: Date, amount: number) {
  return addDays(date, amount)
}

/** Data + horário (qualquer dia da semana). */
export function formatEventWhen(startsAt: string) {
  return formatSp(startsAt, "EEEE, dd/MM/yyyy · HH:mm")
}

export function formatEventDay(startsAt: string) {
  return formatSp(startsAt, "EEEE, dd/MM/yyyy")
}

export function formatEventTime(startsAt: string) {
  return formatSp(startsAt, 'HH:mm')
}

export function labelService(title: string, startsAt: string) {
  const when = formatEventWhen(startsAt)
  const clean = title?.trim()
  if (!clean) return when
  return `${when} · ${clean}`
}

export function friendlyTodayLabel() {
  return format(nowInSp(), "EEEE, d 'de' MMMM", { locale: ptBR })
}

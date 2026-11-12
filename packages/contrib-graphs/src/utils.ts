import type { Calendar, CalendarDay, ContributionDay, Level, LevelScale, MonthLabel } from './types'

const DAY_MS = 86_400_000

/**
 * Default locale. Fixed, rather than the browser's, so server and client HTML
 * match when hydrating and dates match the English default labels.
 */
export const DEFAULT_LOCALE = 'en'

// Todas las fechas se manejan en UTC para evitar saltos por zona horaria / DST.
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS)
}

/** Today (the user's local date) as midnight UTC. */
export function todayUTC(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
}

function toUTCDate(d: string | Date): Date {
  if (typeof d === 'string') return parseISO(d)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

/** Returns a function that maps a count to a level from 0 to 4 for the given counts and scale. */
export function makeLevelFn(counts: readonly number[], scale: LevelScale = 'quantile'): (n: number) => Level {
  if (typeof scale !== 'string') {
    const [a, b, c, d] = scale
    return (n) => (n >= d ? 4 : n >= c ? 3 : n >= b ? 2 : n >= a && n > 0 ? 1 : 0)
  }
  const nz = counts.filter((c) => c > 0).sort((x, y) => x - y)
  if (nz.length === 0) return () => 0
  const max = nz[nz.length - 1]
  if (scale === 'linear') {
    return (n) => (n <= 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil((n / max) * 4))) as Level))
  }
  const q = (p: number) => nz[Math.floor(p * (nz.length - 1))]
  const q1 = q(0.25)
  const q2 = q(0.5)
  const q3 = q(0.75)
  return (n) => (n <= 0 ? 0 : n <= q1 ? 1 : n <= q2 ? 2 : n <= q3 ? 3 : 4)
}

/** Options of `buildCalendar`. They match the graph props of the same name. */
export interface CalendarOptions {
  weeks?: number
  endDate?: string | Date
  weekStart?: 0 | 1
  scale?: LevelScale
  locale?: string
}

/** Lays out days as a weeks × 7 grid with levels, totals and month labels. Dates are handled in UTC. */
export function buildCalendar(data: readonly ContributionDay[], opts: CalendarOptions = {}): Calendar {
  const weekCount = Math.max(1, Math.floor(opts.weeks ?? 53))
  const weekStart = opts.weekStart ?? 0
  const end = opts.endDate ? toUTCDate(opts.endDate) : todayUTC()
  const endOffset = (end.getUTCDay() - weekStart + 7) % 7
  const first = addDays(end, -endOffset - (weekCount - 1) * 7)

  const counts = new Map<string, number>()
  for (const d of data) {
    if (!d || typeof d.date !== 'string') continue
    const c = Number(d.count) || 0
    counts.set(d.date, (counts.get(d.date) ?? 0) + Math.max(0, c))
  }

  const days: CalendarDay[] = []
  const weeks: (CalendarDay | null)[][] = []
  const endTime = end.getTime()

  for (let w = 0; w < weekCount; w++) {
    const week: (CalendarDay | null)[] = []
    for (let r = 0; r < 7; r++) {
      const date = addDays(first, w * 7 + r)
      if (date.getTime() > endTime) {
        week.push(null)
        continue
      }
      const iso = toISO(date)
      const day: CalendarDay = {
        date: iso,
        count: counts.get(iso) ?? 0,
        level: 0,
        index: days.length,
        weekIndex: w,
        dayIndex: r,
        weekday: date.getUTCDay(),
      }
      days.push(day)
      week.push(day)
    }
    weeks.push(week)
  }

  const levelOf = makeLevelFn(
    days.map((d) => d.count),
    opts.scale,
  )
  let total = 0
  let max = 0
  for (const d of days) {
    d.level = levelOf(d.count)
    total += d.count
    if (d.count > max) max = d.count
  }

  return {
    weeks,
    days,
    months: monthLabels(weeks, opts.locale),
    total,
    max,
    start: days[0]?.date ?? toISO(first),
    end: days[days.length - 1]?.date ?? toISO(end),
    levelOf,
  }
}

/** Keeps the last `n` weeks. Levels come from the full calendar, so cropping doesn't change colors. */
export function cropCalendar(cal: Calendar, n: number, locale?: string): Calendar {
  if (n >= cal.weeks.length) return cal
  const days: CalendarDay[] = []
  const weeks = cal.weeks.slice(cal.weeks.length - n).map((w, wi) =>
    w.map((d) => {
      if (!d) return null
      const nd: CalendarDay = { ...d, weekIndex: wi, index: days.length }
      days.push(nd)
      return nd
    }),
  )
  return {
    ...cal,
    weeks,
    days,
    months: monthLabels(weeks, locale),
    total: days.reduce((s, d) => s + d.count, 0),
    max: days.reduce((m, d) => Math.max(m, d.count), 0),
    start: days[0]?.date ?? cal.start,
  }
}

function monthLabels(weeks: (CalendarDay | null)[][], locale?: string): MonthLabel[] {
  const fmt = new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, { month: 'short', timeZone: 'UTC' })
  const out: MonthLabel[] = []
  weeks.forEach((week, w) => {
    const days = week.filter((d): d is CalendarDay => d !== null)
    if (!days.length) return
    // Se etiqueta la semana que contiene el día 1 del mes (o la primera semana).
    const target = w === 0 ? days[0] : days.find((d) => d.date.endsWith('-01'))
    if (!target) return
    const dt = parseISO(target.date)
    out.push({ label: fmt.format(dt), weekIndex: w, month: dt.getUTCMonth(), year: dt.getUTCFullYear() })
  })
  // Evita que la primera etiqueta se encime con la segunda.
  if (out.length > 1 && out[1].weekIndex - out[0].weekIndex < 3) out.shift()
  return out
}

/** Totals and streaks of a list of days. */
export interface GraphStats {
  total: number
  activeDays: number
  best: CalendarDay | null
  longestStreak: number
  currentStreak: number
}

/** Total, active days, best day, longest streak and current streak. A current streak isn't broken by a quiet today. */
export function computeStats(days: readonly CalendarDay[]): GraphStats {
  let total = 0
  let activeDays = 0
  let best: CalendarDay | null = null
  let longest = 0
  let run = 0
  for (const d of days) {
    total += d.count
    if (d.count > 0) {
      activeDays++
      run++
      if (run > longest) longest = run
      if (!best || d.count > best.count) best = d
    } else run = 0
  }
  // La racha actual no se rompe si hoy todavía no hay actividad.
  let current = 0
  let i = days.length - 1
  if (i >= 0 && days[i].count === 0) i--
  for (; i >= 0 && days[i].count > 0; i--) current++
  return { total, activeDays, best, longestStreak: longest, currentStreak: current }
}

/** Formats an ISO date with `Intl`, in UTC so the day never shifts. */
export function formatDate(
  iso: string,
  locale?: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, { ...opts, timeZone: 'UTC' }).format(parseISO(iso))
}

/** Formats a number with `Intl`. */
export function formatNumber(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE).format(n)
}

/** Short names of the 7 weekdays starting at `weekStart`. */
export function weekdayLabels(locale?: string, weekStart: 0 | 1 = 0): string[] {
  const fmt = new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, { weekday: 'short', timeZone: 'UTC' })
  // 2023-01-01 fue domingo
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2023, 0, 1 + ((i + weekStart) % 7)))))
}

/** Picks the singular or plural unit for a count. */
export function pluralize(n: number, unit: readonly [string, string] = ['contribution', 'contributions']): string {
  return n === 1 ? unit[0] : unit[1]
}

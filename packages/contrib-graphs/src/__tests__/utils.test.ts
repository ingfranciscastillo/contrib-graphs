import { afterEach, describe, expect, test } from 'vitest'
import type { ContributionDay } from '../types'
import {
  addDays,
  buildCalendar,
  computeStats,
  cropCalendar,
  formatDate,
  makeLevelFn,
  parseISO,
  pluralize,
  toISO,
  weekdayLabels,
} from '../utils'

const range = (start: string, counts: number[]): ContributionDay[] =>
  counts.map((count, i) => ({ date: toISO(addDays(parseISO(start), i)), count }))

describe('fechas ISO', () => {
  test('parseISO y toISO son inversos', () => {
    for (const d of ['2026-01-01', '2024-02-29', '2026-12-31', '2026-03-08']) expect(toISO(parseISO(d))).toBe(d)
  })

  test('addDays cruza fin de mes, de año y años bisiestos', () => {
    expect(toISO(addDays(parseISO('2024-02-28'), 1))).toBe('2024-02-29')
    expect(toISO(addDays(parseISO('2026-12-31'), 1))).toBe('2027-01-01')
    expect(toISO(addDays(parseISO('2026-03-01'), -1))).toBe('2026-02-28')
  })
})

describe('buildCalendar', () => {
  // 2026-01-07 es miércoles
  const END = '2026-01-07'

  test('53 semanas por defecto, terminando en endDate con la última semana incompleta', () => {
    const cal = buildCalendar([], { endDate: END })
    expect(cal.weeks).toHaveLength(53)
    expect(cal.end).toBe(END)
    expect(cal.days).toHaveLength(52 * 7 + 4) // dom→mié de la última semana
    expect(cal.weeks[52].filter((d) => d === null)).toHaveLength(3)
    expect(cal.weeks.slice(0, 52).every((w) => w.every((d) => d !== null))).toBe(true)
  })

  test('cada columna empieza en weekStart', () => {
    const sun = buildCalendar([], { endDate: END, weekStart: 0 })
    const mon = buildCalendar([], { endDate: END, weekStart: 1 })
    expect(sun.days[0].weekday).toBe(0)
    expect(mon.days[0].weekday).toBe(1)
    for (const d of mon.days) expect(d.dayIndex).toBe((d.weekday + 6) % 7)
  })

  test('índices consistentes con la fecha', () => {
    const cal = buildCalendar([], { endDate: END, weeks: 10 })
    const first = parseISO(cal.start)
    cal.days.forEach((d, i) => {
      expect(d.index).toBe(i)
      expect(toISO(addDays(first, d.weekIndex * 7 + d.dayIndex))).toBe(d.date)
      expect(cal.weeks[d.weekIndex][d.dayIndex]).toBe(d)
    })
  })

  test('suma duplicados, ignora negativos, valores inválidos y fechas fuera del rango', () => {
    const data = [
      { date: '2026-01-05', count: 2 },
      { date: '2026-01-05', count: 3 },
      { date: '2026-01-06', count: -4 },
      { date: '2026-01-07', count: Number.NaN },
      { date: '2027-01-01', count: 100 },
      { date: '2020-01-01', count: 100 },
      null as unknown as ContributionDay,
      { count: 1 } as unknown as ContributionDay,
    ]
    const cal = buildCalendar(data, { endDate: END })
    const byDate = Object.fromEntries(cal.days.map((d) => [d.date, d.count]))
    expect(byDate['2026-01-05']).toBe(5)
    expect(byDate['2026-01-06']).toBe(0)
    expect(byDate['2026-01-07']).toBe(0)
    expect(cal.total).toBe(5)
    expect(cal.max).toBe(5)
  })

  test('weeks se redondea hacia abajo y nunca baja de 1', () => {
    expect(buildCalendar([], { endDate: END, weeks: 4.9 }).weeks).toHaveLength(4)
    expect(buildCalendar([], { endDate: END, weeks: 0 }).weeks).toHaveLength(1)
    expect(buildCalendar([], { endDate: END, weeks: -3 }).weeks).toHaveLength(1)
  })

  test('acepta endDate como Date usando la fecha local', () => {
    const cal = buildCalendar([], { endDate: new Date(2026, 0, 7, 23, 30) })
    expect(cal.end).toBe(END)
  })

  test('etiquetas de mes: en el primer día 1 de cada mes y sin encimarse al inicio', () => {
    const cal = buildCalendar([], { endDate: '2026-12-31', locale: 'en' })
    const labels = cal.months.map((m) => m.label)
    expect(labels.slice(-3)).toEqual(['Oct', 'Nov', 'Dec'])
    for (let i = 1; i < cal.months.length; i++) expect(cal.months[i].weekIndex - cal.months[i - 1].weekIndex).toBeGreaterThanOrEqual(3)
    for (const m of cal.months.slice(1)) {
      const week = cal.weeks[m.weekIndex].filter(Boolean)
      expect(week.some((d) => d!.date.endsWith('-01'))).toBe(true)
    }
  })

  describe('zona horaria', () => {
    const original = process.env.TZ
    afterEach(() => {
      process.env.TZ = original
    })

    test('cambiar process.env.TZ cambia la zona horaria (si no, el test siguiente no probaría nada)', () => {
      const probe = new Date(Date.UTC(2026, 0, 15))
      process.env.TZ = 'Asia/Tokyo'
      const tokyo = probe.getTimezoneOffset()
      process.env.TZ = 'America/Mexico_City'
      expect(probe.getTimezoneOffset()).not.toBe(tokyo)
    })

    test('mismo resultado en cualquier zona horaria (incluidas las que cambian de horario)', () => {
      const data = range('2025-01-01', Array.from({ length: 400 }, (_, i) => (i * 7) % 5))
      const snapshots = ['UTC', 'America/Mexico_City', 'America/Santiago', 'Europe/London', 'Asia/Tokyo', 'Pacific/Chatham', 'Pacific/Kiritimati'].map(
        (tz) => {
          process.env.TZ = tz
          const cal = buildCalendar(data, { endDate: '2026-01-31', locale: 'en' })
          return JSON.stringify({ days: cal.days, months: cal.months, total: cal.total })
        },
      )
      expect(new Set(snapshots).size).toBe(1)
    })
  })
})

describe('makeLevelFn', () => {
  const oneToHundred = Array.from({ length: 100 }, (_, i) => i + 1)

  test('sin actividad todo es nivel 0', () => {
    const f = makeLevelFn([0, 0, 0])
    expect([0, 1, 50].map(f)).toEqual([0, 0, 0])
  })

  test('cuantiles: ignora los ceros y usa los cuartiles de los días activos', () => {
    const f = makeLevelFn([0, 0, 0, ...oneToHundred])
    expect([0, 1, 25, 26, 50, 51, 75, 76, 100].map(f)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
  })

  test('lineal: proporcional al máximo', () => {
    const f = makeLevelFn(oneToHundred, 'linear')
    expect([0, 1, 25, 26, 50, 51, 100, 500].map(f)).toEqual([0, 1, 1, 2, 2, 3, 4, 4])
  })

  test('umbrales propios: mínimo para cada nivel', () => {
    const f = makeLevelFn([], [1, 5, 10, 20])
    expect([0, 1, 4, 5, 9, 10, 19, 20, 99].map(f)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
  })

  test('un día con actividad nunca queda en el nivel 0 con la escala por defecto', () => {
    for (const counts of [[1], [5, 5, 5], [1, 1000], [3, 0, 0, 0]]) {
      const f = makeLevelFn(counts)
      for (const c of counts.filter((n) => n > 0)) expect(f(c)).toBeGreaterThan(0)
    }
  })
})

describe('cropCalendar', () => {
  const data = range('2025-01-01', Array.from({ length: 371 }, (_, i) => (i % 9) * (i % 4)))
  const full = buildCalendar(data, { endDate: '2026-01-06', locale: 'en' })

  test('sin recorte devuelve el mismo calendario', () => {
    expect(cropCalendar(full, 53)).toBe(full)
    expect(cropCalendar(full, 99)).toBe(full)
  })

  test('conserva las últimas semanas, reindexa y mantiene los niveles del año completo', () => {
    const crop = cropCalendar(full, 10, 'en')
    expect(crop.weeks).toHaveLength(10)
    expect(crop.end).toBe(full.end)
    crop.days.forEach((d, i) => {
      expect(d.index).toBe(i)
      const original = full.days.find((o) => o.date === d.date)!
      expect(d.level).toBe(original.level)
      expect(d.weekIndex).toBe(original.weekIndex - 43)
    })
    expect(crop.total).toBe(crop.days.reduce((s, d) => s + d.count, 0))
    expect(crop.months.every((m) => m.weekIndex < 10)).toBe(true)
  })

  test('no modifica el calendario original', () => {
    const before = JSON.stringify(full.days)
    cropCalendar(full, 5)
    expect(JSON.stringify(full.days)).toBe(before)
  })
})

describe('computeStats', () => {
  const cal = (counts: number[]) => buildCalendar(range('2026-01-01', counts), { endDate: toISO(addDays(parseISO('2026-01-01'), counts.length - 1)) }).days.slice(-counts.length)

  test('totales, días activos y mejor día', () => {
    const s = computeStats(cal([1, 4, 0, 4, 2]))
    expect(s.total).toBe(11)
    expect(s.activeDays).toBe(4)
    expect(s.best?.count).toBe(4)
    expect(s.best?.date).toBe('2026-01-02') // el primero con el máximo
  })

  test('racha más larga', () => {
    expect(computeStats(cal([1, 1, 0, 1, 1, 1, 0, 1])).longestStreak).toBe(3)
  })

  test('la racha actual no se rompe si hoy todavía no hay actividad', () => {
    expect(computeStats(cal([0, 1, 1, 1])).currentStreak).toBe(3)
    expect(computeStats(cal([0, 1, 1, 1, 0])).currentStreak).toBe(3)
    expect(computeStats(cal([1, 1, 0, 0])).currentStreak).toBe(0)
  })

  test('lista vacía', () => {
    expect(computeStats([])).toEqual({ total: 0, activeDays: 0, best: null, longestStreak: 0, currentStreak: 0 })
  })
})

describe('formato', () => {
  test('los días de la semana empiezan en weekStart', () => {
    expect(weekdayLabels('en', 0)[0]).toBe('Sun')
    expect(weekdayLabels('en', 1)[0]).toBe('Mon')
    expect(weekdayLabels('en', 1)[6]).toBe('Sun')
  })

  test('formatDate no depende de la zona horaria', () => {
    const tz = process.env.TZ
    process.env.TZ = 'Pacific/Kiritimati'
    const a = formatDate('2026-03-01', 'en', { month: 'short', day: 'numeric' })
    process.env.TZ = 'America/Adak'
    const b = formatDate('2026-03-01', 'en', { month: 'short', day: 'numeric' })
    process.env.TZ = tz
    expect(a).toBe('Mar 1')
    expect(b).toBe('Mar 1')
  })

  test('pluralize', () => {
    expect(pluralize(1)).toBe('contribution')
    expect(pluralize(0)).toBe('contributions')
    expect(pluralize(2, ['post', 'posts'])).toBe('posts')
  })
})

import type { ContributionDay } from './types'
import { addDays, toISO, todayUTC } from './utils'

export type SampleProfile = 'steady' | 'burst' | 'weekend' | 'sparse'

/** Perfiles de actividad disponibles, con una descripción corta en inglés. */
export const sampleProfiles: Record<SampleProfile, string> = {
  steady: 'Steady',
  burst: 'Bursts',
  weekend: 'Weekends',
  sparse: 'Sparse',
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Datos de ejemplo deterministas (misma semilla → mismos datos). Útil para demos y tests. */
export function generateSampleData({
  seed = 7,
  profile = 'steady',
  days = 371,
  endDate,
}: { seed?: number; profile?: SampleProfile; days?: number; endDate?: Date } = {}): ContributionDay[] {
  const rng = mulberry32(seed * 9973 + profile.length * 131)
  const end = endDate ?? todayUTC()
  const start = addDays(end, -(days - 1))
  const geo = (mean: number) => Math.floor(-Math.log(1 - rng()) * mean) + 1

  // Vacaciones: un par de huecos sin actividad.
  const gaps = Array.from({ length: profile === 'steady' ? 2 : 1 }, () => {
    const s = Math.floor(rng() * (days - 20))
    return [s, s + 6 + Math.floor(rng() * 8)] as const
  })

  // Rachas: periodos de 1–3 semanas con mucha actividad.
  const sprints: (readonly [number, number])[] = []
  for (let d = 0; d < days; ) {
    d += 10 + Math.floor(rng() * 35)
    const len = 6 + Math.floor(rng() * 16)
    sprints.push([d, d + len])
    d += len
  }

  const out: ContributionDay[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i)
    const wd = date.getUTCDay()
    const weekend = wd === 0 || wd === 6
    const inGap = gaps.some(([a, b]) => i >= a && i <= b)
    const inSprint = sprints.some(([a, b]) => i >= a && i <= b)
    let p: number
    let mean: number
    switch (profile) {
      case 'burst':
        p = inSprint ? 0.92 : 0.12
        mean = inSprint ? 9 : 2
        break
      case 'weekend':
        p = weekend ? 0.85 : 0.18
        mean = weekend ? 8 : 2
        break
      case 'sparse':
        p = 0.14
        mean = 3
        break
      default:
        p = inGap ? 0 : weekend ? 0.3 : 0.78
        mean = weekend ? 2 : 4.5
    }
    // Ligera tendencia creciente a lo largo del año.
    p = Math.min(1, p * (0.8 + (i / days) * 0.4))
    out.push({ date: toISO(date), count: rng() < p ? geo(mean) : 0 })
  }
  return out
}

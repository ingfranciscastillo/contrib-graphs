import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { generateSampleData, sampleProfiles, themeNames, type ContributionDay, type SampleProfile, type ThemeName } from '@cg/index'
import github from './data/contributions.json'

export type Lang = 'es' | 'en'

/** Datos reales generados con `npm run data` (scripts/fetch-contributions.mjs). */
export const githubData = github as { username: string; generatedAt: string; source: string; total: number; days: ContributionDay[] }

/** Fuente de datos del demo: tu GitHub o uno de los perfiles de ejemplo. */
export type Profile = 'github' | SampleProfile
export const profiles: Record<Profile, string> = { github: `GitHub de @${githubData.username}`, ...sampleProfiles }

/** Estado global del demo, guardado en la URL (compartible). */
export interface GlobalSearch {
  theme?: ThemeName
  profile?: Profile
  seed?: number
  lang?: Lang
}

export function validateGlobalSearch(s: Record<string, unknown>): GlobalSearch {
  const seed = Number(s.seed)
  return {
    theme: themeNames.includes(s.theme as ThemeName) ? (s.theme as ThemeName) : undefined,
    profile: typeof s.profile === 'string' && s.profile in profiles ? (s.profile as Profile) : undefined,
    seed: Number.isInteger(seed) && seed > 0 ? seed : undefined,
    lang: s.lang === 'en' || s.lang === 'es' ? s.lang : undefined,
  }
}

export function useDemo() {
  const search = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const theme = search.theme ?? 'github'
  const profile = search.profile ?? 'github'
  const seed = search.seed ?? 7
  const lang = search.lang ?? 'es'
  const data = useMemo(() => (profile === 'github' ? githubData.days : generateSampleData({ seed, profile })), [seed, profile])
  // GitHub fecha en UTC: su último día puede ser "mañana" en tu zona horaria. El calendario termina ahí.
  const endDate = profile === 'github' ? githubData.days[githubData.days.length - 1]?.date : undefined

  const set = (patch: Partial<GlobalSearch>) =>
    navigate({ to: '.', search: (prev: GlobalSearch) => ({ ...prev, ...patch }), replace: true, resetScroll: false })

  // `locale` agrupa las props comunes que el demo pasa a todos los gráficos.
  const locale = useMemo(() => ({ ...i18n[lang], endDate }), [lang, endDate])
  return { theme, profile, seed, lang, data, endDate, set, locale }
}

/** Props de idioma para los componentes: muestra cómo se localizan. */
export const i18n = {
  es: {
    locale: 'es',
    unit: ['contribución', 'contribuciones'] as const,
    periodLabel: (w: number) => (w >= 52 ? 'en el último año' : `en las últimas ${w} semanas`),
    legendLabels: ['Menos', 'Más'] as const,
    statLabels: ['racha más larga', 'racha actual', 'mejor día'] as const,
    streakLabel: (n: number) => `racha de ${n} ${n === 1 ? 'día' : 'días'}`,
    rangeLabel: (n: number) => `en los últimos ${n} días`,
  },
  en: {
    locale: 'en',
    unit: ['contribution', 'contributions'] as const,
    periodLabel: (w: number) => (w >= 52 ? 'in the last year' : `in the last ${w} weeks`),
    legendLabels: ['Less', 'More'] as const,
    statLabels: ['longest streak', 'current streak', 'best day'] as const,
    streakLabel: (n: number) => `${n} day streak`,
    rangeLabel: (n: number) => `in the last ${n} days`,
  },
} satisfies Record<Lang, Record<string, unknown>>

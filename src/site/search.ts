import { useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { generateSampleData, sampleProfiles, themeNames, type SampleProfile, type ThemeName } from '@cg/index'

export type Lang = 'es' | 'en'

/** Estado global del demo, guardado en la URL (compartible). */
export interface GlobalSearch {
  theme?: ThemeName
  profile?: SampleProfile
  seed?: number
  lang?: Lang
}

export function validateGlobalSearch(s: Record<string, unknown>): GlobalSearch {
  const seed = Number(s.seed)
  return {
    theme: themeNames.includes(s.theme as ThemeName) ? (s.theme as ThemeName) : undefined,
    profile: typeof s.profile === 'string' && s.profile in sampleProfiles ? (s.profile as SampleProfile) : undefined,
    seed: Number.isInteger(seed) && seed > 0 ? seed : undefined,
    lang: s.lang === 'en' || s.lang === 'es' ? s.lang : undefined,
  }
}

export function useDemo() {
  const search = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const theme = search.theme ?? 'github'
  const profile = search.profile ?? 'steady'
  const seed = search.seed ?? 7
  const lang = search.lang ?? 'es'
  const data = useMemo(() => generateSampleData({ seed, profile }), [seed, profile])

  const set = (patch: Partial<GlobalSearch>) =>
    navigate({ to: '.', search: (prev: GlobalSearch) => ({ ...prev, ...patch }), replace: true, resetScroll: false })

  return { theme, profile, seed, lang, data, set, locale: i18n[lang] }
}

/** Props de idioma para los componentes: muestra cómo se localizan. */
export const i18n = {
  es: {
    locale: 'es',
    unit: ['contribución', 'contribuciones'] as const,
    periodLabel: 'en el último año',
    legendLabels: ['Menos', 'Más'] as const,
    statLabels: ['racha más larga', 'racha actual', 'mejor día'] as const,
    streakLabel: (n: number) => `racha de ${n} ${n === 1 ? 'día' : 'días'}`,
    rangeLabel: (n: number) => `en los últimos ${n} días`,
  },
  en: {
    locale: 'en',
    unit: ['contribution', 'contributions'] as const,
    periodLabel: 'in the last year',
    legendLabels: ['Less', 'More'] as const,
    statLabels: ['longest streak', 'current streak', 'best day'] as const,
    streakLabel: (n: number) => `${n} day streak`,
    rangeLabel: (n: number) => `in the last ${n} days`,
  },
} satisfies Record<Lang, Record<string, unknown>>

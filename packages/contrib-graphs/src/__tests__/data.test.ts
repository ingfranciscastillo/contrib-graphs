import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  fetchGitHubContributions,
  fetchGitLabContributions,
  fromDates,
  fromGitHub,
  fromGitLab,
  mergeSources,
} from '../adapters'
import { generateSampleData, sampleProfiles, type SampleProfile } from '../sample'
import { resolveTheme, themeNames, themes, themeVars } from '../themes'

describe('adaptadores', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const githubResponse = {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: [
              { contributionDays: [{ date: '2026-01-04', contributionCount: 0 }, { date: '2026-01-05', contributionCount: 3 }] },
              { contributionDays: [{ date: '2026-01-11', contributionCount: 7 }] },
            ],
          },
        },
      },
    },
  }

  test('fromGitHub aplana semanas y días', () => {
    expect(fromGitHub(githubResponse)).toEqual([
      { date: '2026-01-04', count: 0 },
      { date: '2026-01-05', count: 3 },
      { date: '2026-01-11', count: 7 },
    ])
  })

  test('fromGitHub devuelve [] si el usuario no existe o la respuesta viene vacía', () => {
    expect(fromGitHub({ data: { user: null } })).toEqual([])
    expect(fromGitHub({})).toEqual([])
  })

  test('fromGitLab convierte el objeto fecha → conteo', () => {
    expect(fromGitLab({ '2026-01-05': 2, '2026-01-06': 1 })).toEqual([
      { date: '2026-01-05', count: 2 },
      { date: '2026-01-06', count: 1 },
    ])
  })

  test('fromDates cuenta por día, acepta ISO con hora y objetos Date (fecha local)', () => {
    const out = fromDates(['2026-01-05', '2026-01-05T23:59:00Z', new Date(2026, 0, 6, 22, 0), '2026-01-06'])
    expect(out).toEqual([
      { date: '2026-01-05', count: 2 },
      { date: '2026-01-06', count: 2 },
    ])
  })

  test('mergeSources suma día por día y ordena por fecha', () => {
    const a = [
      { date: '2026-01-06', count: 1 },
      { date: '2026-01-05', count: 2 },
    ]
    const b = [{ date: '2026-01-05', count: 3 }]
    expect(mergeSources(a, b)).toEqual([
      { date: '2026-01-05', count: 5 },
      { date: '2026-01-06', count: 1 },
    ])
  })

  test('fetchGitHubContributions envía el token y el usuario, y normaliza la respuesta', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(githubResponse), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const days = await fetchGitHubContributions('octocat', 'secreto')
    expect(days).toHaveLength(3)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/graphql')
    expect((init.headers as Record<string, string>).Authorization).toBe('bearer secreto')
    expect(JSON.parse(init.body as string).variables).toEqual({ login: 'octocat' })
  })

  test('fetchGitHubContributions falla con el código HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))
    await expect(fetchGitHubContributions('octocat', 'malo')).rejects.toThrow('401')
  })

  test('fetchGitLabContributions codifica el usuario y respeta la URL base', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ '2026-01-05': 4 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchGitLabContributions('a b/c', 'https://git.example.com')).toEqual([{ date: '2026-01-05', count: 4 }])
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('https://git.example.com/users/a%20b%2Fc/calendar.json')
  })
})

describe('datos de ejemplo', () => {
  const end = new Date(Date.UTC(2026, 0, 31))

  test('son deterministas: misma semilla, mismos datos', () => {
    expect(generateSampleData({ seed: 3, endDate: end })).toEqual(generateSampleData({ seed: 3, endDate: end }))
    expect(generateSampleData({ seed: 3, endDate: end })).not.toEqual(generateSampleData({ seed: 4, endDate: end }))
  })

  test('generan los días pedidos, terminando en endDate, sin conteos negativos', () => {
    for (const profile of Object.keys(sampleProfiles) as SampleProfile[]) {
      const data = generateSampleData({ profile, days: 100, endDate: end })
      expect(data).toHaveLength(100)
      expect(data[99].date).toBe('2026-01-31')
      expect(data.every((d) => Number.isInteger(d.count) && d.count >= 0)).toBe(true)
      expect(data.some((d) => d.count > 0)).toBe(true)
    }
  })
})

/* ------------------------------------------------------------------ Temas */

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

describe('temas', () => {
  test('resolveTheme: por defecto github, nombres desconocidos caen en github, objetos pasan tal cual', () => {
    expect(resolveTheme(undefined)).toBe(themes.github)
    expect(resolveTheme('nope' as never)).toBe(themes.github)
    const custom = { ...themes.mono, name: 'Mío' }
    expect(resolveTheme(custom)).toBe(custom)
  })

  test('themeVars expone niveles y colores de texto para claro y oscuro', () => {
    const vars = themeVars(themes.frost) as Record<string, string>
    expect(Object.keys(vars)).toHaveLength(2 * (5 + 4))
    expect(vars['--cg-l4-light']).toBe(themes.frost.light.levels[4])
    expect(vars['--cg-surface-dark']).toBe(themes.frost.dark.surface)
  })

  describe.each(themeNames)('%s', (name) => {
    test.each(['light', 'dark'] as const)('%s: colores hex válidos y nivel 4 con contraste ≥ 3:1 sobre la superficie', (mode) => {
      const p = themes[name][mode]
      for (const c of [...p.levels, p.text, p.muted, p.surface, p.border]) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
      expect(contrast(p.levels[4], p.surface)).toBeGreaterThanOrEqual(3)
      expect(contrast(p.text, p.surface)).toBeGreaterThanOrEqual(4.5)
    })
  })
})

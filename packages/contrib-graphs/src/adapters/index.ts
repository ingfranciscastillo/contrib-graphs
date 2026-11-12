import type { ContributionDay } from '../types'
import { toISO } from '../utils'

/* ------------------------------------------------------------------ GitHub */

/**
 * Query GraphQL de GitHub. Requiere un token (incluso para datos públicos),
 * así que ejecútala en el servidor: API route, función serverless o en build.
 * Nunca envíes el token al navegador.
 */
export const GITHUB_CONTRIBUTIONS_QUERY = /* GraphQL */ `
  query ($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`

export interface GitHubCalendarResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks: { contributionDays: { date: string; contributionCount: number }[] }[]
        }
      }
    } | null
  }
}

export function fromGitHub(res: GitHubCalendarResponse): ContributionDay[] {
  const weeks = res.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
}

/** Para uso en servidor (Node 18+, Deno, Bun, edge runtimes). */
export async function fetchGitHubContributions(login: string, token: string): Promise<ContributionDay[]> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GITHUB_CONTRIBUTIONS_QUERY, variables: { login } }),
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  return fromGitHub((await res.json()) as GitHubCalendarResponse)
}

/* ------------------------------------------------------------------ GitLab */

/** GitLab responde `{ "2026-03-01": 4, ... }` en `/users/:username/calendar.json`. */
export function fromGitLab(json: Record<string, number>): ContributionDay[] {
  return Object.entries(json).map(([date, count]) => ({ date, count }))
}

/**
 * El endpoint es público pero no envía cabeceras CORS: llámalo desde el
 * servidor o en build. Para instancias self-hosted pasa `baseUrl`.
 */
export async function fetchGitLabContributions(username: string, baseUrl = 'https://gitlab.com'): Promise<ContributionDay[]> {
  const res = await fetch(`${baseUrl}/users/${encodeURIComponent(username)}/calendar.json`)
  if (!res.ok) throw new Error(`GitLab ${res.status}`)
  return fromGitLab((await res.json()) as Record<string, number>)
}

/* ------------------------------------------------------------------ Genéricos */

/** Cuenta ocurrencias por día: posts de blog, entrenamientos, commits locales… */
export function fromDates(dates: readonly (string | Date)[]): ContributionDay[] {
  const map = new Map<string, number>()
  for (const d of dates) {
    const iso = typeof d === 'string' ? d.slice(0, 10) : toISO(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))
    map.set(iso, (map.get(iso) ?? 0) + 1)
  }
  return [...map].map(([date, count]) => ({ date, count }))
}

/** Suma varias fuentes día por día (p. ej. GitHub + GitLab). */
export function mergeSources(...sources: readonly ContributionDay[][]): ContributionDay[] {
  const map = new Map<string, number>()
  for (const src of sources) for (const d of src) map.set(d.date, (map.get(d.date) ?? 0) + d.count)
  return [...map].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }))
}

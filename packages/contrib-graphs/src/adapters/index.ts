import type { ContributionDay } from '../types'
import { toISO } from '../utils'

/* ------------------------------------------------------------------ GitHub */

/**
 * GitHub GraphQL query for the contribution calendar. It needs a token even
 * for public data, so run it on the server and never send the token to the browser.
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

/** Shape of the GraphQL response read by `fromGitHub`. */
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

/** Converts a GitHub GraphQL response into `{ date, count }` days. */
export function fromGitHub(res: GitHubCalendarResponse): ContributionDay[] {
  const weeks = res.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
}

/**
 * Fetches the last year of contributions from GitHub's GraphQL API. Server only (Node 18+, Deno, Bun, edge runtimes).
 * A classic token with `read:user` includes private contributions.
 */
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

/** Converts GitLab's `{ "2026-03-01": 4 }` calendar into `{ date, count }` days. */
export function fromGitLab(json: Record<string, number>): ContributionDay[] {
  return Object.entries(json).map(([date, count]) => ({ date, count }))
}

/**
 * Fetches a GitLab user's calendar. The endpoint is public but sends no CORS headers,
 * so call it from the server or at build time. Pass `baseUrl` for self-hosted instances.
 */
export async function fetchGitLabContributions(username: string, baseUrl = 'https://gitlab.com'): Promise<ContributionDay[]> {
  const res = await fetch(`${baseUrl}/users/${encodeURIComponent(username)}/calendar.json`)
  if (!res.ok) throw new Error(`GitLab ${res.status}`)
  return fromGitLab((await res.json()) as Record<string, number>)
}

/* ------------------------------------------------------------------ Genéricos */

/** Counts occurrences per day: blog posts, workouts, local commits… Strings are sliced to the date; `Date` objects use the local date. */
export function fromDates(dates: readonly (string | Date)[]): ContributionDay[] {
  const map = new Map<string, number>()
  for (const d of dates) {
    const iso = typeof d === 'string' ? d.slice(0, 10) : toISO(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))
    map.set(iso, (map.get(iso) ?? 0) + 1)
  }
  return [...map].map(([date, count]) => ({ date, count }))
}

/** Adds several sources day by day (for example GitHub plus GitLab), sorted by date. */
export function mergeSources(...sources: readonly ContributionDay[][]): ContributionDay[] {
  const map = new Map<string, number>()
  for (const src of sources) for (const d of src) map.set(d.date, (map.get(d.date) ?? 0) + d.count)
  return [...map].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }))
}

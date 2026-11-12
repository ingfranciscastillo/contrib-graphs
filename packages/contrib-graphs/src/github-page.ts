import type { ContributionDay } from './types'

/**
 * Lee el calendario de github.com/users/<usuario>/contributions (sin token).
 *
 * Cada día es un <td data-date="…" id="contribution-day-component-X-Y"> y su conteo
 * está en un <tool-tip for="contribution-day-component-X-Y">3 contributions on …</tool-tip>.
 * No es una API oficial: si GitHub cambia el HTML, lanza un error claro en vez
 * de devolver datos incompletos. Uso interno del CLI.
 */
export function parseContributionsPage(html: string, { minDays = 300 } = {}): ContributionDay[] {
  const dateById = new Map<string, string>()
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0]
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1]
    const id = tag.match(/\bid="([^"]+)"/)?.[1]
    if (date && id) dateById.set(id, date)
  }

  const countById = new Map<string, number>()
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const text = m[2].trim()
    const n = text.match(/^([\d,]+)\s+contributions?\b/)
    countById.set(m[1], n ? Number(n[1].replace(/,/g, '')) : /^No contributions\b/.test(text) ? 0 : NaN)
  }

  const days: ContributionDay[] = []
  for (const [id, date] of dateById) {
    const count = countById.get(id)
    if (count === undefined || !Number.isFinite(count)) throw new Error(`Could not read the count for ${date}: GitHub changed the page format`)
    days.push({ date, count })
  }
  if (days.length < minDays) throw new Error(`Expected at least ${minDays} days but read ${days.length}`)
  return days.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export async function fetchContributionsPage(username: string, fetchImpl: typeof fetch = fetch): Promise<ContributionDay[]> {
  const res = await fetchImpl(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
    headers: { 'User-Agent': 'contrib-graphs' },
  })
  if (!res.ok) throw new Error(`The public contributions page answered ${res.status}`)
  return parseContributionsPage(await res.text())
}

/**
 * Lee el calendario de github.com/users/<usuario>/contributions.
 *
 * Cada día es un <td data-date="…" id="contribution-day-component-X-Y"> y su conteo
 * está en un <tool-tip for="contribution-day-component-X-Y">3 contributions on …</tool-tip>.
 * No es una API oficial: si GitHub cambia el HTML, esto lanza un error claro
 * en vez de devolver datos incompletos.
 *
 * @param {string} html
 * @param {{ minDays?: number }} [options]
 * @returns {{ date: string, count: number }[]}
 */
export function parseContributionsPage(html, { minDays = 300 } = {}) {
  const dateById = new Map()
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0]
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1]
    const id = tag.match(/\bid="([^"]+)"/)?.[1]
    if (date && id) dateById.set(id, date)
  }

  const countById = new Map()
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const text = m[2].trim()
    const n = text.match(/^([\d,]+)\s+contributions?\b/)
    countById.set(m[1], n ? Number(n[1].replace(/,/g, '')) : /^No contributions\b/.test(text) ? 0 : NaN)
  }

  const days = []
  for (const [id, date] of dateById) {
    const count = countById.get(id)
    if (!Number.isFinite(count)) throw new Error(`No se pudo leer el conteo del ${date}: GitHub cambió el formato de la página`)
    days.push({ date, count })
  }
  if (days.length < minDays) throw new Error(`Se esperaban al menos ${minDays} días y se leyeron ${days.length}`)
  return days.sort((a, b) => (a.date < b.date ? -1 : 1))
}

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parseContributionsPage } from '../github-page'

const fixture = readFileSync(new URL('./fixtures/contributions-page.html', import.meta.url), 'utf8')
const day = (date: string, id: string, text: string) =>
  `<td data-date="${date}" id="${id}" data-level="1" class="ContributionCalendar-day"></td>` +
  `<tool-tip id="t-${id}" for="${id}" popover="manual" class="sr-only">${text}</tool-tip>`

describe('parseContributionsPage (página pública de GitHub)', () => {
  test('lee el HTML real de GitHub', () => {
    expect(parseContributionsPage(fixture, { minDays: 1 })).toEqual([
      { date: '2025-11-09', count: 0 },
      { date: '2025-11-23', count: 1 },
      { date: '2025-12-21', count: 4 },
      { date: '2026-01-11', count: 3 },
      { date: '2026-09-08', count: 65 },
    ])
  })

  test('separadores de miles y orden por fecha aunque el HTML venga desordenado', () => {
    const html = day('2026-02-02', 'b', '1,234 contributions on February 2nd.') + day('2026-02-01', 'a', 'No contributions on February 1st.')
    expect(parseContributionsPage(html, { minDays: 1 })).toEqual([
      { date: '2026-02-01', count: 0 },
      { date: '2026-02-02', count: 1234 },
    ])
  })

  test('ignora los <td> que no son días', () => {
    const html = '<td class="ContributionCalendar-label">Mon</td><td id="x"></td>' + day('2026-02-01', 'a', '2 contributions on February 1st.')
    expect(parseContributionsPage(html, { minDays: 1 })).toEqual([{ date: '2026-02-01', count: 2 }])
  })

  test('falla con un mensaje claro si GitHub cambia el texto o falta un tooltip', () => {
    expect(() => parseContributionsPage(day('2026-02-01', 'a', '2 contribuciones el 1 de febrero'), { minDays: 1 })).toThrow(/2026-02-01/)
    expect(() => parseContributionsPage('<td data-date="2026-02-01" id="a"></td>', { minDays: 1 })).toThrow(/2026-02-01/)
  })

  test('falla si se leen muy pocos días', () => {
    expect(() => parseContributionsPage(fixture)).toThrow(/at least 300 days but read 5/)
    expect(() => parseContributionsPage('<html></html>')).toThrow(/read 0/)
  })
})

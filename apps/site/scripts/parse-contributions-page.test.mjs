import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parseContributionsPage } from './parse-contributions-page.mjs'

const fixture = await readFile(new URL('./__fixtures__/contributions-page.html', import.meta.url), 'utf8')
const day = (date, id, text) =>
  `<td data-date="${date}" id="${id}" data-level="1" class="ContributionCalendar-day"></td>` +
  `<tool-tip id="t-${id}" for="${id}" popover="manual" class="sr-only">${text}</tool-tip>`

test('lee el HTML real de GitHub', () => {
  assert.deepEqual(parseContributionsPage(fixture, { minDays: 1 }), [
    { date: '2025-11-09', count: 0 },
    { date: '2025-11-23', count: 1 },
    { date: '2025-12-21', count: 4 },
    { date: '2026-01-11', count: 3 },
    { date: '2026-09-08', count: 65 },
  ])
})

test('separadores de miles y orden por fecha aunque el HTML venga desordenado', () => {
  const html = day('2026-02-02', 'b', '1,234 contributions on February 2nd.') + day('2026-02-01', 'a', 'No contributions on February 1st.')
  assert.deepEqual(parseContributionsPage(html, { minDays: 1 }), [
    { date: '2026-02-01', count: 0 },
    { date: '2026-02-02', count: 1234 },
  ])
})

test('ignora los <td> que no son días (encabezados de mes, leyenda)', () => {
  const html = '<td class="ContributionCalendar-label">Mon</td><td id="x"></td>' + day('2026-02-01', 'a', '2 contributions on February 1st.')
  assert.deepEqual(parseContributionsPage(html, { minDays: 1 }), [{ date: '2026-02-01', count: 2 }])
})

test('falla con un mensaje claro si GitHub cambia el texto del tooltip', () => {
  const html = day('2026-02-01', 'a', '2 contribuciones el 1 de febrero')
  assert.throws(() => parseContributionsPage(html, { minDays: 1 }), /No se pudo leer el conteo del 2026-02-01/)
})

test('falla si falta el tooltip de un día', () => {
  const html = '<td data-date="2026-02-01" id="a"></td>'
  assert.throws(() => parseContributionsPage(html, { minDays: 1 }), /2026-02-01/)
})

test('falla si se leen muy pocos días (p. ej. GitHub cambió la estructura)', () => {
  assert.throws(() => parseContributionsPage(fixture), /al menos 300 días y se leyeron 5/)
  assert.throws(() => parseContributionsPage('<html></html>'), /se leyeron 0/)
})

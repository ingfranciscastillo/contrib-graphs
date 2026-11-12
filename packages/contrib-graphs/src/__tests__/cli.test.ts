import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { run } from '../cli'
import { generateSampleData } from '../sample'

let dir: string
let out: string[]
let err: string[]
const io = () => ({ cwd: dir, env: {}, log: (m: string) => out.push(m), error: (m: string) => err.push(m), now: () => new Date('2026-01-08T00:00:00Z') })

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cg-cli-'))
  out = []
  err = []
})
afterEach(async () => {
  vi.unstubAllGlobals()
  await rm(dir, { recursive: true, force: true })
})

const days = generateSampleData({ seed: 2, endDate: new Date(Date.UTC(2026, 0, 7)) })
const withInput = async () => {
  await writeFile(join(dir, 'in.json'), JSON.stringify({ days }))
  return 'in.json'
}

describe('contrib-graphs svg', () => {
  test('escribe la versión clara y la oscura desde un archivo', async () => {
    expect(await run(['svg', '--input', await withInput(), '--out-dir', 'img', '--name', 'graph', '--theme', 'violet'], io())).toBe(0)
    const light = await readFile(join(dir, 'img/graph-light.svg'), 'utf8')
    const dark = await readFile(join(dir, 'img/graph-dark.svg'), 'utf8')
    expect(light).toMatch(/^<svg xmlns/)
    expect(light).toContain('#4c1d95') // violet claro, nivel 4
    expect(dark).toContain('#ddd0ff') // violet oscuro, nivel 4
    expect(out[0]).toBe('Wrote img/graph-light.svg and img/graph-dark.svg (371 days from file)')
  })

  test('--lang es, --no-stats y --background', async () => {
    expect(await run(['svg', '--input', await withInput(), '--lang', 'es', '--no-stats', '--background'], io())).toBe(0)
    const svg = await readFile(join(dir, 'contributions-light.svg'), 'utf8')
    expect(svg).toMatch(/contribuciones en el último año/)
    expect(svg).not.toMatch(/racha/)
    expect(svg).toContain('<rect')
  })

  test('el calendario termina en el último día de los datos (GitHub fecha en UTC)', async () => {
    expect(await run(['svg', '--input', await withInput(), '--no-stats'], io())).toBe(0)
    // 53 semanas que terminan el miércoles 2026-01-07 empiezan el domingo 2025-01-05.
    const total = days.filter((d) => d.date >= '2025-01-05').reduce((s, d) => s + d.count, 0)
    expect(await readFile(join(dir, 'contributions-light.svg'), 'utf8')).toContain(`<title id="cg-title">${total.toLocaleString('en')} contributions`)
  })

  test('con GITHUB_TOKEN usa la API GraphQL', async () => {
    const response = { data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: [{ date: '2026-01-07', contributionCount: 5 }] }] } } } } }
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(response)))
    vi.stubGlobal('fetch', fetchMock)
    expect(await run(['svg', '--user', 'octocat'], { ...io(), env: { GITHUB_TOKEN: 'secreto' } })).toBe(0)
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('https://api.github.com/graphql')
    expect(out[0]).toMatch(/from github-graphql/)
  })

  test('si la API falla con el token, avisa y usa la página pública', async () => {
    const page = await readFile(new URL('./fixtures/contributions-page.html', import.meta.url), 'utf8')
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('graphql') ? new Response('{"message":"Resource not accessible by integration"}', { status: 403 }) : new Response(page),
    )
    vi.stubGlobal('fetch', fetchMock)
    await run(['svg', '--user', 'octocat'], { ...io(), env: { GITHUB_TOKEN: 'de-actions' } })
    expect(fetchMock.mock.calls.map((c) => String((c as unknown[])[0]))).toEqual(['https://api.github.com/graphql', 'https://github.com/users/octocat/contributions'])
    expect(err[0]).toMatch(/^Warning: the GitHub API failed \(GitHub API 403\); using the public contributions page instead\.$/)
  })

  test('sin token lee la página pública', async () => {
    const html = (await readFile(new URL('./fixtures/contributions-page.html', import.meta.url), 'utf8')).repeat(1)
    const fetchMock = vi.fn(async () => new Response(html))
    vi.stubGlobal('fetch', fetchMock)
    // El fixture tiene 5 días: no llega al mínimo de 300, así que el error demuestra que usó esa ruta.
    expect(await run(['svg', '--user', 'octocat'], io())).toBe(1)
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('https://github.com/users/octocat/contributions')
    expect(err[0]).toMatch(/at least 300 days but read 5/)
  })

  test('errores de uso devuelven 1 con un mensaje claro', async () => {
    expect(await run(['svg'], io())).toBe(1)
    expect(await run(['svg', '--user', 'x', '--theme', 'nope'], io())).toBe(1)
    expect(await run(['svg', '--user', 'x', '--lang', 'fr'], io())).toBe(1)
    expect(await run(['svg', '--user', 'x', '--weeks', '99'], io())).toBe(1)
    expect(await run(['nope'], io())).toBe(1)
    expect(await run(['svg', '--unknown-flag'], io())).toBe(1)
    expect(err.map((e) => e.split('\n')[0])).toEqual([
      'contrib-graphs: Pass --user <github-username> or --input <file>',
      'contrib-graphs: Unknown theme "nope". Use one of: github, gitlab, frost, ember, violet, mono',
      'contrib-graphs: Unknown language "fr". Use en or es',
      'contrib-graphs: --weeks must be a whole number from 1 to 53',
      'contrib-graphs: Unknown command "nope"',
      expect.stringMatching(/unknown-flag/),
    ])
  })

  test('help', async () => {
    expect(await run(['help'], io())).toBe(0)
    expect(await run([], io())).toBe(0)
    expect(out[0]).toMatch(/^contrib-graphs: contribution graphs/)
  })
})

describe('contrib-graphs json', () => {
  test('escribe datos con metadatos', async () => {
    expect(await run(['json', '--input', await withInput(), '--user', 'yo', '--out', 'data/c.json'], io())).toBe(0)
    const json = JSON.parse(await readFile(join(dir, 'data/c.json'), 'utf8'))
    expect(json).toMatchObject({ username: 'yo', generatedAt: '2026-01-08T00:00:00.000Z', source: 'file', total: days.reduce((s, d) => s + d.count, 0) })
    expect(json.days).toHaveLength(days.length)
  })

  test('--keep-on-error conserva el archivo anterior si GitHub falla', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    await writeFile(join(dir, 'contributions.json'), '{"previo":true}')
    expect(await run(['json', '--user', 'x', '--keep-on-error'], io())).toBe(0)
    expect(await readFile(join(dir, 'contributions.json'), 'utf8')).toBe('{"previo":true}')
    expect(err[0]).toMatch(/^Warning: .*503.*Keeping the existing contributions.json/)
    // Sin la opción, o sin archivo previo, sí es un error.
    expect(await run(['json', '--user', 'x'], io())).toBe(1)
    await rm(join(dir, 'contributions.json'))
    expect(await run(['json', '--user', 'x', '--keep-on-error'], io())).toBe(1)
  })
})

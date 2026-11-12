import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { OUT, extractApi } from './extract-api.mjs'

test('src/data/api.json está al día con los tipos del paquete (si falla: npm run api)', async () => {
  const committed = JSON.parse(await readFile(OUT, 'utf8'))
  assert.deepEqual(extractApi(), committed)
})

test('cada prop y cada función pública tiene descripción', () => {
  const api = extractApi()
  const missing = [
    ...api.components.flatMap((c) => c.props.filter((p) => !p.description).map((p) => `${c.name}.${p.name}`)),
    ...api.functions.filter((f) => !f.description).map((f) => f.name),
  ]
  assert.deepEqual(missing, [])
})

test('cada texto de la API tiene traducción al español, y no sobran traducciones', async () => {
  const { apiEs } = await import('../src/api-es.ts')
  const api = extractApi()
  const texts = new Set([
    ...api.components.flatMap((c) => [c.description, ...c.props.map((p) => p.description)]),
    ...api.functions.map((f) => f.description),
    ...api.constants.map((c) => c.description),
  ])
  const defaults = new Set(api.components.flatMap((c) => c.props.map((p) => p.default).filter(Boolean)))
  const missing = [...texts].filter((t) => !(t in apiEs))
  const unused = Object.keys(apiEs).filter((k) => !texts.has(k) && !defaults.has(k))
  assert.deepEqual({ missing, unused }, { missing: [], unused: [] })
})

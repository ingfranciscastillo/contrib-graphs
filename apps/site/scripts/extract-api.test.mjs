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

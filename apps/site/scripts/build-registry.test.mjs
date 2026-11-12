import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { posix } from 'node:path'
import { test } from 'node:test'

process.env.SITE_URL = 'https://example.github.io/repo/'
const { buildRegistry } = await import('./build-registry.mjs')
const { items, index } = await buildRegistry()
const SRC = new URL('../../../packages/contrib-graphs/src/', import.meta.url)
const CORE = 'https://example.github.io/repo/r/contrib-graphs-core.json'

test('núcleo, datos y las siete variantes, con su índice', () => {
  assert.deepEqual(Object.keys(items).sort(), [
    'classic-graph', 'compact-graph', 'contrib-graphs-core', 'contrib-graphs-data', 'dots-graph',
    'isometric-graph', 'radial-graph', 'skyline-graph', 'terminal-graph',
  ])
  assert.equal(index.items.length, 9)
  assert.ok(index.items.every((i) => i.files.every((f) => !('content' in f))), 'el índice no lleva el código')
})

test('todo item salvo el núcleo depende del núcleo por URL absoluta', () => {
  for (const [name, item] of Object.entries(items)) {
    if (name === 'contrib-graphs-core') assert.equal(item.registryDependencies, undefined)
    else assert.deepEqual(item.registryDependencies, [CORE], name)
  }
})

test('el código es el del paquete; solo los .tsx llevan "use client" delante', async () => {
  for (const item of Object.values(items)) {
    for (const file of item.files) {
      const rel = file.path.replace(/^contrib-graphs\//, '')
      const source = await readFile(new URL(rel, SRC), 'utf8')
      const expected = rel.endsWith('.tsx') ? `'use client'\n\n${source}` : source
      assert.equal(file.content, expected, rel)
      assert.equal(file.target, `components/contrib-graphs/${rel}`)
    }
  }
})

test('cada import relativo apunta a un archivo que el item o el núcleo instalan', () => {
  const coreFiles = items['contrib-graphs-core'].files.map((f) => f.target)
  for (const [name, item] of Object.entries(items)) {
    const installed = new Set([...coreFiles, ...item.files.map((f) => f.target)])
    for (const file of item.files) {
      for (const [, spec] of file.content.matchAll(/from '(\.{1,2}\/[^']+)'/g)) {
        const base = posix.join(posix.dirname(file.target), spec)
        const found = ['.ts', '.tsx', '/index.ts'].some((ext) => installed.has(base + ext))
        assert.ok(found, `${name}: ${file.target} importa ${spec}, que no se instala`)
      }
    }
  }
})

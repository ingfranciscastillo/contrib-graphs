import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../../../packages/contrib-graphs/dist/index.js', import.meta.url))

test('docs/images está al día con los componentes (si falla: npm run images)', { skip: !existsSync(dist) && 'compila el paquete primero' }, async () => {
  const { OUT_DIR, renderReadmeImages } = await import('./readme-images.mjs')
  for (const [name, svg] of Object.entries(renderReadmeImages())) {
    assert.equal(await readFile(resolve(OUT_DIR, name), 'utf8').catch(() => ''), svg, `${name} está desactualizada`)
  }
})

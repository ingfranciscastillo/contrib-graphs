import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { cliArgs, defaultReadmeOptions, readmeSnippet, workflowYaml } from '../src/readme.ts'

const BIN = fileURLToPath(new URL('../../../packages/contrib-graphs/dist/bin.js', import.meta.url))

test('los argumentos que genera el sitio funcionan con el CLI real', { skip: !existsSync(BIN) && 'compila el paquete primero' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'cg-readme-'))
  try {
    writeFileSync(join(dir, 'in.json'), JSON.stringify([{ date: '2026-01-07', count: 3 }]))
    const combos = [
      defaultReadmeOptions,
      { ...defaultReadmeOptions, theme: 'violet', lang: 'es', background: true, stats: false, dir: 'assets/graph' },
    ]
    for (const o of combos) {
      const args = cliArgs({ ...o, user: 'octocat' }).split(' ')
      execFileSync(process.execPath, [BIN, 'svg', ...args, '--input', 'in.json'], { cwd: dir, stdio: 'pipe' })
      assert.ok(existsSync(join(dir, o.dir, 'contributions-light.svg')), `${o.dir}/contributions-light.svg`)
      assert.ok(existsSync(join(dir, o.dir, 'contributions-dark.svg')))
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('el workflow y el README apuntan a la misma carpeta y archivos', () => {
  const o = { ...defaultReadmeOptions, user: 'octocat', dir: 'assets' }
  assert.match(workflowYaml(o, 'en'), /--out-dir assets/)
  assert.match(workflowYaml(o, 'en'), /git add assets\n/)
  const html = readmeSnippet(o, 'es')
  assert.match(html, /srcset="\.\/assets\/contributions-dark\.svg"/)
  assert.match(html, /alt="Gráfico de contribuciones de @octocat en GitHub"/)
})

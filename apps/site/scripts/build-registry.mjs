#!/usr/bin/env node
/**
 * Genera el registry de componentes copiables (compatible con shadcn) a partir del
 * código fuente del paquete, así los copiables nunca se desincronizan de npm:
 *
 *   npx shadcn@latest add https://<sitio>/r/classic-graph.json
 *
 * Escribe public/r/<item>.json y public/r/registry.json (el índice). Se ejecuta en
 * cada build del sitio; la carpeta generada no se versiona.
 *
 * SITE_URL es la URL pública del sitio: las variantes dependen del núcleo por URL
 * absoluta, que es como shadcn resuelve dependencias entre items de un registry propio.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(SITE, '../../packages/contrib-graphs/src')
export const OUT = resolve(SITE, 'public/r')
const SITE_URL = (process.env.SITE_URL ?? 'https://ingfranciscastillo.github.io/contrib-graphs/').replace(/\/?$/, '/')
/** Carpeta del proyecto donde shadcn deja los archivos (respeta src/ y el alias de components). */
const TARGET = 'components/contrib-graphs'

const api = JSON.parse(await readFile(resolve(SITE, 'src/data/api.json'), 'utf8'))
const describe = (component) => api.components.find((c) => c.name === component)?.description ?? ''

/** Archivos con hooks: llevan "use client" para que funcionen en Server Components de Next.js. */
const CLIENT = /^(core\.tsx|variants\/.+\.tsx)$/

const CORE = ['types.ts', 'themes.ts', 'utils.ts', 'core.tsx', 'styles.css']

const items = [
  {
    name: 'contrib-graphs-core',
    title: 'contrib-graphs core',
    description: 'Shared types, themes, calendar helpers, interaction and styles used by every contribution graph. Import styles.css once in your app.',
    files: CORE,
  },
  {
    name: 'contrib-graphs-data',
    title: 'contrib-graphs data helpers',
    description: 'Adapters for GitHub, GitLab, plain dates and merged sources, plus deterministic sample data.',
    files: ['adapters/index.ts', 'sample.ts'],
    core: true,
  },
  ...[
    ['classic-graph', 'ClassicGraph', ['variants/GridGraph.tsx']],
    ['dots-graph', 'DotsGraph', ['variants/GridGraph.tsx']],
    ['isometric-graph', 'IsometricGraph', ['isometric.ts', 'variants/IsometricGraph.tsx']],
    ['terminal-graph', 'TerminalGraph', ['variants/TerminalGraph.tsx']],
    ['radial-graph', 'RadialGraph', ['variants/RadialGraph.tsx']],
    ['skyline-graph', 'SkylineGraph', ['variants/SkylineGraph.tsx']],
    ['compact-graph', 'CompactGraph', ['variants/CompactGraph.tsx']],
  ].map(([name, component, files]) => ({ name, title: component, description: describe(component), files, core: true, component })),
]

async function fileEntry(path) {
  let content = await readFile(resolve(SRC, path), 'utf8')
  if (CLIENT.test(path)) content = `'use client'\n\n${content}`
  return { path: `contrib-graphs/${path}`, type: 'registry:component', target: `${TARGET}/${path}`, content }
}

export async function buildRegistry() {
  const out = {}
  for (const item of items) {
    out[item.name] = {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: item.name,
      type: 'registry:component',
      title: item.title,
      description: item.description,
      ...(item.core ? { registryDependencies: [new URL('r/contrib-graphs-core.json', SITE_URL).href] } : {}),
      files: await Promise.all(item.files.map(fileEntry)),
    }
  }
  const index = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'contrib-graphs',
    homepage: SITE_URL,
    items: Object.values(out).map(({ $schema, files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })),
  }
  return { items: out, index }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { items: built, index } = await buildRegistry()
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  for (const [name, item] of Object.entries(built)) await writeFile(resolve(OUT, `${name}.json`), JSON.stringify(item, null, 2) + '\n')
  await writeFile(resolve(OUT, 'registry.json'), JSON.stringify(index, null, 2) + '\n')
  console.log(`registry: ${Object.keys(built).length} items → public/r (${SITE_URL}r/)`)
}

import type { ThemeName } from 'contrib-graphs/data'
import type { Lang } from './i18n'

/** Opciones del generador de README. Las mismas que acepta `contrib-graphs svg`. */
export interface ReadmeOptions {
  user: string
  theme: ThemeName
  lang: Lang
  background: boolean
  stats: boolean
  /** Carpeta del repo de perfil donde se guardan los SVG. */
  dir: string
}

export const defaultReadmeOptions: ReadmeOptions = {
  user: 'your-username',
  theme: 'github',
  lang: 'en',
  background: false,
  stats: true,
  dir: 'img',
}

/** Argumentos de `contrib-graphs svg` para estas opciones (solo los que difieren del default). */
export function cliArgs(o: ReadmeOptions): string {
  return [
    `--user ${o.user}`,
    `--out-dir ${o.dir}`,
    o.theme !== 'github' && `--theme ${o.theme}`,
    o.lang !== 'en' && `--lang ${o.lang}`,
    o.background && '--background',
    !o.stats && '--no-stats',
  ]
    .filter(Boolean)
    .join(' ')
}

/** Workflow que regenera los SVG cada día y los sube al repo de perfil. */
export function workflowYaml(o: ReadmeOptions, lang: Lang): string {
  const c =
    lang === 'es'
      ? {
          name: 'Gráfico de contribuciones',
          daily: 'Todos los días a las 06:00 UTC, y a mano desde la pestaña Actions',
          token: 'Opcional: un token clásico con read:user en el secret CONTRIB_TOKEN incluye las contribuciones privadas',
          commit: 'Sube los SVG solo si cambiaron',
        }
      : {
          name: 'Contribution graph',
          daily: 'Every day at 06:00 UTC, and manually from the Actions tab',
          token: 'Optional: a classic token with read:user in the CONTRIB_TOKEN secret includes private contributions',
          commit: 'Commit the SVGs only when they changed',
        }
  return `name: ${c.name}

on:
  # ${c.daily}
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npx --yes contrib-graphs@latest svg ${cliArgs(o)}
        env:
          # ${c.token}
          GITHUB_TOKEN: \${{ secrets.CONTRIB_TOKEN || secrets.GITHUB_TOKEN }}
      # ${c.commit}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add ${o.dir}
          git diff --staged --quiet || (git commit -m "chore: update contribution graph" && git push)
`
}

/** Fragmento para el README: GitHub elige la imagen según el tema de quien visita. */
export function readmeSnippet(o: ReadmeOptions, lang: Lang): string {
  const alt = lang === 'es' ? `Gráfico de contribuciones de @${o.user} en GitHub` : `@${o.user}'s GitHub contribution graph`
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./${o.dir}/contributions-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./${o.dir}/contributions-light.svg">
  <img alt="${alt}" src="./${o.dir}/contributions-light.svg">
</picture>`
}

/**
 * CLI de contrib-graphs (`npx contrib-graphs …`). Genera los SVG para un README
 * de GitHub y el JSON de datos. Ver `contrib-graphs help`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { fetchGitHubContributions } from './adapters'
import { fetchContributionsPage } from './github-page'
import { renderIsometricSvg, type IsometricSvgOptions } from './svg'
import { themeNames, type ThemeName } from './themes'
import type { ContributionDay } from './types'

const HELP = `contrib-graphs: contribution graphs for your GitHub README

Usage
  contrib-graphs svg  --user <name> [options]   Write <name>-light.svg and <name>-dark.svg
  contrib-graphs json --user <name> [options]   Write the contributions as JSON
  contrib-graphs help

Data (first one available)
  --input <file>      Read { date, count }[] from a JSON file instead of GitHub
  GITHUB_TOKEN        Use the official GraphQL API (a classic token with read:user includes private contributions)
  (no token)          Read the public github.com/users/<name>/contributions page

svg options
  --out-dir <dir>     Output folder (default: current folder)
  --name <name>       File name prefix (default: contributions)
  --theme <theme>     ${themeNames.join(', ')} (default: github)
  --lang <en|es>      Labels and date language (default: en)
  --weeks <n>         Weeks to show (default: 53)
  --background        Paint the theme surface instead of a transparent background
  --no-stats          Hide streaks and best day

json options
  --out <file>        Output file (default: contributions.json)
  --keep-on-error     If GitHub can't be reached and the file exists, keep it and exit 0
`

const LABELS: Record<'en' | 'es', Pick<IsometricSvgOptions, 'locale' | 'unit' | 'periodLabel' | 'statLabels'>> = {
  en: { locale: 'en' },
  es: {
    locale: 'es',
    unit: ['contribución', 'contribuciones'],
    periodLabel: (w) => (w >= 52 ? 'en el último año' : `en las últimas ${w} semanas`),
    statLabels: ['racha más larga', 'racha actual', 'mejor día'],
  },
}

export interface RunOptions {
  env?: Record<string, string | undefined>
  cwd?: string
  log?: (msg: string) => void
  error?: (msg: string) => void
  now?: () => Date
}

interface Loaded {
  source: string
  days: ContributionDay[]
}

async function loadData(
  user: string | undefined,
  input: string | undefined,
  env: Record<string, string | undefined>,
  cwd: string,
  warn: (msg: string) => void,
): Promise<Loaded> {
  if (input) {
    const json = JSON.parse(await readFile(resolve(cwd, input), 'utf8'))
    const days: unknown = Array.isArray(json) ? json : json?.days
    if (!Array.isArray(days)) throw new Error(`${input} must contain a { date, count }[] array or an object with "days"`)
    return { source: 'file', days: days as ContributionDay[] }
  }
  if (!user) throw new Error('Pass --user <github-username> or --input <file>')
  const token = env.GITHUB_TOKEN?.trim()
  if (token) {
    try {
      return { source: 'github-graphql', days: await fetchGitHubContributions(user, token) }
    } catch (e) {
      // Un token sin permisos (p. ej. el de Actions en algunas configuraciones) no debe romper la actualización diaria.
      warn(`Warning: the GitHub API failed (${(e as Error).message}); using the public contributions page instead.`)
    }
  }
  return { source: 'github-public-page', days: await fetchContributionsPage(user) }
}

/** Ejecuta el CLI y devuelve el código de salida. */
export async function run(argv: string[], opts: RunOptions = {}): Promise<number> {
  const env = opts.env ?? process.env
  const cwd = opts.cwd ?? process.cwd()
  const log = opts.log ?? ((m) => console.log(m))
  const error = opts.error ?? ((m) => console.error(m))
  const now = opts.now ?? (() => new Date())

  let parsed
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      allowNegative: true,
      options: {
        user: { type: 'string' },
        input: { type: 'string' },
        'out-dir': { type: 'string', default: '.' },
        name: { type: 'string', default: 'contributions' },
        theme: { type: 'string', default: 'github' },
        lang: { type: 'string', default: 'en' },
        weeks: { type: 'string' },
        background: { type: 'boolean', default: false },
        stats: { type: 'boolean', default: true },
        out: { type: 'string', default: 'contributions.json' },
        'keep-on-error': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    })
  } catch (e) {
    error(`${(e as Error).message}\n\n${HELP}`)
    return 1
  }
  const { values: v, positionals } = parsed
  const command = positionals[0] ?? 'help'

  if (command === 'help' || v.help) {
    log(HELP)
    return 0
  }

  if (command === 'svg') {
    if (!themeNames.includes(v.theme as ThemeName)) return fail(`Unknown theme "${v.theme}". Use one of: ${themeNames.join(', ')}`)
    if (v.lang !== 'en' && v.lang !== 'es') return fail(`Unknown language "${v.lang}". Use en or es`)
    const weeks = v.weeks === undefined ? undefined : Number(v.weeks)
    if (weeks !== undefined && !(Number.isInteger(weeks) && weeks >= 1 && weeks <= 53)) return fail('--weeks must be a whole number from 1 to 53')
    try {
      const { source, days } = await loadData(v.user, v.input, env, cwd, error)
      const endDate = days.reduce((last, d) => (d.date > last ? d.date : last), '') || undefined
      const outDir = resolve(cwd, v['out-dir']!)
      await mkdir(outDir, { recursive: true })
      const files: string[] = []
      for (const mode of ['light', 'dark'] as const) {
        const svg = renderIsometricSvg(days, {
          ...LABELS[v.lang],
          mode,
          endDate,
          weeks,
          theme: v.theme as ThemeName,
          background: v.background,
          showStats: v.stats,
        })
        const file = resolve(outDir, `${v.name}-${mode}.svg`)
        await writeFile(file, svg)
        files.push(file)
      }
      log(`Wrote ${files.map((f) => relative(cwd, f)).join(' and ')} (${days.length} days from ${source})`)
      return 0
    } catch (e) {
      return fail((e as Error).message)
    }
  }

  if (command === 'json') {
    const out = resolve(cwd, v.out!)
    try {
      const { source, days } = await loadData(v.user, v.input, env, cwd, error)
      const total = days.reduce((s, d) => s + d.count, 0)
      await mkdir(dirname(out), { recursive: true })
      await writeFile(out, JSON.stringify({ username: v.user ?? null, generatedAt: now().toISOString(), source, total, days }, null, 2) + '\n')
      log(`Wrote ${relative(cwd, out)}: ${total} contributions, ${days.filter((d) => d.count > 0).length} active days (${source})`)
      return 0
    } catch (e) {
      const exists = await readFile(out).then(
        () => true,
        () => false,
      )
      if (v['keep-on-error'] && exists) {
        error(`Warning: ${(e as Error).message}. Keeping the existing ${relative(cwd, out)}.`)
        return 0
      }
      return fail((e as Error).message)
    }
  }

  return fail(`Unknown command "${command}"`)

  function fail(message: string) {
    error(`contrib-graphs: ${message}`)
    return 1
  }
}

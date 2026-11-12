#!/usr/bin/env node
/**
 * Descarga las contribuciones de GitHub del último año y las guarda como JSON
 * para que el sitio las importe en build.
 *
 *   npm run data                      # usa GITHUB_USERNAME o el usuario por defecto
 *   npm run data -- otro-usuario
 *
 * Fuentes, en orden:
 *   1. API GraphQL oficial, si existe GITHUB_TOKEN (en .env.local o en el entorno).
 *      Con un token clásico con permiso `read:user` incluye contribuciones privadas.
 *   2. La página pública github.com/users/<usuario>/contributions (sin token).
 *
 * Si las dos fallan, deja el archivo anterior tal cual y termina sin error,
 * para que un problema de red no rompa el build.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseContributionsPage } from './parse-contributions-page.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/contributions.json')
const DEFAULT_USER = 'ingfranciscastillo'

const username = process.argv[2] || process.env.GITHUB_USERNAME || DEFAULT_USER
const token = process.env.GITHUB_TOKEN?.trim()
const UA = { 'User-Agent': 'contribution-graphs-fetch' }

const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`

async function fromGraphQL() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...UA, Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  })
  if (!res.ok) throw new Error(`GraphQL respondió ${res.status}${res.status === 401 ? ' (token inválido o vencido)' : ''}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`GraphQL: ${json.errors.map((e) => e.message).join('; ')}`)
  const cal = json.data?.user?.contributionsCollection?.contributionCalendar
  if (!cal) throw new Error(`El usuario "${username}" no existe o no es visible`)
  const days = cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
  return { source: 'github-graphql', total: cal.totalContributions, days }
}

async function fromPublicPage() {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, { headers: UA })
  if (!res.ok) throw new Error(`Página pública respondió ${res.status}`)
  const days = parseContributionsPage(await res.text())
  return { source: 'github-public-page', total: days.reduce((s, d) => s + d.count, 0), days }
}

async function main() {
  const attempts = token ? [['API GraphQL', fromGraphQL], ['página pública', fromPublicPage]] : [['página pública', fromPublicPage]]
  if (!token) console.log('Sin GITHUB_TOKEN: se usa la página pública (las privadas solo aparecen si tu perfil las muestra).')

  for (const [name, fn] of attempts) {
    try {
      const data = await fn()
      const payload = { username, generatedAt: new Date().toISOString(), ...data }
      await mkdir(dirname(OUT), { recursive: true })
      await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
      const active = data.days.filter((d) => d.count > 0).length
      console.log(`OK ${username}: ${data.total} contribuciones, ${active} días activos (${name}) → ${OUT.replace(ROOT + '/', '')}`)
      return
    } catch (err) {
      console.warn(`Falló ${name}: ${err.message}`)
    }
  }

  const previous = await readFile(OUT, 'utf8').catch(() => null)
  if (previous) console.warn('Aviso: no se pudieron actualizar los datos; se conserva el archivo anterior.')
  else console.warn('Aviso: no hay datos de GitHub; el sitio usará solo datos de ejemplo.')
}

main()

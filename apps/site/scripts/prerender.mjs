#!/usr/bin/env node
/**
 * Después de `vite build`: escribe un index.html por ruta conocida, en inglés y en español,
 * cada uno con su propio <html lang>, <title>, descripción, canonical y hreflang.
 *
 * Por qué: en GitHub Pages una SPA solo responde 200 en la raíz; el resto de rutas
 * salen de 404.html con estado 404, y los buscadores no indexan páginas con 404.
 * Con un archivo por ruta, cada página responde 200 y su <head> se lee sin JavaScript.
 *
 * También escribe 404.html (rutas desconocidas), sitemap.xml y robots.txt.
 * SITE_URL (p. ej. https://usuario.github.io/repo/) activa canonical, sitemap y robots.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { routeMeta, routes } from '../src/seo.ts'

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const SITE_URL = process.env.SITE_URL?.replace(/\/?$/, '/')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/**
 * Ruta relativa a la base, con barra final: GitHub Pages sirve docs/index.html en /docs/
 * y redirige /docs → /docs/, así que canonical y sitemap usan la URL que responde 200.
 */
const rel = (path, lang) => `${lang === 'es' ? 'es/' : ''}${path === '/' ? '' : path.slice(1) + '/'}`
const url = (path, lang) => (SITE_URL ? new URL(rel(path, lang), SITE_URL).href : null)

export function pageHtml(template, path, lang) {
  const { title, description } = routeMeta(path, lang)
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    SITE_URL && `<link rel="canonical" href="${url(path, lang)}" />`,
    SITE_URL && `<link rel="alternate" hreflang="en" href="${url(path, 'en')}" />`,
    SITE_URL && `<link rel="alternate" hreflang="es" href="${url(path, 'es')}" />`,
    SITE_URL && `<link rel="alternate" hreflang="x-default" href="${url(path, 'en')}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/<title>[^<]*<\/title>\s*<meta name="description" content="[^"]*" \/>/, head)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // vite build vacía dist, así que 404.html solo existe si ya se ejecutó este script: en ese
  // caso es la plantilla original (index.html ya fue reescrito). Así ejecutarlo dos veces no duplica nada.
  const template = await readFile(resolve(DIST, '404.html'), 'utf8').catch(() => readFile(resolve(DIST, 'index.html'), 'utf8'))
  if (!/<title>[^<]*<\/title>\s*<meta name="description"/.test(template)) throw new Error('index.html no tiene <title> seguido de meta description')

  // 404.html: la plantilla genérica, para rutas que no existen.
  await writeFile(resolve(DIST, '404.html'), template)

  let pages = 0
  for (const lang of ['en', 'es']) {
    for (const path of routes) {
      const file = resolve(DIST, rel(path, lang), 'index.html')
      await mkdir(dirname(file), { recursive: true })
      await writeFile(file, pageHtml(template, path, lang))
      pages++
    }
  }

  if (SITE_URL) {
    const entries = routes.flatMap((path) => ['en', 'es'].map((lang) => `  <url><loc>${url(path, lang)}</loc></url>`))
    await writeFile(resolve(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`)
    await writeFile(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', SITE_URL).href}\n`)
  }
  console.log(`prerender: ${pages} páginas${SITE_URL ? ', sitemap.xml y robots.txt' : ' (sin SITE_URL: sin canonical ni sitemap)'}`)
}

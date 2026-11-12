import assert from 'node:assert/strict'
import { test } from 'node:test'
import { routes } from '../src/seo.ts'

process.env.SITE_URL = 'https://example.github.io/repo/'
const { pageHtml } = await import('./prerender.mjs')
const template = '<!doctype html>\n<html lang="en">\n  <head>\n    <title>contrib/graphs</title>\n    <meta name="description" content="x" />\n  </head></html>'

test('cada ruta tiene título y descripción propios en los dos idiomas', () => {
  const titles = new Set()
  for (const lang of ['en', 'es'])
    for (const path of routes) {
      const html = pageHtml(template, path, lang)
      assert.match(html, new RegExp(`<html lang="${lang}">`))
      titles.add(html.match(/<title>([^<]*)/)[1] + lang)
      assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1)
    }
  assert.equal(titles.size, routes.length * 2)
})

test('canonical, hreflang con barra final y escape de HTML', () => {
  const html = pageHtml(template, '/docs/api', 'es')
  assert.match(html, /rel="canonical" href="https:\/\/example\.github\.io\/repo\/es\/docs\/api\/"/)
  assert.match(html, /hreflang="en" href="https:\/\/example\.github\.io\/repo\/docs\/api\/"/)
  assert.match(html, /hreflang="x-default" href="https:\/\/example\.github\.io\/repo\/docs\/api\/"/)
  assert.doesNotMatch(pageHtml(template, '/', 'en'), /content="[^"]*<[^"]*"/)
})

test('imagen para redes con URL absoluta y tarjeta grande', () => {
  const html = pageHtml(template, '/variants/classic', 'es')
  assert.match(html, /property="og:image" content="https:\/\/example\.github\.io\/repo\/og\.png"/)
  assert.match(html, /property="og:url" content="https:\/\/example\.github\.io\/repo\/es\/variants\/classic\/"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
  assert.match(html, /property="og:image:alt" content="[^"]+"/)
})

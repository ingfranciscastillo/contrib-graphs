#!/usr/bin/env node
/**
 * Genera las imágenes del README del proyecto a partir de los componentes reales:
 *
 *   npm run images      (escribe docs/images/<variante>-light.svg y -dark.svg)
 *
 * Renderiza cada variante con react-dom/server, toma su <svg> y resuelve las
 * variables CSS y color-mix() a colores concretos, porque una imagen en GitHub
 * o npm no carga la hoja de estilos. Usa datos de ejemplo fijos, así el
 * resultado solo cambia cuando cambia el diseño. Requiere el paquete compilado.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ClassicGraph, CompactGraph, DotsGraph, IsometricGraph, RadialGraph, SkylineGraph, terminalCharsets } from 'contrib-graphs'
import { buildCalendar, generateSampleData, themes } from 'contrib-graphs/data'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
export const OUT_DIR = resolve(ROOT, 'docs/images')

const END = '2026-11-08'
const data = generateSampleData({ seed: 21, profile: 'steady', endDate: new Date(`${END}T00:00:00Z`) })
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
const PAD = 16

/* ---------------------------------------- color-mix(in oklab, c p%, black) resuelto */
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
function mixWithBlack(hex, pct) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const k = pct / 100
  const L = (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * k
  const A = (1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s) * k
  const B = (0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s) * k
  const l2 = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m2 = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return (
    '#' +
    [4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2, -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2, -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2]
      .map((c) => Math.round(Math.min(1, Math.max(0, srgb(c))) * 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Sustituye las variables CSS del tema por los colores del modo. */
function resolveColors(markup, palette) {
  return markup
    .replace(/var\(--cg-l(\d)\)/g, (_, n) => palette.levels[Number(n)])
    .replace(/var\(--cg-text\)/g, palette.text)
    .replace(/var\(--cg-muted\)/g, palette.muted)
    .replace(/var\(--cg-border\)/g, palette.border)
    .replace(/var\(--cg-mix\)/g, '#000000')
    .replace(/color-mix\(in oklab, (#[0-9a-f]{6}) (\d+)%, #000000\)/gi, (_, hex, p) => mixWithBlack(hex, Number(p)))
    .replace(/--cg-w:[^;"]*;?/g, '')
    .replace(/ style=""/g, '')
}

/** Leyenda Less ▢▢▢▢▢ More alineada a la derecha. */
function legend(palette, right, y, shape = 'square') {
  const sw = 10
  const gap = 3
  const parts = []
  let x = right - 34 // ancho de "More" + separación
  parts.push(`<text x="${right}" y="${y + 9}" text-anchor="end" fill="${palette.muted}" font-size="11">More</text>`)
  for (let l = 4; l >= 0; l--) {
    x -= sw
    parts.push(
      shape === 'circle'
        ? `<circle cx="${x + sw / 2}" cy="${y + sw / 2}" r="${(sw / 2) * (l === 0 ? 0.5 : 0.62 + l * 0.095)}" fill="${palette.levels[l]}"/>`
        : `<rect x="${x}" y="${y}" width="${sw}" height="${sw}" rx="2" fill="${palette.levels[l]}"/>`,
    )
    x -= gap
  }
  parts.push(`<text x="${x - 3}" y="${y + 9}" text-anchor="end" fill="${palette.muted}" font-size="11">Less</text>`)
  return parts.join('')
}

function frame({ width, height, title, body, palette }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t" font-family="${esc(FONT)}">`,
    `<title id="t">${esc(title)}</title>`,
    `<style>.cg-label{fill:${palette.muted};font-size:9px}</style>`,
    body,
    '</svg>',
    '',
  ].join('')
}

/** Toma el primer <svg> que renderiza el componente y lo deja listo para incrustar. */
function innerSvg(element, palette) {
  const html = renderToStaticMarkup(element)
  const svg = html.match(/<svg[\s\S]*?<\/svg>/)?.[0]
  if (!svg) throw new Error('El componente no renderizó un <svg>')
  const width = Number(svg.match(/ width="([\d.]+)"/)[1])
  const height = Number(svg.match(/ height="([\d.]+)"/)[1])
  const content = resolveColors(svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''), palette)
  if (/var\(--|color-mix/.test(content)) throw new Error(`Quedó un color sin resolver: ${content.match(/(var\(--[^)]*\)|color-mix[^)]*\))/)[0]}`)
  return { width, height, content }
}

/** Gráfico SVG con encabezado (total) arriba y leyenda abajo. */
function svgVariant(Component, props, palette, { header = true, legendShape = 'square', title } = {}) {
  const inner = innerSvg(createElement(Component, { data, endDate: END, locale: 'en', showTotal: false, showLegend: false, ...props }), palette)
  const top = header ? 30 : 0
  const bottom = legendShape ? 30 : 0
  const width = Math.ceil(inner.width + PAD * 2)
  const height = Math.ceil(inner.height + top + bottom + PAD * 2)
  const headerText = header ? `<text x="${PAD}" y="${PAD + 12}" font-size="13" fill="${palette.text}"><tspan font-weight="600">${esc(title.total)}</tspan> ${esc(title.rest)}</text>` : ''
  return frame({
    width,
    height,
    title: `${title.total} ${title.rest}`,
    palette,
    body: [headerText, `<g transform="translate(${PAD} ${PAD + top})">${inner.content}</g>`, legendShape ? legend(palette, width - PAD, height - PAD - 10, legendShape) : ''].join(''),
  })
}

/** Terminal: texto monospace con un color por nivel, como el componente. */
function terminalSvg(palette) {
  const cal = buildCalendar(data, { endDate: END, locale: 'en' })
  const chars = terminalCharsets.blocks
  const CW = 7.22
  const LH = 15
  const fs = 12
  const cols = 5 + cal.weeks.length * 2
  const width = Math.ceil(cols * CW + PAD * 2 + 2)
  const lines = 2 + 1 + 7 + 2 + 1
  const height = Math.ceil(lines * LH + PAD * 2)
  const color = (l) => palette.levels[l === 0 ? 2 : l]
  const op = (l) => (l === 0 ? 0.35 : 1)
  const header = Array(cal.weeks.length * 2).fill(' ')
  for (const m of cal.months) for (let i = 0; i < 3; i++) if (m.weekIndex * 2 + i < header.length) header[m.weekIndex * 2 + i] = m.label[i] ?? ' '
  const days = ['', 'Mon', '', 'Wed', '', 'Fri', '']
  const row = (y, content) => `<text x="${PAD + 1}" y="${y}" xml:space="preserve">${content}</text>`
  const out = []
  let y = PAD + 12
  out.push(row(y, `<tspan fill="${palette.levels[4]}" font-weight="600">~ $</tspan><tspan fill="${palette.text}"> git log --since='1 year ago' | heatmap</tspan>`))
  y += LH * 2
  out.push(row(y, `<tspan fill="${palette.muted}">${esc('     ' + header.join(''))}</tspan>`))
  for (let r = 0; r < 7; r++) {
    y += LH
    const cells = cal.weeks
      .map((w) => {
        const d = w[r]
        return d ? `<tspan fill="${color(d.level)}" fill-opacity="${op(d.level)}">${chars[d.level]}</tspan>` : '  '
      })
      .join('')
    out.push(row(y, `<tspan fill="${palette.muted}">${days[r].padEnd(5)}</tspan>${cells}`))
  }
  y += LH * 2
  const legendChars = [0, 1, 2, 3, 4].map((l) => `<tspan fill="${color(l)}" fill-opacity="${op(l)}">${chars[l]}</tspan>`).join('')
  out.push(row(y, `<tspan fill="${palette.text}">     ${cal.total.toLocaleString('en')} contributions in the last year</tspan><tspan fill="${palette.muted}">   less </tspan>${legendChars}<tspan fill="${palette.muted}"> more</tspan>`))
  return frame({
    width,
    height,
    title: `${cal.total.toLocaleString('en')} contributions in the last year`,
    palette,
    body: `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${palette.surface}" stroke="${palette.border}"/><g font-family="${esc(MONO)}" font-size="${fs}">${out.join('')}</g>`,
  })
}

export function renderReadmeImages() {
  const cal = buildCalendar(data, { endDate: END })
  const year = { total: `${cal.total.toLocaleString('en')} contributions`, rest: 'in the last year' }
  const last30 = data.slice(-30).reduce((s, d) => s + d.count, 0)
  const files = {}
  for (const mode of ['light', 'dark']) {
    const palette = themes.github[mode]
    files[`classic-${mode}.svg`] = svgVariant(ClassicGraph, {}, palette, { title: year })
    files[`dots-${mode}.svg`] = svgVariant(DotsGraph, {}, palette, { title: year, legendShape: 'circle' })
    files[`isometric-${mode}.svg`] = svgVariant(IsometricGraph, { showStats: false, tileSize: 14, maxHeight: 56 }, palette, { title: year })
    files[`terminal-${mode}.svg`] = terminalSvg(palette)
    files[`radial-${mode}.svg`] = svgVariant(RadialGraph, { size: 320 }, palette, { header: false, title: year })
    files[`skyline-${mode}.svg`] = svgVariant(SkylineGraph, {}, palette, { title: year })
    files[`compact-${mode}.svg`] = svgVariant(CompactGraph, { days: 30 }, palette, {
      title: { total: `${last30.toLocaleString('en')} contributions`, rest: 'in the last 30 days' },
      legendShape: null,
    })
  }
  return files
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = renderReadmeImages()
  await mkdir(OUT_DIR, { recursive: true })
  for (const [name, svg] of Object.entries(files)) await writeFile(resolve(OUT_DIR, name), svg)
  console.log(`${Object.keys(files).length} imágenes → docs/images/`)
}

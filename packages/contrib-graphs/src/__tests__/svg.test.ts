// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'
import { generateSampleData } from '../sample'
import { mixWithBlack, renderIsometricSvg } from '../svg'
import { themes } from '../themes'

const data = generateSampleData({ seed: 3, endDate: new Date(Date.UTC(2026, 0, 7)) })
const END = '2026-01-07'
const parse = (svg: string) => new DOMParser().parseFromString(svg, 'image/svg+xml')

describe('renderIsometricSvg', () => {
  test('es XML válido con un <svg> raíz, tamaño fijo y título accesible', () => {
    const svg = renderIsometricSvg(data, { endDate: END })
    const doc = parse(svg)
    expect(doc.querySelector('parsererror')).toBeNull()
    const root = doc.documentElement
    expect(root.tagName).toBe('svg')
    expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(root.getAttribute('role')).toBe('img')
    expect(Number(root.getAttribute('width'))).toBeGreaterThan(300)
    expect(doc.querySelector('title')!.textContent).toMatch(/^[\d,]+ contributions in the last year$/)
  })

  test('una cara superior por día y dos caras laterales por día con actividad', () => {
    const doc = parse(renderIsometricSvg(data, { endDate: END }))
    const days = data.filter((d) => d.date >= '2025-01-05' && d.date <= END)
    const active = days.filter((d) => d.count > 0).length
    expect(doc.querySelectorAll('polygon')).toHaveLength(days.length + active * 2)
  })

  test('autónomo: sin scripts, sin variables CSS ni recursos externos', () => {
    const svg = renderIsometricSvg(data, { endDate: END })
    expect(svg).not.toMatch(/<script|var\(--|color-mix|url\(|href=/)
  })

  test('usa la paleta del modo pedido', () => {
    const light = renderIsometricSvg(data, { endDate: END, theme: 'ember', mode: 'light' })
    const dark = renderIsometricSvg(data, { endDate: END, theme: 'ember', mode: 'dark' })
    expect(light).toContain(themes.ember.light.levels[4])
    expect(light).not.toContain(themes.ember.dark.levels[4])
    expect(dark).toContain(themes.ember.dark.levels[4])
    expect(dark).toContain(themes.ember.dark.text)
  })

  test('fondo opcional con el color de superficie del tema', () => {
    expect(parse(renderIsometricSvg(data, { endDate: END })).querySelector('rect')).toBeNull()
    const rect = parse(renderIsometricSvg(data, { endDate: END, background: true, mode: 'dark' })).querySelector('rect')
    expect(rect!.getAttribute('fill')).toBe(themes.github.dark.surface)
  })

  test('textos: estadísticas, etiquetas propias e idioma', () => {
    const doc = parse(
      renderIsometricSvg(data, {
        endDate: END,
        locale: 'es',
        unit: ['contribución', 'contribuciones'],
        periodLabel: 'en el último año',
        statLabels: ['racha más larga', 'racha actual', 'mejor día'],
      }),
    )
    const text = [...doc.querySelectorAll('text')].map((t) => t.textContent)
    expect(text[0]).toMatch(/contribuciones en el último año$/)
    expect(text.slice(1).join('|')).toMatch(/racha más larga\|.*racha actual\|.*mejor día · \d+ \w+/)
  })

  test('sin total ni estadísticas no hay textos ni espacio de encabezado', () => {
    const svg = renderIsometricSvg(data, { endDate: END, showTotal: false, showStats: false })
    const doc = parse(svg)
    expect(doc.querySelectorAll('text')).toHaveLength(0)
    expect(Number(doc.documentElement.getAttribute('height'))).toBeLessThan(Number(parse(renderIsometricSvg(data, { endDate: END })).documentElement.getAttribute('height')))
  })

  test('escapa los textos para XML', () => {
    const svg = renderIsometricSvg(data, { endDate: END, unit: ['<a & b>', '<a & b>'], periodLabel: '"quoted"' })
    expect(parse(svg).querySelector('parsererror')).toBeNull()
    expect(parse(svg).querySelector('title')!.textContent).toContain('<a & b> "quoted"')
  })

  test('es determinista', () => {
    expect(renderIsometricSvg(data, { endDate: END })).toBe(renderIsometricSvg(data, { endDate: END }))
  })
})

describe('mixWithBlack (color-mix en OKLab)', () => {
  test('100% deja el color igual y 0% da negro', () => {
    expect(mixWithBlack('#40c463', 100)).toBe('#40c463')
    expect(mixWithBlack('#40c463', 0)).toBe('#000000')
  })

  test('oscurece manteniendo el tono', () => {
    const dark = mixWithBlack('#ff0000', 60)
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(dark.slice(i, i + 2), 16))
    expect(r).toBeLessThan(255)
    expect(r).toBeGreaterThan(g + b)
  })
})

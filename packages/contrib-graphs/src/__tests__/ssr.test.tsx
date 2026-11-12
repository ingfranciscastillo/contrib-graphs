// Render en servidor (Next, Astro, Remix…): sin DOM, sin window, sin ResizeObserver.
import type { ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  ClassicGraph,
  CompactGraph,
  DotsGraph,
  IsometricGraph,
  RadialGraph,
  SkylineGraph,
  TerminalGraph,
  type BaseGraphProps,
} from '../index'
import { generateSampleData } from '../sample'

const data = generateSampleData({ seed: 5, endDate: new Date(Date.UTC(2026, 0, 7)) })
const variants: [string, ComponentType<BaseGraphProps>][] = [
  ['Classic', ClassicGraph],
  ['Dots', DotsGraph],
  ['Isometric', IsometricGraph],
  ['Terminal', TerminalGraph],
  ['Radial', RadialGraph],
  ['Skyline', SkylineGraph],
  ['Compact', CompactGraph as ComponentType<BaseGraphProps>],
]

describe.each(variants)('%s en el servidor', (_name, Graph) => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renderiza HTML completo sin window', () => {
    expect(typeof window).toBe('undefined')
    const html = renderToString(<Graph data={data} endDate="2026-01-07" locale="en" />)
    expect(html).toContain('class="cg-root')
    expect(html).toContain('data-cg-i="0"')
  })

  test('no emite advertencias de React', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderToString(<Graph data={data} endDate="2026-01-07" locale="en" />)
    expect(errors.mock.calls.map((c) => String(c[0]))).toEqual([])
  })
})

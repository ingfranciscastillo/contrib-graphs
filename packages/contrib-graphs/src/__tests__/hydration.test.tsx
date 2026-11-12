// @vitest-environment jsdom
// Lo que pasa en Next.js o en una isla de Astro: HTML del servidor + hydrateRoot en el navegador.
import { act } from '@testing-library/react'
import type { ComponentType } from 'react'
import { hydrateRoot } from 'react-dom/client'
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

const data = generateSampleData({ seed: 9, endDate: new Date(Date.UTC(2026, 0, 7)) })
const variants: [string, ComponentType<BaseGraphProps>][] = [
  ['Classic', ClassicGraph],
  ['Dots', DotsGraph],
  ['Isometric', IsometricGraph],
  ['Terminal', TerminalGraph],
  ['Radial', RadialGraph],
  ['Skyline', SkylineGraph],
  ['Compact', CompactGraph as ComponentType<BaseGraphProps>],
]

/** Hidrata HTML del servidor y devuelve los errores que React reporta. */
function hydrate(server: JSX.Element, client: JSX.Element) {
  const container = document.createElement('div')
  container.innerHTML = renderToString(server)
  document.body.appendChild(container)
  const errors: string[] = []
  vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.map(String).join(' ')))
  act(() => {
    hydrateRoot(container, client, { onRecoverableError: (e) => errors.push(String(e)) })
  })
  container.remove()
  return errors
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each(variants)('%s', (_name, Graph) => {
  test('hidrata sin diferencias entre servidor y cliente (sin pasar locale)', () => {
    const el = <Graph data={data} endDate="2026-01-07" />
    expect(hydrate(el, el)).toEqual([])
  })
})

test('control: si el servidor y el cliente usan otro día, el test sí lo detecta', () => {
  const errors = hydrate(<ClassicGraph data={data} endDate="2026-01-07" />, <ClassicGraph data={data} endDate="2026-01-08" />)
  expect(errors.length).toBeGreaterThan(0)
})

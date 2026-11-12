// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { ClassicGraph, SkylineGraph } from '../index'
import { generateSampleData } from '../sample'

/**
 * jsdom has no layout, so this models the case that matters: the graph inside a
 * centering flex container. The root is as wide as its SVG, up to the parent's width
 * (`max-width: 100%`); the parent is as wide as the window.
 */
let available = 800
const observers = new Set<{ cb: ResizeObserverCallback; els: Set<Element> }>()

class FakeResizeObserver {
  entry: { cb: ResizeObserverCallback; els: Set<Element> }
  constructor(cb: ResizeObserverCallback) {
    this.entry = { cb, els: new Set() }
    observers.add(this.entry)
  }
  observe(el: Element) {
    this.entry.els.add(el)
    this.entry.cb([], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {
    observers.delete(this.entry)
  }
}

/** Fires every observer, as the browser does after a layout change. */
function relayout() {
  for (const o of [...observers]) o.cb([], o as unknown as ResizeObserver)
}

function resize(width: number) {
  available = width
  act(() => {
    relayout()
    window.dispatchEvent(new Event('resize'))
  })
  // The re-render changes the root's width, which the browser reports again.
  act(() => relayout())
}

beforeEach(() => {
  available = 800
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    if (!this.classList.contains('cg-root')) return available
    const svg = this.querySelector('svg')
    const content = Number(svg?.getAttribute('width') ?? 0)
    return Math.min(content, available)
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  observers.clear()
})

const data = generateSampleData({ seed: 3, endDate: new Date('2026-11-08T00:00:00Z') })
const weeksShown = (c: HTMLElement) => new Set([...c.querySelectorAll('[data-cg-i]')].map((el) => el.getAttribute('x'))).size

test('Classic crops to fit and grows back when the space returns', () => {
  const { container } = render(
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ClassicGraph data={data} endDate="2026-11-08" />
    </div>,
  )
  expect(weeksShown(container)).toBe(53)

  resize(320)
  const narrow = weeksShown(container)
  expect(narrow).toBeLessThan(53)
  expect(narrow).toBeGreaterThanOrEqual(4)

  resize(800)
  expect(weeksShown(container)).toBe(53)
})

test('Skyline grows back too', () => {
  const { container } = render(
    <div>
      <SkylineGraph data={data} endDate="2026-11-08" />
    </div>,
  )
  const bars = () => container.querySelectorAll('[data-cg-i]').length
  const full = bars()
  resize(300)
  expect(bars()).toBeLessThan(full)
  resize(900)
  expect(bars()).toBe(full)
})

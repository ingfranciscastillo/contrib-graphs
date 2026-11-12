// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  ClassicGraph,
  CompactGraph,
  DotsGraph,
  IsometricGraph,
  RadialGraph,
  SkylineGraph,
  TerminalGraph,
  terminalCharsets,
  themes,
  type BaseGraphProps,
  type CalendarDay,
} from '../index'
import { generateSampleData } from '../sample'

afterEach(cleanup)

const END = '2026-01-07' // miércoles: 52 semanas completas + 4 días
const data = generateSampleData({ seed: 11, endDate: new Date(Date.UTC(2026, 0, 7)) })
const base: BaseGraphProps = { data, endDate: END, locale: 'en' }

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.cg-root')!
const cells = (container: HTMLElement) => container.querySelectorAll<Element>('[data-cg-i]')
const cell = (container: HTMLElement, i: number) => container.querySelector(`[data-cg-i="${i}"]`)!
const tooltip = (container: HTMLElement) => container.querySelector('.cg-tooltip')?.textContent ?? null
const live = (container: HTMLElement) => container.querySelector('[aria-live]')!.textContent

/** Variantes por día: mismas reglas de interacción (flechas ←/→ = semana, ↑/↓ = día). */
const dayVariants: [string, ComponentType<BaseGraphProps>, number][] = [
  ['Classic', ClassicGraph, 368],
  ['Dots', DotsGraph, 368],
  ['Isometric', IsometricGraph, 368],
  ['Terminal', TerminalGraph, 368],
  ['Radial', RadialGraph, 368],
]

describe.each(dayVariants)('%s', (_name, Graph, expectedCells) => {
  test('renderiza una celda por día y un resumen accesible', () => {
    const { container } = render(<Graph {...base} />)
    expect(cells(container)).toHaveLength(expectedCells)
    const group = screen.getByRole('group')
    expect(group.getAttribute('aria-label')).toMatch(/contributions from .+ to .+Use arrow keys/)
    expect(group.tabIndex).toBe(0)
  })

  test('hover muestra el tooltip con el conteo y la fecha del día', () => {
    const { container } = render(<Graph {...base} />)
    const day = [...cells(container)].find((c) => Number(c.getAttribute('data-cg-i')) === 10)!
    fireEvent.pointerOver(day)
    const expected = data.find((d) => d.date === '2025-01-15')! // índice 10 desde el domingo 2025-01-05
    expect(tooltip(container)).toContain(`${expected.count} contribution`)
    expect(tooltip(container)).toContain('Jan 15, 2025')
    expect(cell(container, 10).hasAttribute('data-active')).toBe(true)
    fireEvent.pointerLeave(root(container))
    expect(tooltip(container)).toBeNull()
  })

  test('teclado: flechas, Inicio/Fin, Enter llama a onDayClick y Escape cierra', () => {
    const onDayClick = vi.fn<(d: CalendarDay) => void>()
    const { container } = render(<Graph {...base} onDayClick={onDayClick} />)
    const r = root(container)
    const last = expectedCells - 1

    fireEvent.keyDown(r, { key: 'ArrowLeft' }) // desde el último día, una semana atrás
    expect(cell(container, last - 7).hasAttribute('data-active')).toBe(true)
    expect(live(container)).toMatch(/Dec 31, 2025/)

    fireEvent.keyDown(r, { key: 'ArrowUp' })
    expect(cell(container, last - 8).hasAttribute('data-active')).toBe(true)

    fireEvent.keyDown(r, { key: 'Home' })
    fireEvent.keyDown(r, { key: 'ArrowLeft' }) // no se sale del inicio
    expect(cell(container, 0).hasAttribute('data-active')).toBe(true)

    fireEvent.keyDown(r, { key: 'Enter' })
    expect(onDayClick).toHaveBeenCalledTimes(1)
    expect(onDayClick.mock.calls[0][0].date).toBe('2025-01-05')

    fireEvent.keyDown(r, { key: 'End' })
    fireEvent.keyDown(r, { key: 'ArrowRight' })
    expect(cell(container, last).hasAttribute('data-active')).toBe(true)

    fireEvent.keyDown(r, { key: 'Escape' })
    expect(container.querySelector('[data-active]')).toBeNull()
  })

  test('clic llama a onDayClick con el día', () => {
    const onDayClick = vi.fn<(d: CalendarDay) => void>()
    const { container } = render(<Graph {...base} onDayClick={onDayClick} />)
    fireEvent.click(cell(container, 3))
    expect(onDayClick).toHaveBeenCalledWith(expect.objectContaining({ date: '2025-01-08', index: 3 }))
  })

  test('colorMode, tema propio y clase se aplican al contenedor', () => {
    const custom = { ...themes.ember, name: 'Mío' }
    const { container } = render(<Graph {...base} colorMode="dark" theme={custom} className="extra" />)
    const r = root(container)
    expect(r.dataset.mode).toBe('dark')
    expect(r.classList.contains('extra')).toBe(true)
    expect(r.style.getPropertyValue('--cg-l4-dark')).toBe(themes.ember.dark.levels[4])
  })
})

describe('foco', () => {
  test('entrar con el teclado activa el último día; con el mouse no', () => {
    const { container } = render(<ClassicGraph {...base} />)
    const r = root(container)
    // jsdom no sabe si el foco vino del teclado: se simula con matches(':focus-visible').
    const matches = r.matches.bind(r)
    r.matches = (sel: string) => (sel === ':focus-visible' ? true : matches(sel))
    act(() => r.focus())
    expect(cell(container, 367).hasAttribute('data-active')).toBe(true)
    act(() => r.blur())
    expect(container.querySelector('[data-active]')).toBeNull()

    r.matches = (sel: string) => (sel === ':focus-visible' ? false : matches(sel))
    act(() => r.focus())
    expect(container.querySelector('[data-active]')).toBeNull()
  })

  test('no falla si el navegador no soporta :focus-visible', () => {
    const { container } = render(<ClassicGraph {...base} />)
    const r = root(container)
    r.matches = () => {
      throw new SyntaxError("':focus-visible' is not a valid selector")
    }
    const errors: unknown[] = []
    const onError = (e: ErrorEvent) => {
      errors.push(e.error)
      e.preventDefault()
    }
    window.addEventListener('error', onError)
    act(() => r.focus())
    window.removeEventListener('error', onError)
    expect(errors).toEqual([]) // React reporta como error global lo que lanza un handler
    expect(container.querySelector('[data-active]')).toBeNull()
  })
})

describe('textos e idioma', () => {
  test('unit, periodLabel, legendLabels y locale', () => {
    const { container } = render(
      <ClassicGraph {...base} locale="es" unit={['post', 'posts']} periodLabel="este año" legendLabels={['Pocos', 'Muchos']} />,
    )
    expect(container.querySelector('.cg-header')!.textContent).toMatch(/^[\d.,\s]+ posts este año$/)
    expect(container.querySelector('.cg-legend')!.textContent).toBe('PocosMuchos')
    expect(container.textContent).toContain('ene') // meses en español
  })

  test('periodLabel por defecto según las semanas', () => {
    const year = render(<ClassicGraph {...base} />)
    expect(year.container.querySelector('.cg-header')!.textContent).toMatch(/in the last year$/)
    cleanup()
    const short = render(<ClassicGraph {...base} weeks={12} />)
    expect(short.container.querySelector('.cg-header')!.textContent).toMatch(/in the last 12 weeks$/)
    cleanup()
    const fn = render(<ClassicGraph {...base} weeks={12} periodLabel={(w) => `en ${w} semanas`} />)
    expect(fn.container.querySelector('.cg-header')!.textContent).toMatch(/en 12 semanas$/)
  })

  test('showTotal y showLegend en false ocultan encabezado y leyenda; title los reemplaza', () => {
    const hidden = render(<ClassicGraph {...base} showTotal={false} showLegend={false} />)
    expect(hidden.container.querySelector('.cg-header')).toBeNull()
    expect(hidden.container.querySelector('.cg-legend')).toBeNull()
    cleanup()
    const titled = render(<ClassicGraph {...base} title="Mi año" />)
    expect(titled.container.querySelector('.cg-title')!.textContent).toBe('Mi año')
  })

  test('aria-label propio reemplaza el resumen', () => {
    render(<ClassicGraph {...base} aria-label="Actividad" />)
    expect(screen.getByRole('group').getAttribute('aria-label')).toBe('Actividad')
  })
})

describe('props de cada variante', () => {
  test('Classic: weeks, cellSize y gap definen el tamaño del SVG; glow añade el filtro', () => {
    const { container } = render(<ClassicGraph {...base} weeks={10} cellSize={10} gap={2} showWeekdays={false} showMonths={false} glow />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe(String(10 * 12 - 2))
    expect(svg.getAttribute('height')).toBe(String(7 * 12 - 2))
    expect(container.querySelector('filter')).not.toBeNull()
    expect(root(container).hasAttribute('data-glow')).toBe(true)
  })

  test('Dots: el radio crece con el nivel', () => {
    const { container } = render(<DotsGraph {...base} />)
    const radius = (level: number) => Number(container.querySelector(`circle[data-level="${level}"]`)!.getAttribute('r'))
    expect(radius(0)).toBeLessThan(radius(1))
    expect(radius(1)).toBeLessThan(radius(4))
  })

  test('Isometric: estadísticas con etiquetas propias', () => {
    const { container } = render(<IsometricGraph {...base} statLabels={['a', 'b', 'c']} />)
    expect(container.querySelector('.cg-stats')!.textContent).toMatch(/\d+a\d+b\d+c/)
    cleanup()
    const noStats = render(<IsometricGraph {...base} showStats={false} />)
    expect(noStats.container.querySelector('.cg-stats')).toBeNull()
  })

  test('Terminal: charset, prompt y comando', () => {
    const { container } = render(<TerminalGraph {...base} charset="ascii" prompt="$" command="echo hola" />)
    const text = container.querySelector('pre')!.textContent!
    expect(text.startsWith('$ echo hola')).toBe(true)
    const used = new Set([...cells(container)].map((c) => c.textContent))
    for (const ch of used) expect(terminalCharsets.ascii).toContain(ch)
  })

  test('Radial: total en el centro y sin encabezado por defecto', () => {
    const { container } = render(<RadialGraph {...base} />)
    const total = data.filter((d) => d.date >= '2025-01-05' && d.date <= END).reduce((s, d) => s + d.count, 0)
    expect(container.querySelector('svg')!.textContent).toContain(total.toLocaleString('en'))
    expect(container.querySelector('.cg-header')).toBeNull()
  })

  test('Skyline: una barra por semana y onWeekClick con el total de la semana', () => {
    const onWeekClick = vi.fn()
    const { container } = render(<SkylineGraph {...base} onWeekClick={onWeekClick} />)
    expect(cells(container)).toHaveLength(53)
    fireEvent.click(cell(container, 1))
    const week = onWeekClick.mock.calls[0][0]
    const expected = data.filter((d) => d.date >= '2025-01-12' && d.date <= '2025-01-18').reduce((s, d) => s + d.count, 0)
    expect(week.total).toBe(expected)
    expect(week.days).toHaveLength(7)
    expect(week.days[0].date).toBe('2025-01-12')
  })

  test('Compact: últimos N días, racha y textos propios', () => {
    const { container } = render(
      <CompactGraph data={data} endDate={END} days={14} streakLabel={(n) => `racha ${n}`} rangeLabel={(n) => `en ${n} días`} />,
    )
    expect(cells(container)).toHaveLength(14)
    expect(container.querySelector('.cg-header')!.textContent).toMatch(/en 14 días/)
    const lastDays = data.slice(-14)
    const total = lastDays.reduce((s, d) => s + d.count, 0)
    expect(container.querySelector('.cg-title strong')!.textContent).toBe(total.toLocaleString())
    expect(container.querySelector('.cg-legend')).toBeNull() // leyenda oculta por defecto
  })

  test('animate añade el atributo que activa la animación', () => {
    const { container } = render(<ClassicGraph {...base} animate />)
    expect(root(container).hasAttribute('data-animate')).toBe(true)
  })
})

describe('datos vacíos', () => {
  test.each(dayVariants)('%s no falla sin datos', (_name, Graph) => {
    const { container } = render(<Graph data={[]} endDate={END} locale="en" />)
    expect(cells(container).length).toBeGreaterThan(0)
    expect(container.querySelector('[data-level="1"], [data-level="2"]')).toBeNull()
  })
})

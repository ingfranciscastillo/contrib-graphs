import {
  createRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { resolveTheme, themeVars } from './themes'
import type { BaseGraphProps, Calendar, CalendarDay, Level } from './types'
import { buildCalendar, cropCalendar, formatDate, formatNumber, pluralize } from './utils'

/**
 * El tipo de `useRef<T>(null)` en la versión de React instalada: `RefObject<T>` en React 18
 * y `RefObject<T | null>` en React 19. Así el código compila con ambos (importa al copiarlo).
 */
type ElementRef<T> = ReturnType<typeof createRef<T>>

/**
 * useLayoutEffect en el navegador (mide antes de pintar) y useEffect en el
 * servidor, donde los efectos no corren y React avisaría por cada componente.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/* --------------------------------------------------------- Interacción */

export interface Interaction {
  rootRef: ElementRef<HTMLDivElement>
  active: number | null
  via: 'pointer' | 'keyboard' | null
  pos: { x: number; y: number } | null
  handlers: {
    tabIndex: number
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
    onPointerOver: (e: PointerEvent<HTMLDivElement>) => void
    onPointerLeave: () => void
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => void
    onBlur: () => void
  }
}

/** `:focus-visible` no existe en navegadores viejos (Safari < 15.4) ni en algunos entornos de test. */
function isFocusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return false
  }
}

const indexOf = (target: EventTarget | null): number | null => {
  const el = (target as Element | null)?.closest?.('[data-cg-i]')
  return el ? Number(el.getAttribute('data-cg-i')) : null
}

/**
 * Hover + navegación con teclado usando delegación de eventos: las celdas solo
 * llevan `data-cg-i`, así que no se crean cientos de handlers. Flechas izquierda/derecha
 * avanzan `stepX` elementos y arriba/abajo `stepY`.
 */
export function useGraphInteraction(opts: {
  rootRef: ElementRef<HTMLDivElement>
  count: number
  stepX: number
  stepY: number
  onActivate?: (index: number) => void
}): Interaction {
  const { rootRef, count, stepX, stepY, onActivate } = opts
  const [state, setState] = useState<{ index: number; via: 'pointer' | 'keyboard' } | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const index = state && state.index < count ? state.index : null

  // Marca la celda activa. Sin deps a propósito (vuelve a marcarla si el SVG se
  // re-renderiza), por eso aquí NO se toca el estado.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const el = index == null ? null : root.querySelector(`[data-cg-i="${index}"]`)
    root.querySelectorAll('[data-active]').forEach((n) => n !== el && n.removeAttribute('data-active'))
    el?.setAttribute('data-active', '')
  })

  // Posición del tooltip: solo cuando cambia la celda activa o el número de celdas.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    const el = index == null || !root ? null : root.querySelector(`[data-cg-i="${index}"]`)
    if (!root || !el) {
      setPos(null)
      return
    }
    const r = root.getBoundingClientRect()
    const e = el.getBoundingClientRect()
    setPos({ x: e.left + e.width / 2 - r.left, y: e.top - r.top })
  }, [rootRef, index, count])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const cur = index ?? count - 1
      let next: number | null = null
      switch (e.key) {
        case 'ArrowRight': next = cur + stepX; break
        case 'ArrowLeft': next = cur - stepX; break
        case 'ArrowDown': next = stepY ? cur + stepY : null; break
        case 'ArrowUp': next = stepY ? cur - stepY : null; break
        case 'Home': next = 0; break
        case 'End': next = count - 1; break
        case 'Escape': setState(null); return
        case 'Enter':
        case ' ':
          if (index != null) {
            e.preventDefault()
            onActivate?.(index)
          }
          return
        default:
          return
      }
      if (next == null || count === 0) return
      e.preventDefault()
      setState({ index: Math.max(0, Math.min(count - 1, next)), via: 'keyboard' })
    },
    [index, count, stepX, stepY, onActivate],
  )

  return {
    rootRef,
    active: index,
    via: state?.via ?? null,
    pos,
    handlers: {
      tabIndex: 0,
      onKeyDown,
      onPointerOver: (e) => {
        const i = indexOf(e.target)
        if (i != null && i !== index) setState({ index: i, via: 'pointer' })
      },
      onPointerLeave: () => setState((s) => (s?.via === 'pointer' ? null : s)),
      onClick: (e) => {
        const i = indexOf(e.target)
        if (i != null) onActivate?.(i)
      },
      onFocus: (e) => {
        // Al entrar con Tab se activa el último día; con un clic no (el puntero ya lo hace).
        if (e.target === e.currentTarget && isFocusVisible(e.currentTarget))
          setState((s) => s ?? { index: count - 1, via: 'keyboard' })
      },
      onBlur: () => setState((s) => (s?.via === 'keyboard' ? null : s)),
    },
  }
}

/** Reduce las semanas visibles al ancho del contenedor (en vez de hacer scroll). */
export function useFitWeeks(
  ref: ElementRef<HTMLElement>,
  requested: number,
  pitch: number,
  reserved: number,
  enabled: boolean,
): number {
  const [fit, setFit] = useState(requested)
  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el || typeof ResizeObserver === 'undefined') {
      setFit(requested)
      return
    }
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setFit(Math.max(4, Math.min(requested, Math.floor((w - reserved) / pitch))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, requested, pitch, reserved, enabled])
  return enabled ? fit : requested
}

/** Monta calendario + interacción. Es la base de todas las variantes por día. */
export function useCalendarGraph(
  props: BaseGraphProps,
  opts: { stepX?: number; stepY?: number; fit?: { pitch: number; reserved: number; enabled: boolean } } = {},
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const requested = props.weeks ?? 53
  const weeks = useFitWeeks(rootRef, requested, opts.fit?.pitch ?? 1, opts.fit?.reserved ?? 0, opts.fit?.enabled ?? false)
  const endKey = props.endDate instanceof Date ? props.endDate.getTime() : props.endDate
  const scaleKey = typeof props.scale === 'string' ? props.scale : props.scale?.join(',')
  const full = useMemo(
    () => buildCalendar(props.data, { weeks: requested, endDate: props.endDate, weekStart: props.weekStart, scale: props.scale, locale: props.locale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.data, requested, endKey, props.weekStart, scaleKey, props.locale],
  )
  const calendar = useMemo(() => cropCalendar(full, weeks, props.locale), [full, weeks, props.locale])
  const { onDayClick } = props
  const onActivate = useCallback((i: number) => onDayClick?.(calendar.days[i]), [onDayClick, calendar])
  const interaction = useGraphInteraction({
    rootRef,
    count: calendar.days.length,
    stepX: opts.stepX ?? 7,
    stepY: opts.stepY ?? 1,
    onActivate,
  })
  /** `periodTotal` es el total del periodo pedido aunque se muestren menos semanas. */
  return { calendar, periodTotal: full.total, interaction, theme: resolveTheme(props.theme) }
}

/* --------------------------------------------------------- Presentación */

export interface Description {
  title: string
  subtitle?: string
}

export function describeDay(day: CalendarDay, props: BaseGraphProps): Description {
  const n = day.count
  return {
    title: `${formatNumber(n, props.locale)} ${pluralize(n, props.unit)}`,
    subtitle: formatDate(day.date, props.locale),
  }
}

/** Texto del periodo según las semanas pedidas (no las recortadas por ancho). */
export function periodText(props: BaseGraphProps): string {
  const weeks = props.weeks ?? 53
  const p = props.periodLabel
  if (typeof p === 'function') return p(weeks)
  if (typeof p === 'string') return p
  return weeks >= 52 ? 'in the last year' : `in the last ${weeks} weeks`
}

export function defaultTitle(total: number, props: BaseGraphProps): ReactNode {
  return (
    <>
      <strong>{formatNumber(total, props.locale)}</strong> {pluralize(total, props.unit)} {periodText(props)}
    </>
  )
}

export const cellDelay = (w: number) => ({ '--cg-w': w }) as CSSProperties

/** Id estable y válido para usar en `url(#...)` dentro de SVG. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

export function Legend({
  labels = ['Less', 'More'],
  swatch,
}: {
  labels?: readonly [string, string]
  swatch?: (level: Level) => ReactNode
}) {
  return (
    <span className="cg-legend" aria-hidden="true">
      <span>{labels[0]}</span>
      {([0, 1, 2, 3, 4] as const).map((l) =>
        swatch ? <span key={l}>{swatch(l)}</span> : <span key={l} className="cg-swatch" style={{ background: `var(--cg-l${l})` }} />,
      )}
      <span>{labels[1]}</span>
    </span>
  )
}

export interface ShellProps {
  props: BaseGraphProps
  interaction: Interaction
  variant: string
  describe: (index: number) => Description
  summary: string
  title?: ReactNode
  headerEnd?: ReactNode
  footerStart?: ReactNode
  legendSwatch?: (level: Level) => ReactNode
  glow?: boolean
  surface?: boolean
  children: ReactNode
}

/**
 * Contenedor común: tema, modo claro/oscuro, encabezado, leyenda, tooltip
 * y región aria-live para anunciar el día activo al navegar con teclado.
 */
export function GraphShell({
  props,
  interaction,
  variant,
  describe,
  summary,
  title,
  headerEnd,
  footerStart,
  legendSwatch,
  glow,
  surface,
  children,
}: ShellProps) {
  const theme = resolveTheme(props.theme)
  const { active, pos, via } = interaction
  const desc = active != null ? describe(active) : null
  const tipRef = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)

  // Mantiene el tooltip dentro del contenedor.
  useIsomorphicLayoutEffect(() => {
    const tip = tipRef.current
    const root = interaction.rootRef.current
    if (!tip || !root || !pos) return
    const half = tip.offsetWidth / 2
    const w = root.clientWidth
    setShift(pos.x - half < 0 ? half - pos.x : pos.x + half > w ? w - half - pos.x : 0)
  }, [pos, desc?.title, desc?.subtitle, interaction.rootRef])

  const showHeader = props.showTotal !== false || headerEnd
  return (
    <div
      ref={interaction.rootRef}
      className={['cg-root', `cg-${variant}`, props.className].filter(Boolean).join(' ')}
      style={{ ...themeVars(theme), ...props.style }}
      data-mode={props.colorMode ?? 'auto'}
      data-animate={props.animate ? '' : undefined}
      data-glow={glow ? '' : undefined}
      data-surface={surface ? '' : undefined}
      data-has-active={active != null ? '' : undefined}
      role="group"
      aria-label={props['aria-label'] ?? `${summary}. Use arrow keys to explore.`}
      {...interaction.handlers}
    >
      {showHeader && (
        <div className="cg-header">
          {props.showTotal !== false ? <span className="cg-title">{props.title ?? title}</span> : <span />}
          {headerEnd}
        </div>
      )}
      <div className="cg-body">{children}</div>
      {(props.showLegend !== false || footerStart) && (
        <div className="cg-footer">
          <span>{footerStart}</span>
          {props.showLegend !== false && <Legend labels={props.legendLabels} swatch={legendSwatch} />}
        </div>
      )}
      {desc && pos && (
        <div
          ref={tipRef}
          className="cg-tooltip"
          style={{ left: pos.x + shift, top: pos.y, '--cg-arrow': `${-shift}px` } as CSSProperties}
          aria-hidden="true"
        >
          <strong>{desc.title}</strong>
          {desc.subtitle && <span> · {desc.subtitle}</span>}
        </div>
      )}
      <span className="cg-sr-only" aria-live="polite">
        {via === 'keyboard' && desc ? `${desc.title}, ${desc.subtitle ?? ''}` : ''}
      </span>
    </div>
  )
}

export function summaryOf(calendar: Calendar, props: BaseGraphProps) {
  return `${formatNumber(calendar.total, props.locale)} ${pluralize(calendar.total, props.unit)} from ${formatDate(calendar.start, props.locale)} to ${formatDate(calendar.end, props.locale)}`
}

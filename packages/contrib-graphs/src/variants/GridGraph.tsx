import { useMemo } from 'react'
import { GraphShell, cellDelay, defaultTitle, describeDay, summaryOf, useCalendarGraph, useSvgId } from '../core'
import type { BaseGraphProps, Level } from '../types'
import { weekdayLabels } from '../utils'

export interface GridGraphProps extends BaseGraphProps {
  /** Tamaño de cada celda en px (default 11) */
  cellSize?: number
  /** Separación entre celdas (default 3) */
  gap?: number
  /** Radio de las esquinas; usa `cellSize / 2` para círculos (default 2) */
  radius?: number
  showWeekdays?: boolean
  showMonths?: boolean
  /** Brillo en las celdas más activas. */
  glow?: boolean
  /** `crop` recorta semanas antiguas en pantallas angostas; `scale` encoge el SVG. */
  fit?: 'crop' | 'scale'
}

interface Shape {
  variant: string
  cell: (args: { x: number; y: number; size: number; level: Level; radius: number }) => {
    kind: 'rect' | 'circle'
    attrs: Record<string, number>
  }
}

function useGrid(props: GridGraphProps, shape: Shape) {
  const { cellSize = 11, gap = 3, radius = 2, showWeekdays = true, showMonths = true, fit = 'crop' } = props
  const pitch = cellSize + gap
  const left = showWeekdays ? 30 : 0
  const top = showMonths ? 15 : 0
  const { calendar, periodTotal, interaction } = useCalendarGraph(props, {
    fit: { pitch, reserved: left - gap, enabled: fit === 'crop' },
  })
  const glow = props.glow ?? false
  const filterId = useSvgId('cg-glow')
  const weekdays = useMemo(() => weekdayLabels(props.locale, props.weekStart ?? 0), [props.locale, props.weekStart])

  const width = left + calendar.weeks.length * pitch - gap
  const height = top + 7 * pitch - gap

  const svg = useMemo(
    () => (
      <svg
        width={fit === 'scale' ? '100%' : width}
        height={fit === 'scale' ? undefined : height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {glow && (
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={cellSize / 4} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        {showMonths &&
          calendar.months.map((m) => (
            <text key={`${m.year}-${m.month}`} className="cg-label" x={left + m.weekIndex * pitch} y={9}>
              {m.label}
            </text>
          ))}
        {showWeekdays &&
          [1, 3, 5].map((r) => (
            <text key={r} className="cg-label" x={0} y={top + r * pitch + cellSize - 2}>
              {weekdays[r]}
            </text>
          ))}
        <g>
          {calendar.days.map((d) => {
            const { kind, attrs } = shape.cell({
              x: left + d.weekIndex * pitch,
              y: top + d.dayIndex * pitch,
              size: cellSize,
              level: d.level,
              radius,
            })
            const El = kind
            return (
              <El
                key={d.date}
                {...attrs}
                className={`cg-cell${glow && d.level >= 3 ? ' cg-glow' : ''}`}
                data-cg-i={d.index}
                data-level={d.level}
                fill={`var(--cg-l${d.level})`}
                style={cellDelay(d.weekIndex)}
              />
            )
          })}
        </g>
      </svg>
    ),
    [calendar, width, height, fit, glow, filterId, cellSize, showMonths, showWeekdays, left, top, pitch, radius, weekdays, shape],
  )

  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant={shape.variant}
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(periodTotal, props)}
      glow={glow}
      legendSwatch={
        shape.variant === 'dots'
          ? (l) => <span className="cg-swatch" style={{ background: `var(--cg-l${l})`, borderRadius: '50%', transform: `scale(${0.55 + l * 0.11})` }} />
          : undefined
      }
    >
      <div style={glow ? ({ '--cg-glow-filter': `url(#${filterId})` } as React.CSSProperties) : undefined}>{svg}</div>
    </GraphShell>
  )
}

const classicShape: Shape = {
  variant: 'classic',
  cell: ({ x, y, size, radius }) => ({ kind: 'rect', attrs: { x, y, width: size, height: size, rx: radius, ry: radius } }),
}

const dotsShape: Shape = {
  variant: 'dots',
  cell: ({ x, y, size, level }) => ({
    kind: 'circle',
    attrs: { cx: x + size / 2, cy: y + size / 2, r: (size / 2) * (level === 0 ? 0.42 : 0.55 + level * 0.115) },
  }),
}

/** La cuadrícula clásica semanas × días. */
export function ClassicGraph(props: GridGraphProps) {
  return useGrid(props, classicShape)
}

/** Círculos cuyo tamaño también codifica la intensidad. */
export function DotsGraph(props: GridGraphProps) {
  return useGrid(props, dotsShape)
}

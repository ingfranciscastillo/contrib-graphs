import { useCallback, useMemo, useRef } from 'react'
import { GraphShell, cellDelay, describeDay, useGraphInteraction } from '../core'
import type { BaseGraphProps, CalendarDay } from '../types'
import { buildCalendar, computeStats, formatNumber, makeLevelFn, pluralize } from '../utils'

export interface CompactGraphProps extends Omit<BaseGraphProps, 'weeks' | 'weekStart'> {
  /** Días a mostrar (default 30) */
  days?: number
  cellSize?: number
  gap?: number
  radius?: number
  /** Muestra la racha actual junto al total. */
  showStreak?: boolean
  /** Texto para la racha, recibe el número. Default `"N day streak"`. */
  streakLabel?: (n: number) => string
  /** Texto tras el total, recibe los días. Default `"in the last N days"`. */
  rangeLabel?: (days: number) => string
}

/** Una sola fila con los últimos N días. Pensado para headers, tarjetas y footers. */
export function CompactGraph(props: CompactGraphProps) {
  const { days: n = 30, cellSize = 10, gap = 3, radius = 2, showStreak = true } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const endKey = props.endDate instanceof Date ? props.endDate.getTime() : props.endDate
  const scaleKey = typeof props.scale === 'string' ? props.scale : props.scale?.join(',')

  const days = useMemo<CalendarDay[]>(() => {
    const cal = buildCalendar(props.data, { weeks: Math.ceil(n / 7) + 1, endDate: props.endDate })
    const slice = cal.days.slice(-n)
    const levelOf = makeLevelFn(slice.map((d) => d.count), props.scale)
    return slice.map((d, i) => ({ ...d, index: i, weekIndex: i, level: levelOf(d.count) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data, n, endKey, scaleKey])

  const stats = useMemo(() => computeStats(days), [days])
  const { onDayClick } = props
  const onActivate = useCallback((i: number) => onDayClick?.(days[i]), [onDayClick, days])
  const interaction = useGraphInteraction({ rootRef, count: days.length, stepX: 1, stepY: 0, onActivate })

  const pitch = cellSize + gap
  const width = days.length * pitch - gap
  const svg = useMemo(
    () => (
      <svg width={width} height={cellSize} viewBox={`0 0 ${width} ${cellSize}`} aria-hidden="true">
        {days.map((d) => (
          <rect
            key={d.date}
            className="cg-cell"
            data-cg-i={d.index}
            x={d.index * pitch}
            y={0}
            width={cellSize}
            height={cellSize}
            rx={radius}
            fill={`var(--cg-l${d.level})`}
            style={cellDelay(d.index / 3)}
          />
        ))}
      </svg>
    ),
    [days, width, cellSize, pitch, radius],
  )

  const streak = props.streakLabel ?? ((s: number) => `${s} day streak`)
  return (
    <GraphShell
      props={{ ...props, showLegend: props.showLegend ?? false }}
      interaction={interaction}
      variant="compact"
      describe={(i) => describeDay(days[i], props)}
      summary={`${stats.total} ${pluralize(stats.total, props.unit)} in the last ${n} days`}
      title={
        <>
          <strong>{formatNumber(stats.total, props.locale)}</strong> {pluralize(stats.total, props.unit)}
          {' '}
          {(props.rangeLabel ?? ((d: number) => `in the last ${d} days`))(n)}
        </>
      }
      headerEnd={showStreak && stats.currentStreak > 0 && <span style={{ color: 'var(--cg-muted)' }}>{streak(stats.currentStreak)}</span>}
    >
      {svg}
    </GraphShell>
  )
}

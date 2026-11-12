import { useCallback, useMemo, useRef } from 'react'
import { GraphShell, cellDelay, defaultTitle, summaryOf, useFitWeeks, useGraphInteraction } from '../core'
import type { BaseGraphProps, CalendarDay, Level } from '../types'
import { buildCalendar, cropCalendar, formatDate, formatNumber, makeLevelFn, pluralize } from '../utils'

/** Props of `SkylineGraph`. It works by week, so it takes `onWeekClick` instead of `onDayClick`. */
export interface SkylineGraphProps extends Omit<BaseGraphProps, 'onDayClick'> {
  /**
   * Height of the tallest building in px.
   * @default 110
   */
  height?: number
  /**
   * Width of each building in px.
   * @default 9
   */
  barWidth?: number
  /**
   * Space between buildings in px.
   * @default 3
   */
  gap?: number
  /**
   * Draw seven windows per building, lit on the days with activity.
   * @default true
   */
  windows?: boolean
  /**
   * On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the SVG.
   * @default 'crop'
   */
  fit?: 'crop' | 'scale'
  /** Called when a week is clicked, or with Enter or Space while it is focused. */
  onWeekClick?: (week: SkylineWeek) => void
}

/** A week as passed to `onWeekClick`. */
export interface SkylineWeek {
  index: number
  days: CalendarDay[]
  total: number
  activeDays: number
  level: Level
}

/** One building per week: your year as a city skyline. */
export function SkylineGraph(props: SkylineGraphProps) {
  const { height = 110, barWidth = 9, gap = 3, windows = true, fit = 'crop' } = props
  const pitch = barWidth + gap
  const rootRef = useRef<HTMLDivElement>(null)
  const weeksN = useFitWeeks(rootRef, props.weeks ?? 53, pitch, -gap, fit === 'crop')
  const endKey = props.endDate instanceof Date ? props.endDate.getTime() : props.endDate

  const requested = props.weeks ?? 53
  const full = useMemo(
    () => buildCalendar(props.data, { weeks: requested, endDate: props.endDate, weekStart: props.weekStart, locale: props.locale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.data, requested, endKey, props.weekStart, props.locale],
  )
  const calendar = useMemo(() => cropCalendar(full, weeksN, props.locale), [full, weeksN, props.locale])

  // Levels and max height over the full period: cropping doesn't change the scale.
  const allWeeks = useMemo<SkylineWeek[]>(() => {
    const raw = full.weeks.map((w, index) => {
      const days = w.filter((d): d is CalendarDay => d !== null)
      return { index, days, total: days.reduce((s, d) => s + d.count, 0), activeDays: days.filter((d) => d.count > 0).length, level: 0 as Level }
    })
    const levelOf = makeLevelFn(raw.map((w) => w.total), props.scale)
    raw.forEach((w) => (w.level = levelOf(w.total)))
    return raw
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, typeof props.scale === 'string' ? props.scale : props.scale?.join(',')])

  const maxWeek = Math.max(1, ...allWeeks.map((w) => w.total))
  const weeks = useMemo(
    () => allWeeks.slice(allWeeks.length - calendar.weeks.length).map((w, index) => ({ ...w, index, days: calendar.weeks[index].filter((d): d is CalendarDay => d !== null) })),
    [allWeeks, calendar],
  )
  const { onWeekClick } = props
  const onActivate = useCallback((i: number) => onWeekClick?.(weeks[i]), [onWeekClick, weeks])
  const interaction = useGraphInteraction({ rootRef, count: weeks.length, stepX: 1, stepY: 0, onActivate })

  const labelH = 14
  const minH = windows ? 30 : 3
  const width = weeks.length * pitch - gap
  const svgH = height + labelH

  const svg = useMemo(
    () => (
      <svg width={fit === 'scale' ? '100%' : width} height={fit === 'scale' ? undefined : svgH} viewBox={`0 0 ${width} ${svgH}`} aria-hidden="true">
        <line x1={0} x2={width} y1={height + 0.5} y2={height + 0.5} stroke="var(--cg-border)" />
        {weeks.map((w) => {
          const h = w.total === 0 ? minH * 0.8 : minH + (w.total / maxWeek) * (height - minH)
          const x = w.index * pitch
          const y = height - h
          const ww = Math.max(2, barWidth - 4)
          return (
            <g key={w.index} className="cg-cell cg-rise" data-cg-i={w.index} style={cellDelay(w.index)}>
              <rect x={x} y={y} width={barWidth} height={h} rx={1.5} fill={`var(--cg-l${w.level})`} />
              {windows &&
                w.days.map((d) => (
                  <rect
                    key={d.date}
                    x={x + (barWidth - ww) / 2}
                    y={y + 3 + d.dayIndex * 3.6}
                    width={ww}
                    height={2.2}
                    rx={0.5}
                    fill={d.count > 0 ? '#fff6c8' : 'currentColor'}
                    opacity={d.count > 0 ? 0.92 : 0.12}
                    style={{ color: 'var(--cg-mix)' }}
                  />
                ))}
            </g>
          )
        })}
        {calendar.months.map((m) => (
          <text key={`${m.year}-${m.month}`} className="cg-label" x={m.weekIndex * pitch} y={svgH - 2}>
            {m.label}
          </text>
        ))}
      </svg>
    ),
    [weeks, calendar.months, width, svgH, height, pitch, barWidth, maxWeek, minH, windows, fit],
  )

  const describe = (i: number) => {
    const w = weeks[i]
    return {
      title: `${formatNumber(w.total, props.locale)} ${pluralize(w.total, props.unit)}`,
      subtitle: w.days[0] ? `${formatDate(w.days[0].date, props.locale, { month: 'short', day: 'numeric', year: 'numeric' })} · ${w.activeDays}/7` : undefined,
    }
  }

  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant="skyline"
      describe={describe}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(full.total, props)}
    >
      {svg}
    </GraphShell>
  )
}

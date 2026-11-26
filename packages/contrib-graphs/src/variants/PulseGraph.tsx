import { useCallback, useMemo, useRef } from 'react'
import { GraphShell, defaultTitle, summaryOf, useFitWeeks, useGraphInteraction, useSvgId } from '../core'
import type { BaseGraphProps, CalendarDay } from '../types'
import { buildCalendar, cropCalendar, formatDate, formatNumber, pluralize } from '../utils'

/** Props of `PulseGraph`. It works by week, so it takes `onWeekClick` instead of `onDayClick`. */
export interface PulseGraphProps extends Omit<BaseGraphProps, 'onDayClick'> {
  /**
   * Height of the chart in px.
   * @default 90
   */
  height?: number
  /**
   * Horizontal space between two weeks in px.
   * @default 12
   */
  weekWidth?: number
  /**
   * Mark the busiest week with a dot and its total.
   * @default true
   */
  showBest?: boolean
  /**
   * Show month labels under the line.
   * @default true
   */
  showMonths?: boolean
  /**
   * On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the SVG.
   * @default 'crop'
   */
  fit?: 'crop' | 'scale'
  /** Called when a week is clicked, or with Enter or Space while it is focused. */
  onWeekClick?: (week: PulseWeek) => void
}

/** A week as passed to `onWeekClick`. */
export interface PulseWeek {
  index: number
  days: CalendarDay[]
  total: number
}

/** Catmull-Rom spline through the points as cubic Bézier segments, never dipping below `floor`. */
function smoothPath(pts: readonly (readonly [number, number])[], floor: number): string {
  if (pts.length === 0) return ''
  const r = (n: number) => Math.round(n * 100) / 100
  let d = `M${r(pts[0][0])},${r(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = Math.min(floor, p1[1] + (p2[1] - p0[1]) / 6)
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = Math.min(floor, p2[1] - (p3[1] - p1[1]) / 6)
    d += ` C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2[0])},${r(p2[1])}`
  }
  return d
}

/** Weekly totals as a smooth line: the shape of your rhythm over the year. */
export function PulseGraph(props: PulseGraphProps) {
  const { height = 90, weekWidth = 12, showBest = true, showMonths = true, fit = 'crop' } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const requested = props.weeks ?? 53
  // The line spans (weeks - 1) gaps, so one week width is given back to the measurement.
  const weeksN = useFitWeeks(rootRef, requested, weekWidth, -weekWidth, fit === 'crop')
  const endKey = props.endDate instanceof Date ? props.endDate.getTime() : props.endDate
  const gradientId = useSvgId('cg-pulse')

  const full = useMemo(
    () => buildCalendar(props.data, { weeks: requested, endDate: props.endDate, weekStart: props.weekStart, locale: props.locale }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.data, requested, endKey, props.weekStart, props.locale],
  )
  const calendar = useMemo(() => cropCalendar(full, weeksN, props.locale), [full, weeksN, props.locale])
  // The vertical scale comes from the full period: cropping doesn't stretch the line.
  const maxWeek = useMemo(
    () => Math.max(1, ...full.weeks.map((w) => w.reduce((s, d) => s + (d?.count ?? 0), 0))),
    [full],
  )
  const weeks = useMemo<PulseWeek[]>(
    () =>
      calendar.weeks.map((w, index) => {
        const days = w.filter((d): d is CalendarDay => d !== null)
        return { index, days, total: days.reduce((s, d) => s + d.count, 0) }
      }),
    [calendar],
  )
  const { onWeekClick } = props
  const onActivate = useCallback((i: number) => onWeekClick?.(weeks[i]), [onWeekClick, weeks])
  const interaction = useGraphInteraction({ rootRef, count: weeks.length, stepX: 1, stepY: 0, onActivate })

  const labelH = showMonths ? 14 : 0
  const bestH = showBest ? 16 : 0
  const pad = 4
  const width = Math.max(1, (weeks.length - 1) * weekWidth)
  const svgH = bestH + height + labelH
  const base = bestH + height - 1

  const svg = useMemo(() => {
    const pts = weeks.map((w) => [w.index * weekWidth, base - (w.total / maxWeek) * (height - pad)] as const)
    const line = smoothPath(pts, base)
    const best = weeks.reduce((b, w) => (w.total > weeks[b].total ? w.index : b), 0)
    const [bx, by] = pts[best] ?? [0, base]
    const tx = Math.min(Math.max(bx, 24), width - 24)
    return (
      <svg width={fit === 'scale' ? '100%' : width} height={fit === 'scale' ? undefined : svgH} viewBox={`0 0 ${width} ${svgH}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--cg-l4)" stopOpacity={0.4} />
            <stop offset="1" stopColor="var(--cg-l4)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <line x1={0} x2={width} y1={base + 0.5} y2={base + 0.5} stroke="var(--cg-border)" />
        {pts.length > 1 && (
          <>
            <path className="cg-pulse-area" d={`${line} L${width},${base} L0,${base} Z`} fill={`url(#${gradientId})`} />
            <path className="cg-pulse-line" d={line} pathLength={1} fill="none" stroke="var(--cg-l4)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </>
        )}
        {showBest && weeks[best]?.total > 0 && (
          <g className="cg-pulse-best">
            <circle cx={bx} cy={by} r={3.5} fill="var(--cg-l4)" stroke="var(--cg-surface)" strokeWidth={1.5} />
            <text className="cg-label cg-pulse-best-label" x={tx} y={by - 8} textAnchor="middle">
              {formatNumber(weeks[best].total, props.locale)}
            </text>
          </g>
        )}
        {weeks.map((w) => {
          const [x, y] = pts[w.index]
          const left = w.index === 0 ? 0 : x - weekWidth / 2
          const right = w.index === weeks.length - 1 ? width : x + weekWidth / 2
          return (
            <g key={w.index} className="cg-cell" data-cg-i={w.index}>
              <rect x={left} y={0} width={Math.max(1, right - left)} height={base} fill="transparent" />
              <line className="cg-pulse-guide" x1={x} x2={x} y1={y} y2={base} />
              <circle className="cg-pulse-dot" cx={x} cy={y} r={3.5} />
            </g>
          )
        })}
        {showMonths &&
          calendar.months.map((m) => (
            <text key={`${m.year}-${m.month}`} className="cg-label" x={Math.min(m.weekIndex * weekWidth, width - 14)} y={svgH - 2}>
              {m.label}
            </text>
          ))}
      </svg>
    )
  }, [weeks, calendar.months, width, svgH, base, height, weekWidth, maxWeek, showBest, showMonths, fit, gradientId, props.locale])

  const describe = (i: number) => {
    const w = weeks[i]
    return {
      title: `${formatNumber(w.total, props.locale)} ${pluralize(w.total, props.unit)}`,
      subtitle: w.days[0] ? formatDate(w.days[0].date, props.locale, { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    }
  }

  return (
    <GraphShell
      props={{ ...props, showLegend: props.showLegend ?? false }}
      interaction={interaction}
      variant="pulse"
      describe={describe}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(full.total, props)}
    >
      {svg}
    </GraphShell>
  )
}

import { useMemo } from 'react'
import { GraphShell, cellDelay, defaultTitle, describeDay, summaryOf, useCalendarGraph } from '../core'
import { ISO_SHADES, isometricLayout } from '../isometric'
import type { BaseGraphProps } from '../types'
import { computeStats, formatDate, formatNumber } from '../utils'

/** Props of `IsometricGraph`. */
export interface IsometricGraphProps extends BaseGraphProps {
  /**
   * Width of each tile in px.
   * @default 12
   */
  tileSize?: number
  /**
   * Height of the tallest column in px.
   * @default 48
   */
  maxHeight?: number
  /**
   * `count` scales columns by the actual count; `level` uses five fixed heights.
   * @default 'count'
   */
  heightBy?: 'count' | 'level'
  /**
   * Show longest streak, current streak and best day in the header.
   * @default true
   */
  showStats?: boolean
  /**
   * Labels of the three stats.
   * @default ['longest streak', 'current streak', 'best day']
   */
  statLabels?: readonly [string, string, string]
}

const shade = (level: number, pct: number) => `color-mix(in oklab, var(--cg-l${level}) ${pct}%, var(--cg-mix))`

/** Isometric columns whose height shows each day's activity. */
export function IsometricGraph(props: IsometricGraphProps) {
  const { tileSize = 12, maxHeight = 48, heightBy = 'count', showStats = true, statLabels = ['longest streak', 'current streak', 'best day'] } = props
  const { calendar, periodTotal, interaction } = useCalendarGraph(props)
  const stats = useMemo(() => computeStats(calendar.days), [calendar])

  const svg = useMemo(() => {
    const { width, height, tiles } = isometricLayout(calendar, { tileSize, maxHeight, heightBy })
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {tiles.map(({ day: d, height: h, top, left, right }) => (
          <g key={d.date} className="cg-cell cg-rise" data-cg-i={d.index} style={cellDelay(d.weekIndex)}>
            {h > 0 && <polygon points={left} style={{ fill: shade(d.level, ISO_SHADES.left) }} />}
            {h > 0 && <polygon points={right} style={{ fill: shade(d.level, ISO_SHADES.right) }} />}
            <polygon points={top} style={{ fill: `var(--cg-l${d.level})` }} />
          </g>
        ))}
      </svg>
    )
  }, [calendar, tileSize, maxHeight, heightBy])

  const n = (v: number) => formatNumber(v, props.locale)
  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant="isometric"
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(periodTotal, props)}
      headerEnd={
        showStats && (
          <span className="cg-stats">
            <span>
              <b>{n(stats.longestStreak)}</b>{statLabels[0]}
            </span>
            <span>
              <b>{n(stats.currentStreak)}</b>{statLabels[1]}
            </span>
            <span>
              <b>{n(stats.best?.count ?? 0)}</b>
              {statLabels[2]}
              {stats.best && ` · ${formatDate(stats.best.date, props.locale, { month: 'short', day: 'numeric' })}`}
            </span>
          </span>
        )
      }
    >
      {svg}
    </GraphShell>
  )
}

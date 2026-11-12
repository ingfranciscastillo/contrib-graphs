import { useMemo } from 'react'
import { GraphShell, cellDelay, defaultTitle, describeDay, summaryOf, useCalendarGraph } from '../core'
import type { BaseGraphProps } from '../types'
import { computeStats, formatDate, formatNumber } from '../utils'

export interface IsometricGraphProps extends BaseGraphProps {
  /** Ancho de cada baldosa en px (default 12) */
  tileSize?: number
  /** Altura máxima de una columna en px (default 48) */
  maxHeight?: number
  /** `count` usa el conteo real; `level` usa 5 alturas fijas. */
  heightBy?: 'count' | 'level'
  showStats?: boolean
  /** Etiquetas de las estadísticas. Default `['longest streak', 'current streak', 'best day']`. */
  statLabels?: readonly [string, string, string]
}

const shade = (level: number, pct: number) => `color-mix(in oklab, var(--cg-l${level}) ${pct}%, var(--cg-mix))`

/** Columnas en perspectiva isométrica; la altura indica la actividad del día. */
export function IsometricGraph(props: IsometricGraphProps) {
  const { tileSize = 12, maxHeight = 48, heightBy = 'count', showStats = true, statLabels = ['longest streak', 'current streak', 'best day'] } = props
  const { calendar, periodTotal, interaction } = useCalendarGraph(props)
  const stats = useMemo(() => computeStats(calendar.days), [calendar])

  const tw = tileSize
  const th = tileSize / 2
  const W = calendar.weeks.length
  const width = (W + 7) * (tw / 2)
  const height = (W + 7) * (th / 2) + maxHeight + 2
  const ox = 7 * (tw / 2)

  const svg = useMemo(() => {
    // Orden de pintado de atrás hacia adelante.
    const ordered = [...calendar.days].sort((a, b) => a.weekIndex + a.dayIndex - (b.weekIndex + b.dayIndex) || a.weekIndex - b.weekIndex)
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {ordered.map((d) => {
          const X = ox + (d.weekIndex - d.dayIndex) * (tw / 2)
          const Y = maxHeight + (d.weekIndex + d.dayIndex) * (th / 2)
          const h =
            d.count === 0
              ? 0
              : heightBy === 'level'
                ? (d.level / 4) * maxHeight
                : Math.max(3, (d.count / Math.max(1, calendar.max)) * maxHeight)
          const top = `${X},${Y - h} ${X + tw / 2},${Y + th / 2 - h} ${X},${Y + th - h} ${X - tw / 2},${Y + th / 2 - h}`
          const leftFace = `${X - tw / 2},${Y + th / 2 - h} ${X},${Y + th - h} ${X},${Y + th} ${X - tw / 2},${Y + th / 2}`
          const rightFace = `${X},${Y + th - h} ${X + tw / 2},${Y + th / 2 - h} ${X + tw / 2},${Y + th / 2} ${X},${Y + th}`
          return (
            <g key={d.date} className="cg-cell cg-rise" data-cg-i={d.index} style={cellDelay(d.weekIndex)}>
              {h > 0 && <polygon points={leftFace} style={{ fill: shade(d.level, 78) }} />}
              {h > 0 && <polygon points={rightFace} style={{ fill: shade(d.level, 60) }} />}
              <polygon points={top} style={{ fill: `var(--cg-l${d.level})` }} />
            </g>
          )
        })}
      </svg>
    )
  }, [calendar, width, height, ox, tw, th, maxHeight, heightBy])

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

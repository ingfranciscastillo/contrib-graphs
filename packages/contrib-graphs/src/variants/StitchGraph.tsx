import { useMemo } from 'react'
import { GraphShell, cellDelay, defaultTitle, describeDay, summaryOf, useCalendarGraph } from '../core'
import type { BaseGraphProps, Level } from '../types'

/** Props of `StitchGraph`. */
export interface StitchGraphProps extends BaseGraphProps {
  /**
   * Size of each stitch in px.
   * @default 12
   */
  cellSize?: number
  /**
   * Show month labels.
   * @default true
   */
  showMonths?: boolean
  /**
   * On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the SVG.
   * @default 'crop'
   */
  fit?: 'crop' | 'scale'
}

/** A small, stable number in [-0.5, 0.5) for each date, so every stitch leans the same way on every render. */
function wobble(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000 - 0.5
}

/** Thread thickness for each level, as a fraction of the cell size. */
const THREAD: Record<Level, number> = { 0: 0, 1: 0.14, 2: 0.17, 3: 0.2, 4: 0.24 }

/** Cross-stitch on aida cloth: each active day is an X, thicker and darker the busier it was. */
export function StitchGraph(props: StitchGraphProps) {
  const { cellSize = 12, showMonths = true, fit = 'crop' } = props
  const pad = Math.round(cellSize / 2)
  const top = showMonths ? 15 : 0
  const { calendar, periodTotal, interaction } = useCalendarGraph(props, {
    fit: { pitch: cellSize, reserved: pad * 2, enabled: fit === 'crop' },
  })

  const width = calendar.weeks.length * cellSize + pad * 2
  const height = top + 7 * cellSize + pad * 2

  const svg = useMemo(() => {
    const inset = cellSize * 0.18
    const jitter = cellSize * 0.12
    return (
      <svg width={fit === 'scale' ? '100%' : width} height={fit === 'scale' ? undefined : height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect className="cg-cloth" x={0} y={top} width={width} height={height - top} rx={Math.min(6, pad)} />
        {showMonths &&
          calendar.months.map((m) => (
            <text key={`${m.year}-${m.month}`} className="cg-label" x={pad + m.weekIndex * cellSize} y={9}>
              {m.label}
            </text>
          ))}
        {calendar.days.map((d) => {
          const x = pad + d.weekIndex * cellSize
          const y = top + pad + d.dayIndex * cellSize
          const a = wobble(d.date) * jitter
          const b = wobble(`${d.date}~`) * jitter
          const color = `var(--cg-l${d.level})`
          return (
            <g key={d.date} className="cg-cell" data-cg-i={d.index} data-level={d.level} style={cellDelay(d.weekIndex)}>
              <rect x={x} y={y} width={cellSize} height={cellSize} fill="transparent" />
              {d.level === 0 ? (
                <circle className="cg-hole" cx={x + cellSize / 2} cy={y + cellSize / 2} r={Math.max(0.8, cellSize * 0.07)} />
              ) : (
                <g strokeWidth={cellSize * THREAD[d.level]} strokeLinecap="round">
                  <line
                    className="cg-under"
                    x1={x + inset + a}
                    y1={y + cellSize - inset}
                    x2={x + cellSize - inset}
                    y2={y + inset + b}
                    stroke={color}
                  />
                  <line x1={x + inset} y1={y + inset + a} x2={x + cellSize - inset + b} y2={y + cellSize - inset} stroke={color} />
                </g>
              )}
            </g>
          )
        })}
      </svg>
    )
  }, [calendar, width, height, top, pad, cellSize, showMonths, fit])

  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant="stitch"
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(periodTotal, props)}
      legendSwatch={(l) => (
        <svg className="cg-swatch-stitch" width={10} height={10} viewBox="0 0 10 10">
          {l === 0 ? (
            <circle cx={5} cy={5} r={1} className="cg-hole" />
          ) : (
            <g stroke={`var(--cg-l${l})`} strokeWidth={10 * THREAD[l]} strokeLinecap="round">
              <line x1={2} y1={8} x2={8} y2={2} />
              <line x1={2} y1={2} x2={8} y2={8} />
            </g>
          )}
        </svg>
      )}
    >
      {svg}
    </GraphShell>
  )
}

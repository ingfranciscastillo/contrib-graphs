import { useMemo } from 'react'
import { GraphShell, cellDelay, describeDay, summaryOf, useCalendarGraph } from '../core'
import type { BaseGraphProps } from '../types'
import { formatNumber, pluralize } from '../utils'

export interface RadialGraphProps extends BaseGraphProps {
  /** Diámetro en px (default 320) */
  size?: number
  /** Radio interior como fracción del radio total (default 0.38) */
  innerRadius?: number
  showMonths?: boolean
}

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  return `M${p(r1, a0)}A${r1} ${r1} 0 0 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`
}

/** El año como un anillo: cada semana es una porción y cada día de la semana un aro. */
export function RadialGraph(props: RadialGraphProps) {
  const { size = 320, innerRadius = 0.38, showMonths = true } = props
  const { calendar, interaction } = useCalendarGraph(props)
  const pad = showMonths ? 22 : 4
  const R = size / 2
  const outer = R - pad
  const inner = outer * innerRadius
  const ring = (outer - inner) / 7
  const W = calendar.weeks.length
  const slice = (Math.PI * 2) / W
  const start = -Math.PI / 2
  const gapA = Math.min(0.012, slice * 0.12)

  const svg = useMemo(
    () => (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {calendar.days.map((d) => {
          const a0 = start + d.weekIndex * slice + gapA
          const a1 = start + (d.weekIndex + 1) * slice - gapA
          const r0 = inner + d.dayIndex * ring + 0.6
          const r1 = inner + (d.dayIndex + 1) * ring - 0.6
          return (
            <path
              key={d.date}
              d={sector(R, R, r0, r1, a0, a1)}
              className="cg-cell"
              data-cg-i={d.index}
              fill={`var(--cg-l${d.level})`}
              style={cellDelay(d.weekIndex)}
            />
          )
        })}
        {showMonths &&
          calendar.months.map((m) => {
            const a = start + (m.weekIndex + 0.5) * slice
            return (
              <text
                key={`${m.year}-${m.month}`}
                className="cg-label"
                x={R + (outer + 11) * Math.cos(a)}
                y={R + (outer + 11) * Math.sin(a)}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {m.label}
              </text>
            )
          })}
        <text x={R} y={R - 4} textAnchor="middle" style={{ fill: 'var(--cg-text)', fontSize: size / 11, fontWeight: 650 }}>
          {formatNumber(calendar.total, props.locale)}
        </text>
        <text x={R} y={R + size / 18} textAnchor="middle" className="cg-label" style={{ fontSize: 11 }}>
          {pluralize(calendar.total, props.unit)}
        </text>
      </svg>
    ),
    [calendar, size, R, inner, ring, outer, slice, start, gapA, showMonths, props.locale, props.unit],
  )

  return (
    <GraphShell
      props={{ ...props, showTotal: props.showTotal ?? false }}
      interaction={interaction}
      variant="radial"
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>{svg}</div>
    </GraphShell>
  )
}

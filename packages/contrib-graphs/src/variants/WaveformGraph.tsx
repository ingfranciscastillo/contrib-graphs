import { useMemo } from 'react'
import { GraphShell, cellDelay, defaultTitle, describeDay, summaryOf, useCalendarGraph } from '../core'
import type { BaseGraphProps } from '../types'

/** Props of `WaveformGraph`. */
export interface WaveformGraphProps extends BaseGraphProps {
  /**
   * Height of the tallest bar in px, from the top of the wave to the bottom.
   * @default 64
   */
  height?: number
  /**
   * Width of each day's bar in px.
   * @default 2
   */
  barWidth?: number
  /**
   * Space between bars in px.
   * @default 1
   */
  gap?: number
  /**
   * Show month labels under the wave.
   * @default true
   */
  showMonths?: boolean
  /**
   * On narrow screens, `crop` drops the oldest weeks and `scale` shrinks the SVG.
   * @default 'crop'
   */
  fit?: 'crop' | 'scale'
}

/** One bar per day, mirrored on a center line: your year as a sound wave. */
export function WaveformGraph(props: WaveformGraphProps) {
  const { height = 64, barWidth = 2, gap = 1, showMonths = true, fit = 'crop' } = props
  const pitch = barWidth + gap
  const { calendar, periodTotal, periodMax, interaction } = useCalendarGraph(props, {
    stepX: 1,
    stepY: 7,
    fit: { pitch: pitch * 7, reserved: -gap, enabled: fit === 'crop' },
  })

  const labelH = showMonths ? 14 : 0
  // Room for every day of every week, including the days still to come this week,
  // so the width matches what `fit` measures and doesn't shrink week by week.
  const width = Math.max(1, calendar.weeks.length * 7 * pitch - gap)
  const xOf = (d: { weekIndex: number; dayIndex: number }) => (d.weekIndex * 7 + d.dayIndex) * pitch
  const svgH = height + labelH
  const mid = height / 2

  const svg = useMemo(() => {
    const max = Math.max(1, periodMax)
    // Square root, so quiet days don't vanish next to the busiest ones.
    const half = (n: number) => (n === 0 ? 0.75 : Math.max(1.5, Math.sqrt(n / max) * (mid - 1)))
    return (
      <svg width={fit === 'scale' ? '100%' : width} height={fit === 'scale' ? undefined : svgH} viewBox={`0 0 ${width} ${svgH}`} aria-hidden="true">
        <line x1={0} x2={width} y1={mid} y2={mid} stroke="var(--cg-border)" />
        {calendar.days.map((d) => {
          const h = half(d.count)
          return (
            <rect
              key={d.date}
              className="cg-cell cg-rise"
              data-cg-i={d.index}
              data-level={d.level}
              x={xOf(d)}
              y={mid - h}
              width={barWidth}
              height={h * 2}
              rx={Math.min(barWidth / 2, h)}
              fill={`var(--cg-l${d.count ? d.level : 1})`}
              opacity={d.count ? undefined : 0.5}
              style={cellDelay(d.weekIndex)}
            />
          )
        })}
        {showMonths &&
          calendar.months.map((m) => {
            const week = calendar.weeks[m.weekIndex].filter((d) => d !== null)
            const day = week.find((d) => d.date.endsWith('-01')) ?? week[0]
            return day ? (
              <text key={`${m.year}-${m.month}`} className="cg-label" x={xOf(day)} y={svgH - 2}>
                {m.label}
              </text>
            ) : null
          })}
      </svg>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar, periodMax, width, svgH, mid, pitch, barWidth, showMonths, fit])

  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant="waveform"
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
      title={defaultTitle(periodTotal, props)}
    >
      {svg}
    </GraphShell>
  )
}

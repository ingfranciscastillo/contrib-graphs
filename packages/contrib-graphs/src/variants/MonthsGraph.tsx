import { useCallback, useMemo, useRef } from 'react'
import { GraphShell, cellDelay, describeDay, useGraphInteraction } from '../core'
import type { BaseGraphProps, CalendarDay } from '../types'
import { addDays, buildCalendar, formatNumber, makeLevelFn, parseISO, pluralize, toISO, todayUTC } from '../utils'

/** Props of `MonthsGraph`. It shows whole months, so `weeks` and `periodLabel` don't apply. */
export interface MonthsGraphProps extends Omit<BaseGraphProps, 'weeks' | 'periodLabel'> {
  /**
   * Number of months to show, counting the month of `endDate`.
   * @default 12
   */
  months?: number
  /**
   * Size of each cell in px.
   * @default 9
   */
  cellSize?: number
  /**
   * Space between cells in px.
   * @default 2
   */
  gap?: number
  /**
   * Corner radius in px.
   * @default 2
   */
  radius?: number
  /**
   * Text after the total, given the number of months.
   * @default (n) => `in the last ${n} months`, or 'in the last month' for 1
   */
  monthsLabel?: (months: number) => string
}

interface MonthBlock {
  key: string
  label: string
  lead: number
  length: number
  days: CalendarDay[]
}

/** One small calendar per month. The months wrap onto new rows, so it fits narrow screens. */
export function MonthsGraph(props: MonthsGraphProps) {
  const { months: n = 12, cellSize = 9, gap = 2, radius = 2 } = props
  const weekStart = props.weekStart ?? 0
  const rootRef = useRef<HTMLDivElement>(null)
  const endKey = props.endDate instanceof Date ? props.endDate.getTime() : props.endDate
  const scaleKey = typeof props.scale === 'string' ? props.scale : props.scale?.join(',')

  const { blocks, days, total } = useMemo(() => {
    const end = props.endDate ? parseISO(typeof props.endDate === 'string' ? props.endDate : toISO(props.endDate)) : todayUTC()
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (n - 1), 1))
    const span = Math.round((end.getTime() - start.getTime()) / 86400000)
    const cal = buildCalendar(props.data, { weeks: Math.ceil(span / 7) + 2, endDate: toISO(end), weekStart })
    const first = toISO(start)
    const kept = cal.days.filter((d) => d.date >= first)
    const levelOf = makeLevelFn(kept.map((d) => d.count), props.scale)
    // In this layout `weekIndex` is the month (0 = the oldest one shown).
    const monthOf = (iso: string) => (Number(iso.slice(0, 4)) - start.getUTCFullYear()) * 12 + Number(iso.slice(5, 7)) - 1 - start.getUTCMonth()
    const all = kept.map((d, i) => ({ ...d, index: i, weekIndex: monthOf(d.date), level: levelOf(d.count) }))
    const fmt = new Intl.DateTimeFormat(props.locale ?? 'en', { month: 'short', timeZone: 'UTC' })
    const out: MonthBlock[] = []
    for (let m = 0; m < n; m++) {
      const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 1))
      const prefix = toISO(month).slice(0, 7)
      out.push({
        key: prefix,
        label: fmt.format(month),
        lead: (month.getUTCDay() - weekStart + 7) % 7,
        length: addDays(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)), -1).getUTCDate(),
        days: all.filter((d) => d.date.startsWith(prefix)),
      })
    }
    return { blocks: out, days: all, total: all.reduce((s, d) => s + d.count, 0) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data, n, endKey, weekStart, scaleKey, props.locale])

  const { onDayClick } = props
  const onActivate = useCallback((i: number) => onDayClick?.(days[i]), [onDayClick, days])
  const interaction = useGraphInteraction({ rootRef, count: days.length, stepX: 1, stepY: 7, onActivate })

  const pitch = cellSize + gap
  const width = 7 * pitch - gap
  const height = 6 * pitch - gap
  const grid = useMemo(
    () => (
      <div className="cg-months-grid">
        {blocks.map((b, m) => (
          <div key={b.key} className="cg-month">
            <span className="cg-month-name">{b.label}</span>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
              {Array.from({ length: b.length }, (_, k) => {
                const slot = b.lead + k
                const x = (slot % 7) * pitch
                const y = Math.floor(slot / 7) * pitch
                const d = b.days[k]
                if (!d)
                  return <rect key={k} className="cg-future" x={x + 0.5} y={y + 0.5} width={cellSize - 1} height={cellSize - 1} rx={radius} />
                return (
                  <rect
                    key={d.date}
                    className="cg-cell"
                    data-cg-i={d.index}
                    data-level={d.level}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={radius}
                    fill={`var(--cg-l${d.level})`}
                    style={cellDelay(m * 2 + Math.floor(slot / 7))}
                  />
                )
              })}
            </svg>
          </div>
        ))}
      </div>
    ),
    [blocks, width, height, pitch, cellSize, radius],
  )

  const range = (props.monthsLabel ?? ((m: number) => (m === 1 ? 'in the last month' : `in the last ${m} months`)))(n)
  return (
    <GraphShell
      props={props}
      interaction={interaction}
      variant="months"
      describe={(i) => describeDay(days[i], props)}
      summary={`${formatNumber(total, props.locale)} ${pluralize(total, props.unit)} ${range}`}
      title={
        <>
          <strong>{formatNumber(total, props.locale)}</strong> {pluralize(total, props.unit)} {range}
        </>
      }
    >
      {grid}
    </GraphShell>
  )
}

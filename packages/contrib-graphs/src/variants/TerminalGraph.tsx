import { Fragment, useMemo, useState } from 'react'
import { GraphShell, cellDelay, describeDay, periodText, summaryOf, useCalendarGraph, useIsomorphicLayoutEffect } from '../core'
import type { BaseGraphProps, Level } from '../types'
import { formatNumber, pluralize, weekdayLabels } from '../utils'

export const terminalCharsets = {
  blocks: ['··', '░░', '▒▒', '▓▓', '██'],
  squares: ['□ ', '▪ ', '■ ', '■ ', '■ '],
  ascii: ['. ', ': ', '+ ', '# ', '@ '],
  dots: ['· ', '• ', '• ', '● ', '● '],
} as const satisfies Record<string, readonly [string, string, string, string, string]>

export type TerminalCharset = keyof typeof terminalCharsets

export interface TerminalGraphProps extends BaseGraphProps {
  charset?: TerminalCharset
  /** Comando que aparece en el prompt. */
  command?: string
  /** Texto antes del comando (default `~ $`). */
  prompt?: string
  /** Colorea los caracteres con el tema. `false` = monocromo. */
  colored?: boolean
  fit?: 'crop' | 'scale'
}

const CHAR_W = 7.22 // ancho aprox. de un carácter monospace a 12px
const MIN_FONT = 6 // por debajo de esto ya no se lee: mejor recortar semanas

/** Bloques de texto en monospace, para portfolios con estética de terminal. */
export function TerminalGraph(props: TerminalGraphProps) {
  const {
    charset = 'blocks',
    command = "git log --since='1 year ago' | heatmap",
    prompt = '~ $',
    colored = true,
    fit = 'crop',
  } = props
  const chars = terminalCharsets[charset]
  const { calendar, periodTotal, interaction } = useCalendarGraph(props, {
    // En `scale` solo se recortan semanas si ni con la letra mínima caben.
    fit: (() => {
      const k = fit === 'scale' ? MIN_FONT / 12 : 1
      return { pitch: CHAR_W * 2 * k, reserved: CHAR_W * 5 * k + 34, enabled: true }
    })(),
  })
  const weekdays = useMemo(() => weekdayLabels(props.locale, props.weekStart ?? 0), [props.locale, props.weekStart])
  // `scale`: en vez de recortar semanas, reduce el tamaño de letra hasta que quepa.
  const [fontSize, setFontSize] = useState(12)
  const { rootRef } = interaction
  const cols = 5 + calendar.weeks.length * 2
  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current
    if (fit !== 'scale' || !el || typeof ResizeObserver === 'undefined') {
      setFontSize(12)
      return
    }
    const update = () => {
      const avail = el.clientWidth - 34
      if (avail > 0) setFontSize(Math.max(MIN_FONT, Math.min(12, (avail / cols) * (12 / CHAR_W))))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit, cols, rootRef])

  const color = (l: Level) => (colored ? `var(--cg-l${l === 0 ? 2 : l})` : 'var(--cg-text)')
  const op = (l: Level) => (l === 0 ? 0.35 : colored ? 1 : 0.4 + l * 0.15)

  const body = useMemo(() => {
    const cols = calendar.weeks.length * 2
    const header = Array.from({ length: cols }, () => ' ')
    for (const m of calendar.months) {
      const lbl = m.label.replace('.', '').slice(0, 3)
      for (let i = 0; i < lbl.length && m.weekIndex * 2 + i < cols; i++) header[m.weekIndex * 2 + i] = lbl[i]
    }
    return (
      <>
        {'     '}
        {header.join('')}
        {'\n'}
        {Array.from({ length: 7 }, (_, r) => (
          <Fragment key={r}>
            {(r % 2 === 1 ? weekdays[r].replace('.', '').slice(0, 3) : '').padEnd(5)}
            {calendar.weeks.map((w, wi) => {
              const d = w[r]
              if (!d) return <Fragment key={wi}>{'  '}</Fragment>
              return (
                <span
                  key={d.date}
                  className="cg-cell"
                  data-cg-i={d.index}
                  style={{ ...cellDelay(wi), color: color(d.level), opacity: op(d.level) }}
                >
                  {chars[d.level]}
                </span>
              )
            })}
            {'\n'}
          </Fragment>
        ))}
      </>
    )
  }, [calendar, weekdays, chars, colored]) // eslint-disable-line react-hooks/exhaustive-deps

  const [less, more] = props.legendLabels ?? ['less', 'more']
  return (
    <GraphShell
      props={{ ...props, showTotal: false, showLegend: false }}
      interaction={interaction}
      variant="terminal"
      surface
      describe={(i) => describeDay(calendar.days[i], props)}
      summary={summaryOf(calendar, props)}
    >
      <pre className="cg-term" style={fontSize !== 12 ? { fontSize } : undefined}>
        <span className="cg-prompt cg-wrap">
          <b>{prompt}</b> {command}
        </span>
        {'\n\n'}
        {body}
        {'\n'}
        {(props.showTotal !== false || props.showLegend !== false) && (
          // Total y leyenda: en la misma línea si caben, una debajo de otra si no.
          <span className="cg-foot">
            {props.showTotal !== false && (
              <span className="cg-prompt">
                {props.title ??
                  `${formatNumber(periodTotal, props.locale)} ${pluralize(periodTotal, props.unit)} ${periodText(props)}`}
              </span>
            )}
            {props.showLegend !== false && (
              <span>
                {less}{' '}
                {([0, 1, 2, 3, 4] as const).map((l) => (
                  <span key={l} style={{ color: color(l), opacity: op(l) }}>
                    {chars[l]}
                  </span>
                ))}
                {more}
              </span>
            )}
          </span>
        )}
        <span className="cg-prompt">
          <b>{prompt}</b> <span className="cg-caret" />
        </span>
      </pre>
    </GraphShell>
  )
}

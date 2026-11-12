import { Fragment, useMemo } from 'react'
import { GraphShell, cellDelay, describeDay, summaryOf, useCalendarGraph } from '../core'
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
    fit: { pitch: CHAR_W * 2, reserved: CHAR_W * 5 + 34, enabled: fit === 'crop' },
  })
  const weekdays = useMemo(() => weekdayLabels(props.locale, props.weekStart ?? 0), [props.locale, props.weekStart])
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
      <pre className="cg-term">
        <span className="cg-prompt">
          <b>{prompt}</b> {command}
        </span>
        {'\n\n'}
        {body}
        {'\n'}
        {props.showTotal !== false && (
          <span className="cg-prompt">
            {'     '}
            {props.title ?? `${formatNumber(periodTotal, props.locale)} ${pluralize(periodTotal, props.unit)} ${props.periodLabel ?? 'in the last year'}`}
          </span>
        )}
        {props.showLegend !== false && (
          <>
            {'   '}
            {less}{' '}
            {([0, 1, 2, 3, 4] as const).map((l) => (
              <span key={l} style={{ color: color(l), opacity: op(l) }}>
                {chars[l]}
              </span>
            ))}
            {more}
          </>
        )}
        {'\n'}
        <span className="cg-prompt">
          <b>{prompt}</b> <span className="cg-caret" />
        </span>
      </pre>
    </GraphShell>
  )
}

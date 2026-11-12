import { Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowCounterClockwise, CaretLeft, CaretRight, Desktop, DeviceMobile, DeviceTablet } from '@phosphor-icons/react'
import type { CalendarDay, SkylineWeek } from 'contrib-graphs'
import { formatDate } from 'contrib-graphs'
import { useLang, useLocaleParams, type Lang } from '../i18n'
import { useT } from '../messages'
import { useDemo } from '../search'
import { CodeBlock, DemoToolbar } from '../ui'
import { tr, usageSnippet, variants, variantsById, type Control, type Values, type VariantDef } from '../variants'

export function VariantPage() {
  const { variantId } = useParams({ from: '/{-$locale}/variants/$variantId' })
  const def = variantsById[variantId]
  // `key` reinicia los controles al cambiar de variante.
  return <Playground key={def.id} def={def} />
}

function Playground({ def }: { def: VariantDef }) {
  const { data, theme, locale } = useDemo()
  const lp = useLocaleParams()
  const t = useT()
  const lang = useLang()
  const [values, setValues] = useState<Values>(def.defaults)
  const [clicked, setClicked] = useState<CalendarDay | null>(null)
  const [replay, setReplay] = useState(0)
  const [device, setDevice] = useState<Device>('desktop')
  const [week, setWeek] = useState<SkylineWeek | null>(null)
  const C = def.component
  const changed = Object.keys(values).some((k) => values[k] !== def.defaults[k])
  const idx = variants.findIndex((v) => v.id === def.id)
  const prev = variants[(idx - 1 + variants.length) % variants.length]
  const next = variants[(idx + 1) % variants.length]

  return (
    <div className="container page">
      <nav className="crumbs" aria-label={t.playground.breadcrumb}>
        <Link to="/{-$locale}" params={lp} search={(p) => p}>
          {t.nav.gallery}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{def.name}</span>
      </nav>
      <header className="page-head">
        <div>
          <h1>{def.name}</h1>
          <p className="lead">{tr(def.description, lang)}</p>
        </div>
        <div className="pager">
          <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: prev.id }} search={(p) => p} className="btn btn-sm">
            <CaretLeft size={14} aria-hidden="true" />
            {prev.name}
          </Link>
          <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: next.id }} search={(p) => p} className="btn btn-sm">
            {next.name}
            <CaretRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <DemoToolbar />

      <div className="playground">
        <div className="preview-col">
          <div className="preview-bar">
            <div className="segmented" role="radiogroup" aria-label={t.playground.previewWidth}>
              {devices.map(({ id, Icon }) => (
                <button key={id} role="radio" aria-checked={device === id} onClick={() => setDevice(id)}>
                  <Icon size={15} aria-hidden="true" />
                  <span className="hide-sm">{t.playground.devices[id]}</span>
                </button>
              ))}
            </div>
            <span className="preview-size">{device === 'desktop' ? t.playground.fullWidth : `${deviceWidth[device]} px`}</span>
          </div>
          <div className="preview" data-device={device}>
            <div className="device-frame" style={{ maxWidth: deviceWidth[device] }}>
              <C
                key={replay}
                {...values}
                {...locale}
                data={data}
                theme={theme}
                onDayClick={def.id === 'skyline' ? undefined : setClicked}
                onWeekClick={def.id === 'skyline' ? setWeek : undefined}
              />
            </div>
          </div>
          <div className="preview-meta">
            <span>
              {def.id === 'skyline' && week
                ? `onWeekClick({ total: ${week.total}, activeDays: ${week.activeDays}, level: ${week.level} }), ${t.playground.weekOf} ${formatDate(week.days[0]?.date ?? '', locale.locale)}`
                : clicked
                ? `onDayClick({ date: '${clicked.date}', count: ${clicked.count}, level: ${clicked.level} }), ${formatDate(clicked.date, locale.locale)}`
                : t.playground.hint(def.id === 'skyline' ? 'onWeekClick' : 'onDayClick')}
            </span>
            {values.animate === true && (
              <button className="btn btn-ghost btn-sm" onClick={() => setReplay((r) => r + 1)}>
                <ArrowCounterClockwise size={14} aria-hidden="true" />
                {t.playground.replay}
              </button>
            )}
          </div>
          <CodeBlock code={usageSnippet(def, values, theme)} />
        </div>

        <aside className="controls" aria-label="Props">
          <div className="controls-head">
            <h2>Props</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setValues(def.defaults)} disabled={!changed}>
              <ArrowCounterClockwise size={14} aria-hidden="true" />
              {t.playground.reset}
            </button>
          </div>
          {def.controls.map((c) => (
            <ControlField key={c.key} control={c} lang={lang} value={values[c.key]} onChange={(v) => setValues((s) => ({ ...s, [c.key]: v }))} />
          ))}
        </aside>
      </div>
    </div>
  )
}

function ControlField({ control: c, lang, value, onChange }: { control: Control; lang: Lang; value: Values[string]; onChange: (v: Values[string]) => void }) {
  const id = `ctl-${c.key}`
  const name = (
    <span className="ctl-name">
      {tr(c.label, lang)}
      <code>{c.key}</code>
    </span>
  )
  switch (c.type) {
    case 'toggle':
      return (
        <label className="ctl ctl-toggle" htmlFor={id}>
          {name}
          <input id={id} type="checkbox" role="switch" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        </label>
      )
    case 'range':
      return (
        <label className="ctl" htmlFor={id}>
          <span className="ctl-row">
            {name}
            <output>{String(value)}</output>
          </span>
          <input id={id} type="range" min={c.min} max={c.max} step={c.step ?? 1} value={Number(value)} onChange={(e) => onChange(Number(e.target.value))} />
        </label>
      )
    case 'select':
      return (
        <label className="ctl" htmlFor={id}>
          {name}
          <select
            id={id}
            value={String(value)}
            onChange={(e) => onChange(c.options.find((o) => String(o.value) === e.target.value)?.value ?? e.target.value)}
          >
            {c.options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {tr(o.label, lang)}
              </option>
            ))}
          </select>
          {c.hint && <small>{tr(c.hint, lang)}</small>}
        </label>
      )
    case 'text':
      return (
        <label className="ctl" htmlFor={id}>
          {name}
          <input id={id} type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        </label>
      )
  }
}

type Device = 'desktop' | 'tablet' | 'mobile'
const deviceWidth: Record<Device, number | undefined> = { desktop: undefined, tablet: 768, mobile: 375 }
const devices = [
  { id: 'desktop', Icon: Desktop },
  { id: 'tablet', Icon: DeviceTablet },
  { id: 'mobile', Icon: DeviceMobile },
] as const

import { Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import type { CalendarDay } from '@cg/index'
import { formatDate } from '@cg/index'
import { useDemo } from '../search'
import { CodeBlock, DemoToolbar } from '../ui'
import { usageSnippet, variants, variantsById, type Control, type Values, type VariantDef } from '../variants'

export function VariantPage() {
  const { variantId } = useParams({ from: '/variants/$variantId' })
  const def = variantsById[variantId]
  // `key` reinicia los controles al cambiar de variante.
  return <Playground key={def.id} def={def} />
}

function Playground({ def }: { def: VariantDef }) {
  const { data, theme, locale } = useDemo()
  const [values, setValues] = useState<Values>(def.defaults)
  const [clicked, setClicked] = useState<CalendarDay | null>(null)
  const [replay, setReplay] = useState(0)
  const C = def.component
  const changed = Object.keys(values).some((k) => values[k] !== def.defaults[k])
  const idx = variants.findIndex((v) => v.id === def.id)
  const prev = variants[(idx - 1 + variants.length) % variants.length]
  const next = variants[(idx + 1) % variants.length]

  return (
    <div className="container page">
      <nav className="crumbs" aria-label="Migas">
        <Link to="/" search={(p) => p}>
          Galería
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{def.name}</span>
      </nav>
      <header className="page-head">
        <div>
          <h1>{def.name}</h1>
          <p className="lead">{def.description}</p>
        </div>
        <div className="pager">
          <Link to="/variants/$variantId" params={{ variantId: prev.id }} search={(p) => p} className="btn btn-sm">
            ← {prev.name}
          </Link>
          <Link to="/variants/$variantId" params={{ variantId: next.id }} search={(p) => p} className="btn btn-sm">
            {next.name} →
          </Link>
        </div>
      </header>

      <DemoToolbar />

      <div className="playground">
        <div className="preview-col">
          <div className="preview">
            <C
              key={replay}
              {...values}
              {...locale}
              data={data}
              theme={theme}
              onDayClick={def.id === 'skyline' ? undefined : setClicked}
            />
          </div>
          <div className="preview-meta">
            <span>
              {clicked
                ? `onDayClick → ${clicked.date} · ${clicked.count} (nivel ${clicked.level}) · ${formatDate(clicked.date, locale.locale)}`
                : 'Pasa el cursor o usa Tab + flechas sobre el gráfico. Clic o Enter dispara onDayClick.'}
            </span>
            {values.animate === true && (
              <button className="btn btn-ghost btn-sm" onClick={() => setReplay((r) => r + 1)}>
                Repetir animación
              </button>
            )}
          </div>
          <CodeBlock code={usageSnippet(def, values, theme)} />
        </div>

        <aside className="controls" aria-label="Props">
          <div className="controls-head">
            <h2>Props</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setValues(def.defaults)} disabled={!changed}>
              Restablecer
            </button>
          </div>
          {def.controls.map((c) => (
            <ControlField key={c.key} control={c} value={values[c.key]} onChange={(v) => setValues((s) => ({ ...s, [c.key]: v }))} />
          ))}
        </aside>
      </div>
    </div>
  )
}

function ControlField({ control: c, value, onChange }: { control: Control; value: Values[string]; onChange: (v: Values[string]) => void }) {
  const id = `ctl-${c.key}`
  const name = (
    <span className="ctl-name">
      {c.label}
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
                {o.label}
              </option>
            ))}
          </select>
          {c.hint && <small>{c.hint}</small>}
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

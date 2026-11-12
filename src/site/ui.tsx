import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy, Desktop, Moon, Shuffle, Sun } from '@phosphor-icons/react'
import { sampleProfiles, themeNames, themes, themeVars, type SampleProfile } from '@cg/index'
import { useDemo, type Lang } from './search'

/* ---------------------------------------------------------- Modo del sitio */

type SiteMode = 'system' | 'light' | 'dark'
const MODE_KEY = 'cg-site-mode'

export function ModeToggle() {
  const [mode, setMode] = useState<SiteMode>(() => {
    try {
      const m = localStorage.getItem(MODE_KEY)
      return m === 'light' || m === 'dark' ? m : 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') delete root.dataset.theme
    else root.dataset.theme = mode
    try {
      if (mode === 'system') localStorage.removeItem(MODE_KEY)
      else localStorage.setItem(MODE_KEY, mode)
    } catch {
      /* almacenamiento no disponible */
    }
  }, [mode])
  const next: Record<SiteMode, SiteMode> = { system: 'light', light: 'dark', dark: 'system' }
  const label = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' }[mode]
  const Icon = { system: Desktop, light: Sun, dark: Moon }[mode]
  return (
    <button className="btn btn-ghost" onClick={() => setMode(next[mode])} aria-label={`Modo de color: ${label}. Cambiar`}>
      <Icon size={17} aria-hidden="true" />
      <span className="hide-sm">{label}</span>
    </button>
  )
}

/* ---------------------------------------------------------- Toolbar demo */

export function DemoToolbar() {
  const { theme, profile, lang, seed, set } = useDemo()
  return (
    <div className="toolbar" role="toolbar" aria-label="Opciones del demo">
      <div className="toolbar-group chips" role="radiogroup" aria-label="Tema">
        {themeNames.map((t) => (
          <button
            key={t}
            className="theme-chip tv"
            style={themeVars(themes[t])}
            role="radio"
            aria-checked={t === theme}
            onClick={() => set({ theme: t })}
          >
            <span className="chip-swatches" aria-hidden="true">
              <i style={{ background: 'var(--t1)' }} />
              <i style={{ background: 'var(--t2)' }} />
              <i style={{ background: 'var(--t3)' }} />
              <i style={{ background: 'var(--t4)' }} />
            </span>
            {themes[t].name}
          </button>
        ))}
      </div>
      <div className="toolbar-group">
        <label className="field-inline">
          <span>Datos</span>
          <select value={profile} onChange={(e) => set({ profile: e.target.value as SampleProfile })}>
            {Object.entries(sampleProfiles).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={() => set({ seed: (seed % 997) + 1 + Math.floor(Math.random() * 50) })}>
          <Shuffle size={15} aria-hidden="true" />
          Otros datos
        </button>
        <div className="segmented" role="radiogroup" aria-label="Idioma de los componentes">
          {(['es', 'en'] as Lang[]).map((l) => (
            <button key={l} role="radio" aria-checked={l === lang} onClick={() => set({ lang: l })}>
              {l === 'es' ? 'Español' : 'English'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- Código */

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* sin permiso de portapapeles */
    }
  }
  return (
    <div className="code">
      <div className="code-head">
        <span>{label ?? 'tsx'}</span>
        <button className="btn btn-ghost btn-sm" onClick={copy} aria-live="polite">
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="doc-section">
      <h2>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  )
}

/** El logo es un mini contribution graph: toma los colores del tema activo. */
export function Logo({ size = 22 }: { size?: number }) {
  const levels = [4, 2, 1, 3, 0, 2, 1, 3, 4]
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      {levels.map((l, i) => (
        <rect key={i} x={(i % 3) * 7.5} y={Math.floor(i / 3) * 7.5} width="6.5" height="6.5" rx="1.6" style={{ fill: `var(--t${l})` }} />
      ))}
    </svg>
  )
}

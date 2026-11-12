import { useEffect, useState, type ReactNode } from 'react'
import { sampleProfiles, themeNames, themes, type SampleProfile } from '@cg/index'
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
  return (
    <button className="btn btn-ghost" onClick={() => setMode(next[mode])} title="Cambiar modo de color" aria-label={`Modo de color: ${label}`}>
      <ModeIcon mode={mode} />
      <span className="hide-sm">{label}</span>
    </button>
  )
}

function ModeIcon({ mode }: { mode: SiteMode }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (mode === 'light')
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  if (mode === 'dark')
    return (
      <svg {...p}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    )
  return (
    <svg {...p}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

/* ---------------------------------------------------------- Toolbar demo */

export function DemoToolbar() {
  const { theme, profile, lang, seed, set } = useDemo()
  return (
    <div className="toolbar" role="toolbar" aria-label="Opciones del demo">
      <div className="toolbar-group" role="radiogroup" aria-label="Tema">
        {themeNames.map((t) => (
          <button
            key={t}
            className="theme-chip"
            role="radio"
            aria-checked={t === theme}
            onClick={() => set({ theme: t })}
            title={themes[t].name}
          >
            <span className="chip-swatches" aria-hidden="true">
              {themes[t].dark.levels.slice(1).map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
            <span>{themes[t].name}</span>
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
        <button className="btn" onClick={() => set({ seed: (seed % 997) + 1 + Math.floor(Math.random() * 50) })} title="Generar otros datos">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
          Mezclar
        </button>
        <div className="segmented" role="radiogroup" aria-label="Idioma de los componentes">
          {(['es', 'en'] as Lang[]).map((l) => (
            <button key={l} role="radio" aria-checked={l === lang} onClick={() => set({ lang: l })}>
              {l.toUpperCase()}
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
        <button className="btn btn-ghost btn-sm" onClick={copy}>
          {copied ? '¡Copiado!' : 'Copiar'}
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

export function Logo() {
  const levels = [1, 3, 2, 4, 2, 3, 1, 4, 3]
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {levels.map((l, i) => (
        <rect key={i} x={(i % 3) * 7.5} y={Math.floor(i / 3) * 7.5} width="6" height="6" rx="1.5" fill="var(--accent)" opacity={0.25 + l * 0.19} />
      ))}
    </svg>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy, Desktop, Moon, Shuffle, Sun } from '@phosphor-icons/react'
import { themeNames, themes, themeVars } from 'contrib-graphs'
import { Link } from '@tanstack/react-router'
import { langs, useLang, type Lang } from './i18n'
import { useT } from './messages'
import { githubData, profileKeys, useDemo, type Profile } from './search'

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
  const t = useT()
  const next: Record<SiteMode, SiteMode> = { system: 'light', light: 'dark', dark: 'system' }
  const label = t.mode[mode]
  const Icon = { system: Desktop, light: Sun, dark: Moon }[mode]
  return (
    <button className="btn btn-ghost" onClick={() => setMode(next[mode])} aria-label={t.mode.label(label)}>
      <Icon size={17} aria-hidden="true" />
      <span className="hide-sm">{label}</span>
    </button>
  )
}

/* ---------------------------------------------------------- Toolbar demo */

export function DemoToolbar() {
  const { theme, profile, seed, set } = useDemo()
  const t = useT()
  return (
    <div className="toolbar" role="toolbar" aria-label={t.toolbar.label}>
      <div className="toolbar-group chips" role="radiogroup" aria-label={t.toolbar.theme}>
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
          <span>{t.toolbar.data}</span>
          <select value={profile} onChange={(e) => set({ profile: e.target.value as Profile })}>
            {profileKeys.map((k) => (
              <option key={k} value={k}>
                {k === 'github' ? t.toolbar.profiles.github(githubData.username) : t.toolbar.profiles[k]}
              </option>
            ))}
          </select>
        </label>
        {profile !== 'github' && (
          <button className="btn" onClick={() => set({ seed: (seed % 997) + 1 + Math.floor(Math.random() * 50) })}>
            <Shuffle size={15} aria-hidden="true" />
            {t.toolbar.shuffle}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- Código */

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const t = useT()
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
          {copied ? t.code.copied : t.code.copy}
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

/* ---------------------------------------------------------- Idioma */

const langNames: Record<Lang, string> = { en: 'English', es: 'Español' }

/** Cambia solo el parámetro de idioma: misma página, mismos filtros. */
export function LanguageSwitch() {
  const lang = useLang()
  return (
    <nav className="segmented lang-switch" aria-label="Language / Idioma">
      {langs.map((l) => (
        <Link
          key={l}
          to="."
          params={(prev: Record<string, unknown>) => ({ ...prev, locale: l === 'es' ? 'es' : undefined })}
          search={(p) => p}
          hrefLang={l}
          lang={l}
          // En móvil solo se ve la abreviatura (EN/ES): el nombre completo va en aria-label.
          aria-label={langNames[l]}
          aria-current={l === lang ? 'true' : undefined}
          onClick={() => {
            try {
              localStorage.setItem('cg-site-lang', l)
            } catch {
              /* almacenamiento no disponible */
            }
          }}
        >
          <span className="hide-sm">{langNames[l]}</span>
          <span className="show-sm" aria-hidden="true">
            {l.toUpperCase()}
          </span>
        </Link>
      ))}
    </nav>
  )
}

/**
 * Monta su contenido cuando está por entrar en pantalla. Mientras, reserva `minHeight`
 * para no mover el diseño (CLS). Evita renderizar y animar gráficos que nadie ve aún.
 */
export function WhenVisible({ children, minHeight }: { children: ReactNode; minHeight: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="when-visible" style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  )
}

/** URL pública de un item del registry de copiables (publicado con el sitio en /r/). */
export function registryUrl(item: string): string {
  const origin = typeof location === 'undefined' ? 'https://ingfranciscastillo.github.io' : location.origin
  return `${origin}${import.meta.env.BASE_URL}r/${item}.json`
}

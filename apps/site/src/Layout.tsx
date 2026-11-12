import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BookOpen, BracketsCurly, Check, Copy, GithubLogo, SquaresFour } from '@phosphor-icons/react'
import { buildCalendar, themes, themeVars } from 'contrib-graphs'
import { useLang, useLocaleParams } from './i18n'
import { useT } from './messages'
import { routeMeta } from './seo.ts'
import { useDemo } from './search'
import { LanguageSwitch, Logo, ModeToggle } from './ui'
import { PmIcon, pmCommand, usePackageManager } from './pm'
import { variants } from './variants'

export function Layout() {
  const { theme } = useDemo()
  const lp = useLocaleParams()
  const t = useT()
  return (
    // `tv` resuelve los colores del tema (claro/oscuro) como --t0…--t4 para todo el sitio.
    <div className="app tv" style={themeVars(themes[theme])}>
      <DocumentLanguage />
      <a className="skip" href="#main">
        {t.skip}
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/{-$locale}" params={lp} search={(p) => p} className="brand">
            <Logo />
            <span>
              contrib<span className="brand-dim">/graphs</span>
            </span>
          </Link>
          <nav className="nav" aria-label={t.nav.label}>
            <Link to="/{-$locale}" params={lp} search={(p) => p} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
              <SquaresFour size={16} aria-hidden="true" />
              {t.nav.gallery}
            </Link>
            <Link to="/{-$locale}/docs" params={lp} search={(p) => p} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
              <BookOpen size={16} aria-hidden="true" />
              {t.nav.docs}
            </Link>
            <Link to="/{-$locale}/docs/api" params={lp} search={(p) => p} activeOptions={{ includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
              <BracketsCurly size={16} aria-hidden="true" />
              {t.nav.api}
            </Link>
          </nav>
          <LanguageSwitch />
          <ModeToggle />
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/** <html lang>, <title>, meta description y enlaces hreflang de la página actual (ver seo.ts). */
function DocumentLanguage() {
  const lang = useLang()
  const { pathname } = useLocation()
  useEffect(() => {
    const base = pathname.replace(/^\/es(?=\/|$)/, '') || '/'
    const meta = routeMeta(base, lang)
    document.documentElement.lang = lang
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    // Con barra final: es la URL que GitHub Pages sirve con estado 200 (ver scripts/prerender.mjs).
    const slash = base === '/' ? '/' : `${base}/`
    const urls = { en: slash, es: `/es${slash}`, 'x-default': slash }
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = new URL(import.meta.env.BASE_URL.replace(/\/$/, '') + urls[lang], location.origin).href
    for (const [hreflang, path] of Object.entries(urls)) {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = hreflang
        document.head.appendChild(link)
      }
      link.href = new URL(import.meta.env.BASE_URL.replace(/\/$/, '') + path, location.origin).href
    }
  }, [lang, pathname])
  return null
}

/** Repositorio del proyecto. */
const REPO = 'https://github.com/ingfranciscastillo/contrib-graphs'

function Footer() {
  const { data, endDate } = useDemo()
  const lp = useLocaleParams()
  const t = useT()
  const calendar = useMemo(() => buildCalendar(data, { weeks: 53, endDate }), [data, endDate])
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      {/* Decorativo: el año de los datos del demo, con los colores del tema. */}
      <div className="footer-graph" aria-hidden="true">
        {calendar.weeks.map((w, wi) => (
          <div key={wi} className="fg-week">
            {w.map((d, di) => (
              <i key={di} style={d ? { background: `var(--t${d.level})` } : { visibility: 'hidden' }} />
            ))}
          </div>
        ))}
      </div>

      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/{-$locale}" params={lp} search={(p) => p} className="brand">
            <Logo size={26} />
            <span>
              contrib<span className="brand-dim">/graphs</span>
            </span>
          </Link>
          <p>{t.footer.tagline}</p>
          <div className="footer-cta">
            <a className="btn" href={REPO} target="_blank" rel="noreferrer">
              <GithubLogo size={18} weight="fill" aria-hidden="true" />
              {t.footer.viewOnGithub}
            </a>
            <InstallCommand label={t.footer.install} />
          </div>
        </div>

        <nav className="footer-nav" aria-label={t.footer.variants}>
          <p>{t.footer.variants}</p>
          <ul>
            {variants.map((v) => (
              <li key={v.id}>
                <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: v.id }} search={(p) => p}>
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-nav" aria-label={t.footer.resources}>
          <p>{t.footer.resources}</p>
          <ul>
            <li>
              <Link to="/{-$locale}/docs" params={lp} search={(p) => p}>
                {t.footer.docs}
              </Link>
            </li>
            <li>
              <Link to="/{-$locale}/docs/api" params={lp} search={(p) => p}>
                {t.footer.api}
              </Link>
            </li>
            <li>
              <Link to="/{-$locale}/docs" params={lp} hash="github" search={(p) => p}>
                {t.footer.dataSources}
              </Link>
            </li>
            <li>
              <Link to="/{-$locale}/docs" params={lp} hash="themes" search={(p) => p}>
                {t.footer.themes}
              </Link>
            </li>
            <li>
              <Link to="/{-$locale}/docs" params={lp} hash="frameworks" search={(p) => p}>
                {t.footer.frameworks}
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="footer-nav" aria-label={t.footer.project}>
          <p>{t.footer.project}</p>
          <ul>
            <li>
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href={`${REPO}/issues`} target="_blank" rel="noreferrer">
                {t.footer.issues}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
                {t.footer.license}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="container footer-base">
        <span>
          {t.footer.copyright(year)}. {t.footer.license}.
        </span>
        <span className="footer-base-end">
          <a className="footer-icon" href={REPO} target="_blank" rel="noreferrer" aria-label={t.footer.githubLabel} title={t.footer.githubLabel}>
            <GithubLogo size={20} weight="fill" aria-hidden="true" />
          </a>
        </span>
      </div>
    </footer>
  )
}

/** Comando de instalación con botón de copiar. */
function InstallCommand({ label }: { label: string }) {
  const [copied, setCopied] = useState(false)
  const [pm] = usePackageManager()
  const command = pmCommand(pm, 'install', 'contrib-graphs')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* sin permiso de portapapeles */
    }
  }
  return (
    <button className="install-cmd" onClick={copy} aria-label={`${label}: ${command}`}>
      <PmIcon pm={pm} size={15} />
      <code>{command}</code>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  )
}

export function NotFound() {
  const lp = useLocaleParams()
  const t = useT()
  return (
    <div className="container page">
      <h1>{t.notFound.title}</h1>
      <p className="lead">
        {t.notFound.text}{' '}
        <Link to="/{-$locale}" params={lp} search={(p) => p}>
          {t.notFound.back}
        </Link>
      </p>
    </div>
  )
}

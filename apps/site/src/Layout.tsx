import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { BookOpen, BracketsCurly, SquaresFour } from '@phosphor-icons/react'
import { buildCalendar, themes, themeVars } from 'contrib-graphs'
import { useLang, useLocaleParams } from './i18n'
import { useT } from './messages'
import { useDemo } from './search'
import { LanguageSwitch, Logo, ModeToggle } from './ui'
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

/** <html lang>, meta description y enlaces hreflang según el idioma de la página. */
function DocumentLanguage() {
  const lang = useLang()
  const t = useT()
  const { pathname } = useLocation()
  useEffect(() => {
    document.documentElement.lang = lang
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
    const base = pathname.replace(/^\/es(?=\/|$)/, '') || '/'
    const urls = { en: base, es: base === '/' ? '/es' : `/es${base}`, 'x-default': base }
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
  }, [lang, pathname, t])
  return null
}

function Footer() {
  const { data, endDate } = useDemo()
  const lp = useLocaleParams()
  const t = useT()
  const calendar = useMemo(() => buildCalendar(data, { weeks: 53, endDate }), [data, endDate])
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
                {t.footer.github}
              </Link>
            </li>
            <li>
              <Link to="/{-$locale}/docs" params={lp} hash="gitlab" search={(p) => p}>
                {t.footer.gitlab}
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
      </div>
      <div className="container footer-base">{t.footer.builtWith}</div>
    </footer>
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

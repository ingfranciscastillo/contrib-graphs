import { Link, Outlet } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BookOpen, SquaresFour } from '@phosphor-icons/react'
import { buildCalendar, themes, themeVars } from '@cg/index'
import { useDemo } from './search'
import { Logo, ModeToggle } from './ui'
import { variants } from './variants'

export function Layout() {
  const { theme } = useDemo()
  return (
    // `tv` resuelve los colores del tema (claro/oscuro) como --t0…--t4 para todo el sitio.
    <div className="app tv" style={themeVars(themes[theme])}>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" search={(p) => p} className="brand">
            <Logo />
            <span>
              contrib<span className="brand-dim">/graphs</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Principal">
            <Link to="/" search={(p) => p} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
              <SquaresFour size={16} aria-hidden="true" />
              Galería
            </Link>
            <Link to="/docs" search={(p) => p} activeProps={{ 'aria-current': 'page' }}>
              <BookOpen size={16} aria-hidden="true" />
              Docs
            </Link>
          </nav>
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

function Footer() {
  const { data, endDate } = useDemo()
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
          <Link to="/" search={(p) => p} className="brand">
            <Logo size={26} />
            <span>
              contrib<span className="brand-dim">/graphs</span>
            </span>
          </Link>
          <p>Contribution graphs para tu sitio o portfolio. Copia el componente, pásale tus datos y elige un tema.</p>
        </div>
        <nav className="footer-nav" aria-label="Variantes">
          <p>Variantes</p>
          <ul>
            {variants.map((v) => (
              <li key={v.id}>
                <Link to="/variants/$variantId" params={{ variantId: v.id }} search={(p) => p}>
                  {v.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="footer-nav" aria-label="Recursos">
          <p>Recursos</p>
          <ul>
            <li>
              <Link to="/docs" search={(p) => p}>
                Documentación
              </Link>
            </li>
            <li>
              <Link to="/docs" hash="github" search={(p) => p}>
                Datos de GitHub
              </Link>
            </li>
            <li>
              <Link to="/docs" hash="gitlab" search={(p) => p}>
                Datos de GitLab
              </Link>
            </li>
            <li>
              <Link to="/docs" hash="temas" search={(p) => p}>
                Temas propios
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="container footer-base">Hecho con React, TypeScript, Vite y TanStack Router. Los datos del demo se generan en tu navegador.</div>
    </footer>
  )
}

export function NotFound() {
  return (
    <div className="container page">
      <h1>No encontrado</h1>
      <p className="lead">
        Esa página no existe.{' '}
        <Link to="/" search={(p) => p}>
          Volver a la galería
        </Link>
      </p>
    </div>
  )
}

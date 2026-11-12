import { Link, Outlet } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { themes } from '@cg/index'
import { useDemo } from './search'
import { Logo, ModeToggle } from './ui'

export function Layout() {
  const { theme } = useDemo()
  const t = themes[theme]
  // El acento del sitio sigue al tema elegido para los gráficos.
  const accent = {
    '--accent-light': t.light.levels[3],
    '--accent-dark': t.dark.levels[4],
  } as CSSProperties

  return (
    <div className="app" style={accent}>
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
              Galería
            </Link>
            <Link to="/docs" search={(p) => p} activeProps={{ 'aria-current': 'page' }}>
              Docs
            </Link>
          </nav>
          <ModeToggle />
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">
          React + TypeScript · Vite · TanStack Router · Datos de ejemplo generados localmente
        </div>
      </footer>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="container page">
      <h1>No encontrado</h1>
      <p className="lead">
        Esa variante no existe.{' '}
        <Link to="/" search={(p) => p}>
          Volver a la galería
        </Link>
      </p>
    </div>
  )
}

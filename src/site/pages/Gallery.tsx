import { Link } from '@tanstack/react-router'
import { CompactGraph, IsometricGraph } from '@cg/index'
import { useDemo } from '../search'
import { DemoToolbar } from '../ui'
import { variants } from '../variants'

export function Gallery() {
  const { data, theme, locale } = useDemo()
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">{variants.length} variantes · React + TypeScript</p>
            <h1>Contribution graphs para tu portfolio</h1>
            <p className="lead">
              Componentes que copias a tu proyecto y personalizas. Un mismo formato de datos para GitHub, GitLab o lo que quieras medir,
              con temas, modo oscuro, teclado y lector de pantalla incluidos.
            </p>
            <div className="hero-actions">
              <Link to="/docs" search={(p) => p} className="btn btn-primary">
                Empezar
              </Link>
              <a href="#galeria" className="btn">
                Ver variantes
              </a>
            </div>
            <div className="hero-compact">
              <CompactGraph data={data} theme={theme} {...locale} days={28} animate />
            </div>
          </div>
          <div className="hero-art">
            <IsometricGraph data={data} theme={theme} {...locale} weeks={30} tileSize={14} maxHeight={60} showStats={false} showLegend={false} animate />
          </div>
        </div>
      </section>

      <div className="toolbar-wrap" id="galeria">
        <div className="container">
          <DemoToolbar />
        </div>
      </div>

      <div className="container gallery">
        {variants.map((v) => {
          const C = v.component
          return (
            <article key={v.id} className={`card${v.wide ? ' card-wide' : ''}`}>
              <header className="card-head">
                <div>
                  <h2>{v.name}</h2>
                  <p>{v.tagline}</p>
                </div>
                <Link to="/variants/$variantId" params={{ variantId: v.id }} search={(p) => p} className="btn btn-sm">
                  Personalizar <span aria-hidden="true">→</span>
                </Link>
              </header>
              <div className="card-demo">
                <C data={data} theme={theme} {...locale} animate weeks={v.id === 'radial' ? 53 : undefined} size={v.id === 'radial' ? 300 : undefined} />
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}

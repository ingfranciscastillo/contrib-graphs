import { Link } from '@tanstack/react-router'
import { ArrowDown, BookOpen, SlidersHorizontal } from '@phosphor-icons/react'
import { IsometricGraph } from 'contrib-graphs'
import { useLang, useLocaleParams } from '../i18n'
import { useT } from '../messages'
import { githubData, useDemo } from '../search'
import { PmCommand } from '../pm'
import { DemoToolbar, WhenVisible } from '../ui'
import { tr, variants } from '../variants'

export function Gallery() {
  const { data, theme, locale, profile } = useDemo()
  const lp = useLocaleParams()
  const t = useT()
  const lang = useLang()
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>{t.hero.title}</h1>
            <p className="lead">{t.hero.lead}</p>
            <div className="hero-actions">
              <Link to="/{-$locale}/docs" params={lp} search={(p) => p} className="btn btn-primary">
                {t.hero.start}
              </Link>
              <a href="#variants" className="btn">
                <ArrowDown size={15} aria-hidden="true" />
                {t.hero.seeVariants}
              </a>
            </div>
            <div className="hero-install">
              <PmCommand kind="install" arg="contrib-graphs" />
            </div>
          </div>
          <div className="hero-art">
            <IsometricGraph data={data} theme={theme} {...locale} weeks={30} tileSize={14} maxHeight={60} showStats={false} showLegend={false} animate />
            <p className="data-source">
              {profile === 'github' ? (
                <>
                  {t.hero.realData}{' '}
                  <a href={`https://github.com/${githubData.username}`} target="_blank" rel="noreferrer">
                    @{githubData.username}
                  </a>
                  {t.hero.updated(new Date(githubData.generatedAt).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }))}
                </>
              ) : (
                t.hero.sampleData
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="toolbar-wrap" id="variants">
        <div className="container">
          <DemoToolbar />
        </div>
      </div>

      <div className="container gallery">
        {galleryOrder.map((v) => {
          const C = v.component
          return (
            <article key={v.id} className={`card${v.wide ? ' card-wide' : ''}${v.id === 'radial' ? ' card-tall' : ''}`}>
              <header className="card-head">
                <div>
                  <h2>{v.name}</h2>
                  <p>{tr(v.tagline, lang)}</p>
                </div>
                <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: v.id }} search={(p) => p} className="btn btn-sm">
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  {t.gallery.customize}
                </Link>
              </header>
              <div className="card-demo">
                <WhenVisible minHeight={previewHeight[v.id] ?? 200}>
                  <C data={data} theme={theme} {...locale} animate weeks={v.id === 'radial' ? 53 : undefined} size={v.id === 'radial' ? 300 : undefined} />
                </WhenVisible>
              </div>
            </article>
          )
        })}
        <article className="card card-cta">
          <header className="card-head">
            <div>
              <h2>{t.gallery.useIt}</h2>
              <p>{t.gallery.useItText}</p>
            </div>
          </header>
          <div className="card-cta-body">
            <PmCommand kind="install" arg="contrib-graphs" />
            <Link to="/{-$locale}/docs" params={lp} hash="installation" search={(p) => p} className="btn">
              <BookOpen size={15} aria-hidden="true" />
              {t.gallery.readDocs}
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}

/**
 * Orden de la galería en escritorio (dos columnas): Radial ocupa dos filas y a su
 * derecha van Compact y la tarjeta de instalación, así ninguna tarjeta queda sola.
 */
const ORDER = ['classic', 'dots', 'isometric', 'terminal', 'skyline', 'radial', 'compact']
const galleryOrder = [...variants].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))

/** Altura aproximada de cada gráfico en su tarjeta: reserva el espacio antes de montarlo. */
const previewHeight: Record<string, number> = {
  classic: 172,
  dots: 172,
  isometric: 290,
  terminal: 230,
  radial: 330,
  skyline: 190,
  compact: 50,
}

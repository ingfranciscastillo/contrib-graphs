import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, BookOpen, SlidersHorizontal } from '@phosphor-icons/react'
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
              <a href="#variants" className="btn btn-primary">
                <ArrowDown size={15} aria-hidden="true" />
                {t.hero.seeVariants}
              </a>
              <Link to="/{-$locale}/docs" params={lp} search={(p) => p} className="btn btn-ghost">
                <BookOpen size={15} aria-hidden="true" />
                {t.hero.start}
              </Link>
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
        {variants.map((v) => {
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
                  <C
                    data={data}
                    theme={theme}
                    {...locale}
                    animate
                    weeks={v.id === 'radial' ? 53 : undefined}
                    size={v.id === 'radial' ? 300 : undefined}
                    {...halfSize[v.id]}
                  />
                </WhenVisible>
              </div>
            </article>
          )
        })}
        <article className="card card-cta">
          <header className="card-head">
            <div>
              <h2>{t.gallery.ownData}</h2>
              <p>{t.gallery.ownDataText}</p>
            </div>
          </header>
          <nav className="card-cta-body" aria-label={t.gallery.sources.label}>
            {(
              [
                ['github', t.gallery.sources.github],
                ['gitlab', t.gallery.sources.gitlab],
                ['other-sources', t.gallery.sources.other],
              ] as const
            ).map(([hash, label]) => (
              <Link key={hash} to="/{-$locale}/docs" params={lp} hash={hash} search={(p) => p} className="btn btn-sm">
                {label}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </article>
      </div>
    </>
  )
}

/**
 * Tamaños más finos para las variantes de media columna: así cabe el año entero en
 * escritorio, en vez de recortar meses bajo un título que dice "el último año".
 */
const halfSize: Record<string, Record<string, number>> = {
  dots: { cellSize: 7, gap: 2 },
  pulse: { weekWidth: 9 },
}

/** Altura aproximada de cada gráfico en su tarjeta: reserva el espacio antes de montarlo. */
const previewHeight: Record<string, number> = {
  classic: 172,
  dots: 172,
  isometric: 290,
  terminal: 230,
  radial: 330,
  skyline: 190,
  compact: 50,
  months: 320,
  waveform: 130,
  stitch: 160,
  pulse: 160,
}

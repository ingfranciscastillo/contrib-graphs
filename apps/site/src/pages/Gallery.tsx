import { Link } from '@tanstack/react-router'
import { ArrowDown, SlidersHorizontal } from '@phosphor-icons/react'
import { CompactGraph, IsometricGraph } from 'contrib-graphs'
import { useLang, useLocaleParams } from '../i18n'
import { useT } from '../messages'
import { githubData, useDemo } from '../search'
import { DemoToolbar } from '../ui'
import { variants } from '../variants'

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
            <div className="hero-compact">
              <CompactGraph data={data} theme={theme} {...locale} days={28} animate />
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
          <div className="hero-art">
            <IsometricGraph data={data} theme={theme} {...locale} weeks={30} tileSize={14} maxHeight={60} showStats={false} showLegend={false} animate />
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
            <article key={v.id} className={`card${v.wide ? ' card-wide' : ''}`}>
              <header className="card-head">
                <div>
                  <h2>{v.name}</h2>
                  <p>{v.tagline}</p>
                </div>
                <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: v.id }} search={(p) => p} className="btn btn-sm">
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  {t.gallery.customize}
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

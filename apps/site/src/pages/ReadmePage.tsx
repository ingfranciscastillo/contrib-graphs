import { useEffect, useMemo, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { renderIsometricSvg, themeNames, themes, type ThemeName } from 'contrib-graphs/data'
import { useLang, type Lang } from '../i18n'
import { useT } from '../messages'
import { cliArgs, readmeSnippet, workflowYaml, type ReadmeOptions } from '../readme'
import { githubData, i18n, useDemo } from '../search'
import { CodeBlock } from '../ui'

const WORKFLOW_PATH = '.github/workflows/contribution-graph.yml'
/** Fondos reales de GitHub, para ver el SVG transparente como se verá en el perfil. */
const GITHUB_BG = { light: '#ffffff', dark: '#0d1117' } as const

export function ReadmePage() {
  const t = useT()
  const siteLang = useLang()
  const demo = useDemo()
  const [o, setO] = useState<ReadmeOptions>(() => ({
    user: githubData.username,
    theme: demo.theme,
    lang: siteLang,
    background: false,
    stats: true,
    dir: 'img',
  }))
  const set = <K extends keyof ReadmeOptions>(key: K, value: ReadmeOptions[K]) => setO((s) => ({ ...s, [key]: value }))

  // Los mismos SVG que generará el CLI, con los datos del sitio.
  const svgs = useMemo(() => {
    const labels = i18n[o.lang]
    const common = {
      endDate: demo.endDate,
      theme: o.theme,
      background: o.background,
      showStats: o.stats,
      locale: labels.locale,
      unit: labels.unit,
      periodLabel: labels.periodLabel,
      statLabels: labels.statLabels,
    }
    return {
      light: renderIsometricSvg(demo.data, { ...common, mode: 'light' }),
      dark: renderIsometricSvg(demo.data, { ...common, mode: 'dark' }),
    }
  }, [demo.data, demo.endDate, o.theme, o.background, o.stats, o.lang])

  const urls = useBlobUrls(svgs)
  const user = o.user.trim() || 'your-username'
  const opts = { ...o, user, dir: o.dir.trim().replace(/^\.?\/+|\/+$/g, '') || 'img' }

  return (
    <div className="container page readme-page">
      <header className="page-head">
        <div>
          <h1>{t.readme.title}</h1>
          <p className="lead">{t.readme.lead}</p>
        </div>
      </header>

      <div className="readme-layout">
        <section className="controls" aria-labelledby="readme-options">
          <div className="controls-head">
            <h2 id="readme-options">{t.readme.options}</h2>
          </div>
          <label className="ctl" htmlFor="rd-user">
            <span className="ctl-name">{t.readme.user}</span>
            <input id="rd-user" type="text" value={o.user} onChange={(e) => set('user', e.target.value)} spellCheck={false} autoComplete="off" />
          </label>
          <label className="ctl" htmlFor="rd-theme">
            <span className="ctl-name">{t.readme.theme}</span>
            <select id="rd-theme" value={o.theme} onChange={(e) => set('theme', e.target.value as ThemeName)}>
              {themeNames.map((name) => (
                <option key={name} value={name}>
                  {themes[name].name}
                </option>
              ))}
            </select>
          </label>
          <label className="ctl" htmlFor="rd-lang">
            <span className="ctl-name">{t.readme.lang}</span>
            <select id="rd-lang" value={o.lang} onChange={(e) => set('lang', e.target.value as Lang)}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </label>
          <label className="ctl ctl-toggle" htmlFor="rd-stats">
            <span className="ctl-name">{t.readme.stats}</span>
            <input id="rd-stats" type="checkbox" role="switch" checked={o.stats} onChange={(e) => set('stats', e.target.checked)} />
          </label>
          <label className="ctl ctl-toggle" htmlFor="rd-bg">
            <span className="ctl-name">{t.readme.background}</span>
            <input id="rd-bg" type="checkbox" role="switch" checked={o.background} onChange={(e) => set('background', e.target.checked)} />
          </label>
          <label className="ctl" htmlFor="rd-dir">
            <span className="ctl-name">{t.readme.dir}</span>
            <input id="rd-dir" type="text" value={o.dir} onChange={(e) => set('dir', e.target.value)} spellCheck={false} autoComplete="off" />
          </label>
        </section>

        <section className="readme-previews" aria-label={t.readme.options}>
          {(['light', 'dark'] as const).map((mode) => (
            <figure key={mode} className="readme-preview" style={{ background: GITHUB_BG[mode] }} data-mode={mode}>
              {urls[mode] && <img src={urls[mode]} alt={`${t.readme[mode]}: ${demo.data.length}`} />}
              <figcaption>
                <span>{t.readme[mode]}</span>
                {urls[mode] && (
                  <a className="btn btn-sm" href={urls[mode]} download={`contributions-${mode}.svg`}>
                    <DownloadSimple size={14} aria-hidden="true" />
                    {t.readme.download(`contributions-${mode}.svg`)}
                  </a>
                )}
              </figcaption>
            </figure>
          ))}
          <p className="preview-meta">{t.readme.previewNote}</p>
        </section>
      </div>

      <ol className="readme-steps">
        <li>
          <h2>{t.readme.step1}</h2>
          <p>{t.readme.step1Text(WORKFLOW_PATH)}</p>
          <CodeBlock label={WORKFLOW_PATH} code={workflowYaml(opts, siteLang)} />
          <p className="readme-note">{t.readme.privateNote}</p>
        </li>
        <li>
          <h2>{t.readme.step2}</h2>
          <p>{t.readme.step2Text}</p>
        </li>
        <li>
          <h2>{t.readme.step3}</h2>
          <p>{t.readme.step3Text}</p>
          <CodeBlock label="README.md" code={readmeSnippet(opts, o.lang)} />
          <p>{t.readme.cli}</p>
          <CodeBlock label="bash" code={`npx contrib-graphs svg ${cliArgs(opts)}`} />
        </li>
      </ol>
    </div>
  )
}

/** URLs blob para mostrar y descargar los SVG; se liberan al cambiar. */
function useBlobUrls(svgs: { light: string; dark: string }) {
  const [urls, setUrls] = useState<{ light?: string; dark?: string }>({})
  useEffect(() => {
    const next = {
      light: URL.createObjectURL(new Blob([svgs.light], { type: 'image/svg+xml' })),
      dark: URL.createObjectURL(new Blob([svgs.dark], { type: 'image/svg+xml' })),
    }
    setUrls(next)
    return () => {
      URL.revokeObjectURL(next.light)
      URL.revokeObjectURL(next.dark)
    }
  }, [svgs])
  return urls
}

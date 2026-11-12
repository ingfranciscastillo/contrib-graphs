import { Link } from '@tanstack/react-router'
import { apiComponents, apiConstants, apiFunctions, Inline, PropsTable, sharedProps } from '../api'
import { apiText } from '../api-es'
import { useLang, useLocaleParams } from '../i18n'
import { CodeBlock } from '../ui'
import { variants } from '../variants'

/** Variante del sitio que corresponde a cada componente (para enlazar al playground). */
const variantOf = (component: string) => variants.find((v) => v.importName === component)

export function ApiPage() {
  const lang = useLang()
  const lp = useLocaleParams()
  const L = <T,>(en: T, es: T): T => (lang === 'es' ? es : en)
  const anchor = (name: string) => name.toLowerCase()

  return (
    <div className="container page docs">
      <aside className="toc" aria-label={L('On this page', 'En esta página')}>
        <p>{L('On this page', 'En esta página')}</p>
        <ul>
          <li>
            <a href="#shared-props">{L('Shared props', 'Props comunes')}</a>
          </li>
          {apiComponents.map((c) => (
            <li key={c.name}>
              <a href={`#${anchor(c.name)}`}>{c.name}</a>
            </li>
          ))}
          <li>
            <a href="#data">contrib-graphs/data</a>
          </li>
        </ul>
      </aside>
      <article className="prose api">
        <h1>{L('API reference', 'Referencia de la API')}</h1>
        <p className="lead">
          {L(
            'Generated from the package types, so it always matches the published code. Every graph takes the shared props plus its own.',
            'Generada desde los tipos del paquete, así que siempre coincide con el código publicado. Cada gráfico acepta las props comunes y las suyas.',
          )}
        </p>

        <section id="shared-props" className="doc-section">
          <h2>
            <a href="#shared-props">{L('Shared props', 'Props comunes')}</a>
          </h2>
          <p>
            {L('Accepted by every graph, except where a component says otherwise below.', 'Las aceptan todos los gráficos, salvo donde un componente indica otra cosa abajo.')}
          </p>
          <PropsTable props={sharedProps} lang={lang} />
        </section>

        {apiComponents.map((c) => {
          const own = c.props.filter((p) => !p.shared && p.name !== 'data')
          const omitted = sharedProps.filter((s) => !c.props.some((p) => p.name === s.name)).map((p) => p.name)
          const v = variantOf(c.name)
          return (
            <section key={c.name} id={anchor(c.name)} className="doc-section">
              <h2>
                <a href={`#${anchor(c.name)}`}>{c.name}</a>
              </h2>
              <p>
                <Inline text={apiText(c.description, lang)} />{' '}
                {v && (
                  <Link to="/{-$locale}/variants/$variantId" params={{ ...lp, variantId: v.id }} search={(p) => p}>
                    {L('Try it in the playground', 'Pruébalo en el playground')}
                  </Link>
                )}
              </p>
              <CodeBlock code={`import { ${c.name} } from 'contrib-graphs'\n\n<${c.name} data={contributions} />`} />
              {own.length > 0 && <PropsTable props={own} lang={lang} />}
              {omitted.length > 0 && (
                <p className="api-note">
                  {L('Does not accept: ', 'No acepta: ')}
                  {omitted.map((name, i) => (
                    <span key={name}>
                      {i > 0 && ', '}
                      <code>{name}</code>
                    </span>
                  ))}
                  .
                </p>
              )}
            </section>
          )
        })}

        <section id="data" className="doc-section">
          <h2>
            <a href="#data">contrib-graphs/data</a>
          </h2>
          <p>
            {L(
              'Functions and constants with no React dependency: use them on the server, in scripts or at build time.',
              'Funciones y constantes sin dependencia de React: úsalas en el servidor, en scripts o en build.',
            )}
          </p>
          <dl className="api-list">
            {apiFunctions.map((f) => (
              <div key={f.name} id={`fn-${f.name}`}>
                <dt>
                  <code>{f.signature}</code>
                </dt>
                <dd>
                  <Inline text={apiText(f.description, lang)} />
                </dd>
              </div>
            ))}
          </dl>
          <h3>{L('Constants', 'Constantes')}</h3>
          <dl className="api-list">
            {apiConstants.map((c) => (
              <div key={c.name}>
                <dt>
                  <code>{c.name}</code>
                </dt>
                <dd>
                  <Inline text={apiText(c.description, lang)} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </article>
    </div>
  )
}

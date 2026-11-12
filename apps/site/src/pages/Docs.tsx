import { Link } from '@tanstack/react-router'
import { ClassicGraph } from 'contrib-graphs'
import { fromDates } from 'contrib-graphs/data'
import { useMemo, type ReactNode } from 'react'
import { useLang, useLocaleParams } from '../i18n'
import { useDemo } from '../search'
import { CodeBlock, Section, registryUrl } from '../ui'

/** Anclas iguales en los dos idiomas: un enlace a #themes funciona en /docs y en /es/docs. */
const toc = [
  ['installation', 'Installation', 'Instalación'],
  ['frameworks', 'Next.js and Astro', 'Next.js y Astro'],
  ['data', 'Data format', 'Formato de datos'],
  ['github', 'GitHub', 'GitHub'],
  ['gitlab', 'GitLab', 'GitLab'],
  ['other-sources', 'Other sources', 'Otras fuentes'],
  ['themes', 'Themes', 'Temas'],
  ['i18n', 'Language', 'Idioma'],
  ['a11y', 'Accessibility', 'Accesibilidad'],
] as const

export function Docs() {
  const { theme, locale } = useDemo()
  const lang = useLang()
  const lp = useLocaleParams()
  /** Elige el contenido del idioma actual. */
  const L = <T extends ReactNode>(en: T, es: T): T => (lang === 'es' ? es : en)
  const title = (id: (typeof toc)[number][0]) => {
    const row = toc.find((r) => r[0] === id)!
    return lang === 'es' ? row[2] : row[1]
  }
  const user = L('your-username', 'tu-usuario')

  // Ejemplo vivo de fromDates: "posts" publicados en fechas sueltas.
  const posts = useMemo(() => {
    const now = new Date()
    return fromDates(
      Array.from({ length: 70 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor((i * 37) % 180) - (i % 3))),
    )
  }, [])

  return (
    <div className="container page docs">
      <aside className="toc" aria-label={L('On this page', 'En esta página')}>
        <p>{L('On this page', 'En esta página')}</p>
        <ul>
          {toc.map(([id, en, es]) => (
            <li key={id}>
              <a href={`#${id}`}>{L(en, es)}</a>
            </li>
          ))}
        </ul>
      </aside>
      <article className="prose">
        <h1>{L('Documentation', 'Documentación')}</h1>
        <p className="lead">
          {L(
            'Every variant is a standalone React component. They share the same data format, themes and interaction model, so switching designs is a one-line change.',
            'Cada variante es un componente React independiente. Comparten el mismo formato de datos, los temas y el sistema de interacción, así que cambiar de diseño es cambiar una línea.',
          )}{' '}
          <Link to="/{-$locale}/docs/api" params={lp} search={(p) => p}>
            {L('Every prop is in the API reference.', 'Todas las props están en la referencia de la API.')}
          </Link>
        </p>

        <Section id="installation" title={title('installation')}>
          <p>
            {L(
              'There are two ways to use the components. The only dependency is React 18 or later.',
              'Hay dos formas de usar los componentes. La única dependencia es React 18 o superior.',
            )}
          </p>
          <h3>{L('From npm', 'Desde npm')}</h3>
          <p>
            {L(
              'Install the package and import the styles once, for example in your layout or entry file. You get updates with npm.',
              'Instala el paquete e importa los estilos una sola vez, por ejemplo en tu layout o en el archivo de entrada. Las actualizaciones llegan con npm.',
            )}
          </p>
          <CodeBlock label="bash" code={`npm install contrib-graphs`} />
          <CodeBlock
            label="tsx"
            code={`import { ClassicGraph } from 'contrib-graphs'
import 'contrib-graphs/styles.css'

export function Activity({ contributions }) {
  return <ClassicGraph data={contributions} theme="github" animate />
}`}
          />
          <h3>{L('Copy into your project', 'Copiar a tu proyecto')}</h3>
          <p>
            {L(
              'Use the shadcn CLI to copy the source of the variants you want into components/contrib-graphs, and edit it like your own code. Each variant brings the shared core with it. It needs a components.json, which npx shadcn@latest init creates.',
              'Usa el CLI de shadcn para copiar el código de las variantes que quieras a components/contrib-graphs y editarlo como código tuyo. Cada variante trae consigo el núcleo compartido. Necesita un components.json, que crea npx shadcn@latest init.',
            )}
          </p>
          <CodeBlock label="bash" code={`npx shadcn@latest add ${registryUrl('classic-graph')}`} />
          <CodeBlock
            label="tsx"
            code={`import { ClassicGraph } from '@/components/contrib-graphs/variants/GridGraph'
import '@/components/contrib-graphs/styles.css'`}
          />
          <p>
            {L('The GitHub, GitLab and sample data helpers are a separate item:', 'Los adaptadores de GitHub y GitLab y los datos de ejemplo son un item aparte:')}
          </p>
          <CodeBlock label="bash" code={`npx shadcn@latest add ${registryUrl('contrib-graphs-data')}`} />
        </Section>

        <Section id="frameworks" title={title('frameworks')}>
          {L(
            <p>
              The package has two entry points. <code>contrib-graphs</code> holds the components and starts with <code>"use client"</code>.{' '}
              <code>contrib-graphs/data</code> holds everything else (calendar helpers, themes, adapters, sample data) and runs on the server.
            </p>,
            <p>
              El paquete tiene dos entradas. <code>contrib-graphs</code> son los componentes y lleva <code>"use client"</code>.{' '}
              <code>contrib-graphs/data</code> es todo lo demás (calendario, temas, adaptadores, datos de ejemplo) y funciona en el servidor.
            </p>,
          )}
          <h3>Next.js (App Router)</h3>
          {L(
            <p>
              Import the graphs straight into a Server Component, no wrapper needed. Fetch the data on the server through{' '}
              <code>contrib-graphs/data</code>: functions exported from a <code>"use client"</code> file can't run on the server.
            </p>,
            <p>
              Importa los gráficos directamente en un Server Component, sin envolverlos. Obtén los datos en el servidor con{' '}
              <code>contrib-graphs/data</code>: las funciones exportadas desde un archivo <code>"use client"</code> no se pueden ejecutar en el
              servidor.
            </p>,
          )}
          <CodeBlock
            label="app/page.tsx"
            code={`import { ClassicGraph } from 'contrib-graphs'
import { fetchGitHubContributions } from 'contrib-graphs/data'

export const revalidate = 3600 // ${L('refetch the data every hour', 'vuelve a pedir los datos cada hora')}

export default async function Page() {
  const data = await fetchGitHubContributions('${user}', process.env.GITHUB_TOKEN!)
  return <ClassicGraph data={data} endDate={data.at(-1)?.date} />
}`}
          />
          {L(
            <p>
              Import <code>contrib-graphs/styles.css</code> in <code>app/layout.tsx</code>. To use <code>onDayClick</code> or other callbacks,
              render the graph inside a <code>"use client"</code> component.
            </p>,
            <p>
              Importa <code>contrib-graphs/styles.css</code> en <code>app/layout.tsx</code>. Para usar <code>onDayClick</code> u otras funciones,
              renderiza el gráfico dentro de un componente con <code>"use client"</code>.
            </p>,
          )}
          <h3>Astro</h3>
          {L(
            <p>
              With the <code>@astrojs/react</code> integration, a graph without a directive ships as static HTML with no JavaScript. Add{' '}
              <code>client:visible</code> for tooltips and keyboard navigation. Functions can't be passed as props to an island: for{' '}
              <code>onDayClick</code>, wrap the graph in a React component and use that component as the island.
            </p>,
            <p>
              Con la integración <code>@astrojs/react</code>, un gráfico sin directiva se envía como HTML estático, sin JavaScript. Añade{' '}
              <code>client:visible</code> para tener tooltip y teclado. Las funciones no se pueden pasar como props a una isla: para{' '}
              <code>onDayClick</code>, envuelve el gráfico en un componente React y usa ese componente como isla.
            </p>,
          )}
          <CodeBlock
            label="src/pages/index.astro"
            code={`---
import 'contrib-graphs/styles.css'
import { ClassicGraph } from 'contrib-graphs'
import { fetchGitHubContributions } from 'contrib-graphs/data'

const data = await fetchGitHubContributions('${user}', import.meta.env.GITHUB_TOKEN)
const endDate = data.at(-1)?.date
---
<!-- ${L('Static HTML, 0 kB of JavaScript', 'HTML estático, 0 kB de JavaScript')} -->
<ClassicGraph data={data} endDate={endDate} />

<!-- ${L('Interactive once it scrolls into view', 'Interactivo cuando entra en pantalla')} -->
<ClassicGraph client:visible data={data} endDate={endDate} />`}
          />
          <h3>{L('Server rendering: always pass endDate', 'Render en servidor: pasa siempre endDate')}</h3>
          {L(
            <p>
              Without <code>endDate</code> the calendar ends today, and the server and the browser may be on different days (time zones,
              midnight), which causes hydration errors. With real data, use the last date in it. Language doesn't have this problem: without{' '}
              <code>locale</code>, both sides use <code>'en'</code>.
            </p>,
            <p>
              Sin <code>endDate</code> el calendario termina hoy, y el servidor y el navegador pueden estar en días distintos (zonas horarias,
              medianoche). Eso causa errores de hidratación. Con datos reales, usa la última fecha de los datos. El idioma no da este problema:
              sin <code>locale</code> se usa <code>'en'</code> en los dos lados.
            </p>,
          )}
        </Section>

        <Section id="data" title={title('data')}>
          {L(
            <p>
              Every variant takes an array of <code>{'{ date, count }'}</code>. Dates use the ISO format <code>YYYY-MM-DD</code> and are read as UTC
              to avoid time zone shifts. Missing days count as 0 and duplicates are added up.
            </p>,
            <p>
              Todas las variantes reciben un arreglo de <code>{'{ date, count }'}</code>. Las fechas van en formato ISO <code>YYYY-MM-DD</code> y se
              interpretan en UTC para evitar saltos de zona horaria. Los días faltantes cuentan como 0 y los duplicados se suman.
            </p>,
          )}
          <CodeBlock
            label="ts"
            code={`type ContributionDay = { date: string; count: number }

const data: ContributionDay[] = [
  { date: '2026-11-10', count: 4 },
  { date: '2026-11-11', count: 9 },
]`}
          />
        </Section>

        <Section id="github" title={title('github')}>
          {L(
            <p>
              GitHub's GraphQL API needs a token even for public profiles, so <strong>call it on the server</strong> (an API route, a serverless
              function or at build time) and never send the token to the browser. With Vite you can write a JSON file at build time:
            </p>,
            <p>
              La API GraphQL de GitHub requiere un token incluso para perfiles públicos, así que <strong>consúltala en el servidor</strong> (una API
              route, una función serverless o en tiempo de build) y nunca expongas el token al navegador. Con Vite puedes generar un JSON en build:
            </p>,
          )}
          <CodeBlock
            label="scripts/fetch-contributions.ts"
            code={`import { writeFile } from 'node:fs/promises'
import { fetchGitHubContributions } from 'contrib-graphs/data'

const data = await fetchGitHubContributions('${user}', process.env.GITHUB_TOKEN!)
await writeFile('public/contributions.json', JSON.stringify(data))`}
          />
          {L(
            <p>
              A <em>fine-grained</em> token with no extra permissions is enough for public contributions. To include private ones, use a classic
              token with the <code>read:user</code> scope. If you already have the GraphQL response, use <code>fromGitHub(response)</code>.
            </p>,
            <p>
              Un token <em>fine-grained</em> sin permisos adicionales basta para las contribuciones públicas. Para incluir las privadas, usa un token
              clásico con el permiso <code>read:user</code>. Si ya tienes la respuesta GraphQL, usa <code>fromGitHub(response)</code>.
            </p>,
          )}
        </Section>

        <Section id="gitlab" title={title('gitlab')}>
          {L(
            <p>
              GitLab serves <code>/users/:username/calendar.json</code> without authentication but also without CORS headers: as with GitHub, call
              it from the server or at build time. It works with self-hosted instances if you pass the base URL.
            </p>,
            <p>
              GitLab expone <code>/users/:usuario/calendar.json</code> sin autenticación, pero sin cabeceras CORS: igual que con GitHub, llámalo
              desde el servidor o en build. Funciona con instancias self-hosted pasando la URL base.
            </p>,
          )}
          <CodeBlock
            label="ts"
            code={`import { fetchGitLabContributions, fetchGitHubContributions, mergeSources } from 'contrib-graphs/data'

const gitlab = await fetchGitLabContributions('${user}')
const github = await fetchGitHubContributions('${user}', token)

// ${L('Work on both? Add them up day by day.', '¿Trabajas en ambos? Súmalos día a día.')}
const all = mergeSources(github, gitlab)`}
          />
        </Section>

        <Section id="other-sources" title={title('other-sources')}>
          {L(
            <p>
              <code>fromDates()</code> counts occurrences per day: blog posts, workouts, books read… This graph uses 70 loose dates:
            </p>,
            <p>
              <code>fromDates()</code> cuenta ocurrencias por día: posts del blog, entrenamientos, libros leídos… Este gráfico usa 70 fechas sueltas:
            </p>,
          )}
          <div className="docs-demo">
            <ClassicGraph data={posts} theme={theme} {...locale} weeks={26} unit={['post', 'posts']} periodLabel={L('in 6 months', 'en 6 meses')} />
          </div>
          <CodeBlock code={`const data = fromDates(posts.map((p) => p.publishedAt))\n\n<ClassicGraph data={data} weeks={26} unit={['post', 'posts']} />`} />
        </Section>

        <Section id="themes" title={title('themes')}>
          {L(
            <p>
              There are 6 presets: <code>github</code>, <code>gitlab</code>, <code>frost</code>, <code>ember</code>, <code>violet</code> and{' '}
              <code>mono</code>. Each theme defines a light and a dark palette. With <code>colorMode="auto"</code> the graph follows{' '}
              <code>prefers-color-scheme</code>, or a <code>data-theme="dark|light"</code> attribute on <code>&lt;html&gt;</code> if your site has
              its own switch.
            </p>,
            <p>
              Hay 6 presets: <code>github</code>, <code>gitlab</code>, <code>frost</code>, <code>ember</code>, <code>violet</code> y <code>mono</code>.
              Cada tema define una paleta clara y una oscura. Con <code>colorMode="auto"</code> se sigue <code>prefers-color-scheme</code>, o un{' '}
              <code>data-theme="dark|light"</code> en <code>&lt;html&gt;</code> si tu sitio tiene su propio switch.
            </p>,
          )}
          <CodeBlock
            label="ts"
            code={`import type { GraphTheme } from 'contrib-graphs'

const brand: GraphTheme = {
  name: 'Brand',
  light: { levels: ['#eef', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'], text: '#111', muted: '#666', surface: '#fff', border: '#ddd' },
  dark:  { levels: ['#1e1b2e', '#312e81', '#4f46e5', '#818cf8', '#c7d2fe'], text: '#eee', muted: '#999', surface: '#0b0b12', border: '#2a2a3a' },
}

<ClassicGraph data={data} theme={brand} />`}
          />
          {L(
            <p>
              Under the hood the theme becomes CSS variables (<code>--cg-l0</code> … <code>--cg-l4</code>, <code>--cg-text</code>,{' '}
              <code>--cg-muted</code>), so you can also override them from your own CSS.
            </p>,
            <p>
              Internamente el tema se expone como variables CSS (<code>--cg-l0</code> … <code>--cg-l4</code>, <code>--cg-text</code>,{' '}
              <code>--cg-muted</code>), así que también puedes sobrescribirlas desde tu CSS.
            </p>,
          )}
        </Section>

        <Section id="i18n" title={title('i18n')}>
          {L(
            <p>
              Dates and numbers use <code>Intl</code> with the <code>locale</code> prop, which defaults to <code>'en'</code>. Labels are props too.
              This site's language switch passes exactly these props to every graph:
            </p>,
            <p>
              Fechas y números usan <code>Intl</code> con la prop <code>locale</code>, que por defecto es <code>'en'</code>. Los textos también son
              props. El selector de idioma de este sitio pasa exactamente estas props a todos los gráficos:
            </p>,
          )}
          <CodeBlock
            label="tsx"
            code={`<ClassicGraph
  data={data}
  locale="es"
  unit={['contribución', 'contribuciones']}
  periodLabel={(weeks) => (weeks >= 52 ? 'en el último año' : \`en las últimas \${weeks} semanas\`)}
  legendLabels={['Menos', 'Más']}
/>`}
          />
        </Section>

        <Section id="a11y" title={title('a11y')}>
          {L(
            <ul>
              <li>The graph is a single tab stop: Tab to enter, arrow keys to move by day (or week), Home/End to jump to either end.</li>
              <li>
                Enter or Space call <code>onDayClick</code>; Escape closes the tooltip.
              </li>
              <li>
                The active day is announced in an <code>aria-live</code> region, and the container has a summary with the total and the date range.
              </li>
              <li>
                The entry animation turns off with <code>prefers-reduced-motion</code>.
              </li>
              <li>
                Dots and Isometric encode intensity with size or height as well as color, which helps with color blindness. The{' '}
                <code>mono</code> theme helps too.
              </li>
            </ul>,
            <ul>
              <li>El gráfico es un único punto de tabulación: Tab para entrar, flechas para moverse por días (o semanas), Inicio/Fin para los extremos.</li>
              <li>
                Enter o Espacio disparan <code>onDayClick</code>; Escape cierra el tooltip.
              </li>
              <li>
                El día activo se anuncia en una región <code>aria-live</code>, y el contenedor tiene un resumen con el total y el rango de fechas.
              </li>
              <li>
                La animación de entrada se desactiva con <code>prefers-reduced-motion</code>.
              </li>
              <li>
                Dots y Isometric codifican la intensidad con tamaño o altura además del color, útil para daltonismo. El tema <code>mono</code> también
                ayuda.
              </li>
            </ul>,
          )}
        </Section>
      </article>
    </div>
  )
}

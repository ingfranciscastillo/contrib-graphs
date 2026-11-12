import { ClassicGraph, fromDates } from '@cg/index'
import { useMemo } from 'react'
import { useDemo } from '../search'
import { CodeBlock, Section } from '../ui'

const toc = [
  ['instalacion', 'Instalación'],
  ['datos', 'Formato de datos'],
  ['github', 'GitHub'],
  ['gitlab', 'GitLab'],
  ['otras', 'Otras fuentes'],
  ['temas', 'Temas'],
  ['i18n', 'Idioma'],
  ['a11y', 'Accesibilidad'],
] as const

export function Docs() {
  const { theme, locale } = useDemo()
  // Ejemplo vivo de fromDates: "posts" publicados en fechas sueltas.
  const posts = useMemo(() => {
    const now = new Date()
    return fromDates(
      Array.from({ length: 70 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor((i * 37) % 180) - (i % 3))),
    )
  }, [])

  return (
    <div className="container page docs">
      <aside className="toc" aria-label="En esta página">
        <p>En esta página</p>
        <ul>
          {toc.map(([id, t]) => (
            <li key={id}>
              <a href={`#${id}`}>{t}</a>
            </li>
          ))}
        </ul>
      </aside>
      <article className="prose">
        <h1>Documentación</h1>
        <p className="lead">
          Cada variante es un componente React independiente. Comparten el mismo formato de datos, los temas y el sistema de interacción, así que
          cambiar de diseño es cambiar una línea.
        </p>

        <Section id="instalacion" title="Instalación">
          <p>
            Por ahora la librería vive en <code>src/components/contribution-graph</code>. Copia la carpeta a tu proyecto (estilo shadcn/ui): no tiene
            dependencias aparte de React 18+.
          </p>
          <CodeBlock
            label="tsx"
            code={`import { ClassicGraph } from '@/components/contribution-graph'
// el index importa contribution-graph.css automáticamente

export function Activity({ contributions }) {
  return <ClassicGraph data={contributions} theme="github" animate />
}`}
          />
        </Section>

        <Section id="datos" title="Formato de datos">
          <p>
            Todas las variantes reciben un arreglo de <code>{'{ date, count }'}</code>. Las fechas van en formato ISO <code>YYYY-MM-DD</code> y se
            interpretan en UTC para evitar saltos de zona horaria. Los días faltantes cuentan como 0 y los duplicados se suman.
          </p>
          <CodeBlock
            label="ts"
            code={`type ContributionDay = { date: string; count: number }

const data: ContributionDay[] = [
  { date: '2026-11-10', count: 4 },
  { date: '2026-11-11', count: 9 },
]`}
          />
        </Section>

        <Section id="github" title="GitHub">
          <p>
            La API GraphQL de GitHub requiere un token incluso para perfiles públicos, así que <strong>consúltala en el servidor</strong> (una API route,
            una función serverless o en tiempo de build) y nunca expongas el token al navegador. Con Vite puedes generar un JSON en build:
          </p>
          <CodeBlock
            label="scripts/fetch-contributions.ts"
            code={`import { writeFile } from 'node:fs/promises'
import { fetchGitHubContributions } from '../src/components/contribution-graph/adapters'

const data = await fetchGitHubContributions('tu-usuario', process.env.GITHUB_TOKEN!)
await writeFile('public/contributions.json', JSON.stringify(data))`}
          />
          <p>
            Un token <em>fine-grained</em> sin permisos adicionales basta para datos públicos. Si ya tienes la respuesta GraphQL, usa{' '}
            <code>fromGitHub(response)</code>.
          </p>
        </Section>

        <Section id="gitlab" title="GitLab">
          <p>
            GitLab expone <code>/users/:usuario/calendar.json</code> sin autenticación, pero sin cabeceras CORS: igual que con GitHub, llámalo desde el
            servidor o en build. Funciona con instancias self-hosted pasando la URL base.
          </p>
          <CodeBlock
            label="ts"
            code={`import { fetchGitLabContributions, fetchGitHubContributions, mergeSources } from '@/components/contribution-graph'

const gitlab = await fetchGitLabContributions('tu-usuario')
const github = await fetchGitHubContributions('tu-usuario', token)

// ¿Trabajas en ambos? Súmalos día a día.
const all = mergeSources(github, gitlab)`}
          />
        </Section>

        <Section id="otras" title="Otras fuentes">
          <p>
            <code>fromDates()</code> cuenta ocurrencias por día: posts del blog, entrenamientos, libros leídos… Este gráfico usa 70 fechas sueltas:
          </p>
          <div className="docs-demo">
            <ClassicGraph data={posts} theme={theme} {...locale} weeks={26} unit={['post', 'posts']} periodLabel={locale.locale === 'es' ? 'en 6 meses' : 'in 6 months'} />
          </div>
          <CodeBlock code={`const data = fromDates(posts.map((p) => p.publishedAt))\n\n<ClassicGraph data={data} weeks={26} unit={['post', 'posts']} />`} />
        </Section>

        <Section id="temas" title="Temas">
          <p>
            Hay 7 presets (<code>github</code>, <code>gitlab</code>, <code>frost</code>, <code>ember</code>, <code>violet</code>, <code>mono</code>,{' '}
            <code>neon</code>). Cada tema define una paleta clara y una oscura. Con <code>colorMode="auto"</code> se sigue{' '}
            <code>prefers-color-scheme</code>, o un <code>data-theme="dark|light"</code> en <code>&lt;html&gt;</code> si tu sitio tiene su propio switch.
          </p>
          <CodeBlock
            label="ts"
            code={`import type { GraphTheme } from '@/components/contribution-graph'

const brand: GraphTheme = {
  name: 'Brand',
  glow: false,
  light: { levels: ['#eef', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'], text: '#111', muted: '#666', surface: '#fff', border: '#ddd' },
  dark:  { levels: ['#1e1b2e', '#312e81', '#4f46e5', '#818cf8', '#c7d2fe'], text: '#eee', muted: '#999', surface: '#0b0b12', border: '#2a2a3a' },
}

<ClassicGraph data={data} theme={brand} />`}
          />
          <p>
            Internamente el tema se expone como variables CSS (<code>--cg-l0</code> … <code>--cg-l4</code>, <code>--cg-text</code>,{' '}
            <code>--cg-muted</code>), así que también puedes sobrescribirlas desde tu CSS.
          </p>
        </Section>

        <Section id="i18n" title="Idioma">
          <p>
            Fechas y números usan <code>Intl</code> con la prop <code>locale</code>. Los textos se pasan como props; el botón ES/EN de la galería
            muestra este objeto en acción:
          </p>
          <CodeBlock
            label="ts"
            code={`<ClassicGraph
  data={data}
  locale="es"
  unit={['contribución', 'contribuciones']}
  periodLabel="en el último año"
  legendLabels={['Menos', 'Más']}
/>`}
          />
        </Section>

        <Section id="a11y" title="Accesibilidad">
          <ul>
            <li>El gráfico es un único punto de tabulación: Tab para entrar, flechas para moverse por días (o semanas), Inicio/Fin para los extremos.</li>
            <li>Enter o Espacio disparan <code>onDayClick</code>; Escape cierra el tooltip.</li>
            <li>El día activo se anuncia en una región <code>aria-live</code>, y el contenedor tiene un resumen con el total y el rango de fechas.</li>
            <li>La animación de entrada se desactiva con <code>prefers-reduced-motion</code>.</li>
            <li>
              Dots y Isometric codifican la intensidad con tamaño o altura además del color, útil para daltonismo. El tema <code>mono</code> también
              ayuda.
            </li>
          </ul>
        </Section>
      </article>
    </div>
  )
}

/**
 * Metadatos de cada ruta (título y descripción) en los dos idiomas.
 * Los usan la app (al navegar) y el script de build que genera un HTML por ruta,
 * así un buscador recibe cada página con su propio <head> sin ejecutar JavaScript.
 * Sin JSX ni imports de React: Node lo puede importar directamente.
 */
import { apiText } from './api-es.ts'
import api from './data/api.json' with { type: 'json' }

export type SeoLang = 'en' | 'es'

const SITE = 'contrib/graphs'

/** Variantes del sitio: id de la URL → componente (ClassicGraph → classic). */
export const variantRoutes = api.components.map((c) => ({ id: c.name.replace(/Graph$/, '').toLowerCase(), component: c }))

/** Rutas sin prefijo de idioma. El español es la misma ruta con /es delante. */
export const routes = ['/', '/docs', '/docs/api', ...variantRoutes.map((v) => `/variants/${v.id}`)]

const text = {
  en: {
    home: { title: `${SITE}: contribution graph components for React`, description: 'Seven React components that show your GitHub, GitLab or any other activity as a calendar heatmap. Install them from npm or copy them with the shadcn CLI.' },
    docs: { title: `Documentation | ${SITE}`, description: 'Install contrib-graphs, pass your GitHub, GitLab or custom data, and use it in Vite, Next.js or Astro with themes and localization.' },
    api: { title: `API reference | ${SITE}`, description: 'Every prop of the seven contribution graph components and every function of contrib-graphs/data, generated from the package types.' },
    variant: (name: string) => `${name} | ${SITE}`,
  },
  es: {
    home: { title: `${SITE}: componentes de contribution graph para React`, description: 'Siete componentes de React que muestran tu actividad de GitHub, GitLab o la que quieras como un calendario. Instálalos desde npm o cópialos con el CLI de shadcn.' },
    docs: { title: `Documentación | ${SITE}`, description: 'Instala contrib-graphs, pásale tus datos de GitHub, GitLab o propios, y úsalo en Vite, Next.js o Astro con temas e idiomas.' },
    api: { title: `Referencia de la API | ${SITE}`, description: 'Todas las props de los siete componentes de contribution graph y las funciones de contrib-graphs/data, generadas desde los tipos del paquete.' },
    variant: (name: string) => `${name} | ${SITE}`,
  },
}

/** Título y descripción de una ruta (sin prefijo de idioma y sin la base del sitio). */
export function routeMeta(path: string, lang: SeoLang): { title: string; description: string } {
  const t = text[lang]
  const clean = path.replace(/\/+$/, '') || '/'
  if (clean === '/docs') return t.docs
  if (clean === '/docs/api') return t.api
  const variant = variantRoutes.find((v) => clean === `/variants/${v.id}`)
  if (variant) return { title: t.variant(variant.component.name), description: apiText(variant.component.description, lang) }
  return t.home
}

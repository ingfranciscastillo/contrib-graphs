import { useLang, type Lang } from './i18n'

/**
 * Textos del sitio. El inglés define la forma; el español tiene que cumplirla
 * (`satisfies Messages`), así TypeScript avisa si falta una traducción.
 */
const en = {
  skip: 'Skip to content',
  nav: { label: 'Main', gallery: 'Gallery', docs: 'Docs', api: 'API' },
  mode: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    label: (mode: string) => `Color mode: ${mode}. Change`,
  },
  footer: {
    tagline: 'Contribution graphs for your site or portfolio. Install the package or copy the component, pass your data and pick a theme.',
    variants: 'Variants',
    resources: 'Resources',
    docs: 'Documentation',
    api: 'API reference',
    github: 'GitHub data',
    gitlab: 'GitLab data',
    themes: 'Custom themes',
    frameworks: 'Next.js and Astro',
    builtWith: 'Built with React, TypeScript, Vite and TanStack Router.',
  },
  notFound: { title: 'Not found', text: "That page doesn't exist.", back: 'Back to the gallery' },
  toolbar: {
    label: 'Demo options',
    theme: 'Theme',
    data: 'Data',
    shuffle: 'Other data',
    profiles: {
      github: (user: string) => `@${user} on GitHub`,
      steady: 'Steady',
      burst: 'Bursts',
      weekend: 'Weekends',
      sparse: 'Sparse',
    },
  },
  code: { copy: 'Copy', copied: 'Copied' },
  hero: {
    title: 'Contribution graphs for your portfolio',
    lead: 'React components you install or copy and make your own. One data format for GitHub, GitLab or anything you track, with themes, dark mode, keyboard and screen reader support built in.',
    start: 'Read the docs',
    seeVariants: 'See variants',
    realData: 'Real data from',
    updated: (date: string) => `, updated ${date}.`,
    sampleData: 'Sample data generated in your browser.',
  },
  gallery: { customize: 'Customize' },
  playground: {
    breadcrumb: 'Breadcrumb',
    previewWidth: 'Preview width',
    devices: { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' },
    fullWidth: 'Full width',
    hint: (callback: string) => `Hover, or Tab in and use the arrow keys. Click or Enter calls ${callback}.`,
    weekOf: 'week of',
    replay: 'Replay animation',
    reset: 'Reset',
    reference: 'Props reference',
    sharedProps: (n: number) => `Shared props (${n})`,
    fullReference: 'Full API reference',
  },
}

export type Messages = typeof en

const es = {
  skip: 'Saltar al contenido',
  nav: { label: 'Principal', gallery: 'Galería', docs: 'Docs', api: 'API' },
  mode: {
    system: 'Sistema',
    light: 'Claro',
    dark: 'Oscuro',
    label: (mode: string) => `Modo de color: ${mode}. Cambiar`,
  },
  footer: {
    tagline: 'Contribution graphs para tu sitio o portfolio. Instala el paquete o copia el componente, pásale tus datos y elige un tema.',
    variants: 'Variantes',
    resources: 'Recursos',
    docs: 'Documentación',
    api: 'Referencia de la API',
    github: 'Datos de GitHub',
    gitlab: 'Datos de GitLab',
    themes: 'Temas propios',
    frameworks: 'Next.js y Astro',
    builtWith: 'Hecho con React, TypeScript, Vite y TanStack Router.',
  },
  notFound: { title: 'No encontrado', text: 'Esa página no existe.', back: 'Volver a la galería' },
  toolbar: {
    label: 'Opciones del demo',
    theme: 'Tema',
    data: 'Datos',
    shuffle: 'Otros datos',
    profiles: {
      github: (user: string) => `GitHub de @${user}`,
      steady: 'Constante',
      burst: 'Por rachas',
      weekend: 'Fines de semana',
      sparse: 'Esporádico',
    },
  },
  code: { copy: 'Copiar', copied: 'Copiado' },
  hero: {
    title: 'Contribution graphs para tu portfolio',
    lead: 'Componentes de React que instalas o copias y haces tuyos. Un mismo formato de datos para GitHub, GitLab o lo que quieras medir, con temas, modo oscuro, teclado y lector de pantalla incluidos.',
    start: 'Leer la documentación',
    seeVariants: 'Ver variantes',
    realData: 'Datos reales de',
    updated: (date: string) => `, actualizados el ${date}.`,
    sampleData: 'Datos de ejemplo generados en tu navegador.',
  },
  gallery: { customize: 'Personalizar' },
  playground: {
    breadcrumb: 'Migas',
    previewWidth: 'Ancho de la vista previa',
    devices: { desktop: 'Escritorio', tablet: 'Tablet', mobile: 'Móvil' },
    fullWidth: 'Ancho completo',
    hint: (callback: string) => `Pasa el cursor, o entra con Tab y usa las flechas. Clic o Enter llama a ${callback}.`,
    weekOf: 'semana del',
    replay: 'Repetir animación',
    reset: 'Restablecer',
    reference: 'Referencia de props',
    sharedProps: (n: number) => `Props comunes (${n})`,
    fullReference: 'Referencia completa de la API',
  },
} satisfies Messages

export const messages: Record<Lang, Messages> = { en, es }

export function useT(): Messages {
  return messages[useLang()]
}

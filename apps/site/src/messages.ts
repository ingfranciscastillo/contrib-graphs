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
    tagline: 'React components for showing your activity on a personal site. Open source under the MIT License.',
    variants: 'Variants',
    resources: 'Resources',
    docs: 'Documentation',
    api: 'API reference',
    dataSources: 'Data sources',
    project: 'Project',
    viewOnGithub: 'View on GitHub',
    githubLabel: 'contrib-graphs on GitHub',
    issues: 'Report an issue',
    license: 'MIT License',
    copyright: (year: number) => `© ${year} Francis Miguel Castillo Cruz`,
    install: 'Install',
    themes: 'Custom themes',
    frameworks: 'Next.js and Astro',
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
  code: { copy: 'Copy', copied: 'Copied', packageManager: 'Package manager' },
  hero: {
    title: 'Contribution graphs for your portfolio',
    lead: 'Seven React components that draw your GitHub, GitLab or any other activity as a calendar. Install them from npm or copy the source into your project. Each one works with a keyboard and a screen reader.',
    start: 'Read the docs',
    seeVariants: 'See variants',
    realData: 'Real data from',
    updated: (date: string) => `, updated ${date}.`,
    sampleData: 'Sample data generated in your browser.',
  },
  gallery: {
    customize: 'Customize',
    useIt: 'Use it in your project',
    useItText: 'Install it from npm, or copy the source of a single variant with the shadcn CLI and edit it like any other file in your project.',
    readDocs: 'Read the docs',
  },
  playground: {
    breadcrumb: 'Breadcrumb',
    previewWidth: 'Preview width',
    devices: { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' },
    fullWidth: 'Full width',
    hint: (callback: string) => `Hover, or Tab in and use the arrow keys. Click or Enter calls ${callback}.`,
    weekOf: 'week of',
    replay: 'Replay animation',
    reset: 'Reset',
    orCopy: 'Or copy its source into your project with the shadcn CLI:',
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
    tagline: 'Componentes de React para mostrar tu actividad en tu web personal. Código abierto con licencia MIT.',
    variants: 'Variantes',
    resources: 'Recursos',
    docs: 'Documentación',
    api: 'Referencia de la API',
    dataSources: 'Fuentes de datos',
    project: 'Proyecto',
    viewOnGithub: 'Ver en GitHub',
    githubLabel: 'contrib-graphs en GitHub',
    issues: 'Reportar un problema',
    license: 'Licencia MIT',
    copyright: (year: number) => `© ${year} Francis Miguel Castillo Cruz`,
    install: 'Instalar',
    themes: 'Temas propios',
    frameworks: 'Next.js y Astro',
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
  code: { copy: 'Copiar', copied: 'Copiado', packageManager: 'Gestor de paquetes' },
  hero: {
    title: 'Contribution graphs para tu portfolio',
    lead: 'Siete componentes de React que dibujan tu actividad de GitHub, GitLab o lo que quieras medir como un calendario. Instálalos desde npm o copia el código a tu proyecto. Todos se pueden usar con teclado y lector de pantalla.',
    start: 'Leer la documentación',
    seeVariants: 'Ver variantes',
    realData: 'Datos reales de',
    updated: (date: string) => `, actualizados el ${date}.`,
    sampleData: 'Datos de ejemplo generados en tu navegador.',
  },
  gallery: {
    customize: 'Personalizar',
    useIt: 'Úsalo en tu proyecto',
    useItText: 'Instálalo desde npm, o copia el código de una sola variante con el CLI de shadcn y edítalo como cualquier archivo de tu proyecto.',
    readDocs: 'Leer la documentación',
  },
  playground: {
    breadcrumb: 'Migas',
    previewWidth: 'Ancho de la vista previa',
    devices: { desktop: 'Escritorio', tablet: 'Tablet', mobile: 'Móvil' },
    fullWidth: 'Ancho completo',
    hint: (callback: string) => `Pasa el cursor, o entra con Tab y usa las flechas. Clic o Enter llama a ${callback}.`,
    weekOf: 'semana del',
    replay: 'Repetir animación',
    reset: 'Restablecer',
    orCopy: 'O copia su código a tu proyecto con el CLI de shadcn:',
    reference: 'Referencia de props',
    sharedProps: (n: number) => `Props comunes (${n})`,
    fullReference: 'Referencia completa de la API',
  },
} satisfies Messages

export const messages: Record<Lang, Messages> = { en, es }

export function useT(): Messages {
  return messages[useLang()]
}

import type { ComponentType } from 'react'
import type { Lang } from './i18n'
import {
  ClassicGraph,
  CompactGraph,
  DotsGraph,
  IsometricGraph,
  RadialGraph,
  SkylineGraph,
  TerminalGraph,
  terminalCharsets,
} from 'contrib-graphs'

/** Texto traducible; un string simple sirve cuando es igual en los dos idiomas. */
export type Text = string | Record<Lang, string>
export const tr = (text: Text, lang: Lang) => (typeof text === 'string' ? text : text[lang])

export type Control = { key: string; label: Text; hint?: Text } & (
  | { type: 'range'; min: number; max: number; step?: number }
  | { type: 'select'; options: { value: string | number; label: Text }[] }
  | { type: 'toggle' }
  | { type: 'text' }
)

export type Values = Record<string, string | number | boolean>

export interface VariantDef {
  id: string
  name: string
  importName: string
  tagline: Text
  description: Text
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  /** Defaults reales del componente: el snippet solo incluye lo que difiere. */
  defaults: Values
  controls: Control[]
  /** En la galería ocupa todo el ancho. */
  wide?: boolean
}

const common: Control[] = [
  { key: 'animate', label: { en: 'Entry animation', es: 'Animación de entrada' }, type: 'toggle' },
  { key: 'showLegend', label: { en: 'Legend', es: 'Leyenda' }, type: 'toggle' },
  { key: 'showTotal', label: 'Total', type: 'toggle' },
  {
    key: 'scale',
    label: { en: 'Level scale', es: 'Escala de niveles' },
    type: 'select',
    options: [
      { value: 'quantile', label: { en: 'Quantiles (GitHub)', es: 'Cuantiles (GitHub)' } },
      { value: 'linear', label: { en: 'Linear', es: 'Lineal' } },
    ],
  },
  {
    key: 'colorMode',
    label: { en: 'Color mode', es: 'Modo de color' },
    type: 'select',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'light', label: { en: 'Light', es: 'Claro' } },
      { value: 'dark', label: { en: 'Dark', es: 'Oscuro' } },
    ],
  },
]
const commonDefaults: Values = { animate: false, showLegend: true, showTotal: true, scale: 'quantile', colorMode: 'auto' }

const calendarControls: Control[] = [
  { key: 'weeks', label: { en: 'Weeks', es: 'Semanas' }, type: 'range', min: 8, max: 53 },
  {
    key: 'weekStart',
    label: { en: 'Week starts on', es: 'Inicio de semana' },
    type: 'select',
    options: [
      { value: 0, label: { en: 'Sunday', es: 'Domingo' } },
      { value: 1, label: { en: 'Monday', es: 'Lunes' } },
    ],
  },
]
const calendarDefaults: Values = { weeks: 53, weekStart: 0 }

const fit: Control = {
  key: 'fit',
  label: { en: 'Fit on mobile', es: 'Ajuste en móvil' },
  type: 'select',
  hint: { en: 'crop drops older weeks; scale shrinks everything', es: 'crop recorta semanas antiguas; scale encoge todo' },
  options: [
    { value: 'crop', label: 'crop' },
    { value: 'scale', label: 'scale' },
  ],
}

export const variants: VariantDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    importName: 'ClassicGraph',
    tagline: { en: 'The familiar grid, done right.', es: 'La cuadrícula de siempre, bien hecha.' },
    description:
      { en: 'Weeks × days with month and weekday labels. Drops older weeks on narrow screens instead of scrolling, and can add a glow to your busiest days.', es: 'Semanas × días con etiquetas de mes y día. Recorta semanas en pantallas angostas en lugar de hacer scroll, y opcionalmente añade brillo a los días más activos.' },
    component: ClassicGraph,
    wide: true,
    defaults: { ...commonDefaults, ...calendarDefaults, cellSize: 11, gap: 3, radius: 2, showWeekdays: true, showMonths: true, glow: false, fit: 'crop' },
    controls: [
      { key: 'cellSize', label: { en: 'Cell size', es: 'Tamaño de celda' }, type: 'range', min: 6, max: 18 },
      { key: 'gap', label: { en: 'Gap', es: 'Separación' }, type: 'range', min: 0, max: 6 },
      { key: 'radius', label: { en: 'Radius', es: 'Radio' }, type: 'range', min: 0, max: 9 },
      { key: 'glow', label: { en: 'Glow', es: 'Brillo' }, type: 'toggle' },
      { key: 'showWeekdays', label: { en: 'Weekday labels', es: 'Días de la semana' }, type: 'toggle' },
      { key: 'showMonths', label: { en: 'Month labels', es: 'Meses' }, type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'dots',
    name: 'Dots',
    importName: 'DotsGraph',
    tagline: { en: 'Size counts too.', es: 'El tamaño también cuenta.' },
    description: { en: 'Circles that grow with activity: intensity reads from both color and size, so it still works in monochrome.', es: 'Círculos que crecen con la actividad: la intensidad se lee por color y por tamaño, así que sigue funcionando en monocromo.' },
    component: DotsGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, cellSize: 11, gap: 3, showWeekdays: true, showMonths: true, fit: 'crop' },
    controls: [
      { key: 'cellSize', label: { en: 'Size', es: 'Tamaño' }, type: 'range', min: 6, max: 18 },
      { key: 'gap', label: { en: 'Gap', es: 'Separación' }, type: 'range', min: 0, max: 6 },
      { key: 'showWeekdays', label: { en: 'Weekday labels', es: 'Días de la semana' }, type: 'toggle' },
      { key: 'showMonths', label: { en: 'Month labels', es: 'Meses' }, type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'isometric',
    name: 'Isometric',
    importName: 'IsometricGraph',
    tagline: { en: 'Your year in 3D.', es: 'Tu año en 3D.' },
    description: { en: 'Isometric columns whose height is the day\'s contribution count, with streak and best-day stats.', es: 'Columnas isométricas cuya altura es el número de contribuciones del día, con estadísticas de racha y mejor día.' },
    component: IsometricGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, tileSize: 12, maxHeight: 48, heightBy: 'count', showStats: true },
    controls: [
      { key: 'tileSize', label: { en: 'Tile size', es: 'Tamaño de baldosa' }, type: 'range', min: 6, max: 20 },
      { key: 'maxHeight', label: { en: 'Max height', es: 'Altura máxima' }, type: 'range', min: 10, max: 120 },
      {
        key: 'heightBy',
        label: { en: 'Height from', es: 'Altura según' },
        type: 'select',
        options: [
          { value: 'count', label: { en: 'Actual count', es: 'Conteo real' } },
          { value: 'level', label: { en: 'Level (5 heights)', es: 'Nivel (5 alturas)' } },
        ],
      },
      { key: 'showStats', label: { en: 'Stats', es: 'Estadísticas' }, type: 'toggle' },
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    importName: 'TerminalGraph',
    tagline: { en: 'For portfolios that live in the terminal.', es: 'Para portfolios que viven en la terminal.' },
    description: { en: 'Real monospace text (selectable and copyable) with several character sets and a custom prompt.', es: 'Texto monospace real (seleccionable y copiable) con varios juegos de caracteres y un prompt personalizable.' },
    component: TerminalGraph,
    wide: true,
    defaults: {
      ...commonDefaults,
      ...calendarDefaults,
      charset: 'blocks',
      command: "git log --since='1 year ago' | heatmap",
      prompt: '~ $',
      colored: true,
      fit: 'crop',
    },
    controls: [
      { key: 'charset', label: { en: 'Characters', es: 'Caracteres' }, type: 'select', options: Object.keys(terminalCharsets).map((k) => ({ value: k, label: k })) },
      { key: 'command', label: { en: 'Command', es: 'Comando' }, type: 'text' },
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'colored', label: { en: 'Colored', es: 'Con color' }, type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'radial',
    name: 'Radial',
    importName: 'RadialGraph',
    tagline: { en: 'The year comes full circle.', es: 'El año da la vuelta completa.' },
    description: { en: 'Each week is a slice of the ring and each weekday a band. A good centerpiece for an "about me" section.', es: 'Cada semana es una porción del anillo y cada día de la semana un aro. Ideal como pieza central de una sección "sobre mí".' },
    component: RadialGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, size: 320, innerRadius: 0.38, showMonths: true, showTotal: false },
    controls: [
      { key: 'size', label: { en: 'Diameter', es: 'Diámetro' }, type: 'range', min: 200, max: 520, step: 10 },
      { key: 'innerRadius', label: { en: 'Inner radius', es: 'Radio interior' }, type: 'range', min: 0.1, max: 0.7, step: 0.02 },
      { key: 'showMonths', label: { en: 'Month labels', es: 'Meses' }, type: 'toggle' },
      ...calendarControls,
      ...common.filter((c) => c.key !== 'showTotal'),
    ],
  },
  {
    id: 'skyline',
    name: 'Skyline',
    importName: 'SkylineGraph',
    tagline: { en: 'A city built from weeks.', es: 'Una ciudad hecha de semanas.' },
    description: { en: 'One building per week, as tall as its total. Its 7 windows light up on the days you were active.', es: 'Un edificio por semana, alto según el total. Sus 7 ventanas se encienden en los días con actividad.' },
    component: SkylineGraph,
    wide: true,
    defaults: { ...commonDefaults, weeks: 53, height: 110, barWidth: 9, gap: 3, windows: true, fit: 'crop' },
    controls: [
      { key: 'height', label: { en: 'Height', es: 'Altura' }, type: 'range', min: 50, max: 220 },
      { key: 'barWidth', label: { en: 'Width', es: 'Ancho' }, type: 'range', min: 4, max: 20 },
      { key: 'gap', label: { en: 'Gap', es: 'Separación' }, type: 'range', min: 0, max: 8 },
      { key: 'windows', label: { en: 'Windows', es: 'Ventanas' }, type: 'toggle' },
      fit,
      { key: 'weeks', label: { en: 'Weeks', es: 'Semanas' }, type: 'range', min: 8, max: 53 },
      ...common,
    ],
  },
  {
    id: 'compact',
    name: 'Compact',
    importName: 'CompactGraph',
    tagline: { en: 'Your latest days, in one line.', es: 'Los últimos días, en una línea.' },
    description: { en: 'A single row with your last N days and current streak. Fits in a header, a project card or the footer.', es: 'Una fila con los últimos N días y tu racha actual. Cabe en un header, una tarjeta de proyecto o el footer.' },
    component: CompactGraph,
    defaults: { ...commonDefaults, showLegend: false, days: 30, cellSize: 10, gap: 3, radius: 2, showStreak: true },
    controls: [
      { key: 'days', label: { en: 'Days', es: 'Días' }, type: 'range', min: 7, max: 60 },
      { key: 'cellSize', label: { en: 'Cell size', es: 'Tamaño de celda' }, type: 'range', min: 6, max: 18 },
      { key: 'gap', label: { en: 'Gap', es: 'Separación' }, type: 'range', min: 0, max: 6 },
      { key: 'radius', label: { en: 'Radius', es: 'Radio' }, type: 'range', min: 0, max: 9 },
      { key: 'showStreak', label: { en: 'Streak', es: 'Racha' }, type: 'toggle' },
      ...common,
    ],
  },
]

export const variantsById = Object.fromEntries(variants.map((v) => [v.id, v])) as Record<string, VariantDef>

/** Genera el snippet de uso con solo las props que difieren del default. */
export function usageSnippet(def: VariantDef, values: Values, theme: string): string {
  const lines = ['data={contributions}']
  if (theme !== 'github') lines.push(`theme="${theme}"`)
  for (const c of def.controls) {
    const v = values[c.key]
    if (v === undefined || v === def.defaults[c.key]) continue
    if (typeof v === 'string') lines.push(`${c.key}="${v.replace(/"/g, '&quot;')}"`)
    else if (v === true) lines.push(c.key)
    else lines.push(`${c.key}={${v}}`)
  }
  return [
    `import { ${def.importName} } from 'contrib-graphs'`,
    '',
    lines.length === 1 ? `<${def.importName} ${lines[0]} />` : `<${def.importName}\n${lines.map((l) => `  ${l}`).join('\n')}\n/>`,
  ].join('\n')
}

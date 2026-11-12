import type { ComponentType } from 'react'
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

export type Control = { key: string; label: string; hint?: string } & (
  | { type: 'range'; min: number; max: number; step?: number }
  | { type: 'select'; options: { value: string | number; label: string }[] }
  | { type: 'toggle' }
  | { type: 'text' }
)

export type Values = Record<string, string | number | boolean>

export interface VariantDef {
  id: string
  name: string
  importName: string
  tagline: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  /** Defaults reales del componente: el snippet solo incluye lo que difiere. */
  defaults: Values
  controls: Control[]
  /** En la galería ocupa todo el ancho. */
  wide?: boolean
}

const common: Control[] = [
  { key: 'animate', label: 'Animación de entrada', type: 'toggle' },
  { key: 'showLegend', label: 'Leyenda', type: 'toggle' },
  { key: 'showTotal', label: 'Total', type: 'toggle' },
  {
    key: 'scale',
    label: 'Escala de niveles',
    type: 'select',
    options: [
      { value: 'quantile', label: 'Cuantiles (GitHub)' },
      { value: 'linear', label: 'Lineal' },
    ],
  },
  {
    key: 'colorMode',
    label: 'Modo de color',
    type: 'select',
    options: [
      { value: 'auto', label: 'Auto' },
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Oscuro' },
    ],
  },
]
const commonDefaults: Values = { animate: false, showLegend: true, showTotal: true, scale: 'quantile', colorMode: 'auto' }

const calendarControls: Control[] = [
  { key: 'weeks', label: 'Semanas', type: 'range', min: 8, max: 53 },
  {
    key: 'weekStart',
    label: 'Inicio de semana',
    type: 'select',
    options: [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
    ],
  },
]
const calendarDefaults: Values = { weeks: 53, weekStart: 0 }

const fit: Control = {
  key: 'fit',
  label: 'Ajuste en móvil',
  type: 'select',
  hint: 'crop recorta semanas antiguas; scale encoge todo',
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
    tagline: 'La cuadrícula de siempre, bien hecha.',
    description:
      'Semanas × días con etiquetas de mes y día. Recorta semanas en pantallas angostas en lugar de hacer scroll, y opcionalmente añade brillo a los días más activos.',
    component: ClassicGraph,
    wide: true,
    defaults: { ...commonDefaults, ...calendarDefaults, cellSize: 11, gap: 3, radius: 2, showWeekdays: true, showMonths: true, glow: false, fit: 'crop' },
    controls: [
      { key: 'cellSize', label: 'Tamaño de celda', type: 'range', min: 6, max: 18 },
      { key: 'gap', label: 'Separación', type: 'range', min: 0, max: 6 },
      { key: 'radius', label: 'Radio', type: 'range', min: 0, max: 9 },
      { key: 'glow', label: 'Brillo', type: 'toggle' },
      { key: 'showWeekdays', label: 'Días de la semana', type: 'toggle' },
      { key: 'showMonths', label: 'Meses', type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'dots',
    name: 'Dots',
    importName: 'DotsGraph',
    tagline: 'El tamaño también cuenta.',
    description: 'Círculos que crecen con la actividad: la intensidad se lee por color y por tamaño, así que sigue funcionando en monocromo.',
    component: DotsGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, cellSize: 11, gap: 3, showWeekdays: true, showMonths: true, fit: 'crop' },
    controls: [
      { key: 'cellSize', label: 'Tamaño', type: 'range', min: 6, max: 18 },
      { key: 'gap', label: 'Separación', type: 'range', min: 0, max: 6 },
      { key: 'showWeekdays', label: 'Días de la semana', type: 'toggle' },
      { key: 'showMonths', label: 'Meses', type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'isometric',
    name: 'Isometric',
    importName: 'IsometricGraph',
    tagline: 'Tu año en 3D.',
    description: 'Columnas isométricas cuya altura es el número de contribuciones del día, con estadísticas de racha y mejor día.',
    component: IsometricGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, tileSize: 12, maxHeight: 48, heightBy: 'count', showStats: true },
    controls: [
      { key: 'tileSize', label: 'Tamaño de baldosa', type: 'range', min: 6, max: 20 },
      { key: 'maxHeight', label: 'Altura máxima', type: 'range', min: 10, max: 120 },
      {
        key: 'heightBy',
        label: 'Altura según',
        type: 'select',
        options: [
          { value: 'count', label: 'Conteo real' },
          { value: 'level', label: 'Nivel (5 alturas)' },
        ],
      },
      { key: 'showStats', label: 'Estadísticas', type: 'toggle' },
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'terminal',
    name: 'Terminal',
    importName: 'TerminalGraph',
    tagline: 'Para portfolios que viven en la terminal.',
    description: 'Texto monospace real (seleccionable y copiable) con varios juegos de caracteres y un prompt personalizable.',
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
      { key: 'charset', label: 'Caracteres', type: 'select', options: Object.keys(terminalCharsets).map((k) => ({ value: k, label: k })) },
      { key: 'command', label: 'Comando', type: 'text' },
      { key: 'prompt', label: 'Prompt', type: 'text' },
      { key: 'colored', label: 'Con color', type: 'toggle' },
      fit,
      ...calendarControls,
      ...common,
    ],
  },
  {
    id: 'radial',
    name: 'Radial',
    importName: 'RadialGraph',
    tagline: 'El año da la vuelta completa.',
    description: 'Cada semana es una porción del anillo y cada día de la semana un aro. Ideal como pieza central de una sección "sobre mí".',
    component: RadialGraph,
    defaults: { ...commonDefaults, ...calendarDefaults, size: 320, innerRadius: 0.38, showMonths: true, showTotal: false },
    controls: [
      { key: 'size', label: 'Diámetro', type: 'range', min: 200, max: 520, step: 10 },
      { key: 'innerRadius', label: 'Radio interior', type: 'range', min: 0.1, max: 0.7, step: 0.02 },
      { key: 'showMonths', label: 'Meses', type: 'toggle' },
      ...calendarControls,
      ...common.filter((c) => c.key !== 'showTotal'),
    ],
  },
  {
    id: 'skyline',
    name: 'Skyline',
    importName: 'SkylineGraph',
    tagline: 'Una ciudad hecha de semanas.',
    description: 'Un edificio por semana, alto según el total. Sus 7 ventanas se encienden en los días con actividad.',
    component: SkylineGraph,
    wide: true,
    defaults: { ...commonDefaults, weeks: 53, height: 110, barWidth: 9, gap: 3, windows: true, fit: 'crop' },
    controls: [
      { key: 'height', label: 'Altura', type: 'range', min: 50, max: 220 },
      { key: 'barWidth', label: 'Ancho', type: 'range', min: 4, max: 20 },
      { key: 'gap', label: 'Separación', type: 'range', min: 0, max: 8 },
      { key: 'windows', label: 'Ventanas', type: 'toggle' },
      fit,
      { key: 'weeks', label: 'Semanas', type: 'range', min: 8, max: 53 },
      ...common,
    ],
  },
  {
    id: 'compact',
    name: 'Compact',
    importName: 'CompactGraph',
    tagline: 'Los últimos días, en una línea.',
    description: 'Una fila con los últimos N días y tu racha actual. Cabe en un header, una tarjeta de proyecto o el footer.',
    component: CompactGraph,
    defaults: { ...commonDefaults, showLegend: false, days: 30, cellSize: 10, gap: 3, radius: 2, showStreak: true },
    controls: [
      { key: 'days', label: 'Días', type: 'range', min: 7, max: 60 },
      { key: 'cellSize', label: 'Tamaño de celda', type: 'range', min: 6, max: 18 },
      { key: 'gap', label: 'Separación', type: 'range', min: 0, max: 6 },
      { key: 'radius', label: 'Radio', type: 'range', min: 0, max: 9 },
      { key: 'showStreak', label: 'Racha', type: 'toggle' },
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

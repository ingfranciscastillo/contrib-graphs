import type { CSSProperties } from 'react'

export type LevelColors = readonly [string, string, string, string, string]

export interface ThemePalette {
  /** Colores de los niveles 0 → 4 */
  levels: LevelColors
  text: string
  muted: string
  /** Fondo para variantes con superficie propia (terminal, tarjetas). */
  surface: string
  border: string
}

export interface GraphTheme {
  name: string
  light: ThemePalette
  dark: ThemePalette
}

const lightBase = { text: '#1f2328', muted: '#656d76', surface: '#ffffff', border: '#d0d7de' }
const darkBase = { text: '#e6edf3', muted: '#8d96a0', surface: '#0d1117', border: '#30363d' }

export const themes = {
  github: {
    name: 'GitHub',
    light: { ...lightBase, levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] },
    dark: { ...darkBase, levels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'] },
  },
  gitlab: {
    name: 'GitLab',
    light: { ...lightBase, levels: ['#ececef', '#acd5f2', '#7fa8c9', '#527ba0', '#254e77'] },
    dark: { ...darkBase, surface: '#18171d', border: '#3a383f', levels: ['#28272d', '#24406a', '#3a6aa3', '#63a0d9', '#a9d4ff'] },
  },
  frost: {
    name: 'Frost',
    light: { ...lightBase, levels: ['#e5e9f0', '#c3d7e6', '#88c0d0', '#5e81ac', '#3b5378'] },
    dark: { ...darkBase, surface: '#2e3440', border: '#434c5e', text: '#eceff4', muted: '#a3adbf', levels: ['#3b4252', '#3d5468', '#5e81ac', '#81a1c1', '#88c0d0'] },
  },
  ember: {
    name: 'Ember',
    light: { ...lightBase, levels: ['#f1ece8', '#fdd8a8', '#fb9b4b', '#e8590c', '#a8320a'] },
    dark: { ...darkBase, surface: '#16110e', border: '#3a2d25', levels: ['#241c17', '#5a2a12', '#9c3d0c', '#e8590c', '#ffa94d'] },
  },
  violet: {
    name: 'Violet',
    light: { ...lightBase, levels: ['#eeebf3', '#d6c8f7', '#a78bfa', '#7c3aed', '#4c1d95'] },
    dark: { ...darkBase, surface: '#13111b', border: '#2f2a45', levels: ['#1f1b2b', '#3b2a6b', '#6d4fd1', '#a78bfa', '#ddd0ff'] },
  },
  mono: {
    name: 'Mono',
    light: { ...lightBase, levels: ['#ececec', '#c4c4c4', '#8f8f8f', '#5a5a5a', '#1f1f1f'] },
    dark: { ...darkBase, surface: '#0f0f0f', border: '#2e2e2e', levels: ['#1c1c1c', '#3a3a3a', '#6b6b6b', '#a3a3a3', '#f0f0f0'] },
  },
} satisfies Record<string, GraphTheme>

export type ThemeName = keyof typeof themes

export const themeNames = Object.keys(themes) as ThemeName[]

export function resolveTheme(theme: ThemeName | GraphTheme | undefined): GraphTheme {
  if (!theme) return themes.github
  if (typeof theme === 'string') return themes[theme] ?? themes.github
  return theme
}

/** Expone el tema como CSS variables; el CSS de la librería elige claro/oscuro. */
export function themeVars(theme: GraphTheme): CSSProperties {
  const vars: Record<string, string> = {}
  for (const mode of ['light', 'dark'] as const) {
    const p = theme[mode]
    p.levels.forEach((c, i) => (vars[`--cg-l${i}-${mode}`] = c))
    vars[`--cg-text-${mode}`] = p.text
    vars[`--cg-muted-${mode}`] = p.muted
    vars[`--cg-surface-${mode}`] = p.surface
    vars[`--cg-border-${mode}`] = p.border
  }
  return vars as CSSProperties
}

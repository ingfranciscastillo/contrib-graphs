import type { CSSProperties, ReactNode } from 'react'
import type { GraphTheme, ThemeName } from './themes'

/** Un día de actividad. `date` en formato ISO `YYYY-MM-DD`. */
export interface ContributionDay {
  date: string
  count: number
}

export type Level = 0 | 1 | 2 | 3 | 4

/**
 * Cómo se asigna un nivel (0–4) a cada conteo.
 * - `quantile`: por cuartiles de los días con actividad (como GitHub)
 * - `linear`: proporcional al máximo
 * - `[a, b, c, d]`: mínimo de contribuciones para los niveles 1, 2, 3 y 4
 */
export type LevelScale = 'quantile' | 'linear' | readonly [number, number, number, number]

export type ColorMode = 'auto' | 'light' | 'dark'

export interface CalendarDay extends ContributionDay {
  level: Level
  /** Índice plano dentro de `calendar.days` */
  index: number
  /** Columna (semana) dentro del calendario */
  weekIndex: number
  /** Fila 0–6 relativa a `weekStart` */
  dayIndex: number
  /** Día de la semana real 0 = domingo */
  weekday: number
}

export interface MonthLabel {
  label: string
  weekIndex: number
  month: number
  year: number
}

export interface Calendar {
  weeks: (CalendarDay | null)[][]
  days: CalendarDay[]
  months: MonthLabel[]
  total: number
  max: number
  start: string
  end: string
  levelOf: (count: number) => Level
}

/** Props compartidas por todas las variantes. */
export interface BaseGraphProps {
  data: ContributionDay[]
  /** Nombre de un preset o un tema propio. Default `github`. */
  theme?: ThemeName | GraphTheme
  /** `auto` sigue `prefers-color-scheme` o un `data-theme` en `<html>`. */
  colorMode?: ColorMode
  /** Semanas a mostrar (default 53). */
  weeks?: number
  /** Último día del calendario (default: hoy). */
  endDate?: string | Date
  /** 0 = domingo, 1 = lunes */
  weekStart?: 0 | 1
  scale?: LevelScale
  /** Locale para fechas y números (default: el del navegador). */
  locale?: string
  /** Animación de entrada escalonada. Respeta `prefers-reduced-motion`. */
  animate?: boolean
  showLegend?: boolean
  showTotal?: boolean
  /** Texto del encabezado. Por defecto: "N contributions in the last year". */
  title?: ReactNode
  /** Singular y plural de la unidad. Default `['contribution', 'contributions']`. */
  unit?: readonly [string, string]
  /**
   * Texto tras el total en el encabezado. Puede ser una función de las semanas
   * mostradas. Default: `in the last year` (52+ semanas) o `in the last N weeks`.
   */
  periodLabel?: string | ((weeks: number) => string)
  /** Textos de la leyenda. Default `['Less', 'More']`. */
  legendLabels?: readonly [string, string]
  onDayClick?: (day: CalendarDay) => void
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

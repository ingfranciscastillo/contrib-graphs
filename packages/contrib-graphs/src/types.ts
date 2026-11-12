import type { CSSProperties, ReactNode } from 'react'
import type { GraphTheme, ThemeName } from './themes'

/** One day of activity. `date` uses the ISO format `YYYY-MM-DD`. */
export interface ContributionDay {
  date: string
  count: number
}

/** Intensity level from 0 (no activity) to 4 (busiest). */
export type Level = 0 | 1 | 2 | 3 | 4

/**
 * How each count maps to a level from 0 to 4.
 * - `quantile`: by quartiles of the active days (like GitHub)
 * - `linear`: proportional to the maximum
 * - `[a, b, c, d]`: minimum count for levels 1, 2, 3 and 4
 */
export type LevelScale = 'quantile' | 'linear' | readonly [number, number, number, number]

/** `auto` follows `prefers-color-scheme`, or `data-theme="light|dark"` on `<html>`. */
export type ColorMode = 'auto' | 'light' | 'dark'

/** A day as laid out in the calendar, with its level and position. */
export interface CalendarDay extends ContributionDay {
  level: Level
  /** Flat index in `calendar.days`. */
  index: number
  /** Column (week) in the calendar. */
  weekIndex: number
  /** Row from 0 to 6, relative to `weekStart`. */
  dayIndex: number
  /** Actual day of the week, 0 = Sunday. */
  weekday: number
}

/** A month label and the week column where it starts. */
export interface MonthLabel {
  label: string
  weekIndex: number
  month: number
  year: number
}

/** The result of `buildCalendar`: a weeks × 7 grid plus totals and month labels. */
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

/** Props shared by every graph. */
export interface BaseGraphProps {
  /** Days of activity. Missing days count as 0 and duplicate dates are added up. */
  data: ContributionDay[]
  /**
   * A preset name or your own theme object.
   * @default 'github'
   */
  theme?: ThemeName | GraphTheme
  /**
   * `auto` follows `prefers-color-scheme`, or `data-theme="light|dark"` on `<html>`.
   * @default 'auto'
   */
  colorMode?: ColorMode
  /**
   * Number of weeks to show.
   * @default 53
   */
  weeks?: number
  /**
   * Last day of the calendar. When rendering on the server, always pass it:
   * the server and the browser may be on different days.
   * @default today
   */
  endDate?: string | Date
  /**
   * First day of each column: 0 = Sunday, 1 = Monday.
   * @default 0
   */
  weekStart?: 0 | 1
  /**
   * How counts map to the five color levels.
   * @default 'quantile'
   */
  scale?: LevelScale
  /**
   * Locale for dates and numbers. Fixed by default so server and client HTML match.
   * @default 'en'
   */
  locale?: string
  /**
   * Staggered entry animation. Turned off with `prefers-reduced-motion`.
   * @default false
   */
  animate?: boolean
  /**
   * Show the Less–More legend.
   * @default true
   */
  showLegend?: boolean
  /**
   * Show the header with the total.
   * @default true
   */
  showTotal?: boolean
  /**
   * Replaces the whole header text.
   * @default '{total} contributions in the last year'
   */
  title?: ReactNode
  /**
   * Singular and plural of the unit being counted.
   * @default ['contribution', 'contributions']
   */
  unit?: readonly [string, string]
  /**
   * Text after the total in the header. Can be a function of the weeks shown.
   * @default 'in the last year' (52+ weeks), otherwise 'in the last {weeks} weeks'
   */
  periodLabel?: string | ((weeks: number) => string)
  /**
   * Labels at both ends of the legend.
   * @default ['Less', 'More']
   */
  legendLabels?: readonly [string, string]
  /** Called when a day is clicked, or with Enter or Space while it is focused. */
  onDayClick?: (day: CalendarDay) => void
  /** Extra class name for the root element. */
  className?: string
  /** Inline styles for the root element. Theme CSS variables can be overridden here. */
  style?: CSSProperties
  /**
   * Accessible name of the graph.
   * @default a summary with the total and the date range
   */
  'aria-label'?: string
}

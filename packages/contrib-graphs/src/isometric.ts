import type { Calendar, CalendarDay } from './types'

export interface IsometricOptions {
  /** Width of each tile in px. @default 12 */
  tileSize?: number
  /** Height of the tallest column in px. @default 48 */
  maxHeight?: number
  /** `count` scales columns by the actual count; `level` uses five fixed heights. @default 'count' */
  heightBy?: 'count' | 'level'
}

export interface IsometricTile {
  day: CalendarDay
  /** Column height in px; 0 for days without activity (top face only). */
  height: number
  top: string
  left: string
  right: string
}

const r = (v: number) => Math.round(v * 100) / 100

/**
 * Geometry of the isometric view, shared by `IsometricGraph` and
 * `renderIsometricSvg` so the component and the static SVG look the same.
 * Tiles are sorted back to front (paint order).
 */
export function isometricLayout(calendar: Calendar, { tileSize = 12, maxHeight = 48, heightBy = 'count' }: IsometricOptions = {}) {
  const tw = tileSize
  const th = tileSize / 2
  const W = calendar.weeks.length
  const width = (W + 7) * (tw / 2)
  const height = (W + 7) * (th / 2) + maxHeight + 2
  const ox = 7 * (tw / 2)
  const max = Math.max(1, calendar.max)

  const tiles: IsometricTile[] = [...calendar.days]
    .sort((a, b) => a.weekIndex + a.dayIndex - (b.weekIndex + b.dayIndex) || a.weekIndex - b.weekIndex)
    .map((day) => {
      const X = ox + (day.weekIndex - day.dayIndex) * (tw / 2)
      const Y = maxHeight + (day.weekIndex + day.dayIndex) * (th / 2)
      const h = day.count === 0 ? 0 : heightBy === 'level' ? (day.level / 4) * maxHeight : Math.max(3, (day.count / max) * maxHeight)
      const p = (x: number, y: number) => `${r(x)},${r(y)}`
      return {
        day,
        height: h,
        top: [p(X, Y - h), p(X + tw / 2, Y + th / 2 - h), p(X, Y + th - h), p(X - tw / 2, Y + th / 2 - h)].join(' '),
        left: [p(X - tw / 2, Y + th / 2 - h), p(X, Y + th - h), p(X, Y + th), p(X - tw / 2, Y + th / 2)].join(' '),
        right: [p(X, Y + th - h), p(X + tw / 2, Y + th / 2 - h), p(X + tw / 2, Y + th / 2), p(X, Y + th)].join(' '),
      }
    })

  return { width, height, tiles }
}

/** Color percentage of the left and right faces (the rest is mixed with black). */
export const ISO_SHADES = { left: 78, right: 60 } as const

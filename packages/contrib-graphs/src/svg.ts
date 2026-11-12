import { ISO_SHADES, isometricLayout, type IsometricOptions } from './isometric'
import { resolveTheme, type GraphTheme, type ThemeName } from './themes'
import type { ContributionDay, LevelScale } from './types'
import { buildCalendar, computeStats, formatDate, formatNumber, pluralize } from './utils'

/** Options of `renderIsometricSvg`. */
export interface IsometricSvgOptions extends IsometricOptions {
  /**
   * Width of each tile in px.
   * @default 14
   */
  tileSize?: number
  /**
   * A preset name or your own theme object.
   * @default 'github'
   */
  theme?: ThemeName | GraphTheme
  /**
   * Which palette of the theme to use. Generate one file per mode for a README.
   * @default 'light'
   */
  mode?: 'light' | 'dark'
  /** @default 53 */
  weeks?: number
  /** Last day of the calendar. @default today */
  endDate?: string | Date
  /** @default 0 */
  weekStart?: 0 | 1
  /** @default 'quantile' */
  scale?: LevelScale
  /** @default 'en' */
  locale?: string
  /**
   * Show the total in the top-left corner.
   * @default true
   */
  showTotal?: boolean
  /**
   * Show longest streak, current streak and best day in the top-right corner.
   * @default true
   */
  showStats?: boolean
  /** @default ['longest streak', 'current streak', 'best day'] */
  statLabels?: readonly [string, string, string]
  /** @default ['contribution', 'contributions'] */
  unit?: readonly [string, string]
  /** @default 'in the last year' (52+ weeks), otherwise 'in the last {weeks} weeks' */
  periodLabel?: string | ((weeks: number) => string)
  /**
   * Paint the theme surface behind the graph. Off by default so it blends with GitHub's own background.
   * @default false
   */
  background?: boolean
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const HEADER = 34

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* -------------------------------------------- mezcla en OKLab (como color-mix del CSS) */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToHex([L, a, b]: [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255).toString(16).padStart(2, '0')).join('')
}

/** `color-mix(in oklab, color pct%, black)`: en OKLab el negro es (0, 0, 0). */
export function mixWithBlack(hex: string, pct: number): string {
  const [L, a, b] = hexToOklab(hex)
  const k = pct / 100
  return oklabToHex([L * k, a * k, b * k])
}

/**
 * Renders the isometric graph as a standalone SVG string: no JavaScript, no external CSS
 * and colors already resolved, so it works as an image in a GitHub README.
 * For light and dark READMEs, render once per `mode` and use a `<picture>` element.
 */
export function renderIsometricSvg(data: readonly ContributionDay[], options: IsometricSvgOptions = {}): string {
  const {
    mode = 'light',
    showTotal = true,
    showStats = true,
    statLabels = ['longest streak', 'current streak', 'best day'],
    background = false,
    locale,
  } = options
  const palette = resolveTheme(options.theme)[mode]
  const calendar = buildCalendar(data, { weeks: options.weeks, endDate: options.endDate, weekStart: options.weekStart, scale: options.scale, locale })
  // 14px por defecto: deja sitio al total y a las estadísticas en la primera línea.
  const layout = isometricLayout(calendar, { ...options, tileSize: options.tileSize ?? 14 })
  const stats = computeStats(calendar.days)
  const weeks = options.weeks ?? 53
  const period =
    typeof options.periodLabel === 'function'
      ? options.periodLabel(weeks)
      : (options.periodLabel ?? (weeks >= 52 ? 'in the last year' : `in the last ${weeks} weeks`))

  const pad = background ? 16 : 4
  const top = showTotal || showStats ? HEADER : 0
  const width = Math.ceil(layout.width + pad * 2)
  const height = Math.ceil(layout.height + top + pad * 2)
  const num = (n: number) => formatNumber(n, locale)
  const total = `${num(calendar.total)} ${pluralize(calendar.total, options.unit)}`
  const summary = `${total} ${period}`

  const shades = palette.levels.map((c) => ({ top: c, left: mixWithBlack(c, ISO_SHADES.left), right: mixWithBlack(c, ISO_SHADES.right) }))
  const tiles = layout.tiles
    .map(({ day, height: h, top: t, left, right }) => {
      const s = shades[day.level]
      const faces = h > 0 ? `<polygon points="${left}" fill="${s.left}"/><polygon points="${right}" fill="${s.right}"/>` : ''
      return `<g>${faces}<polygon points="${t}" fill="${s.top}"/></g>`
    })
    .join('')

  // Estadísticas en la esquina superior derecha, que la diagonal isométrica deja libre.
  const statLines = showStats
    ? [
        [num(stats.longestStreak), statLabels[0]],
        [num(stats.currentStreak), statLabels[1]],
        [num(stats.best?.count ?? 0), stats.best ? `${statLabels[2]} · ${formatDate(stats.best.date, locale, { month: 'short', day: 'numeric' })}` : statLabels[2]],
      ]
        .map(
          ([value, label], i) =>
            `<text x="${width - pad}" y="${pad + 14 + i * 20}" text-anchor="end"><tspan font-size="15" font-weight="600" fill="${palette.text}">${esc(value)}</tspan><tspan dx="6" font-size="11" fill="${palette.muted}">${esc(label)}</tspan></text>`,
        )
        .join('')
    : ''
  const totalText = showTotal
    ? `<text x="${pad}" y="${pad + 14}" font-size="13" fill="${palette.text}"><tspan font-weight="600">${esc(total)}</tspan> <tspan fill="${palette.muted}">${esc(period)}</tspan></text>`
    : ''

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cg-title" font-family="${esc(FONT)}">`,
    `<title id="cg-title">${esc(summary)}</title>`,
    background ? `<rect width="100%" height="100%" rx="10" fill="${palette.surface}"/>` : '',
    totalText,
    statLines,
    `<g transform="translate(${pad} ${pad + top})">${tiles}</g>`,
    '</svg>',
  ].join('')
}

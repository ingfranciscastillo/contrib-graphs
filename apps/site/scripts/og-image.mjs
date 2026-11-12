#!/usr/bin/env node
/**
 * Generates the social preview image (public/og.png, 1200×630) that X, LinkedIn,
 * Slack or Discord show when someone shares a link to the site:
 *
 *   npm run og          (needs the built package and a Chromium-based browser)
 *
 * Renders the real components with react-dom/server into an HTML page and takes a
 * screenshot with headless Chrome, so the image always matches the current design.
 * The browser comes from CHROME, or the first of a few common install paths.
 * The PNG is committed: it only changes when the design does.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ClassicGraph, IsometricGraph } from 'contrib-graphs'
import { generateSampleData, themes } from 'contrib-graphs/data'

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const OUT = resolve(SITE, 'public/og.png')
export const WIDTH = 1200
export const HEIGHT = 630

const END = '2026-11-08'
const data = generateSampleData({ seed: 21, profile: 'steady', endDate: new Date(`${END}T00:00:00Z`) })
const levels = themes.github.dark.levels

/** Same mini graph as the site logo, in the GitHub dark palette. */
const logo = [4, 2, 1, 3, 0, 2, 1, 3, 4]
  .map((l, i) => `<rect x="${(i % 3) * 7.5}" y="${Math.floor(i / 3) * 7.5}" width="6.5" height="6.5" rx="1.6" fill="${levels[l]}"/>`)
  .join('')

export async function ogHtml() {
  const styles = await readFile(resolve(SITE, '../../packages/contrib-graphs/dist/styles.css'), 'utf8')
  const common = { data, endDate: END, theme: 'github', colorMode: 'dark', locale: 'en' }
  const iso = renderToStaticMarkup(h(IsometricGraph, { ...common, weeks: 26, tileSize: 19, maxHeight: 120, showStats: false, showTotal: false, showLegend: false }))
  const grid = renderToStaticMarkup(h(ClassicGraph, { ...common, weeks: 43, cellSize: 13, gap: 3, showWeekdays: false, showTotal: false, showLegend: false }))
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@500&display=block" />
<style>
${styles}
* { box-sizing: border-box; }
html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
body {
  background: #0b0c0e; color: #ececec; font-family: 'IBM Plex Sans', sans-serif;
  display: grid; grid-template-columns: 500px 1fr; grid-template-rows: 1fr auto;
  padding: 56px 64px 48px;
}
.copy { display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 14px; font: 500 26px 'JetBrains Mono', monospace; }
.brand span { color: #82858b; }
h1 { margin: auto 0 0; font: 700 64px/1.02 'Bricolage Grotesque', sans-serif; letter-spacing: -0.02em; }
p { margin: 22px 0 0; font-size: 25px; line-height: 1.4; color: #a5a7ab; max-width: 30ch; }
.iso { display: flex; align-items: center; justify-content: center; margin: 0 -24px 0 24px; }
.grid { grid-column: 1 / -1; margin-top: 40px; padding-top: 28px; border-top: 1px solid #1f2024;
  display: flex; align-items: center; justify-content: space-between; gap: 32px; }
.grid .cg-root { flex: none; }
.cmd { flex: none; font: 500 22px 'JetBrains Mono', monospace; color: #ececec;
  border: 1px solid #2c2d32; border-radius: 12px; padding: 14px 20px; background: #121316; }
.cmd span { color: ${levels[3]}; }
.cg-root { --cg-bg: transparent; background: transparent; }
</style></head>
<body>
  <div class="copy">
    <div class="brand"><svg width="34" height="34" viewBox="0 0 22 22">${logo}</svg><div>contrib<span>/graphs</span></div></div>
    <h1>Contribution graphs for React</h1>
    <p>Seven designs for your portfolio. Install from npm or copy the source.</p>
  </div>
  <div class="iso">${iso}</div>
  <div class="grid">${grid}<div class="cmd"><span>$</span> npm i contrib-graphs</div></div>
</body></html>`
}

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/brave-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  const found = candidates.find((p) => p && existsSync(p))
  if (!found) throw new Error('No Chromium-based browser found. Set CHROME to its path.')
  return found
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = await mkdtemp(join(tmpdir(), 'cg-og-'))
  try {
    const page = join(dir, 'og.html')
    await writeFile(page, await ogHtml())
    execFileSync(findChrome(), [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--user-data-dir=${join(dir, 'profile')}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      '--virtual-time-budget=8000',
      `--screenshot=${OUT}`,
      pathToFileURL(page).href,
    ], { stdio: 'ignore' })
    console.log(`og image → ${OUT}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

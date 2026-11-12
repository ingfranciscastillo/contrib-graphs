# contrib-graphs

Contribution graph components for React: GitHub-style activity heatmaps in seven designs (Classic, Dots, Isometric, Terminal, Radial, Skyline, Compact), with themes, light/dark mode, keyboard navigation and screen reader support.

```bash
npm install contrib-graphs
```

```tsx
import { ClassicGraph } from 'contrib-graphs'
import 'contrib-graphs/styles.css'

const data = [
  { date: '2026-11-10', count: 4 },
  { date: '2026-11-11', count: 9 },
]

export function Activity() {
  return <ClassicGraph data={data} theme="github" animate />
}
```

Every component takes the same `{ date, count }[]` data. Adapters for GitHub and GitLab (`fromGitHub`, `fromGitLab`, `fetchGitHubContributions`, `fetchGitLabContributions`) and generic sources (`fromDates`, `mergeSources`) are included.

Requires React 18 or later.

## Next.js, Astro and server rendering

- `contrib-graphs` exports the components and starts with `"use client"`, so you can render them straight from a Next.js Server Component.
- `contrib-graphs/data` exports everything else (calendar helpers, themes, adapters, sample data) with no React dependency. Use it on the server, for example `fetchGitHubContributions` in a Server Component or an Astro page.
- In Astro (with `@astrojs/react`), a graph without a `client:*` directive ships as static HTML with no JavaScript; add `client:visible` for tooltips and keyboard navigation. Functions can't be passed to islands, so wrap the graph in a React component to use `onDayClick`.
- When rendering on the server, pass `endDate` (for real data, the last date in it): the server and the browser may be on different days. Dates and numbers default to the `en` locale on both sides.

```tsx
// app/page.tsx (Next.js)
import { ClassicGraph } from 'contrib-graphs'
import { fetchGitHubContributions } from 'contrib-graphs/data'

export default async function Page() {
  const data = await fetchGitHubContributions('your-username', process.env.GITHUB_TOKEN!)
  return <ClassicGraph data={data} endDate={data.at(-1)?.date} />
}
```

Tested with Next.js 16 (React 19) and Astro 6.

## Contribution graph in your GitHub profile README

The package includes a CLI that writes a light and a dark isometric SVG with no JavaScript or external CSS:

```bash
npx contrib-graphs svg --user your-username --out-dir img
```

Options: `--theme`, `--lang en|es`, `--weeks`, `--background`, `--no-stats`, `--name`, and `--input file.json` to use your own data. With `GITHUB_TOKEN` it uses the GraphQL API (a classic token with `read:user` includes private contributions); without it, or if the API fails, it reads the public contributions page.

Show the right one for each visitor's theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./img/contributions-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./img/contributions-light.svg">
  <img alt="My GitHub contribution graph" src="./img/contributions-light.svg">
</picture>
```

To keep it current, run it daily from a GitHub Action in your profile repository:

```yaml
name: Contribution graph
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:
permissions:
  contents: write
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npx --yes contrib-graphs@latest svg --user your-username --out-dir img
        env:
          GITHUB_TOKEN: ${{ secrets.CONTRIB_TOKEN || secrets.GITHUB_TOKEN }}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add img
          git diff --staged --quiet || (git commit -m "chore: update contribution graph" && git push)
```

In code, `renderIsometricSvg(data, { mode: 'dark' })` from `contrib-graphs/data` returns the same SVG as a string.

## License

MIT

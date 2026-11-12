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

## License

MIT

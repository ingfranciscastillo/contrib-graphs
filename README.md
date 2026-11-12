# contrib/graphs

Componentes de contribution graph para portfolios (React + TypeScript), con un sitio de demo en Vite + TanStack Router.

## Correr

Requiere Node 18+ (Vite 6). Con nvm: `nvm use 22`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de producción
```

## Estructura

```
src/
  components/contribution-graph/   ← la librería (copiable a cualquier proyecto React 18+)
    index.ts                       exports públicos + CSS
    types.ts                       ContributionDay, BaseGraphProps…
    utils.ts                       calendario, niveles, recorte, estadísticas, formato
    core.tsx                       interacción (hover/teclado), tooltip, shell común
    themes.ts                      7 presets claro/oscuro → CSS variables
    contribution-graph.css
    adapters/                      GitHub, GitLab, fromDates, mergeSources
    sample.ts                      datos de ejemplo deterministas
    variants/                      Classic, Dots, Isometric, Terminal, Radial, Skyline, Compact
  site/                            demo: galería, playground por variante, docs
    router.tsx                     rutas code-based de TanStack Router
    search.ts                      estado global (tema, datos, idioma) en la URL
    variants.tsx                   registro de variantes + controles del playground
```

## Uso

```tsx
import { ClassicGraph } from '@/components/contribution-graph'

<ClassicGraph data={[{ date: '2026-11-11', count: 4 }]} theme="github" animate />
```

Ver `/docs` en el sitio para adapters (GitHub/GitLab), temas propios, i18n y accesibilidad.

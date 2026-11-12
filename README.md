# contrib/graphs

Componentes de contribution graph para React (estilo GitHub/GitLab) en siete diseños, y el sitio de demo y documentación.

## Estructura

```
packages/contrib-graphs/   paquete de npm `contrib-graphs` (tsdown: ESM + CJS + tipos)
apps/site/                 sitio: Vite + React + TanStack Router
```

## Desarrollo

Requiere Node 20.19+ (`nvm use` lee `.nvmrc`).

```bash
npm install
npm run dev            # sitio en http://localhost:5173, usa el código fuente del paquete
npm run build          # compila el paquete y luego el sitio (que usa el dist del paquete)
npm run data           # actualiza los datos reales de GitHub (ver apps/site/.env.example)
npm run typecheck
npm test               # tipos + tests del paquete (Vitest) + tests del script de datos (node --test)
```

El sitio importa `contrib-graphs` igual que lo haría cualquier proyecto. En desarrollo Vite lo apunta a
`packages/contrib-graphs/src` para tener HMR; en `vite build` usa el `dist` compilado.

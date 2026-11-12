import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/contrib-graphs/${p}`, import.meta.url))

export default defineConfig(({ command }) => ({
  // GitHub Pages sirve el sitio en /<repositorio>/: el workflow pasa BASE_PATH=/contrib-graphs/.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    // En desarrollo se usa el código fuente del paquete (HMR sin compilarlo).
    // En `vite build` se usa su `dist`, así el build del sitio prueba el paquete publicado.
    alias:
      command === 'serve'
        ? [
            { find: /^contrib-graphs$/, replacement: pkg('src/index.ts') },
            { find: /^contrib-graphs\/styles\.css$/, replacement: pkg('src/styles.css') },
            { find: /^contrib-graphs\/data$/, replacement: pkg('src/data.ts') },
          ]
        : [],
  },
}))

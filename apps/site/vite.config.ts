import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const pkg = (p: string) => fileURLToPath(new URL(`../../packages/contrib-graphs/${p}`, import.meta.url))

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    // En desarrollo se usa el código fuente del paquete (HMR sin compilarlo).
    // En `vite build` se usa su `dist`, así el build del sitio prueba el paquete publicado.
    alias:
      command === 'serve'
        ? [
            { find: /^contrib-graphs$/, replacement: pkg('src/index.ts') },
            { find: /^contrib-graphs\/styles\.css$/, replacement: pkg('src/styles.css') },
          ]
        : [],
  },
}))

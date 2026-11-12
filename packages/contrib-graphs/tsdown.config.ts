import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', data: 'src/data.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  // Solo el entry de componentes es "use client". `data` queda usable en el servidor.
  banner: ({ fileName }) => (/^index\.c?js$/.test(fileName) ? `'use client';` : ''),
  // El CSS no se importa desde JS: quien usa el paquete lo importa una vez
  // (`import 'contrib-graphs/styles.css'`), así funciona igual en Vite, Next y Astro.
  copy: [{ from: 'src/styles.css', to: 'dist' }],
  exports: {
    customExports(exports) {
      exports['./styles.css'] = './dist/styles.css'
      return exports
    },
  },
})

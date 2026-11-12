import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', data: 'src/data.ts', bin: 'src/bin.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  // Solo el entry de componentes es "use client". `data` queda usable en el servidor.
  // `bin` es el ejecutable del CLI (`npx contrib-graphs`) y lleva shebang.
  banner: ({ fileName }) => (/^index\.c?js$/.test(fileName) ? `'use client';` : /^bin\.c?js$/.test(fileName) ? '#!/usr/bin/env node' : ''),
  // El CSS no se importa desde JS: quien usa el paquete lo importa una vez
  // (`import 'contrib-graphs/styles.css'`), así funciona igual en Vite, Next y Astro.
  copy: [{ from: 'src/styles.css', to: 'dist' }],
  exports: {
    customExports(exports) {
      exports['./styles.css'] = './dist/styles.css'
      delete exports['./bin'] // el CLI no se importa: se ejecuta
      return exports
    },
  },
})

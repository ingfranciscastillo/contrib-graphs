import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
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

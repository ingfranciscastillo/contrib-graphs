import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Lógica pura en Node; los tests de componentes declaran `// @vitest-environment jsdom`.
    environment: 'node',
  },
})

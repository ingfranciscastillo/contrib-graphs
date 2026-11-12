import { expect, test, vi } from 'vitest'

// Si algo del entry `data` importara React, este mock lo haría fallar:
// `contrib-graphs/data` tiene que poder usarse en el servidor sin React.
vi.mock('react', () => {
  throw new Error('contrib-graphs/data no debe importar React')
})

test('el entry data no depende de React', async () => {
  const data = await import('../data')
  expect(typeof data.buildCalendar).toBe('function')
  expect(typeof data.fetchGitHubContributions).toBe('function')
  expect(Object.keys(data.themes)).toContain('github')
})

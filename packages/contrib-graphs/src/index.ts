/**
 * `contrib-graphs`: the components. The build prepends "use client" to this
 * file so they can be imported from Server Components (Next.js).
 * In server code, use `contrib-graphs/data`.
 */
export { ClassicGraph, DotsGraph, type GridGraphProps } from './variants/GridGraph'
export { IsometricGraph, type IsometricGraphProps } from './variants/IsometricGraph'
export { RadialGraph, type RadialGraphProps } from './variants/RadialGraph'
export { SkylineGraph, type SkylineGraphProps, type SkylineWeek } from './variants/SkylineGraph'
export { TerminalGraph, terminalCharsets, type TerminalGraphProps, type TerminalCharset } from './variants/TerminalGraph'
export { CompactGraph, type CompactGraphProps } from './variants/CompactGraph'

// Also exported here for convenience in client-only apps (Vite, CRA…).
export * from './data'

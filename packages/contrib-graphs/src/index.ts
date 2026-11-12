/**
 * `contrib-graphs`: los componentes. El build antepone "use client" a este
 * archivo para que se puedan importar desde Server Components (Next.js).
 * En código de servidor usa `contrib-graphs/data`.
 */
export { ClassicGraph, DotsGraph, type GridGraphProps } from './variants/GridGraph'
export { IsometricGraph, type IsometricGraphProps } from './variants/IsometricGraph'
export { RadialGraph, type RadialGraphProps } from './variants/RadialGraph'
export { SkylineGraph, type SkylineGraphProps, type SkylineWeek } from './variants/SkylineGraph'
export { TerminalGraph, terminalCharsets, type TerminalGraphProps, type TerminalCharset } from './variants/TerminalGraph'
export { CompactGraph, type CompactGraphProps } from './variants/CompactGraph'

// También desde aquí por comodidad en apps solo cliente (Vite, CRA…).
export * from './data'

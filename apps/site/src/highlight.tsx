import type { ReactNode } from 'react'
import { tokenize } from 'sugar-high/lang/typescript'

/**
 * Coloreado de sintaxis para los bloques de código del sitio.
 *
 * TSX/TS: el tokenizador de Sugar High (~1 KB), importado solo para TypeScript para no
 * arrastrar sus otros lenguajes al bundle. Los tokens se pintan como elementos de React
 * (sin innerHTML) con clases cuyos colores salen de variables CSS del tema del sitio.
 *
 * Terminal: un tokenizador mínimo propio, porque los comandos del sitio son siempre
 * `gestor subcomando argumentos` y el modo shell de Sugar High parte las URL en trozos.
 */

/** Orden de los índices que devuelve tokenize (TokenType de sugar-high/core). */
const TYPES = ['identifier', 'keyword', 'string', 'class', 'property', 'entity', 'jsxliterals', 'sign', 'comment', 'break', 'space'] as const

type Token = [type: string, value: string]

function tsTokens(code: string): Token[] {
  const out: Token[] = []
  const push = (type: string, value: string) => {
    const last = out[out.length - 1]
    // Junta tokens seguidos del mismo tipo: menos nodos, mismo resultado.
    if (last && last[0] === type) last[1] += value
    else out.push([type, value])
  }
  // Los comentarios HTML (<!-- -->, en los ejemplos de Astro) no son JS: se marcan aparte.
  for (const part of code.split(/(<!--[\s\S]*?-->)/)) {
    if (part.startsWith('<!--')) push('comment', part)
    else for (const [i, value] of tokenize(part, {})) push(TYPES[i] ?? 'identifier', value)
  }
  return out
}

const SUBCOMMANDS = new Set(['add', 'install', 'i', 'dlx', 'init', 'run', 'publish'])

function shellTokens(code: string): Token[] {
  const out: Token[] = []
  for (const [n, line] of code.split('\n').entries()) {
    if (n > 0) out.push(['space', '\n'])
    if (line.trimStart().startsWith('#')) {
      out.push(['comment', line])
      continue
    }
    let word = 0
    for (const part of line.split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) out.push(['space', part])
      else if (word++ === 0) out.push(['keyword', part])
      else if (part.startsWith('-')) out.push(['property', part])
      else if (SUBCOMMANDS.has(part)) out.push(['entity', part])
      else out.push(['string', part])
    }
  }
  return out
}

const SHELL = new Set(['bash', 'sh', 'shell'])
const PLAIN = new Set(['text', 'txt', 'json'])

/** Devuelve el código como nodos coloreados; si el lenguaje no se conoce, como texto plano. */
export function highlightCode(code: string, lang = 'tsx'): ReactNode {
  if (PLAIN.has(lang)) return code
  const tokens = SHELL.has(lang) ? shellTokens(code) : tsTokens(code)
  return tokens.map(([type, value], i) =>
    type === 'space' || type === 'break' ? value : (
      <span key={i} className={`tk-${type}`}>
        {value}
      </span>
    ),
  )
}

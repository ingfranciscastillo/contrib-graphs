#!/usr/bin/env node
/**
 * Genera la referencia de la API a partir de los tipos del paquete, para que la
 * documentación nunca se desincronice del código:
 *
 *   npm run api        (escribe src/data/api.json)
 *
 * Lee con el compilador de TypeScript los componentes que exporta `contrib-graphs`
 * (sus props, tipos, @default y descripciones JSDoc) y las funciones y constantes
 * de `contrib-graphs/data`. Un test comprueba que el JSON está al día.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PKG = resolve(SITE, '../../packages/contrib-graphs/src')
export const OUT = resolve(SITE, 'src/data/api.json')

const COMPONENTS = ['ClassicGraph', 'DotsGraph', 'IsometricGraph', 'TerminalGraph', 'RadialGraph', 'SkylineGraph', 'CompactGraph']

export function extractApi() {
  const program = ts.createProgram([resolve(PKG, 'index.ts'), resolve(PKG, 'data.ts')], {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    strict: true,
    skipLibCheck: true,
  })
  const checker = program.getTypeChecker()
  const exportsOf = (file) => {
    const sf = program.getSourceFile(resolve(PKG, file))
    return checker.getExportsOfModule(checker.getSymbolAtLocation(sf)).map((s) => (s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s))
  }
  const doc = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim()
  const defaultOf = (symbol) => {
    const tag = symbol.getJsDocTags(checker).find((t) => t.name === 'default')
    return tag ? ts.displayPartsToString(tag.text).trim() : null
  }

  // ---------------------------------------------------------------- componentes
  const index = new Map(exportsOf('index.ts').map((s) => [s.name, s]))
  const components = COMPONENTS.map((name) => {
    const symbol = index.get(name)
    if (!symbol) throw new Error(`${name} no se exporta desde contrib-graphs`)
    const decl = symbol.valueDeclaration
    const sig = checker.getSignaturesOfType(checker.getTypeOfSymbolAtLocation(symbol, decl), ts.SignatureKind.Call)[0]
    const param = sig.getParameters()[0]
    const propsType = checker.getTypeOfSymbolAtLocation(param, decl)
    const props = checker.getPropertiesOfType(propsType).map((p) => {
      // Las props de Omit<…> son sintéticas: su declaración original está en el tipo base.
      const d = p.valueDeclaration ?? p.declarations?.[0] ?? p.links?.syntheticOrigin?.declarations?.[0]
      const owner = d && ts.isInterfaceDeclaration(d.parent) ? d.parent.name.text : null
      const typeText = d && 'type' in d && d.type ? d.type.getText() : checker.typeToString(checker.getNonNullableType(checker.getTypeOfSymbol(p)))
      return {
        name: p.name,
        type: typeText.replace(/\s+/g, ' '),
        required: !(p.flags & ts.SymbolFlags.Optional),
        default: defaultOf(p),
        description: doc(p),
        shared: owner === 'BaseGraphProps',
      }
    })
    // Primero las props propias de la variante, luego las compartidas; `data` siempre arriba.
    props.sort((a, b) => Number(b.name === 'data') - Number(a.name === 'data') || Number(a.shared) - Number(b.shared))
    return {
      name,
      propsType: checker.typeToString(propsType),
      description: doc(symbol),
      props,
    }
  })

  // ---------------------------------------------------------------- data
  const functions = []
  const constants = []
  for (const symbol of exportsOf('data.ts')) {
    const decl = symbol.valueDeclaration
    if (!decl) continue // tipos e interfaces
    const type = checker.getTypeOfSymbolAtLocation(symbol, decl)
    const sigs = checker.getSignaturesOfType(type, ts.SignatureKind.Call)
    if (sigs.length && (ts.isFunctionDeclaration(decl) || ts.isVariableDeclaration(decl))) {
      functions.push({
        name: symbol.name,
        signature: `${symbol.name}${checker.signatureToString(sigs[0], undefined, ts.TypeFormatFlags.NoTruncation)}`.replace(/\s+/g, ' '),
        description: doc(symbol),
      })
    } else {
      constants.push({ name: symbol.name, description: doc(symbol) })
    }
  }
  functions.sort((a, b) => a.name.localeCompare(b.name))
  constants.sort((a, b) => a.name.localeCompare(b.name))

  return { components, functions, constants }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const api = extractApi()
  await writeFile(OUT, JSON.stringify(api, null, 2) + '\n')
  const props = api.components.reduce((n, c) => n + c.props.length, 0)
  console.log(`API: ${api.components.length} componentes, ${props} props, ${api.functions.length} funciones → src/data/api.json`)
}

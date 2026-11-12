// Verifica el build: solo el entry de componentes lleva "use client".
// Algunos bundlers quitan las directivas; si pasa, Next.js no podría importar
// los componentes desde Server Components, o el entry `data` dejaría de servir en el servidor.
import { readdir, readFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const files = (await readdir(dist)).filter((f) => /\.c?js$/.test(f))
const problems = []
for (const f of files) {
  const src = await readFile(new URL(f, dist), 'utf8')
  const hasDirective = /^(['"])use client\1;?/.test(src)
  const isClientEntry = /^index\.c?js$/.test(f)
  if (isClientEntry && !hasDirective) problems.push(`${f}: falta "use client" en la primera línea`)
  if (!isClientEntry && hasDirective) problems.push(`${f}: no debería llevar "use client"`)
  if (!isClientEntry && /from ['"]react|require\(['"]react/.test(src)) problems.push(`${f}: importa React pero es código de servidor`)
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`dist OK: ${files.length} archivos, "use client" solo en index`)

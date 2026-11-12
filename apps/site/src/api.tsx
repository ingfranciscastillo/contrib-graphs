import { Fragment } from 'react'
import { apiText } from './api-es'
import api from './data/api.json'
import type { Lang } from './i18n'

/** Referencia generada desde los tipos del paquete (`npm run api`). */
export type ApiProp = (typeof api.components)[number]['props'][number]
export const apiComponents = api.components
export const apiFunctions = api.functions
export const apiConstants = api.constants

export const componentApi = (name: string) => api.components.find((c) => c.name === name)

/** Props que comparten todas las variantes (las de BaseGraphProps en ClassicGraph). */
export const sharedProps = api.components[0].props.filter((p) => p.shared)

/** Convierte `código` dentro de un texto en <code>. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  )
}

const headers = {
  en: { prop: 'Prop', type: 'Type', default: 'Default', description: 'Description', required: 'required' },
  es: { prop: 'Prop', type: 'Tipo', default: 'Default', description: 'Descripción', required: 'obligatoria' },
}

/** Tabla de props: en pantallas angostas cada fila se apila como una tarjeta. */
export function PropsTable({ props, lang }: { props: ApiProp[]; lang: Lang }) {
  const h = headers[lang]
  return (
    <div className="props-table" role="region" aria-label={h.prop}>
      <table>
        <thead>
          <tr>
            <th scope="col">{h.prop}</th>
            <th scope="col">{h.type}</th>
            <th scope="col">{h.default}</th>
            <th scope="col">{h.description}</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name} id={`prop-${p.name}`}>
              <th scope="row" data-label={h.prop}>
                <code>{p.name}</code>
                {p.required && <span className="req">{h.required}</span>}
              </th>
              <td data-label={h.type}>
                <code className="type">{p.type}</code>
              </td>
              <td data-label={h.default}>{p.default ? <code>{apiText(p.default, lang)}</code> : <span className="none">—</span>}</td>
              <td data-label={h.description}>
                <Inline text={apiText(p.description, lang)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

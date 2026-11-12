import { useParams } from '@tanstack/react-router'

/** Idiomas del sitio. Inglés en la raíz (`/docs`), español con prefijo (`/es/docs`). */
export type Lang = 'en' | 'es'
export const langs: readonly Lang[] = ['en', 'es']

/** Idioma de la página actual, leído del parámetro opcional `{-$locale}`. */
export function useLang(): Lang {
  const { locale } = useParams({ strict: false }) as { locale?: string }
  return locale === 'es' ? 'es' : 'en'
}

/** Params de `<Link>` para un idioma: el inglés no lleva prefijo. */
export const localeParams = (lang: Lang) => ({ locale: lang === 'es' ? 'es' : undefined })

export function useLocaleParams() {
  return localeParams(useLang())
}

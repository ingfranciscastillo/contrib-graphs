import { createRootRoute, createRoute, createRouter, notFound } from '@tanstack/react-router'
import { Layout, NotFound } from './Layout'
import { ApiPage } from './pages/ApiPage'
import { Docs } from './pages/Docs'
import { Gallery } from './pages/Gallery'
import { VariantPage } from './pages/VariantPage'
import { validateGlobalSearch } from './search'
import { variantsById } from './variants'

// Rutas definidas en código (code-based routing): sin plugin ni archivo generado.
const rootRoute = createRootRoute({
  component: Layout,
  notFoundComponent: NotFound,
  validateSearch: validateGlobalSearch,
})

// Idioma como parámetro opcional: /docs (inglés) y /es/docs (español).
const localeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/{-$locale}',
  beforeLoad: ({ params }) => {
    if (params.locale !== undefined && params.locale !== 'es') throw notFound()
  },
})

const indexRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: '/',
  component: Gallery,
})

const variantRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: '/variants/$variantId',
  loader: ({ params }) => {
    if (!variantsById[params.variantId]) throw notFound()
  },
  component: VariantPage,
})

const docsRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: '/docs',
  component: Docs,
})

const apiRoute = createRoute({
  getParentRoute: () => localeRoute,
  path: '/docs/api',
  component: ApiPage,
})

const routeTree = rootRoute.addChildren([localeRoute.addChildren([indexRoute, variantRoute, docsRoute, apiRoute])])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

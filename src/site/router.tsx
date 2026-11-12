import { createRootRoute, createRoute, createRouter, notFound } from '@tanstack/react-router'
import { Layout, NotFound } from './Layout'
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

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Gallery,
})

const variantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/variants/$variantId',
  loader: ({ params }) => {
    if (!variantsById[params.variantId]) throw notFound()
  },
  component: VariantPage,
})

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: Docs,
})

const routeTree = rootRoute.addChildren([indexRoute, variantRoute, docsRoute])

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

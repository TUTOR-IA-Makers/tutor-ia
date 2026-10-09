import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import type { Services } from '@/services'
import { createMockServices, type MockOptions } from '@/services/mock'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}

export function createTestServices(options: MockOptions = {}): Services {
  return createMockServices({ latencyMs: 0, stepMs: 60_000, ...options })
}

export interface RenderOptions {
  client?: QueryClient
  services?: Services
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const client = options.client ?? createTestQueryClient()
  const services = options.services ?? createTestServices()
  return {
    client,
    services,
    ...render(
      <AppProviders client={client} services={services}>
        {ui}
      </AppProviders>,
    ),
  }
}

export function renderRoutes(
  routes: RouteObject[],
  initialPath = '/',
  options: RenderOptions = {},
) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  return { router, ...renderWithProviders(<RouterProvider router={router} />, options) }
}

export function renderInRouter(ui: ReactElement, initialPath = '/', options: RenderOptions = {}) {
  return renderRoutes([{ path: '*', element: ui }], initialPath, options)
}

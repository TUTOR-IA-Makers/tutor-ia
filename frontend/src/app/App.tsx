import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import type { Services } from '@/services'
import { AppProviders } from './AppProviders'
import { createQueryClient } from './queryClient'
import { routes } from './routes'

export interface AppProps {
  services: Services
}

export function App({ services }: AppProps) {
  const [client] = useState(createQueryClient)
  const [router] = useState(() => createBrowserRouter(routes))

  return (
    <AppProviders client={client} services={services}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

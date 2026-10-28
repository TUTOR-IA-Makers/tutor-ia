import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui'
import { ServicesProvider, type Services } from '@/services'

export interface AppProvidersProps {
  client: QueryClient
  services: Services
  children: ReactNode
}

export function AppProviders({ client, services, children }: AppProvidersProps) {
  return (
    <ServicesProvider services={services}>
      <QueryClientProvider client={client}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </ServicesProvider>
  )
}

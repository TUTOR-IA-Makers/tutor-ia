import type { ReactNode } from 'react'
import type { Services } from './contracts'
import { ServicesContext } from './servicesContext'

export interface ServicesProviderProps {
  services: Services
  children: ReactNode
}

export function ServicesProvider({ services, children }: ServicesProviderProps) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

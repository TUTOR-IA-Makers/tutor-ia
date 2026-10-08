import { createContext, useContext } from 'react'
import type { Services } from './contracts'

export const ServicesContext = createContext<Services | null>(null)

export function useServices(): Services {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('useServices precisa estar dentro de <ServicesProvider>')
  return services
}

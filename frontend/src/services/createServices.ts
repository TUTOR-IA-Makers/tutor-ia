import type { ApiMode, Services } from './contracts'
import { createHttpServices } from './http/createHttpServices'

export interface ServicesEnv {
  VITE_PUBLIC_API_MODE?: string
  VITE_PUBLIC_API_BASE_URL?: string
  PROD?: boolean
}

// A production build must never fall back to fake data by accident, so there mock is opt-in.
export function resolveApiMode(value: string | undefined, production: boolean): ApiMode {
  if (value === 'http' || value === 'mock') return value
  return production ? 'http' : 'mock'
}

export async function createServices(env: ServicesEnv = import.meta.env): Promise<Services> {
  if (resolveApiMode(env.VITE_PUBLIC_API_MODE, env.PROD ?? false) === 'mock') {
    // Loaded on demand so the fixtures stay out of the entry chunk of an http build.
    const { createMockServices } = await import('./mock/createMockServices')
    return createMockServices()
  }
  const baseUrl = env.VITE_PUBLIC_API_BASE_URL
  return createHttpServices(baseUrl ? { baseUrl } : {})
}

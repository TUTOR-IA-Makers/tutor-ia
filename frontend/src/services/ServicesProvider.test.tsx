import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMockServices } from './mock/createMockServices'
import { ServicesProvider } from './ServicesProvider'
import { useServices } from './servicesContext'

describe('ServicesProvider', () => {
  it('entrega os serviços para os hooks', () => {
    const services = createMockServices()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ServicesProvider services={services}>{children}</ServicesProvider>
    )
    const { result } = renderHook(() => useServices(), { wrapper })
    expect(result.current).toBe(services)
  })

  it('falha com mensagem clara fora do provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => renderHook(() => useServices())).toThrow(/ServicesProvider/)
  })
})

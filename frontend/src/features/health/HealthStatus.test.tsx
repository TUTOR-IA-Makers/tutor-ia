import { screen } from '@testing-library/react'
import { HttpError } from '@/lib/http'
import { createTestServices, renderInRouter } from '@/test/render'
import { HealthStatus } from './HealthStatus'

describe('HealthStatus', () => {
  it('mostra carregamento e depois a versão do servidor', async () => {
    renderInRouter(<HealthStatus />)
    expect(screen.getByText('Verificando o servidor')).toBeInTheDocument()
    expect(await screen.findByText('Servidor ativo, versão mock')).toBeInTheDocument()
  })

  it('informa indisponibilidade quando a API falha', async () => {
    const base = createTestServices()
    const services = { ...base, system: { health: () => Promise.reject(new HttpError(503, '')) } }
    renderInRouter(<HealthStatus />, '/', { services })
    expect(await screen.findByText('Servidor indisponível')).toBeInTheDocument()
  })
})

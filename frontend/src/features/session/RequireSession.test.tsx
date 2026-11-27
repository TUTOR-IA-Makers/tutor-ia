import { screen } from '@testing-library/react'
import { HttpError, NetworkError } from '@/lib/http'
import { createTestServices, renderRoutes } from '@/test/render'
import { RequireSession } from './RequireSession'

const routes = [
  {
    element: <RequireSession />,
    children: [{ path: '/biblioteca', element: <p>Biblioteca</p> }],
  },
  { path: '/entrar', element: <p>Entrar</p> },
]

function withSession(currentTeacher: () => Promise<never>) {
  const services = createTestServices()
  services.session.currentTeacher = currentTeacher
  return services
}

describe('RequireSession', () => {
  it('mostra a página quando há sessão', async () => {
    renderRoutes(routes, '/biblioteca')
    expect(await screen.findByText('Biblioteca')).toBeInTheDocument()
  })

  it('sem sessão, leva ao login guardando para onde voltar', async () => {
    const services = withSession(() => Promise.reject(new HttpError(401, '')))
    const { router } = renderRoutes(routes, '/biblioteca?estado=GERADA', { services })
    expect(await screen.findByText('Entrar')).toBeInTheDocument()
    expect(router.state.location.search).toBe(
      `?proximo=${encodeURIComponent('/biblioteca?estado=GERADA')}`,
    )
  })

  it('outra falha não tira o professor da página', async () => {
    const services = withSession(() => Promise.reject(new NetworkError('offline')))
    renderRoutes(routes, '/biblioteca', { services })
    expect(await screen.findByText('Biblioteca')).toBeInTheDocument()
  })
})

import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { blockingViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'
import { createClock } from '@/test/services'
import { createMockServices } from '@/services/mock'
import { MAIN_CONTENT_ID } from './layout/RootLayout'
import { routes } from './routes'

describe('rotas da aplicação', () => {
  it('redireciona a raiz para a biblioteca', async () => {
    const { router } = renderRoutes(routes, '/')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Biblioteca de questões' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/biblioteca')
  })

  it('a navbar é a mesma em todas as telas e marca a página ativa', async () => {
    const user = userEvent.setup()
    renderRoutes(routes, '/biblioteca')
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: 'Biblioteca' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(within(nav).getByRole('link', { name: 'Gerar questão' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Configurar nova questão' }),
    ).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Gerar questão' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(within(nav).getByRole('link', { name: 'Ajuda' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Ajuda' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID)
  })

  it('o primeiro Tab leva ao link de pular para o conteúdo', async () => {
    const user = userEvent.setup()
    renderRoutes(routes, '/ajuda')
    await screen.findByRole('heading', { level: 1, name: 'Ajuda' })
    await user.tab()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveFocus()
  })

  it('mostra 404 com o caminho pedido e caminho de volta', async () => {
    const user = userEvent.setup()
    const { router } = renderRoutes(routes, '/nao-existe')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('/nao-existe')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Voltar à biblioteca' }))
    expect(router.state.location.pathname).toBe('/biblioteca')
  })

  it('escapa o caminho exibido no 404 em vez de interpretá-lo como HTML', () => {
    renderRoutes(routes, '/<img src=x onerror=alert(1)>')
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('fluxo completo: gerar, acompanhar, revisar, aprovar e exportar', async () => {
    const user = userEvent.setup()
    const { clock, now } = createClock()
    const services = createMockServices({ latencyMs: 0, stepMs: 1000, now })
    const { router } = renderRoutes(routes, '/gerar', { services })

    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Conteúdo de programação/ }),
      'condicionais',
    )
    await user.click(
      within(screen.getByRole('group', { name: 'Estruturas obrigatórias' })).getByRole('button', {
        name: 'if / else',
      }),
    )
    await user.type(screen.getByRole('textbox', { name: /Contexto do exercício/ }), 'par ou ímpar')
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))

    expect(await screen.findByRole('heading', { name: 'Acompanhar geração' })).toBeInTheDocument()
    expect(await screen.findByText('Escrevendo o enunciado')).toBeInTheDocument()

    clock.now += 5000
    expect(
      await screen.findByRole('heading', { name: /Revisar questão/ }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Par ou ímpar')

    await user.click(screen.getByRole('button', { name: 'Aprovar e salvar' }))
    expect(await screen.findByRole('link', { name: 'Exportar na biblioteca' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Exportar na biblioteca' }))
    await waitFor(() => {
      expect(router.state.location.search).toBe('?estado=APROVADA')
    })
    expect(
      await screen.findByRole('checkbox', { name: 'Selecionar Par ou ímpar' }),
    ).toBeInTheDocument()
  }, 15_000)

  it.each([
    '/biblioteca',
    '/gerar',
    '/ajuda',
    '/questoes/q-0142',
    '/questoes/q-0143',
    '/nao-existe',
  ])('a rota %s não tem violações sérias de acessibilidade', async (path) => {
    const { container } = renderRoutes(routes, path)
    await screen.findByRole('heading', { level: 1 })
    expect(await blockingViolations(container)).toEqual([])
  })
})

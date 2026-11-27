import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '@/lib/http'
import { createTestServices, renderRoutes } from '@/test/render'
import { withQuestions } from '@/test/services'
import { QuestionPage } from './QuestionPage'

function renderPage(id: string, services = withQuestions({})) {
  return renderRoutes([{ path: '/questoes/:id', element: <QuestionPage /> }], `/questoes/${id}`, {
    services,
  })
}

describe('QuestionPage', () => {
  it('mostra o acompanhamento enquanto a questão é gerada', async () => {
    renderPage('q-0143')
    expect(await screen.findByRole('heading', { name: 'Acompanhar geração' })).toBeInTheDocument()
    expect(document.title).toBe('Acompanhar geração · Milani')
  })

  it('retoma uma geração interrompida e volta a acompanhar as etapas', async () => {
    const user = userEvent.setup()
    renderPage('q-0142', createTestServices({ interrupted: ['q-0142'] }))
    const title = await screen.findByText('A geração da questão foi interrompida na etapa:')
    const callout = title.closest<HTMLElement>('[data-tone]')
    if (!callout) throw new Error('the warning callout is missing')
    expect(callout).toHaveAttribute('data-tone', 'warning')
    expect(callout).toHaveTextContent(/^A geração da questão foi interrompida na etapa:$/)
    expect(screen.getByText('3 de 5: Criar casos de teste')).toBeInTheDocument()
    expect(within(callout).queryByRole('progressbar')).toBeNull()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    const sidebar = screen.getByRole('complementary', { name: 'Revisão pedagógica' })
    const actions = within(sidebar)
      .getAllByRole('button')
      .map((button) => button.textContent)
    expect(actions).toEqual(['Retomar geração', 'Gerar de novo'])
    await user.click(screen.getByRole('button', { name: 'Retomar geração' }))
    expect(await screen.findByRole('heading', { name: 'Acompanhar geração' })).toBeInTheDocument()
    const current = screen.getAllByRole('listitem').find((item) => item.ariaCurrent === 'step')
    expect(current).toHaveTextContent('Criar casos de teste')
  })

  it('mostra a revisão quando a questão já foi gerada', async () => {
    renderPage('q-0142')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ano bissexto' }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Ano bissexto · Milani')
  })

  it('explica quando a questão não existe', async () => {
    renderPage(
      'nao-existe',
      withQuestions({
        get: () => Promise.reject(new HttpError(404, "Question 'nao-existe' not found.")),
      }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Questão não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Volte à biblioteca e abra a questão de novo/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('not found')
    expect(document.title).toBe('Questão não encontrada · Milani')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Voltar à biblioteca',
    ])
  })

  it('oferece entrar de novo quando a sessão expira, voltando para a questão', async () => {
    renderPage('q-1', withQuestions({ get: () => Promise.reject(new HttpError(401, '')) }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sessão expirada')
    expect(screen.getByRole('link', { name: 'Entrar de novo' })).toHaveAttribute(
      'href',
      '/entrar?proximo=%2Fquestoes%2Fq-1',
    )
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
})

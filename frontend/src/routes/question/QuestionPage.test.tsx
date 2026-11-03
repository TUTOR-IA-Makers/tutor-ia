import { screen } from '@testing-library/react'
import { HttpError } from '@/lib/http'
import { renderRoutes } from '@/test/render'
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
    expect(document.title).toBe('Acompanhar geração · CodeExpert')
  })

  it('mostra a revisão quando a questão já foi gerada', async () => {
    renderPage('q-0142')
    expect(await screen.findByRole('heading', { name: /Revisar questão/ })).toBeInTheDocument()
    expect(document.title).toBe('Ano bissexto · CodeExpert')
  })

  it('explica quando a questão não existe', async () => {
    renderPage(
      'nao-existe',
      withQuestions({ get: () => Promise.reject(new HttpError(404, 'Questão não encontrada.')) }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Questão não encontrada.')
    expect(screen.getByRole('link', { name: 'Voltar à biblioteca' })).toBeInTheDocument()
  })
})

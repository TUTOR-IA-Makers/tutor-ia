import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Question } from '@/domain'
import { HttpError } from '@/lib/http'
import { seedQuestions } from '@/services/mock'
import { blockingViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'
import { withQuestions } from '@/test/services'
import { ReviewView } from './ReviewView'

function seed(id: string): Question {
  const question = seedQuestions().find((item) => item.id === id)
  if (!question) throw new Error(`fixture ${id} ausente`)
  return question
}

function renderReview(question: Question, path = '/questoes/x', services = withQuestions({})) {
  return renderRoutes(
    [{ path: '/questoes/:id', element: <ReviewView question={question} /> }],
    path,
    { services },
  )
}

describe('ReviewView', () => {
  it('abre na aba de enunciado e solução, com código em editor escuro', () => {
    renderReview(seed('q-0142'))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Revisar questãoAno bissexto',
    )
    expect(screen.getByRole('tab', { name: 'Enunciado e solução' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).getByRole('heading', { name: 'Enunciado da questão' })).toBeInTheDocument()
    expect(within(panel).getByText(/divisível por 400/)).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { name: 'Solução em C' })).toBeInTheDocument()
    expect(within(panel).getByLabelText('Código da solução em C')).toBeInTheDocument()
    expect(
      within(panel).getByText('// Divisivel por 400, ou por 4 sem ser por 100'),
    ).toHaveAttribute('data-token', 'comment')
    expect(
      within(panel).getByText('Compilação bem-sucedida, sem advertências.'),
    ).toBeInTheDocument()
  })

  it('tem só duas abas e junta casos de teste e restrições', async () => {
    const user = userEvent.setup()
    const { router } = renderReview(seed('q-0142'))
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    await user.click(screen.getByRole('tab', { name: /Casos de teste e restrições/ }))
    expect(router.state.location.search).toBe('?aba=testes')
    const panel = screen.getByRole('tabpanel')
    const table = within(panel).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(7)
    expect(within(panel).getByText('6 de 6 passaram')).toBeInTheDocument()
    expect(
      within(panel).getByRole('heading', { name: 'Restrições e estruturas em C' }),
    ).toBeInTheDocument()
    expect(within(panel).getByText('laços de repetição')).toBeInTheDocument()
  })

  it('abre direto na aba indicada pelo endereço', () => {
    renderReview(seed('q-0141'), '/questoes/x?aba=testes')
    expect(screen.getByRole('tab', { name: /Casos de teste/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getAllByText('Violada')).toHaveLength(2)
    expect(screen.getByText('A solução usa um laço for na linha 8.')).toBeInTheDocument()
  })

  it('aprova a questão e atualiza o estado', async () => {
    const user = userEvent.setup()
    const { services } = renderReview(seed('q-0142'))
    const approve = vi.spyOn(services.questions, 'approve')
    expect(screen.getByText('Aguardando revisão')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aprovar e salvar' }))
    expect(approve).toHaveBeenCalledWith('q-0142')
    expect(await screen.findByText('Questão aprovada')).toBeInTheDocument()
  })

  it('pede confirmação antes de rejeitar', async () => {
    const user = userEvent.setup()
    const { services } = renderReview(seed('q-0142'))
    const reject = vi.spyOn(services.questions, 'reject')
    await user.click(screen.getByRole('button', { name: 'Rejeitar' }))
    const dialog = screen.getByRole('dialog', { name: 'Rejeitar questão?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(reject).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Rejeitar' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Rejeitar questão' }),
    )
    await waitFor(() => {
      expect(reject).toHaveBeenCalledWith('q-0142')
    })
    expect(await screen.findByText('Questão rejeitada')).toBeInTheDocument()
  })

  it('mostra a causa da falha e oferece gerar de novo', async () => {
    const user = userEvent.setup()
    const { services } = renderReview(seed('q-0141'))
    const regenerate = vi.spyOn(services.questions, 'regenerate')
    expect(screen.getByText('A questão falhou na verificação')).toBeInTheDocument()
    expect(screen.getByText(/usou repetição/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar e salvar' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Gerar de novo' }))
    expect(regenerate).toHaveBeenCalledWith('q-0141')
    expect(await screen.findByText('Gerando a questão de novo')).toBeInTheDocument()
  })

  it('questão aprovada leva à exportação e não oferece aprovar de novo', () => {
    renderReview(seed('q-0138'))
    expect(screen.getByRole('link', { name: 'Exportar na biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca?estado=APROVADA',
    )
    expect(screen.queryByRole('button', { name: 'Rejeitar' })).toBeNull()
  })

  it('edita o enunciado e salva', async () => {
    const user = userEvent.setup()
    const { services } = renderReview(seed('q-0142'))
    const update = vi.spyOn(services.questions, 'updateStatement')
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const text = screen.getByRole('textbox', { name: /Texto do enunciado/ })
    await user.clear(text)
    await user.type(text, 'Novo enunciado')
    await user.click(screen.getByRole('button', { name: 'Salvar enunciado' }))
    expect(update).toHaveBeenCalledWith(
      'q-0142',
      expect.objectContaining({ text: 'Novo enunciado' }),
    )
    expect(await screen.findByText('Enunciado salvo')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('mantém o texto editado quando o salvamento falha', async () => {
    const user = userEvent.setup()
    const services = withQuestions({
      updateStatement: () => Promise.reject(new HttpError(422, 'O enunciado é obrigatório.')),
    })
    renderReview(seed('q-0142'), '/questoes/x', services)
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const text = screen.getByRole('textbox', { name: /Texto do enunciado/ })
    await user.clear(text)
    await user.type(text, 'Novo enunciado')
    await user.click(screen.getByRole('button', { name: 'Salvar enunciado' }))
    expect(await screen.findByText('O enunciado é obrigatório.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Texto do enunciado/ })).toHaveValue(
      'Novo enunciado',
    )
  })

  it('cancela a edição sem salvar', async () => {
    const user = userEvent.setup()
    renderReview(seed('q-0142'))
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('explica conflito 409 e recarrega a questão', async () => {
    const user = userEvent.setup()
    const services = withQuestions({ approve: () => Promise.reject(new HttpError(409, '')) })
    const { client } = renderReview(seed('q-0142'), '/questoes/x', services)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await user.click(screen.getByRole('button', { name: 'Aprovar e salvar' }))
    expect(await screen.findByText('A questão mudou de estado')).toBeInTheDocument()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['questions', 'detail', 'q-0142'] })
  })

  it('avisa quando a solução ainda não existe', () => {
    renderReview({ ...seed('q-0142'), solution: null, compilation: null })
    expect(screen.getByText('Solução indisponível')).toBeInTheDocument()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderReview(seed('q-0142'))
    expect(await blockingViolations(container)).toEqual([])
  })
})

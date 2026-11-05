import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpError } from '@/lib/http'
import { blockingViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'
import { withQuestions } from '@/test/services'
import { GenerateForm } from './GenerateForm'

function renderForm(services = withQuestions({})) {
  return renderRoutes(
    [
      { path: '/gerar', element: <GenerateForm /> },
      { path: '/questoes/:id', element: <p>Página da questão</p> },
    ],
    '/gerar',
    { services },
  )
}

function chip(group: string, name: string) {
  return within(screen.getByRole('group', { name: group })).getByRole('button', { name })
}

describe('GenerateForm', () => {
  it('usa as opções recebidas pelo serviço nas três listas', async () => {
    const base = withQuestions({})
    const structures = vi.fn().mockResolvedValue([{ id: 'nova', label: 'Estrutura da API' }])
    renderForm({ ...base, catalog: { structures } })
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    for (const group of [
      'Estruturas obrigatórias',
      'Estruturas permitidas',
      'Estruturas proibidas',
    ]) {
      expect(chip(group, 'Estrutura da API')).toBeEnabled()
    }
    expect(screen.queryByRole('button', { name: 'if' })).not.toBeInTheDocument()
    expect(structures).toHaveBeenCalledTimes(1)
  })

  it('bloqueia o envio enquanto carrega o catálogo', () => {
    const base = withQuestions({})
    renderForm({ ...base, catalog: { structures: () => new Promise(() => undefined) } })
    expect(screen.getByText('Carregando estruturas disponíveis…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar questão' })).toBeDisabled()
  })

  it('permite tentar novamente quando o catálogo falha', async () => {
    const user = userEvent.setup()
    const base = withQuestions({})
    const structures = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'for', label: 'for' }])
    renderForm({ ...base, catalog: { structures } })
    await screen.findByText('Não foi possível carregar as estruturas')
    expect(screen.getByRole('button', { name: 'Gerar questão' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    expect(chip('Estruturas obrigatórias', 'for')).toBeEnabled()
  })

  it('bloqueia catálogo vazio e explica o próximo passo', async () => {
    const base = withQuestions({})
    renderForm({ ...base, catalog: { structures: () => Promise.resolve([]) } })
    await screen.findByText('Catálogo de estruturas vazio')
    expect(screen.getByRole('button', { name: 'Gerar questão' })).toBeDisabled()
  })

  it('não envia estruturas antigas ausentes do catálogo', async () => {
    const user = userEvent.setup()
    const create = vi.fn()
    const base = withQuestions({ create })
    renderRoutes(
      [
        {
          path: '/gerar',
          element: (
            <GenerateForm
              defaultValues={{
                contentId: 'condicionais',
                difficulty: { min: 1200, max: 1600 },
                testCaseCount: 6,
                testCaseHints: '',
                context: '',
                structures: { required: ['antiga'], allowed: [], forbidden: [] },
              }}
            />
          ),
        },
      ],
      '/gerar',
      { services: base },
    )
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))
    expect(
      await screen.findByText('Há uma estrutura fora do catálogo atual. Revise as seleções.'),
    ).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Remover estruturas fora do catálogo' }))
    expect(screen.queryByText('Seleções desatualizadas')).not.toBeInTheDocument()
  })

  it('bloqueia uma estrutura permitida na lista de proibidas', async () => {
    const user = userEvent.setup()
    renderForm()
    await screen.findByRole('group', { name: 'Estruturas permitidas' })
    await user.click(chip('Estruturas permitidas', 'for'))
    expect(chip('Estruturas proibidas', 'for')).toBeDisabled()
  })

  it('mostra erros junto aos campos quando falta o essencial', async () => {
    const user = userEvent.setup()
    const create = vi.fn()
    renderForm(withQuestions({ create }))
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))
    expect(await screen.findByText('Escolha o conteúdo da questão.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Conteúdo de programação/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByText('Escolha pelo menos uma estrutura obrigatória.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('ajusta a dificuldade em intervalo estilo Codeforces', () => {
    renderForm()
    const min = screen.getByRole('slider', { name: 'Dificuldade mínima' })
    const max = screen.getByRole('slider', { name: 'Dificuldade máxima' })
    expect(min).toHaveAttribute('min', '500')
    expect(max).toHaveAttribute('max', '3500')
    expect(min).toHaveAttribute('step', '50')
    fireEvent.change(min, { target: { value: '1900' } })
    fireEvent.change(max, { target: { value: '2450' } })
    expect(screen.getByText('1600 a 2450')).toBeInTheDocument()
    expect(screen.getByText('Médio a Muito difícil')).toBeInTheDocument()
    expect(max).toHaveAttribute('aria-valuetext', '2450, Muito difícil')
  })

  it('bloqueia a estrutura oposta para impedir conflito', async () => {
    const user = userEvent.setup()
    renderForm()
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    await user.click(chip('Estruturas obrigatórias', 'for'))
    expect(chip('Estruturas obrigatórias', 'for')).toHaveAttribute('aria-pressed', 'true')
    const loops = chip('Estruturas proibidas', 'for')
    expect(loops).toBeDisabled()
    expect(loops).toHaveAccessibleDescription(/proibida não pode ser obrigatória nem permitida/)
    await user.click(chip('Estruturas obrigatórias', 'for'))
    expect(chip('Estruturas proibidas', 'for')).toBeEnabled()
  })

  it('envia o rascunho completo, com os casos específicos, e abre a questão', async () => {
    const user = userEvent.setup()
    const { router, services } = renderForm()
    const create = vi.spyOn(services.questions, 'create')

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Conteúdo de programação/ }),
      'condicionais',
    )
    await user.click(screen.getByRole('button', { name: 'Aumentar casos de teste' }))
    await user.type(
      screen.getByRole('textbox', { name: /Casos de teste específicos/ }),
      'incluir o ano 1900',
    )
    await user.type(screen.getByRole('textbox', { name: /Contexto do exercício/ }), 'ano bissexto')
    await user.click(chip('Estruturas obrigatórias', 'if'))
    await user.click(chip('Estruturas proibidas', 'for'))
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/questoes\/q-\d+$/)
    })
    expect(create).toHaveBeenCalledWith({
      contentId: 'condicionais',
      difficulty: { min: 1200, max: 1600 },
      testCaseCount: 7,
      testCaseHints: 'incluir o ano 1900',
      context: 'ano bissexto',
      structures: {
        required: ['if'],
        allowed: [],
        forbidden: ['for'],
      },
    })
  })

  it('mostra o motivo quando o servidor recusa', async () => {
    const user = userEvent.setup()
    renderForm(withQuestions({ create: () => Promise.reject(new HttpError(503, '')) }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Conteúdo de programação/ }),
      'vetores',
    )
    await user.click(chip('Estruturas obrigatórias', 'vetor'))
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))
    expect(await screen.findByText('Geração indisponível')).toBeInTheDocument()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderForm()
    await screen.findByRole('group', { name: 'Estruturas obrigatórias' })
    expect(await blockingViolations(container)).toEqual([])
  })
})

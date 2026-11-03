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
  it('mostra erros junto aos campos quando falta o essencial', async () => {
    const user = userEvent.setup()
    const create = vi.fn()
    renderForm(withQuestions({ create }))
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
    await user.click(chip('Estruturas obrigatórias', 'for'))
    expect(chip('Estruturas obrigatórias', 'for')).toHaveAttribute('aria-pressed', 'true')
    const loops = chip('Estruturas proibidas', 'laços de repetição')
    expect(loops).toBeDisabled()
    expect(loops).toHaveAccessibleDescription(/não pode ser obrigatória e proibida/)
    await user.click(chip('Estruturas obrigatórias', 'for'))
    expect(chip('Estruturas proibidas', 'laços de repetição')).toBeEnabled()
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
    await user.click(chip('Estruturas obrigatórias', 'if / else'))
    await user.click(chip('Estruturas proibidas', 'laços de repetição'))
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
        required: ['if-else'],
        allowed: ['scanf-printf', 'tipos-primitivos'],
        forbidden: ['lacos'],
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
    await user.click(chip('Estruturas obrigatórias', 'vetores'))
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))
    expect(await screen.findByText('Geração indisponível')).toBeInTheDocument()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderForm()
    expect(await blockingViolations(container)).toEqual([])
  })
})

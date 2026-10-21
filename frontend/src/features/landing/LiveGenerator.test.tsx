import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LiveGenerator } from './LiveGenerator'

function progress() {
  return screen.getByRole('progressbar', { name: 'Progresso da demonstração' })
}

// jsdom has no matchMedia; the component treats its absence as "motion allowed".
function stubReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({ matches: reduce && query.includes('reduce'), media: query }),
  })
}

// Each timer is created by an effect after the previous render, so run them one by one.
function runReplay() {
  for (let round = 0; round < 100; round++) {
    act(() => {
      vi.runOnlyPendingTimers()
    })
  }
}

describe('LiveGenerator', () => {
  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(window, 'matchMedia')
  })

  it('começa parado, com as cinco etapas e o primeiro conteúdo escolhido', () => {
    render(<LiveGenerator />)
    expect(screen.getByRole('radio', { name: 'Condicionais' })).toBeChecked()
    expect(screen.getByText('Pronto para gerar')).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveTextContent('Criar enunciado')
    expect(progress()).toHaveAttribute('aria-valuenow', '0')
  })

  it('gera a questão do conteúdo escolhido, etapa por etapa', async () => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<LiveGenerator />)

    await user.click(screen.getByRole('radio', { name: 'Laços' }))
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))

    expect(screen.getByText('Escrevendo o enunciado')).toBeInTheDocument()
    expect(screen.getByText('Fatorial')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Vetores' })).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(screen.getByText('Gerando a solução')).toBeInTheDocument()
    expect(progress()).toHaveAttribute('aria-valuenow', '20')

    runReplay()
    expect(screen.getByText('Questão pronta. 4 de 4 casos de teste passaram.')).toBeInTheDocument()
    expect(screen.getByText('2432902008176640000')).toBeInTheDocument()
    expect(progress()).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('button', { name: 'Gerar de novo' })).toBeEnabled()
  })

  it('mostra a solução sendo escrita durante a etapa da solução', async () => {
    vi.useFakeTimers()
    stubReducedMotion(false)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<LiveGenerator />)

    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    for (let line = 0; line < 3; line++) {
      act(() => {
        vi.advanceTimersByTime(45)
      })
    }
    const code = screen.getByLabelText(/Solução de referência/).textContent ?? ''
    expect(code).toContain('#include <stdio.h>')
    expect(code).not.toContain('return 0;')
  })

  it('com movimento reduzido, mostra a questão pronta no clique', async () => {
    stubReducedMotion(true)
    const user = userEvent.setup()
    render(<LiveGenerator />)

    await user.click(screen.getByRole('radio', { name: 'Vetores' }))
    await user.click(screen.getByRole('button', { name: 'Gerar questão' }))

    expect(screen.getByText('Questão pronta. 3 de 3 casos de teste passaram.')).toBeInTheDocument()
    expect(screen.getByText('8 0 -3 10')).toBeInTheDocument()
  })
})

import { screen, within } from '@testing-library/react'
import { ACCESS_URL, DOCS_URL } from '@/features/landing'
import { blockingViolations } from '@/test/axe'
import { renderInRouter } from '@/test/render'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('diz o problema, o que faz e para quem logo no início', () => {
    renderInRouter(<LandingPage />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Questões de C verificadas por execução, prontas para o Moodle.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Para professores de Algoritmos e Programação de Computadores'),
    ).toBeInTheDocument()
    expect(screen.getByText(/leva horas/)).toBeInTheDocument()
    expect(screen.getByText(/nunca de um palpite do modelo/)).toBeInTheDocument()
    expect(document.title).toBe('CodeExpert')
  })

  it('diz o que a ferramenta não faz', () => {
    renderInRouter(<LandingPage />)
    const scope = screen.getByRole('region', { name: 'O que o CodeExpert faz e o que não faz' })
    const doesNot = within(scope).getByRole('heading', { level: 3, name: 'Não faz' })
    expect(doesNot).toBeInTheDocument()
    expect(within(scope).getByText('Não é juiz automático.')).toBeInTheDocument()
    expect(within(scope).getByText('Não dá nota.')).toBeInTheDocument()
  })

  it('leva a pedir acesso e à documentação', () => {
    renderInRouter(<LandingPage />)
    const access = screen.getAllByRole('link', { name: 'Pedir acesso' })
    expect(access.length).toBeGreaterThan(0)
    for (const link of access) {
      expect(link).toHaveAttribute('href', ACCESS_URL)
    }
    const docs = screen.getAllByRole('link', { name: 'Ler a documentação' })
    expect(docs.length).toBeGreaterThan(0)
    for (const link of docs) {
      expect(link).toHaveAttribute('href', DOCS_URL)
    }
  })

  it('traz a demonstração da geração ao lado do título', () => {
    renderInRouter(<LandingPage />)
    expect(screen.getByRole('group', { name: 'Conteúdo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar questão' })).toBeEnabled()
    expect(
      screen.getByRole('progressbar', { name: 'Progresso da demonstração' }),
    ).toBeInTheDocument()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderInRouter(<LandingPage />)
    expect(await blockingViolations(container)).toEqual([])
  })
})

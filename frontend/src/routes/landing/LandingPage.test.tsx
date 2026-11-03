import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ACCESS_URL, ANALYTICS_EVENT, DOCS_URL, type LandingEvent } from '@/features/landing'
import { blockingViolations } from '@/test/axe'
import { renderInRouter } from '@/test/render'
import { LandingPage } from './LandingPage'

function collectEvents(): LandingEvent[] {
  const events: LandingEvent[] = []
  window.addEventListener(ANALYTICS_EVENT, (event) => {
    events.push((event as CustomEvent<LandingEvent>).detail)
  })
  return events
}

describe('LandingPage', () => {
  it('diz o que é, para quem e a próxima ação logo no início', () => {
    renderInRouter(<LandingPage />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Menos tempo criando questões. Mais tempo ensinando.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Para professores de Algoritmos e Programação')).toBeInTheDocument()
    expect(screen.getByText(/Questões de C testadas por execução/)).toBeInTheDocument()
    expect(document.title).toBe('CodeExpert')
  })

  it('mostra o problema, o fluxo e a prova de execução', () => {
    renderInRouter(<LandingPage />)
    expect(screen.getByRole('region', { name: /Cinco etapas soltas/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Do enunciado ao Moodle/ })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'A saída esperada não é um palpite da IA.' }),
    ).toBeInTheDocument()
  })

  it('divide o que o CodeExpert prepara do que fica com o professor', () => {
    renderInRouter(<LandingPage />)
    const scope = screen.getByRole('region', {
      name: 'Uma ferramenta para preparar suas questões. O controle continua com você.',
    })
    expect(
      within(scope).getByRole('heading', { level: 3, name: 'O CodeExpert prepara' }),
    ).toBeVisible()
    expect(
      within(scope).getByRole('heading', { level: 3, name: 'Você mantém o controle sobre' }),
    ).toBeVisible()
    expect(within(scope).getByText(/não corrige respostas de alunos/)).toBeInTheDocument()
    expect(within(scope).getByText(/Avaliação e atribuição de notas/)).toBeInTheDocument()
  })

  it('leva a solicitar acesso e à documentação, em vários pontos da página', () => {
    renderInRouter(<LandingPage />)
    const access = screen.getAllByRole('link', { name: /^(Solicitar acesso|Pedir acesso)/ })
    expect(access.length).toBeGreaterThanOrEqual(4)
    for (const link of access) {
      expect(link).toHaveAttribute('href', ACCESS_URL)
    }
    const docs = screen.getAllByRole('link', { name: /documentação/i })
    expect(docs.length).toBeGreaterThan(0)
    for (const link of docs) {
      expect(link).toHaveAttribute('href', DOCS_URL)
    }
    expect(screen.getByRole('link', { name: /Ver demonstração/ })).toHaveAttribute(
      'href',
      '#como-funciona',
    )
  })

  it('traz a demonstração da geração', () => {
    renderInRouter(<LandingPage />)
    expect(screen.getByRole('group', { name: 'Conteúdo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar questão' })).toBeEnabled()
    expect(
      screen.getByRole('progressbar', { name: 'Progresso da demonstração' }),
    ).toBeInTheDocument()
  })

  it('responde as objeções no FAQ', () => {
    renderInRouter(<LandingPage />)
    for (const question of [
      'Preciso saber programar em C para usar?',
      'O CodeExpert substitui o Moodle?',
      'As soluções são realmente executadas?',
      'Posso revisar as questões?',
      'Como funciona a exportação?',
      'O CodeExpert corrige respostas dos alunos?',
      'Como solicito acesso?',
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument()
    }
  })

  it('só reproduz a execução depois do clique e a identifica como exemplo', async () => {
    const user = userEvent.setup()
    renderInRouter(<LandingPage />)
    expect(screen.getByText(/Exemplo gravado/)).toBeInTheDocument()
    expect(screen.queryByText('2024 → BISSEXTO')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Compilar e executar' }))
    expect(await screen.findByText('2024 → BISSEXTO', {}, { timeout: 10_000 })).toBeInTheDocument()
  }, 15_000)

  it('publica eventos de uso sem sair do navegador', async () => {
    const events = collectEvents()
    const user = userEvent.setup()
    renderInRouter(<LandingPage />)
    const [heroCta] = screen.getAllByRole('link', { name: /Solicitar acesso ao CodeExpert/ })
    if (!heroCta) throw new Error('CTA do hero não encontrado')
    await user.click(heroCta)
    await user.click(screen.getByText('Posso revisar as questões?'))
    const names = events.map((event) => event.name)
    expect(names).toContain('landing_view')
    expect(names).toContain('access_request_click')
    expect(names).toContain('faq_interaction')
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderInRouter(<LandingPage />)
    expect(await blockingViolations(container)).toEqual([])
  }, 15_000)
})

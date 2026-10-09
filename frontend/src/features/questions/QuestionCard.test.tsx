import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { QuestionSummary } from '@/domain'
import { blockingViolations } from '@/test/axe'
import { renderInRouter } from '@/test/render'
import { QuestionCard } from './QuestionCard'
import { QuestionStatusBadge } from './QuestionStatusBadge'
import { QuestionTags } from './QuestionTags'

const question: QuestionSummary = {
  id: 'q-0142',
  code: '#0142',
  title: 'Ano bissexto',
  description: 'Determinar se um ano é bissexto.',
  contentId: 'condicionais',
  difficulty: { min: 1200, max: 1400 },
  status: 'GERADA',
  testCaseCount: 6,
}

describe('QuestionCard', () => {
  it('mostra título, descrição, classificação, estado e ação', () => {
    renderInRouter(<QuestionCard question={question} />)
    expect(screen.getByRole('article', { name: 'Ano bissexto' })).toBeInTheDocument()
    expect(screen.getByText('Condicionais')).toBeInTheDocument()
    expect(screen.getByText('Fácil a Médio')).toBeInTheDocument()
    expect(screen.getByText('Aguardando revisão')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisar: Ano bissexto' })).toHaveAttribute(
      'href',
      '/questoes/q-0142',
    )
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('permite seleção quando selecionável', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    renderInRouter(
      <QuestionCard
        question={{ ...question, status: 'APROVADA' }}
        selectable
        selected
        onSelectedChange={onSelectedChange}
      />,
    )
    const box = screen.getByRole('checkbox', { name: 'Selecionar Ano bissexto' })
    expect(box).toBeChecked()
    expect(screen.getByRole('article')).toHaveClass('selected')
    await user.click(box)
    expect(onSelectedChange).toHaveBeenCalledWith(false)
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = renderInRouter(<QuestionCard question={question} selectable />)
    expect(await blockingViolations(container)).toEqual([])
  })
})

describe('QuestionStatusBadge', () => {
  it.each([
    ['GERANDO', 'Gerando', 'info'],
    ['GERADA', 'Aguardando revisão', 'warning'],
    ['FALHOU_VERIFICACAO', 'Falhou na verificação', 'danger'],
    ['APROVADA', 'Aprovada', 'success'],
    ['REJEITADA', 'Rejeitada', 'neutral'],
  ] as const)('%s vira "%s"', (status, label, tone) => {
    renderInRouter(<QuestionStatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveAttribute('data-tone', tone)
  })
})

describe('QuestionTags', () => {
  it('mostra o código como metadado discreto quando pedido', () => {
    renderInRouter(<QuestionTags question={question} showCode tone="primary" />)
    expect(screen.getByText('#0142')).toHaveClass('mono')
    expect(screen.getByText('1200 a 1400')).toBeInTheDocument()
  })
})

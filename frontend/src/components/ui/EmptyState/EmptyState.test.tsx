import { render, screen } from '@testing-library/react'
import { FilePlus2 } from 'lucide-react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('orienta com título, texto e ação', () => {
    render(
      <EmptyState
        icon={FilePlus2}
        title="Sua biblioteca está vazia"
        description="Gere a primeira questão."
        action={<button type="button">Gerar primeira questão</button>}
      />,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sua biblioteca está vazia' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar primeira questão' })).toBeInTheDocument()
  })

  it('aceita título principal da página', () => {
    render(<EmptyState icon={FilePlus2} title="Página não encontrada" headingLevel={1} />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

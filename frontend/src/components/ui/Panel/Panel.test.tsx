import { render, screen } from '@testing-library/react'
import { Panel } from './Panel'

describe('Panel', () => {
  it('vira uma região nomeada pelo título', () => {
    render(
      <Panel
        title="Etapas da geração"
        description="Cinco etapas"
        actions={<button type="button">Ação</button>}
      >
        conteúdo
      </Panel>,
    )
    expect(screen.getByRole('region', { name: 'Etapas da geração' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Etapas da geração' })).toBeInTheDocument()
    expect(screen.getByText('Cinco etapas')).toBeInTheDocument()
  })

  it('aceita título de nível 3 e tom', () => {
    render(<Panel title="Sub" headingLevel={3} tone="primary" />)
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('region')).toHaveClass('primary')
  })

  it('mostra as ações quando o título é vazio', () => {
    render(<Panel title="" actions={<button type="button">Ação</button>} />)
    expect(screen.getByRole('button', { name: 'Ação' })).toBeInTheDocument()
  })

  it('sem título não cria cabeçalho', () => {
    const { container } = render(<Panel>só conteúdo</Panel>)
    expect(container.querySelector('header')).toBeNull()
  })
})

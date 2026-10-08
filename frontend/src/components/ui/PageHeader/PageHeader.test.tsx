import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renderiza título, subtítulo, descrição e ações', () => {
    render(
      <PageHeader
        title="Revisar questão"
        subtitle="Ano bissexto"
        description="Confira tudo"
        before={<span>voltar</span>}
        actions={<button type="button">Gerar</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Revisar questãoAno bissexto',
    )
    expect(screen.getByText('Confira tudo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar' })).toBeInTheDocument()
    expect(screen.getByText('voltar')).toBeInTheDocument()
  })

  it('mostra as ações quando meta é falso', () => {
    render(<PageHeader title="X" meta={false} actions={<button type="button">Gerar</button>} />)
    expect(screen.getByRole('button', { name: 'Gerar' })).toBeInTheDocument()
  })
})

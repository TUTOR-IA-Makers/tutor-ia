import { render, screen } from '@testing-library/react'
import { SkipLink } from './SkipLink'

describe('SkipLink', () => {
  it('aponta para o conteúdo principal com rótulo padrão em português', () => {
    render(<SkipLink targetId="conteudo" />)
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute(
      'href',
      '#conteudo',
    )
  })

  it('aceita rótulo customizado', () => {
    render(<SkipLink targetId="casos" label="Pular para os casos" />)
    expect(screen.getByRole('link', { name: 'Pular para os casos' })).toHaveAttribute(
      'href',
      '#casos',
    )
  })
})

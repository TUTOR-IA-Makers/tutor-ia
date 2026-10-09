import { render, screen } from '@testing-library/react'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('mostra contador quando pedido', () => {
    render(
      <Textarea
        aria-label="Casos"
        value="abc"
        maxLength={10}
        showCount
        onChange={() => undefined}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Casos' })).toHaveAttribute('maxLength', '10')
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('não mostra contador por padrão', () => {
    render(<Textarea aria-label="Contexto" maxLength={10} />)
    expect(screen.queryByText(/\/10/)).toBeNull()
  })
})

import { render, screen } from '@testing-library/react'
import { TextInput } from './TextInput'

describe('TextInput', () => {
  it('é um campo de texto estilizado', () => {
    render(<TextInput aria-label="Nome" className="extra" />)
    const input = screen.getByRole('textbox', { name: 'Nome' })
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveClass('control', 'extra')
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('alterna pelo rótulo, mesmo escondido visualmente', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox label="Selecionar Ano bissexto" hideLabel onChange={onChange} />)
    const box = screen.getByRole('checkbox', { name: 'Selecionar Ano bissexto' })
    await user.click(box)
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.getByText('Selecionar Ano bissexto')).toHaveClass('visually-hidden')
  })

  it('respeita id fornecido', () => {
    render(<Checkbox id="meu-id" label="Visível" />)
    expect(screen.getByRole('checkbox', { name: 'Visível' })).toHaveAttribute('id', 'meu-id')
  })
})

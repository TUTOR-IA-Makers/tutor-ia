import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

describe('Select', () => {
  it('lista opções com placeholder e repassa a escolha', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Select
        aria-label="Status"
        placeholder="Todos os status"
        options={[
          { value: 'GERADA', label: 'Aguardando revisão' },
          { value: 'APROVADA', label: 'Aprovada' },
        ]}
        onChange={onChange}
      />,
    )
    const select = screen.getByRole('combobox', { name: 'Status' })
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Todos os status',
      'Aguardando revisão',
      'Aprovada',
    ])
    await user.selectOptions(select, 'APROVADA')
    expect(onChange).toHaveBeenCalled()
    expect(select).toHaveValue('APROVADA')
  })
})

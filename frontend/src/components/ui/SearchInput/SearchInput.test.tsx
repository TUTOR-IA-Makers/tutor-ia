import { render, screen } from '@testing-library/react'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('é um campo de busca com rótulo acessível', () => {
    render(<SearchInput label="Buscar questões" placeholder="Buscar" />)
    expect(screen.getByRole('searchbox', { name: 'Buscar questões' })).toHaveAttribute(
      'type',
      'search',
    )
  })
})

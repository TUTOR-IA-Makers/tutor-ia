import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('é decorativo e tem tamanho', () => {
    render(<Spinner size="lg" />)
    const spinner = screen.getByTestId('spinner')
    expect(spinner).toHaveAttribute('aria-hidden', 'true')
    expect(spinner).toHaveClass('lg')
  })
})

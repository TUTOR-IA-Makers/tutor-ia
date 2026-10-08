import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('mostra as iniciais como decoração', () => {
    render(<Avatar initials="HS" />)
    expect(screen.getByText('HS')).toHaveAttribute('aria-hidden', 'true')
  })
})

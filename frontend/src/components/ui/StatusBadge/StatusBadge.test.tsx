import { render, screen } from '@testing-library/react'
import { StatusBadge, type BadgeTone } from './StatusBadge'

describe('StatusBadge', () => {
  it.each<BadgeTone>(['info', 'warning', 'success', 'danger', 'neutral'])(
    'mostra texto além da cor no tom %s',
    (tone) => {
      render(<StatusBadge tone={tone}>Aprovada</StatusBadge>)
      const badge = screen.getByText('Aprovada')
      expect(badge).toHaveAttribute('data-tone', tone)
      expect(badge).toHaveClass('badge', tone)
    },
  )
})

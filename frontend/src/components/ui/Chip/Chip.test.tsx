import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chip } from './Chip'

describe('Chip', () => {
  it('expõe o estado com aria-pressed e alterna no clique', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = render(
      <Chip pressed={false} onToggle={onToggle}>
        for
      </Chip>,
    )
    const chip = screen.getByRole('button', { name: 'for' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(onToggle).toHaveBeenCalledOnce()
    rerender(
      <Chip pressed tone="danger" onToggle={onToggle}>
        for
      </Chip>,
    )
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveClass('danger')
  })

  it('não alterna quando desabilitado', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <Chip pressed={false} disabled onToggle={onToggle}>
        goto
      </Chip>,
    )
    await user.click(screen.getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})

import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('informa progresso para tecnologias assistivas', () => {
    render(<ProgressBar value={60} label="Progresso da geração" valueText="Etapa 4 de 5" />)
    const bar = screen.getByRole('progressbar', { name: 'Progresso da geração' })
    expect(bar).toHaveAttribute('aria-valuenow', '60')
    expect(bar).toHaveAttribute('aria-valuetext', 'Etapa 4 de 5')
  })

  it('limita a proporção visual entre 0 e 1', () => {
    const { container, rerender } = render(<ProgressBar value={150} label="x" />)
    const fill = container.querySelector<HTMLElement>('.fill')
    expect(fill?.style.getPropertyValue('--progress')).toBe('1')
    rerender(<ProgressBar value={5} max={0} label="x" />)
    expect(fill?.style.getPropertyValue('--progress')).toBe('0')
  })
})

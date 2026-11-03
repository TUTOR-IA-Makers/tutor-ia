import { render } from '@testing-library/react'
import { Plus } from 'lucide-react'
import { Icon } from './Icon'

describe('Icon', () => {
  it('usa o traço da identidade e tamanhos fixos', () => {
    const { container, rerender } = render(<Icon icon={Plus} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('stroke-width', '1.75')
    expect(svg).toHaveAttribute('width', '16')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    rerender(<Icon icon={Plus} size="md" />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '20')
  })
})

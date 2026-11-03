import { render, screen } from '@testing-library/react'
import { Tag } from './Tag'

describe('Tag', () => {
  it('usa tom neutro por padrão', () => {
    render(<Tag>Condicionais</Tag>)
    expect(screen.getByText('Condicionais')).toHaveClass('tag', 'neutral')
  })

  it('aplica tom e fonte mono para códigos internos', () => {
    render(
      <Tag tone="primary" mono>
        #0142
      </Tag>,
    )
    expect(screen.getByText('#0142')).toHaveClass('primary', 'mono')
  })
})

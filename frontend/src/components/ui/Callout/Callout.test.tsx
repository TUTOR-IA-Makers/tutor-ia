import { render, screen } from '@testing-library/react'
import { Callout, type CalloutTone } from './Callout'

describe('Callout', () => {
  it.each<CalloutTone>(['info', 'success', 'warning', 'danger', 'neutral'])('tom %s', (tone) => {
    render(
      <Callout tone={tone} title="Título">
        Texto
      </Callout>,
    )
    expect(screen.getByText('Título').closest('[data-tone]')).toHaveAttribute('data-tone', tone)
  })

  it('pode anunciar como alerta', () => {
    render(<Callout tone="danger" title="Falhou" role="alert" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
  })
})

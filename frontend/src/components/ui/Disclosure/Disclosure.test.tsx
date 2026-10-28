import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Info } from 'lucide-react'
import { Disclosure } from './Disclosure'

describe('Disclosure', () => {
  it('abre e fecha o conteúdo pelo resumo', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Disclosure summary="Como importar no Moodle" icon={Info} framed>
        Passo a passo
      </Disclosure>,
    )
    const details = container.querySelector('details')
    expect(details).not.toHaveAttribute('open')
    await user.click(screen.getByText('Como importar no Moodle'))
    expect(details).toHaveAttribute('open')
  })

  it('pode começar aberto', () => {
    const { container } = render(
      <Disclosure summary="Detalhes" defaultOpen>
        x
      </Disclosure>,
    )
    expect(container.querySelector('details')).toHaveAttribute('open')
  })
})

import { screen } from '@testing-library/react'
import { renderInRouter } from '@/test/render'
import { BackLink } from './BackLink'

describe('BackLink', () => {
  it('leva ao destino com o texto informado', () => {
    renderInRouter(<BackLink to="/biblioteca">Voltar à biblioteca</BackLink>)
    expect(screen.getByRole('link', { name: 'Voltar à biblioteca' })).toHaveAttribute(
      'href',
      '/biblioteca',
    )
  })
})

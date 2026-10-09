import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

describe('States', () => {
  it('carregamento é anunciado como status', () => {
    render(<LoadingState label="Carregando questões" />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando questões')
  })

  it('erro explica e oferece nova tentativa', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState title="Sem conexão" message="Confira sua rede." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexãoConfira sua rede.')
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('erro sem ação de nova tentativa', () => {
    render(<ErrorState title="Erro" message="x" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

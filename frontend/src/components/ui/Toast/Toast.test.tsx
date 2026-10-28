import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToast } from './toastContext'
import { ToastProvider } from './ToastProvider'

function Trigger() {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => {
        toast.show({ tone: 'success', title: 'Questão aprovada', description: 'Já pode exportar.' })
      }}
    >
      Avisar
    </button>
  )
}

describe('Toast', () => {
  it('anuncia em região de status e some sozinho', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(
      <ToastProvider durationMs={1000}>
        <Trigger />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Questão aprovada')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByText('Questão aprovada')).toBeNull()
    vi.useRealTimers()
  })

  it('pode ser fechado pelo botão', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Avisar' }))
    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }))
    expect(screen.queryByText('Questão aprovada')).toBeNull()
  })

  it('exige o provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/)
  })
})

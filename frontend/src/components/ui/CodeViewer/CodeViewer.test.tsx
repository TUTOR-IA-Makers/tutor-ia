import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { blockingViolations } from '@/test/axe'
import { CodeViewer } from './CodeViewer'

const CODE = '#include <stdio.h>\n// comentário\nint main(void) {\n    return 0;\n}\n'

describe('CodeViewer', () => {
  it('numera as linhas e colore comentários de forma diferente', () => {
    render(<CodeViewer code={CODE} filename="solucao.c" />)
    const editor = screen.getByLabelText('Código de solucao.c')
    expect(editor.querySelectorAll('.line')).toHaveLength(5)
    expect(screen.getByText('// comentário')).toHaveAttribute('data-token', 'comment')
    expect(screen.getByText('#include <stdio.h>')).toHaveAttribute('data-token', 'preprocessor')
    expect(screen.getByText('return')).toHaveAttribute('data-token', 'keyword')
    expect(screen.getByText('0')).toHaveAttribute('data-token', 'number')
  })

  it('mostra o terminal com o comando e o resultado da compilação', () => {
    render(
      <CodeViewer
        code={CODE}
        filename="solucao.c"
        terminal={{ command: 'gcc solucao.c', output: 'Compilação bem-sucedida', succeeded: true }}
      />,
    )
    expect(screen.getByText('Terminal')).toBeInTheDocument()
    expect(screen.getByText('gcc solucao.c', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Compilação bem-sucedida')).toHaveClass('ok')
  })

  it('marca falha de compilação', () => {
    render(
      <CodeViewer
        code="x"
        filename="a.c"
        terminal={{ command: 'gcc a.c', output: 'erro', succeeded: false }}
      />,
    )
    expect(screen.getByText('erro')).toHaveClass('fail')
  })

  it('copia o código e avisa', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<CodeViewer code={CODE} filename="solucao.c" />)
    await user.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(writeText).toHaveBeenCalledWith(CODE)
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument()
  })

  it('avisa quando não consegue copiar e volta ao estado inicial', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('negado'))
    render(<CodeViewer code={CODE} filename="solucao.c" />)
    await user.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(screen.getByRole('button', { name: 'Não foi possível copiar' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = render(<CodeViewer code={CODE} filename="solucao.c" />)
    expect(await blockingViolations(container)).toEqual([])
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { clamp } from './clamp'
import { NumberStepper } from './NumberStepper'

function Harness({ initial = 6, onBlur }: { initial?: number; onBlur?: () => void }) {
  const [value, setValue] = useState(initial)
  return (
    <NumberStepper
      aria-describedby="hint"
      value={value}
      min={1}
      max={20}
      onChange={setValue}
      {...(onBlur ? { onBlur } : {})}
      decrementLabel="Diminuir casos"
      incrementLabel="Aumentar casos"
    />
  )
}

describe('NumberStepper', () => {
  it('aumenta e diminui pelos botões', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Aumentar casos' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(7)
    await user.click(screen.getByRole('button', { name: 'Diminuir casos' }))
    await user.click(screen.getByRole('button', { name: 'Diminuir casos' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(5)
  })

  it('desabilita os botões nos limites', () => {
    render(<Harness initial={1} />)
    expect(screen.getByRole('button', { name: 'Diminuir casos' })).toBeDisabled()
  })

  it('aceita digitação e limita ao sair do campo', async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()
    render(<Harness onBlur={onBlur} />)
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '99')
    await user.tab()
    expect(input).toHaveValue(20)
    expect(onBlur).toHaveBeenCalled()
  })

  it('confirma com Enter e ignora texto inválido', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '3{Enter}')
    expect(input).toHaveValue(3)
    await user.clear(input)
    await user.tab()
    expect(input).toHaveValue(3)
  })
})

describe('clamp', () => {
  it('mantém o valor dentro do intervalo', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(5, 0, 10)).toBe(5)
  })
})

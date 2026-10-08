import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { blockingViolations } from '@/test/axe'
import { RangeSlider, type RangeValue } from './RangeSlider'

function Harness({ onChange }: { onChange?: (value: RangeValue) => void }) {
  const [value, setValue] = useState({ min: 1200, max: 1600 })
  return (
    <RangeSlider
      min={500}
      max={3500}
      step={50}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      minLabel="Dificuldade mínima"
      maxLabel="Dificuldade máxima"
      valueText={(rating) => `${String(rating)} pontos`}
    />
  )
}

describe('RangeSlider', () => {
  it('expõe dois controles com valor textual', () => {
    render(<Harness />)
    const min = screen.getByRole('slider', { name: 'Dificuldade mínima' })
    expect(min).toHaveAttribute('aria-valuetext', '1200 pontos')
    expect(min).toHaveAttribute('step', '50')
    expect(screen.getByRole('slider', { name: 'Dificuldade máxima' })).toHaveValue('1600')
  })

  it('move cada ponta sem deixar uma cruzar a outra', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const min = screen.getByRole('slider', { name: 'Dificuldade mínima' })
    const max = screen.getByRole('slider', { name: 'Dificuldade máxima' })
    fireEvent.change(min, { target: { value: '2000' } })
    expect(onChange).toHaveBeenLastCalledWith({ min: 1600, max: 1600 })
    fireEvent.change(max, { target: { value: '800' } })
    expect(onChange).toHaveBeenLastCalledWith({ min: 1600, max: 1600 })
    fireEvent.change(max, { target: { value: '3500' } })
    expect(onChange).toHaveBeenLastCalledWith({ min: 1600, max: 3500 })
  })

  it('não tem violações sérias de acessibilidade', async () => {
    const { container } = render(<Harness />)
    expect(await blockingViolations(container)).toEqual([])
  })
})

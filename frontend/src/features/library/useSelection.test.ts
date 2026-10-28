import { act, renderHook } from '@testing-library/react'
import { useSelection } from './useSelection'

describe('useSelection', () => {
  it('só considera ids selecionáveis visíveis', () => {
    const { result, rerender } = renderHook(({ ids }) => useSelection(ids), {
      initialProps: { ids: ['a', 'b'] },
    })
    act(() => {
      result.current.toggle('a', true)
      result.current.toggle('b', true)
    })
    expect(result.current.selected).toEqual(['a', 'b'])
    rerender({ ids: ['b'] })
    expect(result.current.selected).toEqual(['b'])
    act(() => {
      result.current.toggle('b', false)
    })
    expect(result.current.selected).toEqual([])
    act(() => {
      result.current.toggle('b', true)
      result.current.clear()
    })
    expect(result.current.isSelected('b')).toBe(false)
  })
})

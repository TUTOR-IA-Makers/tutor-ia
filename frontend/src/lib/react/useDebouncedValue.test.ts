import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  it('só entrega o valor depois do intervalo', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'ab' })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('ab')
    vi.useRealTimers()
  })
})

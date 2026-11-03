import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'failed'

export function useCopy(resetMs = 2000) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(
    () => () => {
      clearTimeout(timer.current)
    },
    [],
  )

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setState('copied')
      } catch {
        setState('failed')
      }
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setState('idle')
      }, resetMs)
    },
    [resetMs],
  )

  return { state, copy }
}

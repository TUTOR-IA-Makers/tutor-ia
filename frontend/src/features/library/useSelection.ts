import { useCallback, useMemo, useState } from 'react'

export function useSelection(selectableIds: readonly string[]) {
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())

  const selected = useMemo(
    () => selectableIds.filter((id) => picked.has(id)),
    [picked, selectableIds],
  )

  const toggle = useCallback((id: string, value: boolean) => {
    setPicked((current) => {
      const next = new Set(current)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setPicked(new Set())
  }, [])

  return { selected, isSelected: (id: string) => picked.has(id), toggle, clear }
}

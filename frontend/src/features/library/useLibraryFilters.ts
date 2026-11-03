import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { filtersToParams, parseFilters, type LibraryFilters } from '@/domain'

export function useLibraryFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])

  const update = useCallback(
    (patch: Partial<LibraryFilters>) => {
      setParams(filtersToParams({ ...parseFilters(params), ...patch }), { replace: true })
    },
    [params, setParams],
  )

  const clear = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  return { filters, update, clear }
}

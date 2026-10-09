import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isFinished, type LibraryFilters } from '@/domain'
import { useServices } from '@/services'
import { questionKeys } from './queryKeys'

export const GENERATION_POLL_MS = 1500

export function useQuestionList(filters: LibraryFilters) {
  const { questions } = useServices()
  return useQuery({
    queryKey: questionKeys.list(filters),
    queryFn: ({ signal }) => questions.list(filters, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useQuestion(id: string) {
  const { questions } = useServices()
  return useQuery({
    queryKey: questionKeys.detail(id),
    queryFn: ({ signal }) => questions.get(id, { signal }),
  })
}

export function useGeneration(id: string, enabled = true) {
  const { questions } = useServices()
  return useQuery({
    queryKey: questionKeys.generation(id),
    queryFn: ({ signal }) => questions.generation(id, { signal }),
    enabled,
    refetchInterval: (query) =>
      query.state.data && isFinished(query.state.data) ? false : GENERATION_POLL_MS,
  })
}

import type { LibraryFilters } from '@/domain'

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters: LibraryFilters) => [...questionKeys.lists(), filters] as const,
  detail: (id: string) => [...questionKeys.all, 'detail', id] as const,
  generation: (id: string) => [...questionKeys.all, 'generation', id] as const,
}

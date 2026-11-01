import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/services'

export function useStructureCatalog() {
  const { catalog } = useServices()
  return useQuery({
    queryKey: ['structure-catalog'],
    queryFn: ({ signal }) => catalog.structures({ signal }),
    staleTime: 300_000,
  })
}

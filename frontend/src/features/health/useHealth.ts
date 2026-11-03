import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/services'

export const healthQueryKey = ['health'] as const

export function useHealth() {
  const { system } = useServices()
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: ({ signal }) => system.health({ signal }),
    staleTime: 30_000,
  })
}

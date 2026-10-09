import { useQuery } from '@tanstack/react-query'
import { useServices } from '@/services'

export const sessionKeys = { teacher: ['session', 'teacher'] as const }

export function useCurrentTeacher() {
  const { session } = useServices()
  return useQuery({
    queryKey: sessionKeys.teacher,
    queryFn: ({ signal }) => session.currentTeacher({ signal }),
    staleTime: Infinity,
  })
}

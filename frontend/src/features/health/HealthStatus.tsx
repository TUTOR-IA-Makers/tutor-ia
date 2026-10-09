import { StatusBadge } from '@/components/ui'
import { useHealth } from './useHealth'

export function HealthStatus() {
  const { data, isPending, isError } = useHealth()

  if (isPending) return <StatusBadge tone="neutral">Verificando o servidor</StatusBadge>
  if (isError) return <StatusBadge tone="danger">Servidor indisponível</StatusBadge>

  return <StatusBadge tone="success">{`Servidor ativo, versão ${data.version}`}</StatusBadge>
}

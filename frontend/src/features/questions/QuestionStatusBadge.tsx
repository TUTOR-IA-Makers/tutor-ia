import { StatusBadge } from '@/components/ui'
import { STATUS, type QuestionStatus } from '@/domain'

export interface QuestionStatusBadgeProps {
  status: QuestionStatus
}

export function QuestionStatusBadge({ status }: QuestionStatusBadgeProps) {
  const { label, tone } = STATUS[status]
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}

import type { QuestionStatus } from './question'

export type StatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral'
export type QuestionAction =
  'follow' | 'review' | 'edit' | 'approve' | 'reject' | 'regenerate' | 'export'

interface StatusPresentation {
  label: string
  tone: StatusTone
  cardAction: string
  actions: readonly QuestionAction[]
}

export const STATUS: Record<QuestionStatus, StatusPresentation> = {
  GERANDO: { label: 'Gerando', tone: 'info', cardAction: 'Ver progresso', actions: ['follow'] },
  GERADA: {
    label: 'Aguardando revisão',
    tone: 'warning',
    cardAction: 'Revisar',
    actions: ['review', 'edit', 'approve', 'reject', 'regenerate'],
  },
  FALHOU_VERIFICACAO: {
    label: 'Falhou na verificação',
    tone: 'danger',
    cardAction: 'Ver falha',
    actions: ['regenerate'],
  },
  APROVADA: {
    label: 'Aprovada',
    tone: 'success',
    cardAction: 'Ver questão',
    actions: ['export', 'edit'],
  },
  REJEITADA: {
    label: 'Rejeitada',
    tone: 'neutral',
    cardAction: 'Ver questão',
    actions: ['regenerate'],
  },
}

export function can(status: QuestionStatus, action: QuestionAction): boolean {
  return STATUS[status].actions.includes(action)
}

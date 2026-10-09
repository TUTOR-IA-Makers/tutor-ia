import { Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Callout, Dialog, LinkButton } from '@/components/ui'
import { can, passedCount, type Question } from '@/domain'
import {
  QuestionStatusBadge,
  useApproveQuestion,
  useRegenerateQuestion,
  useRejectQuestion,
} from '@/features/questions'
import styles from './ReviewSidebar.module.css'

export interface ReviewSidebarProps {
  question: Question
}

function VerificationSummary({ question }: ReviewSidebarProps) {
  const passed = passedCount(question.testCases)
  const total = question.testCases.length
  if (question.failureReason) {
    return (
      <Callout tone="danger" title="A questão falhou na verificação">
        {question.failureReason}
      </Callout>
    )
  }
  return (
    <Callout
      tone={passed === total ? 'success' : 'warning'}
      title={`${String(passed)} de ${String(total)} testes passaram`}
    >
      {question.compilation?.message}
    </Callout>
  )
}

export function ReviewSidebar({ question }: ReviewSidebarProps) {
  const approve = useApproveQuestion(question.id)
  const reject = useRejectQuestion(question.id)
  const regenerate = useRegenerateQuestion(question.id)
  const [confirmingReject, setConfirmingReject] = useState(false)
  const busy = approve.isPending || reject.isPending || regenerate.isPending

  return (
    <aside className={styles.sidebar} aria-labelledby="review-sidebar-title">
      <h2 id="review-sidebar-title" className={styles.title}>
        Revisão pedagógica
      </h2>
      <div aria-live="polite">
        <QuestionStatusBadge status={question.status} />
      </div>
      <VerificationSummary question={question} />
      <p className={styles.note}>
        Confira o enunciado, o código e os casos de teste antes de aprovar para a sua turma. A
        validação técnica é um suporte; a aprovação é sua.
      </p>
      <div className={styles.actions}>
        {can(question.status, 'approve') && (
          <Button
            variant="accent"
            size="lg"
            block
            icon={Check}
            isLoading={approve.isPending}
            disabled={busy}
            onClick={() => {
              approve.mutate()
            }}
          >
            Aprovar e salvar
          </Button>
        )}
        {can(question.status, 'reject') && (
          <Button
            variant="danger"
            block
            icon={X}
            disabled={busy}
            onClick={() => {
              setConfirmingReject(true)
            }}
          >
            Rejeitar
          </Button>
        )}
        {can(question.status, 'regenerate') && (
          <Button
            variant={question.status === 'GERADA' ? 'ghost' : 'primary'}
            block
            icon={RotateCcw}
            isLoading={regenerate.isPending}
            disabled={busy}
            onClick={() => {
              regenerate.mutate()
            }}
          >
            {question.status === 'GERADA' ? 'Solicitar regeneração' : 'Gerar de novo'}
          </Button>
        )}
        {can(question.status, 'export') && (
          <LinkButton to="/biblioteca?estado=APROVADA" variant="primary" block>
            Exportar na biblioteca
          </LinkButton>
        )}
      </div>
      {can(question.status, 'approve') && (
        <p className={styles.footnote}>
          Ao aprovar, a questão fica disponível na biblioteca para exportação em XML do Moodle.
        </p>
      )}
      <Dialog
        open={confirmingReject}
        onClose={() => {
          setConfirmingReject(false)
        }}
        icon={X}
        title="Rejeitar questão?"
        description="A questão sai da fila de revisão. Você pode gerar uma nova versão depois."
        footer={
          <>
            <Button
              onClick={() => {
                setConfirmingReject(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={X}
              isLoading={reject.isPending}
              onClick={() => {
                reject.mutate(undefined, {
                  onSettled: () => {
                    setConfirmingReject(false)
                  },
                })
              }}
            >
              Rejeitar questão
            </Button>
          </>
        }
      />
    </aside>
  )
}

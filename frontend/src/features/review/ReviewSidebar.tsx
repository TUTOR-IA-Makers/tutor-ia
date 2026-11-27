import { Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Callout, Dialog, LinkButton, Spinner } from '@/components/ui'
import { can, failureSummary, passedCount, type Generation, type Question } from '@/domain'
import { GenerationFailure, ResumeGenerationButton } from '@/features/progress'
import {
  QuestionStatusBadge,
  useApproveQuestion,
  useGeneration,
  useRegenerateQuestion,
  useRejectQuestion,
} from '@/features/questions'
import styles from './ReviewSidebar.module.css'

export interface ReviewSidebarProps {
  question: Question
}

interface VerificationSummaryProps extends ReviewSidebarProps {
  generation: { data: Generation | undefined; isPending: boolean }
}

function VerificationSummary({ question, generation }: VerificationSummaryProps) {
  const failed = question.status === 'FALHOU_VERIFICACAO'
  const passed = passedCount(question.testCases)
  const total = question.testCases.length
  if (failed && generation.data) return <GenerationFailure generation={generation.data} />
  if (failed && generation.isPending) {
    return (
      <p className={styles.checking} role="status">
        <Spinner size="sm" />
        Buscando a etapa em que a geração parou
      </p>
    )
  }
  if (failed || question.failureReason) {
    return (
      <Callout tone="danger" title="A questão falhou na verificação">
        {failureSummary(question.failureReason) ?? 'Gere de novo para tentar outra versão.'}
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
  const generation = useGeneration(question.id, question.status === 'FALHOU_VERIFICACAO')
  const resumable = question.status === 'FALHOU_VERIFICACAO' && generation.data?.resumable === true
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
      <VerificationSummary question={question} generation={generation} />
      <div className={styles.actions}>
        {resumable && <ResumeGenerationButton questionId={question.id} block disabled={busy} />}
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

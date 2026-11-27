import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  DescriptionList,
  Disclosure,
  LinkButton,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui'
import { currentStep, failedStep, isFinished, type QuestionSummary } from '@/domain'
import { questionKeys, useGeneration } from '@/features/questions'
import { RequestErrorState } from '@/features/session'
import { GenerationFailure } from './GenerationFailure'
import { ResumeGenerationButton } from './ResumeGenerationButton'
import { GenerationPanel } from './GenerationPanel'
import { QuestionSummaryCard } from './QuestionSummaryCard'
import { StepList } from './StepList'
import styles from './ProgressView.module.css'

const GENERATED_TOAST = {
  tone: 'success',
  title: 'Questão gerada',
} as const

function failedToast(stepLabel: string, resumable: boolean) {
  if (resumable) {
    return {
      tone: 'info',
      title: `A geração foi interrompida em: ${stepLabel}`,
    } as const
  }
  return {
    tone: 'danger',
    title: `A geração parou em: ${stepLabel}`,
  } as const
}

export interface ProgressViewProps {
  question: QuestionSummary
}

export function ProgressView({ question }: ProgressViewProps) {
  const generation = useGeneration(question.id)
  const client = useQueryClient()
  const toast = useToast()
  const finished = generation.data ? isFinished(generation.data) : false
  const stopped = generation.data ? failedStep(generation.data) : null
  const resumable = generation.data?.resumable ?? false
  const announced = useRef(false)

  useEffect(() => {
    if (!finished || announced.current) return
    announced.current = true
    void client.invalidateQueries({ queryKey: questionKeys.detail(question.id) })
    void client.invalidateQueries({ queryKey: questionKeys.lists() })
    toast.show(stopped ? failedToast(stopped.label, resumable) : GENERATED_TOAST)
  }, [finished, stopped, resumable, client, question.id, toast])

  return (
    <div className={styles.page}>
      <PageHeader title="Acompanhar geração" />
      {generation.isPending && <LoadingState label="Consultando o andamento" />}
      {generation.isError && (
        <RequestErrorState error={generation.error} onRetry={() => void generation.refetch()} />
      )}
      {generation.data && (
        <>
          {stopped ? (
            <GenerationFailure generation={generation.data} />
          ) : (
            <GenerationPanel generation={generation.data} />
          )}
          <div className={styles.columns}>
            <StepList generation={generation.data} />
            <QuestionSummaryCard question={question} />
          </div>
          <div className={styles.footer}>
            <div className={styles.aside}>
              <Disclosure summary="Ver detalhes técnicos">
                <DescriptionList
                  items={[
                    { term: 'Questão', value: <code>{question.code}</code> },
                    { term: 'Execução', value: <code>{generation.data.runId}</code> },
                    {
                      term: 'Etapa atual',
                      value: (
                        <code>{(stopped ?? currentStep(generation.data))?.id ?? 'concluída'}</code>
                      ),
                    },
                  ]}
                />
              </Disclosure>
            </div>
            <div className={styles.actions}>
              {stopped && resumable && <ResumeGenerationButton questionId={question.id} />}
              <LinkButton to="/biblioteca" variant="primary" size="lg" icon={ArrowLeft}>
                Voltar à biblioteca
              </LinkButton>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useParams } from 'react-router'
import { BackLink, ErrorState, LoadingState } from '@/components/ui'
import { ProgressView } from '@/features/progress'
import { useQuestion } from '@/features/questions'
import { ReviewView } from '@/features/review'
import { useDocumentTitle } from '@/lib/dom'
import { describeError } from '@/lib/http'
import styles from './QuestionPage.module.css'

export function QuestionPage() {
  const { id = '' } = useParams()
  const question = useQuestion(id)
  const generating = question.data?.status === 'GERANDO'
  useDocumentTitle(generating ? 'Acompanhar geração' : (question.data?.title ?? 'Questão'))

  if (question.isPending) return <LoadingState label="Carregando a questão" />
  if (question.isError) {
    return (
      <div className={styles.page}>
        <BackLink to="/biblioteca">Voltar à biblioteca</BackLink>
        <ErrorState {...describeError(question.error)} onRetry={() => void question.refetch()} />
      </div>
    )
  }
  return generating ? (
    <ProgressView question={question.data} />
  ) : (
    <ReviewView question={question.data} />
  )
}

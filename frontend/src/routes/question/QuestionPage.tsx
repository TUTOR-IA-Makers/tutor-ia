import { useParams } from 'react-router'
import { BackLink, LoadingState } from '@/components/ui'
import { ProgressView } from '@/features/progress'
import { useQuestion } from '@/features/questions'
import { ReviewView } from '@/features/review'
import { RequestErrorState } from '@/features/session'
import { useDocumentTitle } from '@/lib/dom'
import { HttpError } from '@/lib/http'
import { QuestionNotFound } from './QuestionNotFound'
import styles from './QuestionPage.module.css'

export function QuestionPage() {
  const { id = '' } = useParams()
  const question = useQuestion(id)
  const generating = question.data?.status === 'GERANDO'
  const notFound = question.error instanceof HttpError && question.error.status === 404
  useDocumentTitle(
    notFound
      ? 'Questão não encontrada'
      : generating
        ? 'Acompanhar geração'
        : (question.data?.title ?? 'Questão'),
  )

  if (question.isPending) return <LoadingState label="Carregando a questão" />
  if (notFound) return <QuestionNotFound />
  if (question.isError) {
    return (
      <div className={styles.page}>
        <BackLink to="/biblioteca">Voltar à biblioteca</BackLink>
        <RequestErrorState error={question.error} onRetry={() => void question.refetch()} />
      </div>
    )
  }
  return generating ? (
    <ProgressView question={question.data} />
  ) : (
    <ReviewView question={question.data} />
  )
}

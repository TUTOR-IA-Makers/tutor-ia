import { ArrowLeft, FileQuestion } from 'lucide-react'
import { LinkButton } from '@/components/ui'
import styles from './QuestionNotFound.module.css'

export function QuestionNotFound() {
  return (
    <section className={styles.page} aria-labelledby="question-not-found-title">
      <span className={styles.icon}>
        <FileQuestion aria-hidden="true" focusable="false" size={32} strokeWidth={1.75} />
      </span>
      <h1 id="question-not-found-title" className={styles.title}>
        Questão não encontrada
      </h1>
      <p className={styles.description}>
        Ela pode ter sido apagada, ou o endereço está incompleto. Volte à biblioteca e abra a
        questão de novo.
      </p>
      <LinkButton to="/biblioteca" variant="primary" size="lg" icon={ArrowLeft}>
        Voltar à biblioteca
      </LinkButton>
    </section>
  )
}

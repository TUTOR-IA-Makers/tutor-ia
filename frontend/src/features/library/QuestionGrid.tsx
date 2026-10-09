import type { QuestionSummary } from '@/domain'
import { QuestionCard } from '@/features/questions'
import styles from './QuestionGrid.module.css'

export interface QuestionGridProps {
  questions: readonly QuestionSummary[]
  isSelected: (id: string) => boolean
  onToggle: (id: string, selected: boolean) => void
}

export function QuestionGrid({ questions, isSelected, onToggle }: QuestionGridProps) {
  return (
    <ul className={styles.grid} aria-label="Questões">
      {questions.map((question) => (
        <li key={question.id} className={styles.item}>
          <QuestionCard
            question={question}
            selectable={question.status === 'APROVADA'}
            selected={isSelected(question.id)}
            onSelectedChange={(selected) => {
              onToggle(question.id, selected)
            }}
          />
        </li>
      ))}
    </ul>
  )
}

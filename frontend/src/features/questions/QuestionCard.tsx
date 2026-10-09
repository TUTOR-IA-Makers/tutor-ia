import { Link } from 'react-router'
import { Checkbox } from '@/components/ui'
import { STATUS, type QuestionSummary } from '@/domain'
import { cx } from '@/lib/cx'
import { questionPath } from './paths'
import { QuestionStatusBadge } from './QuestionStatusBadge'
import { QuestionTags } from './QuestionTags'
import styles from './QuestionCard.module.css'

export interface QuestionCardProps {
  question: QuestionSummary
  selectable?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
}

export function QuestionCard({
  question,
  selectable = false,
  selected = false,
  onSelectedChange,
}: QuestionCardProps) {
  return (
    <article
      className={cx(styles.card, selected && styles.selected)}
      aria-labelledby={`${question.id}-title`}
    >
      <header className={styles.header}>
        <h3 id={`${question.id}-title`} className={styles.title}>
          {question.title}
        </h3>
        {selectable && (
          <Checkbox
            label={`Selecionar ${question.title}`}
            hideLabel
            checked={selected}
            onChange={(event) => onSelectedChange?.(event.target.checked)}
          />
        )}
      </header>
      <p className={styles.description}>{question.description}</p>
      <QuestionTags question={question} />
      <footer className={styles.footer}>
        <QuestionStatusBadge status={question.status} />
        <Link to={questionPath(question.id)} className={styles.action}>
          {STATUS[question.status].cardAction}
          <span className="visually-hidden">: {question.title}</span>
        </Link>
      </footer>
    </article>
  )
}

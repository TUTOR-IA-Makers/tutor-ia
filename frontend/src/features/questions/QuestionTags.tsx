import { Tag } from '@/components/ui'
import { contentLabel, describeDifficulty, formatRating, type QuestionSummary } from '@/domain'
import styles from './QuestionTags.module.css'

export interface QuestionTagsProps {
  question: Pick<QuestionSummary, 'contentId' | 'difficulty' | 'code'>
  tone?: 'neutral' | 'primary'
  showCode?: boolean
}

export function QuestionTags({ question, tone = 'neutral', showCode = false }: QuestionTagsProps) {
  return (
    <ul className={styles.tags} aria-label="Classificação">
      <li>
        <Tag tone={tone}>{contentLabel(question.contentId)}</Tag>
      </li>
      <li>
        <Tag tone={tone}>
          {describeDifficulty(question.difficulty)}
          <span className={styles.rating}>{formatRating(question.difficulty)}</span>
        </Tag>
      </li>
      {showCode && (
        <li>
          <Tag mono>{question.code}</Tag>
        </li>
      )}
    </ul>
  )
}

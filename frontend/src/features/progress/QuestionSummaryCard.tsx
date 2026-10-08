import { DescriptionList, Panel } from '@/components/ui'
import { contentLabel, describeDifficulty, formatRating, type QuestionSummary } from '@/domain'
import styles from './QuestionSummaryCard.module.css'

export interface QuestionSummaryCardProps {
  question: QuestionSummary
}

export function QuestionSummaryCard({ question }: QuestionSummaryCardProps) {
  return (
    <Panel tone="accent" title={question.title} description="Sua questão">
      <DescriptionList
        items={[
          { term: 'Conteúdo', value: contentLabel(question.contentId) },
          {
            term: 'Dificuldade',
            value: `${describeDifficulty(question.difficulty)} (${formatRating(question.difficulty)})`,
          },
          { term: 'Casos de teste', value: question.testCaseCount },
        ]}
      />
      <p className={styles.note}>
        Após a geração, você poderá revisar o enunciado, a solução e os testes.
      </p>
    </Panel>
  )
}

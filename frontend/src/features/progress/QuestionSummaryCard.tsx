import { DescriptionList, Panel } from '@/components/ui'
import { contentLabel, describeDifficulty, formatRating, type QuestionSummary } from '@/domain'

export interface QuestionSummaryCardProps {
  question: QuestionSummary
}

export function QuestionSummaryCard({ question }: QuestionSummaryCardProps) {
  return (
    <Panel tone="accent" title={question.title}>
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
    </Panel>
  )
}

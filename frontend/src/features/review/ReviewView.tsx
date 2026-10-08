import { FileCode2, ListChecks } from 'lucide-react'
import { BackLink, PageHeader, Tab, TabList, TabPanel, Tabs } from '@/components/ui'
import { can, type Question } from '@/domain'
import { QuestionTags, useUpdateStatement } from '@/features/questions'
import { ConstraintsList } from './ConstraintsList'
import { ReviewSidebar } from './ReviewSidebar'
import { SolutionSection } from './SolutionSection'
import { StatementSection } from './StatementSection'
import { TestCasesTable } from './TestCasesTable'
import { useReviewTab } from './useReviewTab'
import styles from './ReviewView.module.css'

export interface ReviewViewProps {
  question: Question
}

export function ReviewView({ question }: ReviewViewProps) {
  const { tab, select } = useReviewTab()
  const updateStatement = useUpdateStatement(question.id)

  return (
    <div className={styles.page}>
      <PageHeader
        before={<BackLink to="/biblioteca">Voltar à biblioteca</BackLink>}
        title="Revisar questão"
        subtitle={question.title}
        meta={<QuestionTags question={question} tone="primary" showCode />}
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs value={tab} onChange={select}>
            <TabList label="Seções da questão">
              <Tab value="enunciado" icon={FileCode2}>
                Enunciado e solução
              </Tab>
              <Tab value="testes" icon={ListChecks} badge={question.testCases.length}>
                Casos de teste e restrições
              </Tab>
            </TabList>
            <TabPanel value="enunciado">
              <div className={styles.stack}>
                <StatementSection
                  statement={question.statement}
                  editable={can(question.status, 'edit')}
                  saving={updateStatement.isPending}
                  onSave={(statement, onSaved) => {
                    updateStatement.mutate(statement, { onSuccess: onSaved })
                  }}
                />
                <SolutionSection question={question} />
              </div>
            </TabPanel>
            <TabPanel value="testes">
              <div className={styles.stack}>
                <TestCasesTable testCases={question.testCases} />
                <ConstraintsList structures={question.structures} checks={question.constraints} />
              </div>
            </TabPanel>
          </Tabs>
        </div>
        <ReviewSidebar question={question} />
      </div>
    </div>
  )
}

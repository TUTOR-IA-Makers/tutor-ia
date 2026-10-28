import { FilePlus2, Plus, SearchX } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  EmptyState,
  ErrorState,
  LinkButton,
  LoadingState,
  PageHeader,
} from '@/components/ui'
import { hasActiveFilters } from '@/domain'
import { describeError } from '@/lib/http'
import { useQuestionList } from '@/features/questions'
import { ExportDialog } from './ExportDialog'
import { LibraryFilterBar } from './LibraryFilterBar'
import { QuestionGrid } from './QuestionGrid'
import { SelectionBar } from './SelectionBar'
import { useLibraryFilters } from './useLibraryFilters'
import { useSelection } from './useSelection'
import styles from './LibraryView.module.css'

export function LibraryView() {
  const { filters, update, clear } = useLibraryFilters()
  const list = useQuestionList(filters)
  const questions = useMemo(() => list.data ?? [], [list.data])
  const approvedIds = useMemo(
    () => questions.filter((question) => question.status === 'APROVADA').map(({ id }) => id),
    [questions],
  )
  const selection = useSelection(approvedIds)
  const [exporting, setExporting] = useState(false)
  const selectedQuestions = questions.filter((question) => selection.selected.includes(question.id))

  return (
    <div className={styles.page}>
      <PageHeader
        title="Biblioteca de questões"
        description="Organize e revise seus exercícios de programação em C."
        actions={
          <LinkButton to="/gerar" variant="primary" size="lg" icon={Plus}>
            Gerar questão
          </LinkButton>
        }
      />
      <LibraryFilterBar filters={filters} onChange={update} />
      {selection.selected.length > 0 && (
        <SelectionBar
          count={selection.selected.length}
          onExport={() => {
            setExporting(true)
          }}
          onClear={selection.clear}
        />
      )}
      <LibraryContent
        state={list}
        isEmpty={questions.length === 0}
        filtered={hasActiveFilters(filters)}
        onClearFilters={clear}
      >
        <QuestionGrid
          questions={questions}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
        />
      </LibraryContent>
      <ExportDialog
        open={exporting}
        questions={selectedQuestions}
        onClose={() => {
          setExporting(false)
        }}
      />
    </div>
  )
}

interface LibraryContentProps {
  state: ReturnType<typeof useQuestionList>
  isEmpty: boolean
  filtered: boolean
  onClearFilters: () => void
  children: ReactNode
}

function LibraryContent({
  state,
  isEmpty,
  filtered,
  onClearFilters,
  children,
}: LibraryContentProps) {
  if (state.isPending) return <LoadingState label="Carregando questões" />
  if (state.isError) {
    const { title, message } = describeError(state.error)
    return <ErrorState title={title} message={message} onRetry={() => void state.refetch()} />
  }
  if (isEmpty && filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhuma questão com esses filtros"
        description="Tente outro termo de busca ou limpe os filtros."
        action={<Button onClick={onClearFilters}>Limpar filtros</Button>}
      />
    )
  }
  if (isEmpty) {
    return (
      <EmptyState
        icon={FilePlus2}
        title="Sua biblioteca está vazia"
        description="Gere a primeira questão. Ela aparece aqui para revisão assim que ficar pronta."
        action={
          <LinkButton to="/gerar" variant="primary" icon={Plus}>
            Gerar primeira questão
          </LinkButton>
        }
      />
    )
  }
  return <>{children}</>
}

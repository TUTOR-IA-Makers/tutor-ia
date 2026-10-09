import { useEffect, useState } from 'react'
import { SearchInput, Select } from '@/components/ui'
import {
  CONTENTS,
  DIFFICULTY_BANDS,
  isBandId,
  isQuestionStatus,
  QUESTION_STATUSES,
  STATUS,
  type LibraryFilters,
} from '@/domain'
import { useDebouncedValue } from '@/lib/react'
import styles from './LibraryFilterBar.module.css'

export interface LibraryFilterBarProps {
  filters: LibraryFilters
  onChange: (patch: Partial<LibraryFilters>) => void
}

const CONTENT_OPTIONS = CONTENTS.map(({ id, shortLabel }) => ({ value: id, label: shortLabel }))
const DIFFICULTY_OPTIONS = DIFFICULTY_BANDS.map(({ id, label }) => ({ value: id, label }))
const STATUS_OPTIONS = QUESTION_STATUSES.map((status) => ({
  value: status,
  label: STATUS[status].label,
}))

export const SEARCH_DEBOUNCE_MS = 250

export function LibraryFilterBar({ filters, onChange }: LibraryFilterBarProps) {
  const [search, setSearch] = useState(filters.search)
  const [committed, setCommitted] = useState(filters.search)
  const debounced = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  if (filters.search !== committed) {
    setCommitted(filters.search)
    setSearch(filters.search)
  }

  useEffect(() => {
    if (debounced !== search || debounced === committed) return
    onChange({ search: debounced })
  }, [debounced, search, committed, onChange])

  return (
    <div role="search" className={styles.bar} aria-label="Filtrar questões">
      <SearchInput
        label="Buscar questões"
        placeholder="Buscar questões"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
        }}
        className={styles.search}
      />
      <Select
        aria-label="Conteúdo"
        placeholder="Todos os conteúdos"
        options={CONTENT_OPTIONS}
        value={filters.contentId}
        onChange={(event) => {
          onChange({ contentId: event.target.value })
        }}
      />
      <Select
        aria-label="Dificuldade"
        placeholder="Todas as dificuldades"
        options={DIFFICULTY_OPTIONS}
        value={filters.difficulty}
        onChange={(event) => {
          const value = event.target.value
          onChange({ difficulty: isBandId(value) ? value : '' })
        }}
      />
      <Select
        aria-label="Status"
        placeholder="Todos os status"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(event) => {
          const value = event.target.value
          onChange({ status: isQuestionStatus(value) ? value : '' })
        }}
      />
    </div>
  )
}

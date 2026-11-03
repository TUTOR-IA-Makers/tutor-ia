import { isBandId, overlapsBand, type DifficultyBandId } from './difficulty'
import { isQuestionStatus, type QuestionStatus, type QuestionSummary } from './question'

export interface LibraryFilters {
  search: string
  contentId: string
  difficulty: DifficultyBandId | ''
  status: QuestionStatus | ''
}

export const EMPTY_FILTERS: LibraryFilters = {
  search: '',
  contentId: '',
  difficulty: '',
  status: '',
}

export function parseFilters(params: URLSearchParams): LibraryFilters {
  const difficulty = params.get('dificuldade')
  const status = params.get('estado')
  return {
    search: params.get('busca') ?? '',
    contentId: params.get('conteudo') ?? '',
    difficulty: isBandId(difficulty) ? difficulty : '',
    status: isQuestionStatus(status) ? status : '',
  }
}

export function filtersToParams(filters: LibraryFilters): URLSearchParams {
  const entries: [string, string][] = [
    ['busca', filters.search.trim()],
    ['conteudo', filters.contentId],
    ['dificuldade', filters.difficulty],
    ['estado', filters.status],
  ]
  return new URLSearchParams(entries.filter(([, value]) => value !== ''))
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function matchesFilters(question: QuestionSummary, filters: LibraryFilters): boolean {
  const search = normalize(filters.search.trim())
  if (search && !normalize(`${question.title} ${question.description}`).includes(search)) {
    return false
  }
  if (filters.contentId && question.contentId !== filters.contentId) return false
  if (filters.difficulty && !overlapsBand(question.difficulty, filters.difficulty)) return false
  if (filters.status && question.status !== filters.status) return false
  return true
}

export function hasActiveFilters(filters: LibraryFilters): boolean {
  return Object.values(filters).some((value) => value !== '')
}

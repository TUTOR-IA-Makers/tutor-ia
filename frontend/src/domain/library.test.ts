import {
  EMPTY_FILTERS,
  filtersToParams,
  hasActiveFilters,
  matchesFilters,
  parseFilters,
} from './library'
import type { QuestionSummary } from './question'

const question: QuestionSummary = {
  id: 'q-1',
  code: '#0001',
  title: 'Ano bissexto',
  description: 'Calendário gregoriano',
  contentId: 'condicionais',
  difficulty: { min: 1200, max: 1400 },
  status: 'GERADA',
  testCaseCount: 6,
}

describe('library filters', () => {
  it('lê filtros da URL e descarta valores inválidos', () => {
    const params = new URLSearchParams('busca=ano&conteudo=vetores&dificuldade=N2&estado=GERADA')
    expect(parseFilters(params)).toEqual({
      search: 'ano',
      contentId: 'vetores',
      difficulty: '',
      status: 'GERADA',
    })
  })

  it('escreve só os filtros preenchidos', () => {
    const params = filtersToParams({ ...EMPTY_FILTERS, search: ' ano ', difficulty: 'medio' })
    expect(params.toString()).toBe('busca=ano&dificuldade=medio')
  })

  it('faz ida e volta pela URL', () => {
    const filters = {
      search: 'vetor',
      contentId: 'vetores',
      difficulty: 'facil',
      status: 'APROVADA',
    } as const
    expect(parseFilters(filtersToParams(filters))).toEqual(filters)
  })

  it('busca sem diferenciar acentos e maiúsculas', () => {
    expect(matchesFilters(question, { ...EMPTY_FILTERS, search: 'CALENDARIO' })).toBe(true)
    expect(matchesFilters(question, { ...EMPTY_FILTERS, search: 'vetor' })).toBe(false)
  })

  it('combina conteúdo, dificuldade e estado', () => {
    expect(matchesFilters(question, { ...EMPTY_FILTERS, contentId: 'vetores' })).toBe(false)
    expect(matchesFilters(question, { ...EMPTY_FILTERS, difficulty: 'facil' })).toBe(true)
    expect(matchesFilters(question, { ...EMPTY_FILTERS, difficulty: 'muito-dificil' })).toBe(false)
    expect(matchesFilters(question, { ...EMPTY_FILTERS, status: 'APROVADA' })).toBe(false)
    expect(matchesFilters(question, EMPTY_FILTERS)).toBe(true)
  })

  it('sabe se há filtro ativo', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: 'GERADA' })).toBe(true)
  })
})

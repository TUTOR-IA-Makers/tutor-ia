import type { DifficultyRange } from './difficulty'
import type { StructureRules } from './structures'

export const QUESTION_STATUSES = [
  'GERANDO',
  'GERADA',
  'FALHOU_VERIFICACAO',
  'APROVADA',
  'REJEITADA',
] as const

export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

export interface Statement {
  text: string
  input: string
  output: string
  example: { input: string; output: string } | null
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  actualOutput: string | null
  passed: boolean | null
}

export interface ConstraintCheck {
  structureId: string
  rule: keyof StructureRules
  satisfied: boolean
  detail: string | null
}

export interface Compilation {
  command: string
  succeeded: boolean
  message: string
}

export interface QuestionSummary {
  id: string
  code: string
  title: string
  description: string
  contentId: string
  difficulty: DifficultyRange
  status: QuestionStatus
  testCaseCount: number
}

export interface Question extends QuestionSummary {
  statement: Statement
  solution: string | null
  testCases: TestCase[]
  structures: StructureRules
  constraints: ConstraintCheck[]
  compilation: Compilation | null
  failureReason: string | null
}

export interface QuestionDraft {
  contentId: string
  difficulty: DifficultyRange
  testCaseCount: number
  testCaseHints: string
  context: string
  structures: StructureRules
}

export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return typeof value === 'string' && (QUESTION_STATUSES as readonly string[]).includes(value)
}

export function passedCount(testCases: readonly TestCase[]): number {
  return testCases.filter((testCase) => testCase.passed === true).length
}

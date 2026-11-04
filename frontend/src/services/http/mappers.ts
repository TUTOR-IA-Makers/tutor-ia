import type {
  Generation,
  LibraryFilters,
  LoginCredentials,
  Question,
  QuestionDraft,
  QuestionSummary,
  Registration,
  Statement,
} from '@/domain'
import type { Query } from '@/lib/http'
import type { GenerationDto, QuestionDto, QuestionSummaryDto } from './dto'

export function toSummary(dto: QuestionSummaryDto): QuestionSummary {
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    description: dto.description,
    contentId: dto.content_id,
    difficulty: { min: dto.difficulty_min, max: dto.difficulty_max },
    status: dto.status,
    testCaseCount: dto.test_case_count,
  }
}

export function toQuestion(dto: QuestionDto): Question {
  return {
    ...toSummary(dto),
    statement: dto.statement,
    solution: dto.solution,
    testCases: dto.test_cases.map((testCase) => ({
      id: testCase.id,
      input: testCase.input,
      expectedOutput: testCase.expected_output,
      actualOutput: testCase.actual_output,
      passed: testCase.passed,
    })),
    structures: dto.structures,
    constraints: dto.constraints.map((check) => ({
      structureId: check.structure_id,
      rule: check.rule,
      satisfied: check.satisfied,
      detail: check.detail,
    })),
    compilation: dto.compilation,
    failureReason: dto.failure_reason,
  }
}

export function toGeneration(dto: GenerationDto): Generation {
  return {
    questionId: dto.question_id,
    runId: dto.run_id,
    status: dto.status,
    completedSteps: dto.completed_steps,
    failureReason: dto.failure_reason,
  }
}

export function fromDraft(draft: QuestionDraft) {
  return {
    content_id: draft.contentId,
    difficulty_min: draft.difficulty.min,
    difficulty_max: draft.difficulty.max,
    test_case_count: draft.testCaseCount,
    test_case_hints: draft.testCaseHints.trim() || null,
    context: draft.context.trim() || null,
    structures: draft.structures,
  }
}

// Explicit field lists, not spreads: a property added to the domain type later
// must not reach the wire without someone choosing to send it.
export function fromCredentials({ email, password }: LoginCredentials) {
  return { email, password }
}

export function fromRegistration(registration: Registration) {
  return {
    name: registration.name,
    email: registration.email,
    password: registration.password,
    invite_code: registration.inviteCode,
  }
}

export function fromStatement(statement: Statement) {
  return statement
}

export function toQuery(filters: LibraryFilters): Query {
  return {
    q: filters.search.trim(),
    content: filters.contentId,
    difficulty: filters.difficulty,
    status: filters.status,
  }
}

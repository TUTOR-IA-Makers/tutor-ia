import { z } from 'zod/mini'
import { QUESTION_STATUSES } from '@/domain'

const status = z.enum(QUESTION_STATUSES)
const rules = z.object({
  required: z.array(z.string()),
  allowed: z.array(z.string()),
  forbidden: z.array(z.string()),
})

export const healthDto = z.object({ status: z.string(), version: z.string() })

export const createdDto = z.object({ id: z.string() })

export const teacherDto = z.object({ name: z.string(), department: z.string() })

export const questionSummaryDto = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  content_id: z.string(),
  difficulty_min: z.number(),
  difficulty_max: z.number(),
  status,
  test_case_count: z.number(),
})

export const questionListDto = z.object({ items: z.array(questionSummaryDto) })

export const questionDto = z.extend(questionSummaryDto, {
  statement: z.object({
    text: z.string(),
    input: z.string(),
    output: z.string(),
    example: z.nullable(z.object({ input: z.string(), output: z.string() })),
  }),
  solution: z.nullable(z.string()),
  test_cases: z.array(
    z.object({
      id: z.string(),
      input: z.string(),
      expected_output: z.string(),
      actual_output: z.nullable(z.string()),
      passed: z.nullable(z.boolean()),
    }),
  ),
  structures: rules,
  constraints: z.array(
    z.object({
      structure_id: z.string(),
      rule: z.enum(['required', 'allowed', 'forbidden']),
      satisfied: z.boolean(),
      detail: z.nullable(z.string()),
    }),
  ),
  compilation: z.nullable(
    z.object({ command: z.string(), succeeded: z.boolean(), message: z.string() }),
  ),
  failure_reason: z.nullable(z.string()),
})

export const generationDto = z.object({
  question_id: z.string(),
  run_id: z.string(),
  status,
  completed_steps: z.number(),
  failure_reason: z.nullable(z.string()),
})

export const emptyDto = z.optional(z.unknown())

export type QuestionSummaryDto = z.infer<typeof questionSummaryDto>
export type QuestionDto = z.infer<typeof questionDto>
export type GenerationDto = z.infer<typeof generationDto>

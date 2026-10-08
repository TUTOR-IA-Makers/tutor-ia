import type { QuestionsService, Services } from '@/services'
import { createTestServices } from './render'

export function withQuestions(
  overrides: Partial<QuestionsService>,
  base: Services = createTestServices(),
): Services {
  return { ...base, questions: { ...base.questions, ...overrides } }
}

export function createClock(start = 1_000_000) {
  const clock = { now: start }
  return { clock, now: () => clock.now }
}

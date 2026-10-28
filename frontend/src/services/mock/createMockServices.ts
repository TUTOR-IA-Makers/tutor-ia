import {
  GENERATION_STEPS,
  matchesFilters,
  type Generation,
  type Question,
  type QuestionAction,
  type QuestionStatus,
  type QuestionSummary,
  can,
} from '@/domain'
import { HttpError } from '@/lib/http'
import type { Services } from '../contracts'
import { delay } from './delay'
import { MOCK_TEACHER, seedQuestions } from './fixtures'
import { buildMockMoodleXml } from './moodleXml'
import { questionFromDraft } from './template'

export interface MockOptions {
  latencyMs?: number
  stepMs?: number
  now?: () => number
  seed?: () => Question[]
}

interface Record {
  question: Question
  startedAt: number
  runId: string
}

const SEEDED_PROGRESS = 2

function toSummary(question: Question): QuestionSummary {
  const { id, code, title, description, contentId, difficulty, status, testCaseCount } = question
  return { id, code, title, description, contentId, difficulty, status, testCaseCount }
}

function conflict(status: QuestionStatus): HttpError {
  return new HttpError(409, `Esta ação não é possível no estado "${status}".`)
}

export function createMockServices({
  latencyMs = 250,
  stepMs = 1200,
  now = () => Date.now(),
  seed = seedQuestions,
}: MockOptions = {}): Services {
  const store = new Map<string, Record>()
  let sequence = 144

  for (const question of seed()) {
    store.set(question.id, {
      question,
      startedAt: now() - SEEDED_PROGRESS * stepMs,
      runId: `run-${question.id}`,
    })
  }

  const wait = (signal?: AbortSignal) => delay(latencyMs, signal)

  const settle = (record: Record): Record => {
    if (record.question.status !== 'GERANDO') return record
    const steps = Math.floor((now() - record.startedAt) / stepMs)
    if (steps < GENERATION_STEPS.length) return record
    record.question = { ...record.question, status: 'GERADA' }
    return record
  }

  const find = (id: string): Record => {
    const record = store.get(id)
    if (!record) throw new HttpError(404, 'Questão não encontrada. Ela pode ter sido removida.')
    return settle(record)
  }

  const transition = (id: string, action: QuestionAction, status: QuestionStatus): Question => {
    const record = find(id)
    if (!can(record.question.status, action)) throw conflict(record.question.status)
    record.question = { ...record.question, status }
    return structuredClone(record.question)
  }

  const restart = (record: Record) => {
    record.question = { ...record.question, status: 'GERANDO' }
    record.startedAt = now()
    record.runId = `run-${record.question.id}-${String(now())}`
  }

  return {
    questions: {
      async list(filters, options) {
        await wait(options?.signal)
        return [...store.values()]
          .map((record) => toSummary(settle(record).question))
          .filter((question) => matchesFilters(question, filters))
      },
      async get(id, options) {
        await wait(options?.signal)
        return structuredClone(find(id).question)
      },
      async create(draft) {
        await wait()
        sequence += 1
        const code = `#${String(sequence).padStart(4, '0')}`
        const id = `q-${String(sequence).padStart(4, '0')}`
        store.set(id, {
          question: questionFromDraft(id, code, draft),
          startedAt: now(),
          runId: `run-${id}`,
        })
        return { id }
      },
      async generation(id, options) {
        await wait(options?.signal)
        const record = find(id)
        const { status, failureReason } = record.question
        const elapsed = Math.floor((now() - record.startedAt) / stepMs)
        const completedSteps =
          status === 'GERANDO'
            ? Math.min(elapsed, GENERATION_STEPS.length - 1)
            : status === 'FALHOU_VERIFICACAO'
              ? 3
              : GENERATION_STEPS.length
        const generation: Generation = {
          questionId: id,
          runId: record.runId,
          status,
          completedSteps,
          failureReason,
        }
        return generation
      },
      async approve(id) {
        await wait()
        return transition(id, 'approve', 'APROVADA')
      },
      async reject(id) {
        await wait()
        return transition(id, 'reject', 'REJEITADA')
      },
      async regenerate(id) {
        await wait()
        const record = find(id)
        if (!can(record.question.status, 'regenerate')) throw conflict(record.question.status)
        restart(record)
        record.question = {
          ...record.question,
          failureReason: null,
          constraints: record.question.constraints.map((check) => ({
            ...check,
            satisfied: true,
            detail: null,
          })),
        }
        return { id }
      },
      async updateStatement(id, statement) {
        await wait()
        const record = find(id)
        if (!can(record.question.status, 'edit')) throw conflict(record.question.status)
        record.question = { ...record.question, statement, status: 'GERADA' }
        return structuredClone(record.question)
      },
      async exportMoodleXml(ids) {
        await wait()
        const questions = ids.map((id) => find(id).question)
        const notApproved = questions.find((question) => question.status !== 'APROVADA')
        if (notApproved) throw conflict(notApproved.status)
        const xml = buildMockMoodleXml(questions)
        return {
          filename: 'questoes_codeexpert.xml',
          blob: new Blob([xml], { type: 'application/xml' }),
        }
      },
    },
    session: {
      async currentTeacher(options) {
        await wait(options?.signal)
        return { ...MOCK_TEACHER }
      },
      async logout() {
        await wait()
      },
    },
    system: {
      async health(options) {
        await wait(options?.signal)
        return { status: 'ok', version: 'mock' }
      },
    },
  }
}

import {
  GENERATION_STEPS,
  matchesFilters,
  type Generation,
  type Question,
  type QuestionAction,
  type QuestionStatus,
  type QuestionSummary,
  type Teacher,
  can,
} from '@/domain'
import { HttpError } from '@/lib/http'
import type { Services } from '../contracts'
import { delay } from './delay'
import structures from './structures.json'
import { MOCK_ACCOUNT, MOCK_INVITE_CODE, MOCK_TEACHER, seedQuestions } from './fixtures'
import { buildMockMoodleXml } from './moodleXml'
import { questionFromDraft } from './template'

export interface MockOptions {
  latencyMs?: number
  stepMs?: number
  now?: () => number
  seed?: () => Question[]
  interrupted?: readonly string[]
}

interface Record {
  question: Question
  startedAt: number
  runId: string
  stoppedAt?: number
}

const INTERRUPTED_STEPS = 2

export const MOCK_INTERRUPTED_REASON =
  'A geração foi interrompida porque o servidor reiniciou. Retome para continuar de onde parou, sem repetir as etapas já concluídas.'

const SEEDED_PROGRESS = 2

function toSummary(question: Question): QuestionSummary {
  const { id, code, title, description, contentId, difficulty, status, testCaseCount } = question
  return { id, code, title, description, contentId, difficulty, status, testCaseCount }
}

// The same detail for every refusal, so the mock behaves like the backend we
// are asking for: a failed login or signup never says which part was wrong.
const loginRefused = () => new HttpError(401, 'Credenciais inválidas.')
const signupRefused = () => new HttpError(400, 'Não foi possível criar a conta.')

function conflict(status: QuestionStatus): HttpError {
  return new HttpError(409, `Esta ação não é possível no estado "${status}".`)
}

export function createMockServices({
  latencyMs = 250,
  stepMs = 1200,
  now = () => Date.now(),
  seed = seedQuestions,
  interrupted = [],
}: MockOptions = {}): Services {
  const store = new Map<string, Record>()
  let sequence = 144

  for (const question of seed()) {
    const stopped = interrupted.includes(question.id)
    store.set(question.id, {
      question: stopped
        ? { ...question, status: 'FALHOU_VERIFICACAO', failureReason: MOCK_INTERRUPTED_REASON }
        : question,
      startedAt: now() - SEEDED_PROGRESS * stepMs,
      runId: `run-${question.id}`,
      ...(stopped && { stoppedAt: INTERRUPTED_STEPS }),
    })
  }

  const wait = (signal?: AbortSignal) => delay(latencyMs, signal)

  const accounts = new Map<string, { password: string; teacher: Teacher }>([
    [MOCK_ACCOUNT.email, { password: MOCK_ACCOUNT.password, teacher: MOCK_TEACHER }],
  ])
  let teacher: Teacher = MOCK_TEACHER

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

  const progress = (id: string, record: Record): Generation => {
    const { status, failureReason } = record.question
    const elapsed = Math.floor((now() - record.startedAt) / stepMs)
    const completedSteps =
      record.stoppedAt ??
      (status === 'GERANDO'
        ? Math.min(elapsed, GENERATION_STEPS.length - 1)
        : status === 'FALHOU_VERIFICACAO'
          ? 3
          : GENERATION_STEPS.length)
    return {
      questionId: id,
      runId: record.runId,
      status,
      completedSteps,
      failureReason,
      resumable: record.stoppedAt !== undefined,
    }
  }

  const restart = (record: Record) => {
    delete record.stoppedAt
    record.question = { ...record.question, status: 'GERANDO' }
    record.startedAt = now()
    record.runId = `run-${record.question.id}-${String(now())}`
  }

  return {
    catalog: {
      async structures(options) {
        await wait(options?.signal)
        return structuredClone(structures)
      },
    },
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
        return progress(id, find(id))
      },
      async resume(id) {
        await wait()
        const record = find(id)
        const { stoppedAt } = record
        if (stoppedAt === undefined) throw conflict(record.question.status)
        delete record.stoppedAt
        record.startedAt = now() - stoppedAt * stepMs
        record.question = { ...record.question, status: 'GERANDO', failureReason: null }
        return progress(id, record)
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
        return { ...teacher }
      },
      async login({ email, password }, options) {
        await wait(options?.signal)
        const account = accounts.get(email)
        if (account?.password !== password) throw loginRefused()
        teacher = account.teacher
      },
      async register({ name, email, password, inviteCode }, options) {
        await wait(options?.signal)
        if (inviteCode !== MOCK_INVITE_CODE || accounts.has(email)) throw signupRefused()
        const created = { name, department: MOCK_TEACHER.department }
        accounts.set(email, { password, teacher: created })
        teacher = created
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

import { createHttpClient, type HttpClient } from '@/lib/http'
import type { Services } from '../contracts'
import {
  createdDto,
  emptyDto,
  generationDto,
  healthDto,
  questionDto,
  questionListDto,
  teacherDto,
} from './dto'
import { API_PREFIX, ENDPOINTS } from './endpoints'
import { fromDraft, fromStatement, toGeneration, toQuery, toQuestion, toSummary } from './mappers'

export interface HttpServicesConfig {
  baseUrl?: string
  timeoutMs?: number
}

export function createHttpServices({
  baseUrl = API_PREFIX,
  timeoutMs,
}: HttpServicesConfig = {}): Services {
  const config = timeoutMs === undefined ? {} : { timeoutMs }
  const api: HttpClient = createHttpClient({ baseUrl, ...config })
  const root: HttpClient = createHttpClient(config)

  return {
    questions: {
      list: async (filters, options = {}) => {
        const { items } = await api.get(ENDPOINTS.questions, questionListDto, {
          ...options,
          query: toQuery(filters),
        })
        return items.map(toSummary)
      },
      get: async (id, options = {}) =>
        toQuestion(await api.get(ENDPOINTS.question(id), questionDto, options)),
      create: (draft) => api.post(ENDPOINTS.questions, createdDto, { body: fromDraft(draft) }),
      generation: async (id, options = {}) =>
        toGeneration(await api.get(ENDPOINTS.generation(id), generationDto, options)),
      approve: async (id) => toQuestion(await api.post(ENDPOINTS.approve(id), questionDto)),
      reject: async (id) => toQuestion(await api.post(ENDPOINTS.reject(id), questionDto)),
      regenerate: (id) => api.post(ENDPOINTS.regenerate(id), createdDto),
      updateStatement: async (id, statement) =>
        toQuestion(
          await api.patch(ENDPOINTS.statement(id), questionDto, { body: fromStatement(statement) }),
        ),
      exportMoodleXml: (ids) =>
        api.download(ENDPOINTS.moodleExport, 'questoes_codeexpert.xml', {
          method: 'POST',
          body: { question_ids: ids },
        }),
    },
    session: {
      currentTeacher: (options = {}) => api.get(ENDPOINTS.session, teacherDto, options),
      logout: async () => {
        await api.post(ENDPOINTS.logout, emptyDto)
      },
    },
    system: {
      health: (options = {}) => root.get(ENDPOINTS.health, healthDto, options),
    },
  }
}

import type {
  Generation,
  LibraryFilters,
  Question,
  QuestionDraft,
  QuestionSummary,
  Statement,
  Teacher,
} from '@/domain'

export interface CallOptions {
  signal?: AbortSignal
}

export interface ExportedFile {
  filename: string
  blob: Blob
}

export interface Health {
  status: string
  version: string
}

export interface QuestionsService {
  list(filters: LibraryFilters, options?: CallOptions): Promise<QuestionSummary[]>
  get(id: string, options?: CallOptions): Promise<Question>
  create(draft: QuestionDraft): Promise<{ id: string }>
  generation(id: string, options?: CallOptions): Promise<Generation>
  approve(id: string): Promise<Question>
  reject(id: string): Promise<Question>
  regenerate(id: string): Promise<{ id: string }>
  updateStatement(id: string, statement: Statement): Promise<Question>
  exportMoodleXml(ids: readonly string[]): Promise<ExportedFile>
}

export interface SessionService {
  currentTeacher(options?: CallOptions): Promise<Teacher>
  logout(): Promise<void>
}

export interface SystemService {
  health(options?: CallOptions): Promise<Health>
}

export interface Services {
  questions: QuestionsService
  session: SessionService
  system: SystemService
}

export type ApiMode = 'mock' | 'http'

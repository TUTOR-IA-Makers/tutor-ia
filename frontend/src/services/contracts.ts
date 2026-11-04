import type {
  Generation,
  LibraryFilters,
  LoginCredentials,
  Question,
  QuestionDraft,
  QuestionSummary,
  Registration,
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

// login and register resolve with nothing: the session travels in an HttpOnly
// cookie the browser stores, so the caller refetches currentTeacher instead of
// receiving a token it would have to keep somewhere script can read.
export interface SessionService {
  currentTeacher(options?: CallOptions): Promise<Teacher>
  login(credentials: LoginCredentials, options?: CallOptions): Promise<void>
  register(registration: Registration, options?: CallOptions): Promise<void>
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

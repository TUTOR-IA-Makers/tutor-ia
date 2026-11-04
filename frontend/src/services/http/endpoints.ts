const segment = (value: string) => encodeURIComponent(value)

export const API_PREFIX = '/api/v1'

export const ENDPOINTS = {
  health: '/health',
  structures: '/structures',
  questions: '/questions',
  question: (id: string) => `/questions/${segment(id)}`,
  generation: (id: string) => `/questions/${segment(id)}/generation`,
  approve: (id: string) => `/questions/${segment(id)}/approve`,
  reject: (id: string) => `/questions/${segment(id)}/reject`,
  regenerate: (id: string) => `/questions/${segment(id)}/regenerate`,
  statement: (id: string) => `/questions/${segment(id)}/statement`,
  moodleExport: '/exports/moodle',
  session: '/session',
  logout: '/session/logout',
  accounts: '/accounts',
} as const

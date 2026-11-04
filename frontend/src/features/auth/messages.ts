import { HttpError, NetworkError, TimeoutError } from '@/lib/http'

export type AuthMode = 'login' | 'signup'

// The server's own detail is never shown here, unlike describeError: a
// message that changes with the cause would tell a stranger whether an
// e-mail has an account or an invite exists (G8-1).
export const AUTH_MESSAGES = {
  loginRefused: 'E-mail ou senha incorretos.',
  signupRefused:
    'Não foi possível criar a conta com esses dados. Confira o código de convite ou peça um novo.',
  tooMany: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  offline: 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.',
  unavailable: 'O serviço está indisponível agora. Tente de novo em alguns minutos.',
  invalid: 'Revise os campos destacados antes de continuar.',
} as const

export function authErrorMessage(mode: AuthMode, error: unknown): string {
  if (error instanceof NetworkError || error instanceof TimeoutError) return AUTH_MESSAGES.offline
  if (error instanceof HttpError) {
    if (error.status === 429) return AUTH_MESSAGES.tooMany
    if (error.status >= 400 && error.status < 500)
      return mode === 'login' ? AUTH_MESSAGES.loginRefused : AUTH_MESSAGES.signupRefused
  }
  return AUTH_MESSAGES.unavailable
}

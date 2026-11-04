import { HttpError, NetworkError, TimeoutError } from '@/lib/http'
import {
  COOLDOWN_MS,
  INITIAL_ATTEMPTS,
  MAX_FAILURES,
  recordFailure,
  remainingSeconds,
} from './attempts'
import { AFTER_AUTH, destinationAfterAuth } from './destination'
import { AUTH_MESSAGES, authErrorMessage } from './messages'

describe('tentativas', () => {
  it(`trava por ${String(COOLDOWN_MS / 1000)} s depois de ${String(MAX_FAILURES)} falhas`, () => {
    let state = INITIAL_ATTEMPTS
    for (let i = 1; i < MAX_FAILURES; i += 1) state = recordFailure(state, 0)
    expect(remainingSeconds(state, 0)).toBe(0)
    state = recordFailure(state, 1_000)
    expect(remainingSeconds(state, 1_000)).toBe(30)
    expect(remainingSeconds(state, 1_000 + COOLDOWN_MS - 1)).toBe(1)
    expect(remainingSeconds(state, 1_000 + COOLDOWN_MS)).toBe(0)
  })

  it('zera a contagem ao travar, para a próxima trava exigir outras cinco falhas', () => {
    let state = INITIAL_ATTEMPTS
    for (let i = 0; i < MAX_FAILURES; i += 1) state = recordFailure(state, 0)
    expect(state.failures).toBe(0)
  })
})

describe('destinationAfterAuth', () => {
  it.each([
    [null, AFTER_AUTH],
    ['/gerar', '/gerar'],
    ['/questoes/q-1?aba=testes', '/questoes/q-1?aba=testes'],
    ['//evil.com', AFTER_AUTH],
    ['https://evil.com', AFTER_AUTH],
    ['/\\evil.com', AFTER_AUTH],
    // eslint-disable-next-line no-script-url -- the guard must refuse it, so the test feeds one
    ['javascript:alert(1)', AFTER_AUTH],
    ['/entrar', AFTER_AUTH],
    ['/criar-conta?proximo=/gerar', AFTER_AUTH],
  ])('%s leva a %s', (next, expected) => {
    expect(destinationAfterAuth(next)).toBe(expected)
  })
})

describe('authErrorMessage', () => {
  it('nunca repete o detalhe do servidor', () => {
    const revealing = new HttpError(404, 'Nenhuma conta com ana@universidade.br')
    expect(authErrorMessage('login', revealing)).toBe(AUTH_MESSAGES.loginRefused)
    expect(authErrorMessage('signup', revealing)).toBe(AUTH_MESSAGES.signupRefused)
  })

  it.each([
    [new HttpError(401, 'x'), AUTH_MESSAGES.loginRefused],
    [new HttpError(429, 'x'), AUTH_MESSAGES.tooMany],
    [new HttpError(503, 'x'), AUTH_MESSAGES.unavailable],
    [new NetworkError('x'), AUTH_MESSAGES.offline],
    [new TimeoutError('x'), AUTH_MESSAGES.offline],
    [new Error('x'), AUTH_MESSAGES.unavailable],
  ])('%o vira mensagem genérica', (error, expected) => {
    expect(authErrorMessage('login', error)).toBe(expected)
  })
})

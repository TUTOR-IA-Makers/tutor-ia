import { HttpError, isHttpStatus } from './errors'

describe('isHttpStatus', () => {
  it('reconhece o status de um HttpError', () => {
    expect(isHttpStatus(new HttpError(409, 'x'), 409)).toBe(true)
    expect(isHttpStatus(new HttpError(404, 'x'), 409)).toBe(false)
    expect(isHttpStatus(new Error('x'), 409)).toBe(false)
  })

  it('formata a mensagem com status e detail', () => {
    expect(new HttpError(404, 'sumiu').message).toBe('HTTP 404: sumiu')
  })
})

import { HttpError } from '@/lib/http'
import { createQueryClient } from './queryClient'

function retryPolicy() {
  const retry = createQueryClient().getDefaultOptions().queries?.retry
  if (typeof retry !== 'function') throw new Error('retry deveria ser uma função')
  return retry
}

describe('createQueryClient', () => {
  it('não repete erros do cliente (4xx)', () => {
    expect(retryPolicy()(0, new HttpError(409, 'conflito'))).toBe(false)
  })

  it('repete erros do servidor até o limite', () => {
    const retry = retryPolicy()
    expect(retry(0, new HttpError(503, 'indisponível'))).toBe(true)
    expect(retry(1, new TypeError('rede'))).toBe(true)
    expect(retry(2, new TypeError('rede'))).toBe(false)
  })

  it('não repete mutações', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })
})

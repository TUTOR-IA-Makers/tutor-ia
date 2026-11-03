import { delay } from './delay'

describe('delay', () => {
  it('resolve depois do tempo', async () => {
    await expect(delay(1)).resolves.toBeUndefined()
  })

  it('rejeita na hora se o sinal já foi cancelado', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(delay(1000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })
})

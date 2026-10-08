import { http, HttpResponse } from 'msw'
import { z } from 'zod/mini'
import { server } from '@/test/server'
import { createHttpClient, joinPath } from './createHttpClient'
import { TimeoutError } from './errors'

const schema = z.object({ ok: z.boolean() })

describe('joinPath', () => {
  it.each([
    ['/api/v1', '/questions', '/api/v1/questions'],
    ['/api/v1/', '/questions', '/api/v1/questions'],
    ['/api/v1', 'questions', '/api/v1/questions'],
    ['', '/health', '/health'],
  ])('junta %s e %s', (base, path, expected) => {
    expect(joinPath(base, path)).toBe(expected)
  })
})

describe('createHttpClient', () => {
  it.each(['get', 'post', 'put', 'patch', 'delete'] as const)(
    '%s usa o prefixo e o método certos',
    async (verb) => {
      let seen = ''
      server.use(
        http.all('*/api/v1/recurso', ({ request }) => {
          seen = `${request.method} ${new URL(request.url).pathname}`
          return HttpResponse.json({ ok: true })
        }),
      )
      const client = createHttpClient({ baseUrl: '/api/v1' })
      await expect(client[verb]('/recurso', schema)).resolves.toEqual({ ok: true })
      expect(seen).toBe(`${verb.toUpperCase()} /api/v1/recurso`)
    },
  )

  it('aplica o timeout padrão configurado', async () => {
    server.use(
      http.get('*/lento', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json({ ok: true })
      }),
    )
    const client = createHttpClient({ timeoutMs: 10 })
    await expect(client.get('/lento', schema)).rejects.toBeInstanceOf(TimeoutError)
  })

  it('baixa arquivos pelo prefixo configurado', async () => {
    server.use(http.get('*/api/v1/arquivo', () => new HttpResponse('conteudo')))
    const client = createHttpClient({ baseUrl: '/api/v1' })
    const file = await client.download('/arquivo', 'reserva.txt')
    expect(file.filename).toBe('reserva.txt')
    expect(await file.blob.text()).toBe('conteudo')
  })
})

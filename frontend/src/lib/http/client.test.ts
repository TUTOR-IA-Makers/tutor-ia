import { http, HttpResponse } from 'msw'
import { z } from 'zod/mini'
import { server } from '@/test/server'
import {
  assertRelativePath,
  buildUrl,
  CSRF_HEADER,
  CSRF_HEADER_VALUE,
  download,
  filenameFrom,
  request,
} from './client'
import { describeError } from './describeError'
import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

const schema = z.object({ id: z.string() })

describe('assertRelativePath', () => {
  it.each(['https://evil.example/api', '//evil.example/api', 'api/x', '/\\evil.example'])(
    'rejeita %s',
    (path) => {
      expect(() => {
        assertRelativePath(path)
      }).toThrow(TypeError)
    },
  )

  it('aceita caminho relativo à origem', () => {
    expect(() => {
      assertRelativePath('/api/v1/questions')
    }).not.toThrow()
  })
})

describe('buildUrl', () => {
  it('ignora valores vazios e repete chaves de listas', () => {
    const url = buildUrl('/api/items', {
      q: 'vetor',
      empty: '',
      none: null,
      skip: undefined,
      tag: ['a', 'b'],
      page: 2,
    })
    expect(url.pathname).toBe('/api/items')
    expect(url.search).toBe('?q=vetor&tag=a&tag=b&page=2')
  })

  it('mantém a origem da página', () => {
    expect(buildUrl('/x').origin).toBe(window.location.origin)
  })
})

describe('request', () => {
  it('valida e devolve o corpo da resposta', async () => {
    server.use(http.get('*/api/item', () => HttpResponse.json({ id: 'abc' })))
    await expect(request('/api/item', schema)).resolves.toEqual({ id: 'abc' })
  })

  it('envia query string', async () => {
    let search = ''
    server.use(
      http.get('*/api/item', ({ request: req }) => {
        search = new URL(req.url).search
        return HttpResponse.json({ id: 'abc' })
      }),
    )
    await request('/api/item', schema, { query: { status: 'APROVADA' } })
    expect(search).toBe('?status=APROVADA')
  })

  it('não envia o header anti-CSRF em GET', async () => {
    let header: string | null = 'unset'
    server.use(
      http.get('*/api/item', ({ request: req }) => {
        header = req.headers.get(CSRF_HEADER)
        return HttpResponse.json({ id: 'abc' })
      }),
    )
    await request('/api/item', schema)
    expect(header).toBeNull()
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
    'envia header anti-CSRF e JSON em %s',
    async (method) => {
      let received: { header: string | null; type: string | null; body: unknown } | undefined
      server.use(
        http.all('*/api/item', async ({ request: req }) => {
          received = {
            header: req.headers.get(CSRF_HEADER),
            type: req.headers.get('Content-Type'),
            body: await req.json(),
          }
          return HttpResponse.json({ id: 'novo' }, { status: 201 })
        }),
      )
      await expect(request('/api/item', schema, { method, body: { a: 1 } })).resolves.toEqual({
        id: 'novo',
      })
      expect(received).toEqual({
        header: CSRF_HEADER_VALUE,
        type: 'application/json',
        body: { a: 1 },
      })
    },
  )

  it('aceita 204 sem corpo quando o schema permite', async () => {
    server.use(http.post('*/api/empty', () => new HttpResponse(null, { status: 204 })))
    await expect(request('/api/empty', z.undefined(), { method: 'POST' })).resolves.toBeUndefined()
  })

  it('converte erro da API em HttpError com o detail do backend', async () => {
    server.use(
      http.get('*/api/item', () =>
        HttpResponse.json({ detail: 'Questão não encontrada.' }, { status: 404 }),
      ),
    )
    await expect(request('/api/item', schema)).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
      detail: 'Questão não encontrada.',
    })
  })

  it('não repassa o statusText quando o erro não traz JSON', async () => {
    server.use(
      http.get(
        '*/api/item',
        () => new HttpResponse('oops', { status: 502, statusText: 'Bad Gateway' }),
      ),
    )
    const error = await request('/api/item', schema).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(HttpError)
    expect((error as HttpError).detail).toBe('')
  })

  it('mostra a mensagem em português quando detail não é texto', async () => {
    server.use(
      http.get('*/api/item', () =>
        HttpResponse.json({ detail: [{ msg: 'x' }] }, { status: 422, statusText: 'Unprocessable' }),
      ),
    )
    const error = await request('/api/item', schema).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 422, detail: '' })
    expect(describeError(error).message).toBe('Confira os campos destacados e tente de novo.')
  })

  it('rejeita resposta fora do contrato', async () => {
    server.use(http.get('*/api/item', () => HttpResponse.json({ id: 1 })))
    await expect(request('/api/item', schema)).rejects.toBeInstanceOf(ResponseShapeError)
  })

  it('recusa URL absoluta antes de chamar a rede', async () => {
    await expect(request('https://evil.example/x', schema)).rejects.toBeInstanceOf(TypeError)
  })

  it('converte falha de rede em NetworkError', async () => {
    server.use(http.get('*/api/item', () => HttpResponse.error()))
    await expect(request('/api/item', schema)).rejects.toBeInstanceOf(NetworkError)
  })

  it('converte demora acima do limite em TimeoutError', async () => {
    server.use(
      http.get('*/api/slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json({ id: 'x' })
      }),
    )
    await expect(request('/api/slow', schema, { timeoutMs: 10 })).rejects.toBeInstanceOf(
      TimeoutError,
    )
  })

  it('propaga o cancelamento feito por quem chamou', async () => {
    server.use(http.get('*/api/item', () => HttpResponse.json({ id: 'x' })))
    const controller = new AbortController()
    controller.abort()
    const error = await request('/api/item', schema, { signal: controller.signal }).catch(
      (e: unknown) => e,
    )
    expect(error).not.toBeInstanceOf(NetworkError)
    expect(error).not.toBeInstanceOf(TimeoutError)
  })
})

describe('download', () => {
  it('devolve o blob com o nome indicado pelo servidor', async () => {
    server.use(
      http.post(
        '*/api/export',
        () =>
          new HttpResponse('<quiz/>', {
            headers: {
              'Content-Type': 'application/xml',
              'Content-Disposition': 'attachment; filename="turma-a.xml"',
            },
          }),
      ),
    )
    const file = await download('/api/export', 'padrao.xml', { method: 'POST', body: { ids: [] } })
    expect(file.filename).toBe('turma-a.xml')
    expect(await file.blob.text()).toBe('<quiz/>')
  })
})

describe('filenameFrom', () => {
  it('usa o nome de reserva sem cabeçalho', () => {
    expect(filenameFrom(null, 'padrao.xml')).toBe('padrao.xml')
    expect(filenameFrom('attachment', 'padrao.xml')).toBe('padrao.xml')
  })

  it('decodifica filename* e remove barras', () => {
    expect(filenameFrom("attachment; filename*=UTF-8''quest%C3%B5es.xml", 'x')).toBe('questões.xml')
    expect(filenameFrom('attachment; filename="../../etc/passwd"', 'x')).toBe('.._.._etc_passwd')
  })

  it('mantém o nome como veio quando o escape é inválido', () => {
    expect(filenameFrom('attachment; filename="100%.xml"', 'x')).toBe('100%.xml')
  })
})

import { http, HttpResponse } from 'msw'
import { EMPTY_FILTERS } from '@/domain'
import { CSRF_HEADER, ResponseShapeError } from '@/lib/http'
import { server } from '@/test/server'
import { createHttpServices } from './createHttpServices'

const summaryDto = {
  id: 'q-1',
  code: '#0001',
  title: 'Ano bissexto',
  description: 'Calendário',
  content_id: 'condicionais',
  difficulty_min: 1200,
  difficulty_max: 1400,
  status: 'GERADA',
  test_case_count: 1,
}

const questionDto = {
  ...summaryDto,
  statement: { text: 'Leia um ano', input: 'Ano', output: 'Resposta', example: null },
  solution: 'int main(void) { return 0; }',
  test_cases: [
    {
      id: 'c1',
      input: '2024',
      expected_output: 'BISSEXTO',
      actual_output: 'BISSEXTO',
      passed: true,
    },
  ],
  structures: { required: ['if-else'], allowed: [], forbidden: ['lacos'] },
  constraints: [{ structure_id: 'lacos', rule: 'forbidden', satisfied: true, detail: null }],
  compilation: { command: 'gcc', succeeded: true, message: 'ok' },
  failure_reason: null,
}

function capture() {
  const calls: {
    method: string
    path: string
    search: string
    body: unknown
    csrf: string | null
  }[] = []
  server.use(
    http.all('*/api/v1/*', async ({ request }) => {
      const url = new URL(request.url)
      const text = await request.text()
      calls.push({
        method: request.method,
        path: url.pathname,
        search: url.search,
        body: text ? (JSON.parse(text) as unknown) : undefined,
        csrf: request.headers.get(CSRF_HEADER),
      })
      if (url.pathname === '/api/v1/questions' && request.method === 'GET') {
        return HttpResponse.json({ items: [summaryDto] })
      }
      if (url.pathname.endsWith('/generation')) {
        return HttpResponse.json({
          question_id: 'q-1',
          run_id: 'run-1',
          status: 'GERANDO',
          completed_steps: 2,
          failure_reason: null,
        })
      }
      if (url.pathname === '/api/v1/questions' || url.pathname.endsWith('/regenerate')) {
        return HttpResponse.json({ id: 'q-1' }, { status: 202 })
      }
      if (url.pathname === '/api/v1/exports/moodle') {
        return new HttpResponse('<quiz/>', {
          headers: { 'Content-Disposition': 'attachment; filename="lote.xml"' },
        })
      }
      if (url.pathname === '/api/v1/session')
        return HttpResponse.json({ name: 'Profa. Ana', department: 'CIC' })
      if (url.pathname === '/api/v1/session/logout') return new HttpResponse(null, { status: 204 })
      return HttpResponse.json(questionDto)
    }),
  )
  return calls
}

describe('createHttpServices', () => {
  const services = createHttpServices()

  it('lista questões com filtros na query e converte o DTO', async () => {
    const calls = capture()
    const list = await services.questions.list({
      ...EMPTY_FILTERS,
      search: 'ano',
      status: 'GERADA',
    })
    expect(calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/v1/questions',
      search: '?q=ano&status=GERADA',
    })
    expect(list).toEqual([
      {
        id: 'q-1',
        code: '#0001',
        title: 'Ano bissexto',
        description: 'Calendário',
        contentId: 'condicionais',
        difficulty: { min: 1200, max: 1400 },
        status: 'GERADA',
        testCaseCount: 1,
      },
    ])
  })

  it('busca a questão completa e converte casos e restrições', async () => {
    capture()
    const question = await services.questions.get('q-1')
    expect(question.testCases[0]).toEqual({
      id: 'c1',
      input: '2024',
      expectedOutput: 'BISSEXTO',
      actualOutput: 'BISSEXTO',
      passed: true,
    })
    expect(question.constraints[0]).toEqual({
      structureId: 'lacos',
      rule: 'forbidden',
      satisfied: true,
      detail: null,
    })
    expect(question.failureReason).toBeNull()
  })

  it('cria a questão enviando o rascunho em snake_case', async () => {
    const calls = capture()
    await expect(
      services.questions.create({
        contentId: 'vetores',
        difficulty: { min: 800, max: 1000 },
        testCaseCount: 5,
        testCaseHints: '  vetor vazio  ',
        context: '',
        structures: { required: ['for'], allowed: [], forbidden: [] },
      }),
    ).resolves.toEqual({ id: 'q-1' })
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/questions',
      csrf: 'codeexpert-web',
      body: {
        content_id: 'vetores',
        difficulty_min: 800,
        difficulty_max: 1000,
        test_case_count: 5,
        test_case_hints: 'vetor vazio',
        context: null,
        structures: { required: ['for'], allowed: [], forbidden: [] },
      },
    })
  })

  it('consulta o andamento da geração', async () => {
    capture()
    expect(await services.questions.generation('q-1')).toEqual({
      questionId: 'q-1',
      runId: 'run-1',
      status: 'GERANDO',
      completedSteps: 2,
      failureReason: null,
    })
  })

  it.each([
    ['approve', 'POST', '/api/v1/questions/q-1/approve'],
    ['reject', 'POST', '/api/v1/questions/q-1/reject'],
    ['regenerate', 'POST', '/api/v1/questions/q-1/regenerate'],
  ] as const)('%s chama %s %s', async (action, method, path) => {
    const calls = capture()
    await services.questions[action]('q-1')
    expect(calls[0]).toMatchObject({ method, path })
  })

  it('codifica o id no caminho', async () => {
    const calls = capture()
    await services.questions.get('a/b')
    expect(calls[0]?.path).toBe('/api/v1/questions/a%2Fb')
  })

  it('atualiza o enunciado com PATCH', async () => {
    const calls = capture()
    const statement = { text: 'Novo', input: 'a', output: 'b', example: null }
    await services.questions.updateStatement('q-1', statement)
    expect(calls[0]).toMatchObject({
      method: 'PATCH',
      path: '/api/v1/questions/q-1/statement',
      body: statement,
    })
  })

  it('baixa o XML do lote', async () => {
    const calls = capture()
    const file = await services.questions.exportMoodleXml(['q-1', 'q-2'])
    expect(calls[0]).toMatchObject({ method: 'POST', body: { question_ids: ['q-1', 'q-2'] } })
    expect(file.filename).toBe('lote.xml')
  })

  it('lê a sessão e encerra com POST', async () => {
    const calls = capture()
    expect(await services.session.currentTeacher()).toEqual({
      name: 'Profa. Ana',
      department: 'CIC',
    })
    await services.session.logout()
    expect(calls[1]).toMatchObject({ method: 'POST', path: '/api/v1/session/logout' })
  })

  it('consulta /health na raiz, fora do prefixo da API', async () => {
    server.use(http.get('*/health', () => HttpResponse.json({ status: 'ok', version: '0.1.0' })))
    expect(await services.system.health()).toEqual({ status: 'ok', version: '0.1.0' })
  })

  it('recusa resposta fora do contrato', async () => {
    server.use(
      http.get('*/api/v1/questions/q-1', () =>
        HttpResponse.json({ ...questionDto, status: 'PUBLICADA' }),
      ),
    )
    await expect(services.questions.get('q-1')).rejects.toBeInstanceOf(ResponseShapeError)
  })

  it('aceita outro prefixo de API', async () => {
    let path = ''
    server.use(
      http.get('*/api/v2/questions', ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({ items: [] })
      }),
    )
    await createHttpServices({ baseUrl: '/api/v2', timeoutMs: 500 }).questions.list(EMPTY_FILTERS)
    expect(path).toBe('/api/v2/questions')
  })
})

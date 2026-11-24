import { describeError } from './describeError'
import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

describe('describeError', () => {
  it('não mostra o detail do backend', () => {
    const detail = "Question 'q-9' not found. Create one with POST /api/v1/questions."
    expect(describeError(new HttpError(404, detail))).toEqual({
      title: 'Não encontrado',
      message: 'O item pode ter sido removido. Volte à biblioteca e abra a questão de novo.',
      sessionExpired: false,
    })
  })

  it('marca a sessão expirada para a tela oferecer o login, e só ela', () => {
    expect(describeError(new HttpError(401, '')).sessionExpired).toBe(true)
    expect(describeError(new HttpError(403, '')).sessionExpired).toBe(false)
    expect(describeError(new NetworkError('x')).sessionExpired).toBe(false)
  })

  it('usa a mensagem padrão quando o detail está vazio', () => {
    expect(describeError(new HttpError(409, ' ')).title).toBe('A questão mudou de estado')
  })

  it('não expõe detalhes internos em erros 5xx', () => {
    const description = describeError(new HttpError(500, 'Traceback: segredo'))
    expect(description.title).toBe('Erro no servidor')
    expect(description.message).not.toContain('Traceback')
  })

  it('cai na mensagem genérica para status 4xx desconhecido sem detail', () => {
    expect(describeError(new HttpError(418, '')).title).toBe('Algo deu errado')
  })

  it('separa cota, provedor de IA, geração desligada e sessão expirada', () => {
    const quota = describeError(new HttpError(429, ''))
    const provider = describeError(new HttpError(502, 'HTTP 429 do provedor'))
    const disabled = describeError(new HttpError(503, ''))
    const session = describeError(new HttpError(401, ''))

    expect(quota.title).toBe('Cota de gerações atingida')
    expect(quota.message).toContain('continuam na biblioteca')
    expect(provider.title).toBe('Provedor de IA indisponível')
    expect(provider.message).toBe(
      'O serviço de IA que escreve as questões não respondeu. Nada foi perdido. Tente de novo em alguns minutos.',
    )
    expect(disabled.title).toBe('Geração indisponível')
    expect(disabled.message).toContain('Avise a equipe')
    expect(session.title).toBe('Sessão expirada')
    expect(session.message).toContain('Entre de novo para continuar')

    const messages = new Set([quota, provider, disabled, session].map((d) => d.message))
    expect(messages.size).toBe(4)
  })

  it.each([
    [30, 'Tente de novo em alguns segundos.'],
    [60, 'Tente de novo em 1 min.'],
    [1790, 'Tente de novo em 30 min.'],
    [3601, 'Tente de novo em 2 h.'],
  ])('na cota, diz quando tentar de novo com Retry-After de %i s', (seconds, text) => {
    expect(describeError(new HttpError(429, '', seconds)).message).toBe(
      `Você usou todas as gerações disponíveis por enquanto. As questões já geradas continuam na biblioteca. ${text}`,
    )
  })

  it.each([
    [new TimeoutError('x'), 'Tempo esgotado'],
    [new NetworkError('x'), 'Sem conexão'],
    [new ResponseShapeError('x'), 'Resposta inesperada'],
    [new Error('x'), 'Algo deu errado'],
    ['texto', 'Algo deu errado'],
  ])('descreve %s', (error, title) => {
    expect(describeError(error).title).toBe(title)
  })

  it.each([
    ...[400, 401, 403, 404, 409, 418, 422, 429, 500, 502, 503, 504].map(
      (status) => new HttpError(status, ''),
    ),
    new TimeoutError('x'),
    new NetworkError('x'),
    new ResponseShapeError('x'),
    new Error('x'),
  ])('%s termina com um próximo passo', (error) => {
    expect(describeError(error).message).toMatch(
      /(tente|confira|corrija|recarregue|volte|fale|avise|carregamos|biblioteca)[^.]*\.$/i,
    )
  })
})

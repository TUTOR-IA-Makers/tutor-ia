import { describeError } from './describeError'
import { HttpError, NetworkError, ResponseShapeError, TimeoutError } from './errors'

describe('describeError', () => {
  it('usa o detail do backend em erros 4xx', () => {
    expect(describeError(new HttpError(422, 'O conteúdo é obrigatório.'))).toEqual({
      title: 'Dados inválidos',
      message: 'O conteúdo é obrigatório.',
    })
  })

  it('usa a mensagem padrão quando o detail está vazio', () => {
    expect(describeError(new HttpError(409, ' ')).title).toBe('A questão mudou de estado')
  })

  it('não expõe detalhes internos em erros 5xx', () => {
    const description = describeError(new HttpError(500, 'Traceback: segredo'))
    expect(description.title).toBe('Erro no servidor')
    expect(description.message).not.toContain('Traceback')
  })

  it('tem mensagem própria para serviço indisponível', () => {
    expect(describeError(new HttpError(503, '')).title).toBe('Geração indisponível')
  })

  it('cai na mensagem genérica para status 4xx desconhecido sem detail', () => {
    expect(describeError(new HttpError(418, '')).title).toBe('Algo deu errado')
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
})

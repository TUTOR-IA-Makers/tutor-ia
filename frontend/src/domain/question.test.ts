import { contentById, contentLabel } from './contents'
import { isQuestionStatus, passedCount } from './question'

describe('question', () => {
  it('reconhece estados válidos', () => {
    expect(isQuestionStatus('APROVADA')).toBe(true)
    expect(isQuestionStatus('PUBLICADA')).toBe(false)
    expect(isQuestionStatus(1)).toBe(false)
  })

  it('conta só os casos que passaram', () => {
    const base = { id: 'c', input: '', expectedOutput: '', actualOutput: null }
    expect(
      passedCount([
        { ...base, passed: true },
        { ...base, passed: false },
        { ...base, passed: null },
      ]),
    ).toBe(1)
  })

  it('traduz o conteúdo para o rótulo curto', () => {
    expect(contentLabel('condicionais')).toBe('Condicionais')
    expect(contentLabel('inexistente')).toBe('inexistente')
    expect(contentById('vetores')?.label).toBe('Vetores')
  })
})

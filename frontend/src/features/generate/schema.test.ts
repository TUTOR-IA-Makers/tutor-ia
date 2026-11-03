import { DEFAULT_VALUES, generateSchema } from './schema'

const valid = {
  ...DEFAULT_VALUES,
  contentId: 'condicionais',
  structures: { ...DEFAULT_VALUES.structures, required: ['if-else'] },
}

function messages(input: unknown): string[] {
  const result = generateSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('generateSchema', () => {
  it('aceita um rascunho completo', () => {
    expect(messages(valid)).toEqual([])
  })

  it('exige conteúdo', () => {
    expect(messages({ ...valid, contentId: '' })).toContain('Escolha o conteúdo da questão.')
  })

  it('valida o intervalo de dificuldade', () => {
    expect(messages({ ...valid, difficulty: { min: 2000, max: 1500 } })).toContain(
      'A dificuldade mínima não pode passar da máxima.',
    )
    expect(messages({ ...valid, difficulty: { min: 1210, max: 1500 } })).toContain(
      'A dificuldade anda de 50 em 50.',
    )
    expect(messages({ ...valid, difficulty: { min: 400, max: 1500 } })).not.toEqual([])
  })

  it('limita a quantidade de casos de teste', () => {
    expect(messages({ ...valid, testCaseCount: 0 })).toContain('Peça pelo menos 1 caso de teste.')
    expect(messages({ ...valid, testCaseCount: 21 })).toContain('Peça no máximo 20 casos de teste.')
    expect(messages({ ...valid, testCaseCount: 2.5 })).toContain('Use um número inteiro de casos.')
  })

  it('limita o tamanho dos textos opcionais', () => {
    expect(messages({ ...valid, testCaseHints: 'x'.repeat(1001) })).toContain(
      'Use no máximo 1000 caracteres.',
    )
    expect(messages({ ...valid, context: 'x'.repeat(301) })).toContain(
      'Use no máximo 300 caracteres.',
    )
  })

  it('exige estrutura obrigatória e impede conflito', () => {
    expect(
      messages({ ...valid, structures: { required: [], allowed: [], forbidden: [] } }),
    ).toContain('Escolha pelo menos uma estrutura obrigatória.')
    expect(
      messages({ ...valid, structures: { required: ['for'], allowed: [], forbidden: ['lacos'] } }),
    ).toContain('Uma estrutura não pode ser obrigatória e proibida ao mesmo tempo.')
  })
})

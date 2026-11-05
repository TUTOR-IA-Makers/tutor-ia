import {
  blockedBy,
  conflicts,
  EMPTY_RULES,
  STRUCTURE_GROUPS,
  structureLabel,
  toggleRule,
} from './structures'

describe('structures', () => {
  it('oferece os três tipos de restrição', () => {
    expect(STRUCTURE_GROUPS.map(({ kind }) => kind)).toEqual(['required', 'allowed', 'forbidden'])
  })

  it('devolve o próprio id quando não há rótulo', () => {
    expect(structureLabel('desconhecida')).toBe('desconhecida')
  })

  it('liga e desliga uma estrutura no grupo', () => {
    const on = toggleRule(EMPTY_RULES, 'required', 'for')
    expect(on.required).toEqual(['for'])
    expect(toggleRule(on, 'required', 'for').required).toEqual([])
  })

  it('detecta conflito direto entre obrigatória e proibida', () => {
    expect(conflicts({ required: ['recursao'], allowed: [], forbidden: ['recursao'] })).toEqual([
      ['recursao', 'recursao'],
    ])
  })

  it('detecta conflito quando "laços de repetição" proíbe for e while', () => {
    const rules = { required: ['for', 'if-else'], allowed: [], forbidden: ['lacos'] }
    expect(conflicts(rules)).toEqual([['for', 'lacos']])
  })

  it('bloqueia a opção oposta antes do conflito acontecer', () => {
    const rules = { required: ['while'], allowed: [], forbidden: [] }
    expect(blockedBy('forbidden', 'lacos', rules)).toBe('while')
    expect(blockedBy('forbidden', 'goto', rules)).toBeNull()
    expect(blockedBy('allowed', 'while', rules)).toBeNull()
    const forbidding = { required: [], allowed: [], forbidden: ['lacos'] }
    expect(blockedBy('required', 'do-while', forbidding)).toBe('lacos')
  })
})

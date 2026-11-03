import { safeNextPath } from './safeNextPath'

describe('safeNextPath', () => {
  it.each([
    ['/biblioteca', '/biblioteca'],
    ['/questoes/42?aba=casos#saida', '/questoes/42?aba=casos#saida'],
    ['  /gerar  ', '/gerar'],
  ])('aceita caminho interno %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each([
    'https://evil.example/phish',
    '//evil.example',
    '/\\evil.example',
    ['javascript', 'alert(1)'].join(':'),
    'biblioteca',
    '/gerar\nSet-Cookie: x',
  ])('rejeita destino inseguro %s', (input) => {
    expect(safeNextPath(input)).toBe('/')
  })

  it('mantém sequências codificadas sem decodificar', () => {
    expect(safeNextPath('/%0d%0a')).toBe('/%0d%0a')
  })

  it('usa o fallback informado quando o valor é vazio', () => {
    expect(safeNextPath(null, '/gerar')).toBe('/gerar')
    expect(safeNextPath('', '/gerar')).toBe('/gerar')
    expect(safeNextPath(undefined)).toBe('/')
  })
})

import { tokenizeC, type Token } from './tokenizeC'

const kinds = (line: Token[] | undefined) =>
  (line ?? []).filter((token) => token.kind !== 'space').map((token) => [token.kind, token.text])

describe('tokenizeC', () => {
  it('separa diretiva, palavras reservadas, números, textos e comentários', () => {
    const lines = tokenizeC('#include <stdio.h>\nint x = 42; // resposta\nprintf("%d\\n", x);')
    expect(kinds(lines[0])).toEqual([['preprocessor', '#include <stdio.h>']])
    expect(kinds(lines[1])).toEqual([
      ['keyword', 'int'],
      ['identifier', 'x'],
      ['punctuation', '='],
      ['number', '42'],
      ['punctuation', ';'],
      ['comment', '// resposta'],
    ])
    expect(kinds(lines[2])).toContainEqual(['string', '"%d\\n"'])
  })

  it('quebra comentários de bloco entre linhas mantendo o tipo', () => {
    const lines = tokenizeC('/* linha 1\nlinha 2 */ int a;')
    expect(lines).toHaveLength(2)
    expect(kinds(lines[0])).toEqual([['comment', '/* linha 1']])
    expect(kinds(lines[1])[0]).toEqual(['comment', 'linha 2 */'])
    expect(kinds(lines[1])).toContainEqual(['keyword', 'int'])
  })

  it('reconhece caractere, hexadecimal, real e divisão', () => {
    const tokens = kinds(tokenizeC("char c = '\\n'; x = 0xFF / 2.5e3;")[0])
    expect(tokens).toContainEqual(['string', "'\\n'"])
    expect(tokens).toContainEqual(['number', '0xFF'])
    expect(tokens).toContainEqual(['number', '2.5e3'])
    expect(tokens).toContainEqual(['punctuation', '/'])
  })

  it('preserva linhas vazias e normaliza CRLF', () => {
    const lines = tokenizeC('a\r\n\r\nb')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toEqual([])
  })

  it('reconstrói o texto original', () => {
    const source = 'int main(void) {\n    return 0; /* fim */\n}'
    const rebuilt = tokenizeC(source)
      .map((line) => line.map((token) => token.text).join(''))
      .join('\n')
    expect(rebuilt).toBe(source)
  })

  it('não trava em texto não terminado', () => {
    expect(kinds(tokenizeC('"aberto')[0])).toEqual([['string', '"aberto']])
    expect(kinds(tokenizeC('/* aberto')[0])).toEqual([['comment', '/* aberto']])
  })
})

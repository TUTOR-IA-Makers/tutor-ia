export type TokenKind =
  | 'comment'
  | 'preprocessor'
  | 'string'
  | 'number'
  | 'keyword'
  | 'identifier'
  | 'punctuation'
  | 'space'

export interface Token {
  kind: TokenKind
  text: string
}

export const C_KEYWORDS: ReadonlySet<string> = new Set([
  'auto',
  'bool',
  'break',
  'case',
  'char',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extern',
  'false',
  'float',
  'for',
  'goto',
  'if',
  'inline',
  'int',
  'long',
  'NULL',
  'register',
  'restrict',
  'return',
  'short',
  'signed',
  'sizeof',
  'static',
  'struct',
  'switch',
  'true',
  'typedef',
  'union',
  'unsigned',
  'void',
  'volatile',
  'while',
])

const RULES: readonly (readonly [TokenKind, RegExp])[] = [
  ['comment', /\/\/[^\n]*/y],
  ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
  ['preprocessor', /#[ \t]*[a-z]+[^\n]*/y],
  ['string', /"(?:[^"\\\n]|\\.)*"?/y],
  ['string', /'(?:[^'\\\n]|\\.)*'?/y],
  ['number', /(?:0[xX][\da-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)[uUlLfF]*/y],
  ['identifier', /[A-Za-z_]\w*/y],
  ['space', /[ \t]+/y],
  ['punctuation', /[^\sA-Za-z_\d"'#/]+|\//y],
]

function nextToken(source: string, position: number): Token {
  for (const [kind, pattern] of RULES) {
    pattern.lastIndex = position
    const match = pattern.exec(source)
    if (match && match[0].length > 0) {
      const text = match[0]
      if (kind === 'identifier' && C_KEYWORDS.has(text)) return { kind: 'keyword', text }
      return { kind, text }
    }
  }
  return { kind: 'punctuation', text: source.charAt(position) }
}

function pushLines(lines: Token[][], token: Token): void {
  const parts = token.text.split('\n')
  parts.forEach((part, index) => {
    if (index > 0) lines.push([])
    if (part) lines.at(-1)?.push({ kind: token.kind, text: part })
  })
}

export function tokenizeC(source: string): Token[][] {
  const normalized = source.replace(/\r\n?/g, '\n')
  const lines: Token[][] = [[]]
  let position = 0
  while (position < normalized.length) {
    if (normalized[position] === '\n') {
      lines.push([])
      position += 1
      continue
    }
    const token = nextToken(normalized, position)
    pushLines(lines, token)
    position += token.text.length
  }
  return lines
}

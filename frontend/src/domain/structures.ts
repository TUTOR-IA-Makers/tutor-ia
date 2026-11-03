export type StructureRuleKind = 'required' | 'allowed' | 'forbidden'

export interface StructureRules {
  required: string[]
  allowed: string[]
  forbidden: string[]
}

export const EMPTY_RULES: StructureRules = { required: [], allowed: [], forbidden: [] }

export const STRUCTURE_LABELS: Readonly<Record<string, string>> = {
  'if-else': 'if / else',
  switch: 'switch',
  for: 'for',
  while: 'while',
  'do-while': 'do / while',
  funcoes: 'funções',
  vetores: 'vetores',
  matrizes: 'matrizes',
  strings: 'strings',
  ponteiros: 'ponteiros',
  structs: 'structs',
  recursao: 'recursão',
  'operadores-logicos': 'operadores lógicos (&&, ||)',
  'tipos-primitivos': 'tipos primitivos',
  'scanf-printf': 'scanf / printf',
  'math-h': 'math.h',
  lacos: 'laços de repetição',
  goto: 'goto',
  'bibliotecas-externas': 'bibliotecas externas',
}

export const STRUCTURE_GROUPS: readonly {
  kind: StructureRuleKind
  title: string
  hint: string
  options: readonly string[]
}[] = [
  {
    kind: 'required',
    title: 'Estruturas obrigatórias',
    hint: 'Pelo menos uma precisa aparecer na solução.',
    options: [
      'if-else',
      'switch',
      'for',
      'while',
      'do-while',
      'funcoes',
      'vetores',
      'matrizes',
      'strings',
      'ponteiros',
      'structs',
      'recursao',
    ],
  },
  {
    kind: 'allowed',
    title: 'Estruturas permitidas',
    hint: 'O aluno pode usar, mas não é obrigado.',
    options: [
      'operadores-logicos',
      'tipos-primitivos',
      'scanf-printf',
      'math-h',
      'switch',
      'funcoes',
      'vetores',
    ],
  },
  {
    kind: 'forbidden',
    title: 'Estruturas proibidas',
    hint: 'A questão falha na verificação se a solução usar.',
    options: ['lacos', 'goto', 'recursao', 'ponteiros', 'vetores', 'bibliotecas-externas'],
  },
]

const COVERS: Readonly<Record<string, readonly string[]>> = {
  lacos: ['for', 'while', 'do-while'],
}

export function structureLabel(id: string): string {
  return STRUCTURE_LABELS[id] ?? id
}

function covered(forbiddenId: string): readonly string[] {
  return [forbiddenId, ...(COVERS[forbiddenId] ?? [])]
}

export function conflicts(rules: StructureRules): [string, string][] {
  return rules.forbidden.flatMap((forbidden) =>
    rules.required
      .filter((required) => covered(forbidden).includes(required))
      .map((required): [string, string] => [required, forbidden]),
  )
}

export function blockedBy(
  kind: StructureRuleKind,
  id: string,
  rules: StructureRules,
): string | null {
  if (kind === 'required') {
    return rules.forbidden.find((forbidden) => covered(forbidden).includes(id)) ?? null
  }
  if (kind === 'forbidden') {
    return rules.required.find((required) => covered(id).includes(required)) ?? null
  }
  return null
}

export function toggleRule(
  rules: StructureRules,
  kind: StructureRuleKind,
  id: string,
): StructureRules {
  const current = rules[kind]
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  return { ...rules, [kind]: next }
}

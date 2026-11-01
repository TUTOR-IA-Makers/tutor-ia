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

export interface StructureOption {
  id: string
  label: string
}

export const STRUCTURE_GROUPS: readonly {
  kind: StructureRuleKind
  title: string
  hint: string
}[] = [
  {
    kind: 'required',
    title: 'Estruturas obrigatórias',
    hint: 'Todas as selecionadas precisam aparecer na solução.',
  },
  {
    kind: 'allowed',
    title: 'Estruturas permitidas',
    hint: 'O aluno pode usar, mas não é obrigado.',
  },
  {
    kind: 'forbidden',
    title: 'Estruturas proibidas',
    hint: 'A solução não pode usar as estruturas selecionadas.',
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
    [...rules.required, ...rules.allowed]
      .filter((required) => covered(forbidden).includes(required))
      .map((required): [string, string] => [required, forbidden]),
  )
}

export function blockedBy(
  kind: StructureRuleKind,
  id: string,
  rules: StructureRules,
): string | null {
  if (kind === 'required' || kind === 'allowed') {
    return rules.forbidden.find((forbidden) => covered(forbidden).includes(id)) ?? null
  }
  return (
    [...rules.required, ...rules.allowed].find((required) => covered(id).includes(required)) ?? null
  )
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

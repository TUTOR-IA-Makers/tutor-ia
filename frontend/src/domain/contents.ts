export interface Content {
  id: string
  label: string
  shortLabel: string
}

export const CONTENTS: readonly Content[] = [
  { id: 'entrada-saida', label: 'Entrada e saída (scanf / printf)', shortLabel: 'Entrada e saída' },
  {
    id: 'condicionais',
    label: 'Estruturas condicionais (if / else / switch)',
    shortLabel: 'Condicionais',
  },
  { id: 'repeticao', label: 'Laços de repetição (for / while)', shortLabel: 'Repetição' },
  { id: 'vetores', label: 'Vetores', shortLabel: 'Vetores' },
  { id: 'matrizes', label: 'Matrizes', shortLabel: 'Matrizes' },
  { id: 'strings', label: 'Cadeias de caracteres (strings)', shortLabel: 'Strings' },
  { id: 'funcoes', label: 'Funções', shortLabel: 'Funções' },
  { id: 'ponteiros', label: 'Ponteiros', shortLabel: 'Ponteiros' },
  { id: 'structs', label: 'Registros (struct)', shortLabel: 'Structs' },
  { id: 'recursao', label: 'Recursão', shortLabel: 'Recursão' },
]

export function contentById(id: string): Content | undefined {
  return CONTENTS.find((content) => content.id === id)
}

export function contentLabel(id: string): string {
  return contentById(id)?.shortLabel ?? id
}

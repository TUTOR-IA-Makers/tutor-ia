export function selectionLabel(count: number): string {
  return count === 1
    ? '1 questão aprovada selecionada'
    : `${String(count)} questões aprovadas selecionadas`
}

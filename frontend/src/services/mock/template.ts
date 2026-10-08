import { contentById, type Question, type QuestionDraft } from '@/domain'

const TEMPLATE_SOLUTION = `#include <stdio.h>

/* Solucao de referencia gerada para revisao. */
int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 1;
    }

    // Classifica o numero lido
    if (n % 2 == 0) {
        printf("PAR\\n");
    } else {
        printf("IMPAR\\n");
    }
    return 0;
}
`

function titleFrom(draft: QuestionDraft): string {
  const context = draft.context.trim()
  if (context) return context.charAt(0).toUpperCase() + context.slice(1, 60)
  return `Questão de ${(contentById(draft.contentId)?.shortLabel ?? 'programação').toLowerCase()}`
}

export function questionFromDraft(id: string, code: string, draft: QuestionDraft): Question {
  const testCases = Array.from({ length: draft.testCaseCount }, (_, index) => {
    const value = index * 7 + 2
    const output = value % 2 === 0 ? 'PAR' : 'IMPAR'
    return {
      id: `caso-${String(index + 1)}`,
      input: String(value),
      expectedOutput: output,
      actualOutput: output,
      passed: true,
    }
  })
  return {
    id,
    code,
    title: titleFrom(draft),
    description: draft.context.trim() || 'Questão gerada a partir das regras escolhidas.',
    contentId: draft.contentId,
    difficulty: draft.difficulty,
    status: 'GERANDO',
    testCaseCount: draft.testCaseCount,
    statement: {
      text: 'Escreva um programa em C que leia um número inteiro e informe se ele é par ou ímpar.',
      input: 'Um número inteiro.',
      output: 'Imprima PAR ou IMPAR.',
      example: { input: '4', output: 'PAR' },
    },
    solution: TEMPLATE_SOLUTION,
    testCases,
    structures: draft.structures,
    constraints: [
      ...draft.structures.required.map((structureId) => ({
        structureId,
        rule: 'required' as const,
        satisfied: true,
        detail: null,
      })),
      ...draft.structures.forbidden.map((structureId) => ({
        structureId,
        rule: 'forbidden' as const,
        satisfied: true,
        detail: null,
      })),
    ],
    compilation: {
      command: 'gcc -std=c11 -Wall -Wextra solucao.c -o solucao',
      succeeded: true,
      message: 'Compilação bem-sucedida, sem advertências.',
    },
    failureReason: null,
  }
}

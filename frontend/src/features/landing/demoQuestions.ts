// The questions the landing "generates". Nothing here is produced at runtime: the
// page replays a finished run. Each expected output was obtained by compiling the
// solution with `gcc -std=c11 -Wall -Wextra` and running it on the input, which is
// the same rule the real pipeline follows (AGENTS.md, rule 4).

export interface DemoCase {
  input: string
  output: string
}

export interface DemoQuestion {
  id: string
  content: string
  title: string
  difficulty: string
  statement: string
  solution: string
  cases: readonly DemoCase[]
}

export const DEMO_COMPILE_COMMAND = 'gcc -std=c11 -Wall -Wextra solucao.c -o solucao'

export const DEMO_QUESTIONS: readonly DemoQuestion[] = [
  {
    id: 'condicionais',
    content: 'Condicionais',
    title: 'Ano bissexto',
    difficulty: '1200 a 1400',
    statement:
      'Leia um ano inteiro positivo e informe se ele é bissexto. Um ano é bissexto quando é divisível por 400, ou por 4 sem ser por 100. Imprima BISSEXTO ou NAO BISSEXTO.',
    solution: `#include <stdio.h>

/* Le um ano e informa se ele e bissexto. */
int main(void) {
    int ano;

    if (scanf("%d", &ano) != 1) {
        return 1;
    }

    // Divisivel por 400, ou por 4 sem ser por 100
    if (ano % 400 == 0 || (ano % 4 == 0 && ano % 100 != 0)) {
        printf("BISSEXTO\\n");
    } else {
        printf("NAO BISSEXTO\\n");
    }

    return 0;
}
`,
    cases: [
      { input: '2024', output: 'BISSEXTO' },
      { input: '1900', output: 'NAO BISSEXTO' },
      { input: '2000', output: 'BISSEXTO' },
      { input: '2023', output: 'NAO BISSEXTO' },
    ],
  },
  {
    id: 'lacos',
    content: 'Laços',
    title: 'Fatorial',
    difficulty: '900 a 1100',
    statement:
      'Leia um inteiro N, de 0 a 20, e imprima N! calculado com um laço de repetição. Lembre que 0! vale 1.',
    solution: `#include <stdio.h>

/* Le N (0 a 20) e imprime N! com um laco. */
int main(void) {
    int n;
    long long fatorial = 1;

    if (scanf("%d", &n) != 1) {
        return 1;
    }

    for (int i = 2; i <= n; i++) {
        fatorial *= i;
    }

    printf("%lld\\n", fatorial);
    return 0;
}
`,
    cases: [
      { input: '0', output: '1' },
      { input: '5', output: '120' },
      { input: '10', output: '3628800' },
      { input: '20', output: '2432902008176640000' },
    ],
  },
  {
    id: 'vetores',
    content: 'Vetores',
    title: 'Inversão de vetor',
    difficulty: '1300 a 1500',
    statement:
      'Leia N e, em seguida, N inteiros. Guarde-os em um vetor, inverta a ordem sem usar outro vetor e imprima o resultado separado por espaços.',
    solution: `#include <stdio.h>

/* Le N inteiros e os imprime em ordem inversa. */
int main(void) {
    int n;
    int v[1000];

    if (scanf("%d", &n) != 1) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }

    // Troca as extremidades ate o centro
    for (int i = 0, j = n - 1; i < j; i++, j--) {
        int aux = v[i];
        v[i] = v[j];
        v[j] = aux;
    }

    for (int i = 0; i < n; i++) {
        printf("%d%c", v[i], i == n - 1 ? '\\n' : ' ');
    }
    return 0;
}
`,
    cases: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '1\n7', output: '7' },
      { input: '4\n10 -3 0 8', output: '8 0 -3 10' },
    ],
  },
]

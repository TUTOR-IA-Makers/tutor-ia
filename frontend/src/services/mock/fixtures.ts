import type { Question, Teacher } from '@/domain'

export const MOCK_TEACHER: Teacher = {
  name: 'Profa. Dra. Helena Silveira',
  department: 'Ciência da Computação',
}

const GCC = 'gcc -std=c11 -Wall -Wextra solucao.c -o solucao'
const COMPILED = {
  command: GCC,
  succeeded: true,
  message: 'Compilação bem-sucedida, sem advertências.',
}

const LEAP_YEAR = `#include <stdio.h>

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
`

const MAX_OF_THREE = `#include <stdio.h>

int main(void) {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    // Comeca supondo que o primeiro e o maior
    int maior = a;
    if (b > maior) {
        maior = b;
    }
    if (c > maior) {
        maior = c;
    }

    printf("%d\\n", maior);
    return 0;
}
`

const WEIGHTED_AVERAGE = `#include <stdio.h>

int main(void) {
    double n1, n2, n3;
    scanf("%lf %lf %lf", &n1, &n2, &n3);

    /* Pesos 2, 3 e 5 */
    double media = (n1 * 2 + n2 * 3 + n3 * 5) / 10.0;

    if (media >= 9.0) {
        printf("SS\\n");
    } else if (media >= 7.0) {
        printf("MS\\n");
    } else if (media >= 5.0) {
        printf("MM\\n");
    } else {
        printf("MI\\n");
    }
    return 0;
}
`

const BINARY_SEARCH = `#include <stdio.h>

int main(void) {
    int n, chave;
    scanf("%d", &n);

    int v[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    scanf("%d", &chave);

    int inicio = 0, fim = n - 1, posicao = -1;
    // Busca binaria iterativa, sem recursao
    while (inicio <= fim) {
        int meio = inicio + (fim - inicio) / 2;
        if (v[meio] == chave) {
            posicao = meio;
            break;
        } else if (v[meio] < chave) {
            inicio = meio + 1;
        } else {
            fim = meio - 1;
        }
    }

    printf("%d\\n", posicao);
    return 0;
}
`

const REVERSE_ARRAY = `#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);

    int v[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }

    /* Troca as extremidades ate o centro */
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
`

const SUM_ARRAY = `#include <stdio.h>

int main(void) {
    int n, soma = 0;
    scanf("%d", &n);

    int v[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
        soma += v[i];
    }

    printf("%d\\n", soma);
    return 0;
}
`

const FACTORIAL_WITH_LOOP = `#include <stdio.h>

int main(void) {
    int n;
    long long fatorial = 1;
    scanf("%d", &n);

    for (int i = 2; i <= n; i++) {
        fatorial *= i;
    }

    printf("%lld\\n", fatorial);
    return 0;
}
`

function cases(rows: readonly (readonly [string, string])[]) {
  return rows.map(([input, expectedOutput], index) => ({
    id: `caso-${String(index + 1)}`,
    input,
    expectedOutput,
    actualOutput: expectedOutput,
    passed: true,
  }))
}

export function seedQuestions(): Question[] {
  return [
    {
      id: 'q-0138',
      code: '#0138',
      title: 'Maior de três números',
      description:
        'Receber três números inteiros fornecidos via teclado e exibir o maior valor entre eles.',
      contentId: 'condicionais',
      difficulty: { min: 800, max: 950 },
      status: 'APROVADA',
      testCaseCount: 5,
      statement: {
        text: 'Escreva um programa em C que leia três números inteiros e imprima o maior deles.',
        input: 'Três números inteiros separados por espaço.',
        output: 'O maior dos três números.',
        example: { input: '3 9 4', output: '9' },
      },
      solution: MAX_OF_THREE,
      testCases: cases([
        ['3 9 4', '9'],
        ['10 2 7', '10'],
        ['-1 -5 -3', '-1'],
        ['4 4 4', '4'],
        ['0 8 8', '8'],
      ]),
      structures: { required: ['if-else'], allowed: ['scanf-printf'], forbidden: ['lacos'] },
      constraints: [
        { structureId: 'if-else', rule: 'required', satisfied: true, detail: null },
        { structureId: 'lacos', rule: 'forbidden', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0142',
      code: '#0142',
      title: 'Ano bissexto',
      description:
        'Determinar se um ano inserido pelo usuário é bissexto respeitando o calendário gregoriano.',
      contentId: 'condicionais',
      difficulty: { min: 1200, max: 1400 },
      status: 'GERADA',
      testCaseCount: 6,
      statement: {
        text: 'Escreva um programa em C que leia um ano inteiro positivo e informe se ele é bissexto.\n\nUm ano é bissexto quando é divisível por 400 ou quando é divisível por 4 e não é divisível por 100.',
        input: 'Um número inteiro positivo representando o ano.',
        output: 'Imprima BISSEXTO ou NAO BISSEXTO.',
        example: { input: '2024', output: 'BISSEXTO' },
      },
      solution: LEAP_YEAR,
      testCases: cases([
        ['2024', 'BISSEXTO'],
        ['1900', 'NAO BISSEXTO'],
        ['2000', 'BISSEXTO'],
        ['2023', 'NAO BISSEXTO'],
        ['1', 'NAO BISSEXTO'],
        ['2400', 'BISSEXTO'],
      ]),
      structures: {
        required: ['if-else'],
        allowed: ['operadores-logicos', 'tipos-primitivos', 'scanf-printf'],
        forbidden: ['lacos'],
      },
      constraints: [
        { structureId: 'if-else', rule: 'required', satisfied: true, detail: null },
        { structureId: 'operadores-logicos', rule: 'allowed', satisfied: true, detail: null },
        { structureId: 'lacos', rule: 'forbidden', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0143',
      code: '#0143',
      title: 'Soma de um vetor',
      description: 'Ler N elementos numéricos para um vetor de inteiros e calcular a soma total.',
      contentId: 'vetores',
      difficulty: { min: 800, max: 900 },
      status: 'GERANDO',
      testCaseCount: 4,
      statement: {
        text: 'Leia N e, em seguida, N números inteiros. Guarde-os em um vetor e imprima a soma.',
        input: 'N, depois N inteiros.',
        output: 'A soma dos N inteiros.',
        example: { input: '3\n1 2 3', output: '6' },
      },
      solution: SUM_ARRAY,
      testCases: cases([
        ['3\n1 2 3', '6'],
        ['1\n-5', '-5'],
        ['4\n0 0 0 0', '0'],
        ['5\n10 20 30 40 50', '150'],
      ]),
      structures: { required: ['vetores', 'for'], allowed: ['scanf-printf'], forbidden: [] },
      constraints: [
        { structureId: 'vetores', rule: 'required', satisfied: true, detail: null },
        { structureId: 'for', rule: 'required', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0139',
      code: '#0139',
      title: 'Cálculo de média ponderada',
      description:
        'Calcular a média com pesos 2, 3 e 5 e emitir a menção final do estudante conforme a nota.',
      contentId: 'condicionais',
      difficulty: { min: 900, max: 1100 },
      status: 'APROVADA',
      testCaseCount: 4,
      statement: {
        text: 'Leia três notas e calcule a média ponderada com pesos 2, 3 e 5. Imprima a menção: SS (9 ou mais), MS (7 ou mais), MM (5 ou mais) ou MI.',
        input: 'Três números reais separados por espaço.',
        output: 'A menção correspondente à média.',
        example: { input: '8 9 10', output: 'SS' },
      },
      solution: WEIGHTED_AVERAGE,
      testCases: cases([
        ['8 9 10', 'SS'],
        ['7 7 7', 'MS'],
        ['5 5 5', 'MM'],
        ['1 2 3', 'MI'],
      ]),
      structures: { required: ['if-else'], allowed: ['scanf-printf'], forbidden: ['lacos'] },
      constraints: [
        { structureId: 'if-else', rule: 'required', satisfied: true, detail: null },
        { structureId: 'lacos', rule: 'forbidden', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0144',
      code: '#0144',
      title: 'Busca binária iterativa',
      description:
        'Localizar a posição de uma chave em um vetor ordenado usando laço while, sem recursão.',
      contentId: 'vetores',
      difficulty: { min: 1900, max: 2100 },
      status: 'GERADA',
      testCaseCount: 5,
      statement: {
        text: 'Leia N, um vetor ordenado de N inteiros e uma chave. Imprima a posição da chave no vetor (a partir de 0) ou -1 se ela não existir. Use busca binária iterativa.',
        input: 'N, depois N inteiros em ordem crescente, depois a chave.',
        output: 'A posição da chave ou -1.',
        example: { input: '5\n1 3 5 7 9\n7', output: '3' },
      },
      solution: BINARY_SEARCH,
      testCases: cases([
        ['5\n1 3 5 7 9\n7', '3'],
        ['5\n1 3 5 7 9\n2', '-1'],
        ['1\n4\n4', '0'],
        ['4\n2 4 6 8\n2', '0'],
        ['4\n2 4 6 8\n8', '3'],
      ]),
      structures: {
        required: ['vetores', 'while'],
        allowed: ['scanf-printf'],
        forbidden: ['recursao'],
      },
      constraints: [
        { structureId: 'vetores', rule: 'required', satisfied: true, detail: null },
        { structureId: 'while', rule: 'required', satisfied: true, detail: null },
        { structureId: 'recursao', rule: 'forbidden', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0140',
      code: '#0140',
      title: 'Inversão de vetor in-place',
      description:
        'Reorganizar os elementos de um vetor trocando as extremidades até o centro, sem vetor auxiliar.',
      contentId: 'vetores',
      difficulty: { min: 1300, max: 1500 },
      status: 'APROVADA',
      testCaseCount: 4,
      statement: {
        text: 'Leia N e um vetor de N inteiros. Inverta o vetor sem usar outro vetor e imprima o resultado.',
        input: 'N, depois N inteiros.',
        output: 'Os N inteiros em ordem inversa, separados por espaço.',
        example: { input: '4\n1 2 3 4', output: '4 3 2 1' },
      },
      solution: REVERSE_ARRAY,
      testCases: cases([
        ['4\n1 2 3 4', '4 3 2 1'],
        ['1\n7', '7'],
        ['5\n5 4 3 2 1', '1 2 3 4 5'],
        ['2\n-1 1', '1 -1'],
      ]),
      structures: { required: ['vetores', 'for'], allowed: ['scanf-printf'], forbidden: [] },
      constraints: [
        { structureId: 'vetores', rule: 'required', satisfied: true, detail: null },
        { structureId: 'for', rule: 'required', satisfied: true, detail: null },
      ],
      compilation: COMPILED,
      failureReason: null,
    },
    {
      id: 'q-0141',
      code: '#0141',
      title: 'Fatorial sem repetição',
      description: 'Calcular o fatorial de N usando apenas recursão, sem laços de repetição.',
      contentId: 'recursao',
      difficulty: { min: 1100, max: 1300 },
      status: 'FALHOU_VERIFICACAO',
      testCaseCount: 4,
      statement: {
        text: 'Leia um inteiro N (0 a 20) e imprima N! usando uma função recursiva.',
        input: 'Um inteiro N.',
        output: 'O fatorial de N.',
        example: { input: '5', output: '120' },
      },
      solution: FACTORIAL_WITH_LOOP,
      testCases: [
        { id: 'caso-1', input: '5', expectedOutput: '120', actualOutput: '120', passed: true },
        { id: 'caso-2', input: '0', expectedOutput: '1', actualOutput: '1', passed: true },
        { id: 'caso-3', input: '1', expectedOutput: '1', actualOutput: '1', passed: true },
        {
          id: 'caso-4',
          input: '20',
          expectedOutput: '2432902008176640000',
          actualOutput: '2432902008176640000',
          passed: true,
        },
      ],
      structures: { required: ['recursao'], allowed: ['scanf-printf'], forbidden: ['lacos'] },
      constraints: [
        {
          structureId: 'recursao',
          rule: 'required',
          satisfied: false,
          detail: 'A solução não tem nenhuma função recursiva.',
        },
        {
          structureId: 'lacos',
          rule: 'forbidden',
          satisfied: false,
          detail: 'A solução usa um laço for na linha 8.',
        },
      ],
      compilation: COMPILED,
      failureReason: 'A solução usou repetição, mas o pedido era sem repetição. Gere de novo.',
    },
  ]
}

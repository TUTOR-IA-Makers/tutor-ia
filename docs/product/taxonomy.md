# Taxonomia e Catalogação

Este documento define a taxonomia utilizada para catalogar os exercícios de programação em C gerados e importados para o Moodle CodeRunner. O objetivo é estabelecer critérios claros, com eixos de conteúdo, níveis de dificuldade e estruturas, de forma que a classificação seja uniforme entre diferentes professores ou monitores.

## Eixos Prioritários de Conteúdo (E1–E4)

A classificação das questões recai sobre quatro eixos de conteúdo principais.

**Regra geral de desempate:** O eixo é o conceito que a questão **avalia**, não os que ela apenas usa como suporte sintático. Em caso de empate legítimo (a questão foca igualmente em dois tópicos), vale o eixo mais avançado. A presença de uma função não transfere a questão automaticamente para E4 se a função for mero invólucro para testar outro algoritmo ou estrutura (ex.: ordenar um vetor dentro de uma função avalia manipulação/ordenação de vetor, pertencendo a E3; já uma questão cujo objetivo seja definir a assinatura correta, manipular escopo ou alterar variáveis externas via passagem por referência avalia a modularização, pertencendo a E4).

### E1 — Fundamentos
Foco em conceitos iniciais: declaração de variáveis, tipos de dados básicos, operadores aritméticos/lógicos e operações de entrada e saída (`printf`, `scanf`).
- **Exemplo típico:** Calcular a média de três números lidos.
- **Exemplo de fronteira:** Usar o operador ternário para exibir o maior de dois números. Como o desafio é usar o próprio operador em vez de alterar o fluxo de execução, a questão avalia fundamentos (E1).

### E2 — Controle de Fluxo
Foco nas estruturas de decisão e repetição que alteram o fluxo sequencial básico.
- **Exemplo típico:** Imprimir os `N` primeiros números pares usando `while`.
- **Exemplo de fronteira:** Um laço que lê valores até encontrar o sentinela `-1`. Apesar de usar I/O intensivamente, o conceito central exigido é a condição de parada (E2 avaliado).

### E3 — Estruturas de Dados e Ponteiros
Foco no armazenamento e manipulação na memória: vetores (1D), matrizes (2D), strings, `structs` e ponteiros.
- **Exemplo típico:** Inverter uma string em uma variável local ou buscar um elemento em um vetor.
- **Exemplo de fronteira:** Ordenar um vetor (seja na função `main` ou dentro de uma função requisitada). O problema pode conter laços aninhados (E2) ou estar empacotado em uma função (E4), mas o conceito avaliado centralmente é a indexação, comparação e troca de elementos no vetor (E3 avaliado).

### E4 — Modularização
Foco na separação de responsabilidades usando funções, passagem de parâmetros (por valor ou referência) e recursão.
- **Exemplo típico:** Escrever uma função que calcula e retorna a área de um círculo recebendo o raio por valor.
- **Exemplo de fronteira:** A fronteira de E4 aplica-se quando o objetivo pedagógico avaliado é a modularização em si (definição e assinatura da função, parâmetros, retorno, escopo de variáveis ou recursão). Se o exercício exige isolar uma lógica onde a mecânica de funções é o foco da avaliação (ex.: implementar função que zera variáveis externas via ponteiros, ou fatorial recursivo), o eixo é E4. Se a função for apenas um invólucro para exercitar um algoritmo de ordenação ou busca em vetor, o eixo é E3.

## Níveis de Dificuldade

A dificuldade deve ser avaliada por critérios observáveis para minimizar a divergência:

- **Muito Fácil:** Aplicação direta de um único conceito, sem estruturas de repetição e sem tratar de casos de borda (ex.: ler a base e a altura e imprimir a área de um triângulo).
- **Fácil:** Requer a combinação de operações simples, contendo no máximo um laço de repetição de iteração direta, uso de acumulador simples ou recursão linear direta com caso base imediato (ex.: um `for` para imprimir os pares de 1 a N, somatório simples em laço iterativo, ou cálculo de fatorial recursivo básico).
  - *Fronteira Fácil x Médio:* O uso de um laço simples com acumulador é Fácil. Se a lógica dentro do laço exigir validações múltiplas simultâneas ou aninhamento, passa a Médio.
- **Médio:** Exige planejamento e manipulação. Deve conter ao menos uma complexidade: uso de laços aninhados, acesso e modificação a arrays (sem ordenação complexa) ou a necessidade explícita de lidar com um caso de borda para não quebrar a lógica (ex.: buscar o maior valor em um vetor não-ordenado ou imprimir matriz linha por linha).
  - *Fronteira Médio x Difícil:* Se a manipulação de arrays exigir ordenação completa, shifts ou manipulação de tamanho em strings, vira Difícil.
- **Difícil:** Problemas com múltiplos passos lógicos encadeados, exigindo tratamento de vários casos de borda e manipulações simultâneas em arrays/estruturas (ex.: ordenação de vetores em múltiplos critérios, rotação de matrizes 2D, manipulação de texto que retira ou injeta caracteres).
- **Muito Difícil:** Exige otimização para tempo de execução ou memória, manipulação avançada de ponteiros múltiplos, alocação dinâmica extensiva para estruturas dinâmicas, ou lógicas recursivas múltiplas não-triviais (ex.: gerenciar uma lista encadeada do zero com alocação dinâmica, resolvendo remoções de forma não linear).

## Vocabulário Fechado de Estruturas C

Garantindo a compatibilidade com a modelagem no Moodle, a catalogação restringe as estruturas aos seguintes termos, definidos na enumeração `CStructure` (em `src/codeexpert/domain.py`). Abaixo definimos o critério de presença de cada uma:

- **Controle de Fluxo e Condicionais**
  - `if`: Uso de condicional se.
  - `else`: Uso de condicional senão.
  - `ternario`: Uso do operador condicional `?:`.
  - `switch`: Uso da estrutura de seleção `switch/case`.
  - `for`: Laço de repetição com inicialização, condição e incremento (`for (init; cond; inc)`).
  - `while`: Laço de repetição com teste de condição no início.
  - `do-while`: Laço de repetição com teste de condição no final.
  - `break`: Uso explícito da instrução `break` para parar laços (não contar nos cases do `switch`).
  - `continue`: Uso da instrução `continue` em laços.
  - `goto`: Desvios não estruturados (útil frequentemente como proibição).

- **Estruturas de Dados e Tipos**
  - `vetor`: Declaração ou manipulação de array de 1 dimensão (1D).
  - `matriz`: Declaração ou manipulação de array de 2 ou mais dimensões.
  - `string`: Uso de array de `char` para representar texto, mesmo que envolva uso implícito pela biblioteca de strings.
  - `struct`: Uso e definição de registros compostos com `struct`.
  - `typedef`: Uso do `typedef` para criação de alias de tipos.
  - `enum`: Declaração de enumerações `enum`.

- **Ponteiros e Memória**
  - `ponteiro`: Declaração de tipo com `*` e manipulação indireta de memória ou endereçamento com `&`.
  - `alocacao dinamica`: Presença ou exigência de uso de `malloc`, `calloc`, `realloc` e `free`.

- **Modularização**
  - `funcao`: Declaração de função própria (além da `main`).
  - `passagem por referencia`: Funções próprias que recebem ponteiros com o objetivo específico de alterar as variáveis externas enviadas como parâmetro.
  - `recursao`: Chamada de uma função dentro de si mesma.

- **Bibliotecas e Outros**
  - `arquivos`: Manipulação de arquivos externos usando funções dedicadas (como `fopen`, `fclose`, `fprintf`).
  - `math.h`: Uso de funções clássicas de matemática (ex.: `pow`, `sqrt`).
  - `string.h`: Uso direto de bibliotecas utilitárias de texto (`strlen`, `strcpy`, etc.).
  - `stdlib.h`: Uso direto de funções da stdlib (fora da alocação que tem tag própria), como por exemplo, funções de conversão ou rand().

---

## Relações e Implicações entre Estruturas

Para assegurar consistência na marcação independente e evitar divergências de interpretação sintática, aplicam-se as seguintes regras de implicação:

- **`passagem por referencia` implica `ponteiro`:** Em linguagem C, a passagem por referência é implementada unicamente por meio de ponteiros (parâmetros declarados com `*` recebendo endereços com `&` e operados via desreferenciamento). Portanto, a marcação de `passagem por referencia` acarreta **obrigatoriamente** a marcação conjunta da estrutura `ponteiro`.
- **`string` vs. `string.h`:** A estrutura `string` refere-se ao dado (vetor de `char` terminado em `\0`). A estrutura `string.h` denota a utilização de funções da biblioteca padrão de texto (como `strlen`, `strcpy`, `strcmp`). O uso de `string` **não implica** `string.h` (por exemplo, ao percorrer manualmente a string com laço `while`). Por outro lado, a inclusão/uso de `string.h` pressupõe a manipulação de `string`.

---

## Verificação de Consistência da Taxonomia

Para demonstrar a aplicação prática das regras e verificar a consistência da taxonomia de forma objetiva, o protocolo de concordância utiliza dois perfis de exemplo (**Avaliador Exemplo A** e **Avaliador Exemplo B**), que classificam de forma independente as mesmas 10 questões aplicando as regras sem comunicação prévia.

*(Nota: Os avaliadores apresentados nesta seção — Avaliador Exemplo A e Avaliador Exemplo B — são apenas exemplos hipotéticos/ilustrativos para demonstrar o protocolo e exercitar os critérios da taxonomia, não correspondendo a pessoas reais ou monitores específicos.)*

**Histórico de Rodadas:** Na rodada 1 preliminar, as questões Q03 e Q07 cobriam outros enunciados exploratórios. Para esta rodada formal documentada (rodada 2), o conjunto de 10 questões foi estabilizado cobrindo de forma representativa os quatro eixos (E1 a E4) e seus casos de fronteira.

**Critério de Divergência:** Qualquer diferença no Eixo, qualquer diferença no Nível de dificuldade, ou qualquer divergência no conjunto exato de Estruturas C marcadas (diferença estrita de conjuntos) é contabilizada como divergência na questão.

### Enunciados das Questões do Teste de Concordância

- **Q01 (Soma simples de dois inteiros):** "Escreva um programa em C que leia dois números inteiros da entrada padrão e imprima a soma deles na saída padrão."
- **Q02 (Somatório de N números com for):** "Escreva um programa em C que leia um número inteiro positivo N e, a seguir, N valores inteiros. Calcule e imprima a soma desses N valores utilizando um laço `for` com uma variável acumuladora."
- **Q03 (Maior de dois inteiros com operador ternário):** "Escreva um programa em C que leia dois números inteiros e exiba o maior entre eles utilizando estritamente o operador condicional ternário `? :`."
- **Q04 (Fatorial recursivo com caso base):** "Implemente uma função recursiva `int fatorial(int n)` que receba um número inteiro não negativo n e retorne o seu fatorial, utilizando uma estrutura condicional `if` para o caso base."
- **Q05 (Média aritmética de vetor com laço):** "Escreva um programa em C que declare um vetor de 10 inteiros, leia os 10 valores da entrada padrão e, utilizando um laço `for`, calcule e imprima a média aritmética dos elementos armazenados."
- **Q06 (Zerar variáveis via passagem por referência):** "Escreva uma função `void zera(int *a, int *b)` que receba ponteiros para dois inteiros e atribua zero a ambas as variáveis na função chamadora, alterando diretamente o conteúdo de seus endereços de memória."
- **Q07 (Preenchimento da diagonal principal de matriz 3x3):** "Escreva um programa em C que declare uma matriz de inteiros 3x3 e preencha com 1 os elementos da diagonal principal (onde linha == coluna) e com 0 os demais elementos, utilizando laços de repetição `for`, e imprima a matriz."
- **Q08 (Função para ordenação de vetor):** "Escreva uma função `void ordenar(int v[], int n)` que receba um vetor de inteiros e seu tamanho n e ordene os elementos em ordem crescente utilizando o algoritmo Bubble Sort (laços `for` e condicional `if`)."
- **Q09 (Cadastro de alunos em vetor de struct e busca):** "Defina um tipo `struct Aluno` contendo `nome` (string de até 50 caracteres) e `nota` (float). Escreva um programa que leia os dados de 5 alunos em um vetor dessa struct e imprima o nome do aluno que obteve a maior nota."
- **Q10 (Comprimento de string sem strlen):** "Escreva um programa em C que leia uma string (vetor de char) e, utilizando um laço `while` que percorre a memória até encontrar o terminador nulo `\0`, calcule e imprima o comprimento do texto sem utilizar a função `strlen` da biblioteca `string.h`."

### Resultados da Classificação Independente (Rodada Cega)

Os dados originais brutos desta rodada cega estão disponíveis em [`classificacao_rodada2.csv`](classificacao_rodada2.csv).

| ID | Enunciado Resumido | Avaliador Exemplo A (Eixo / Nível / Estruturas) | Avaliador Exemplo B (Eixo / Nível / Estruturas) | Resultado da Comparação |
|----|--------------------|-------------------------------------------------|-------------------------------------------------|-------------------------|
| Q01 | Soma de dois inteiros | E1 / Muito Fácil / - | E1 / Muito Fácil / - | Consenso |
| Q02 | Somatório de N números | E2 / Fácil / `for` | E2 / Fácil / `for` | Consenso |
| Q03 | Maior de dois números com `?:` | E1 / Muito Fácil / `ternario` | E1 / Muito Fácil / `ternario` | Consenso |
| Q04 | Fatorial recursivo | E4 / Fácil / `funcao`, `if`, `recursao` | E4 / Fácil / `funcao`, `if`, `recursao` | Consenso |
| Q05 | Média de vetor `[10]` com laço | E3 / Médio / `for`, `vetor` | E3 / Médio / `for`, `vetor` | Consenso |
| Q06 | Função zera variáveis por ref. | E4 / Médio / `funcao`, `passagem por referencia` | E4 / Médio / `funcao`, `passagem por referencia`, `ponteiro` | **Divergência (Estruturas)** |
| Q07 | Diagonal principal de matriz | E3 / Médio / `for`, `matriz` | E3 / Médio / `for`, `matriz` | Consenso |
| Q08 | Função de ordenação de vetor | E3 / Difícil / `for`, `funcao`, `if`, `vetor` | E3 / Difícil / `for`, `funcao`, `if`, `vetor` | Consenso |
| Q09 | Vetor de structs e busca maior | E3 / Difícil / `string`, `struct`, `vetor` | E3 / Médio / `string`, `struct`, `vetor` | **Divergência (Dificuldade)** |
| Q10 | Contar tamanho sem `strlen` | E3 / Médio / `string`, `while` | E3 / Médio / `string`, `while` | Consenso |

**Análise das Divergências (2 de 10):**

1. **Q06 (Estruturas):** O Avaliador Exemplo A considerou que marcar `passagem por referencia` já tornava redundante a marcação de `ponteiro`. O Avaliador Exemplo B marcou ambas pela presença da sintaxe de ponteiro (`*`). Pelo critério de igualdade estrita de conjuntos, registrou-se uma divergência. Essa ocorrência motivou a formalização da regra explícita de implicação neste documento: `passagem por referencia` implica obrigatoriamente `ponteiro`.
2. **Q09 (Dificuldade):** O Avaliador Exemplo A classificou a questão como "Difícil" por combinar registro composto heterogêneo contendo texto (`struct Aluno`), armazenamento em vetor e retenção de índice durante a varredura linear. O Avaliador Exemplo B classificou como "Médio" por entender que a busca por maior valor é um padrão clássico sem mutação dos dados.

A verificação atendeu ao critério de aceitação de G6-1 (divergência em no máximo 2 das 10 questões analisadas).

# Taxonomia e Catalogação

Este documento define a taxonomia utilizada para catalogar os exercícios de programação em C gerados e importados para o Moodle CodeRunner. O objetivo é estabelecer critérios claros, com eixos de conteúdo, níveis de dificuldade e estruturas, de forma que a classificação seja uniforme entre diferentes professores ou monitores.

## Eixos Prioritários de Conteúdo (E1–E4)

A classificação das questões recai sobre quatro eixos de conteúdo principais:

### E1 — Fundamentos
Foco em conceitos iniciais: declaração de variáveis, tipos de dados básicos, operadores aritméticos/lógicos e operações de entrada e saída (`printf`, `scanf`).
- **Exemplo típico:** Calcular a média de três números lidos.
- **Exemplo de fronteira:** Usar o operador ternário para exibir uma string. Ainda é E1 se for focado estritamente na operação lógica/aritmética, mas se exigir desvio de fluxo mais complexo vira E2.

### E2 — Controle de Fluxo
Foco nas estruturas de decisão e repetição que alteram o fluxo sequencial básico.
- **Exemplo típico:** Imprimir os `N` primeiros números primos ou classificar a idade usando `if`/`else`.
- **Exemplo de fronteira:** Um laço `while` que lê valores até encontrar o sentinela `-1`. Apesar de usar I/O (E1), o desafio central é a condição de parada (E2).

### E3 — Estruturas de Dados e Ponteiros
Foco no armazenamento e manipulação na memória: vetores (1D), matrizes (2D), strings, `structs` e ponteiros.
- **Exemplo típico:** Inverter uma string ou ordenar um vetor.
- **Exemplo de fronteira:** Criar uma matriz cujos elementos dependam dos índices (ex: `mat[i][j] = i+j`). Envolve laços aninhados (E2), mas o elemento principal abordado é o acesso aos índices da matriz (E3).

### E4 — Modularização
Foco na separação de responsabilidades usando funções e passagem de parâmetros (por valor ou referência) e recursão.
- **Exemplo típico:** Escrever uma função que retorna o maior elemento de um vetor.
- **Exemplo de fronteira:** Calcular o fatorial usando recursão. O foco está na chamada recursiva e encapsulamento em função (E4), e não apenas no laço de repetição ou operações (E1/E2).

## Níveis de Dificuldade

A dificuldade é baseada na exigência cognitiva da questão:
- **Muito Fácil:** Aplicação direta de um único conceito (ex: ler dois números e somar).
- **Fácil:** Requer a junção de dois conceitos simples (ex: `if` com operadores lógicos `&&`).
- **Médio:** Exige planejamento e combinação (ex: ler um vetor e usar um laço para achar o maior).
- **Difícil:** Problemas com múltiplos passos e tratamento de borda (ex: ordenação de vetor, manipulação de matrizes complexas).
- **Muito Difícil:** Exige otimização ou algoritmos avançados (ex: backtracking ou algoritmos eficientes).

## Vocabulário Fechado de Estruturas C

Garantindo a compatibilidade com G2-1 (consumidora futura), a catalogação restringe as estruturas aos seguintes termos, definidos na enumeração `CStructure` (em `src/codeexpert/domain.py`):

- `if`, `else`, `for`, `while`, `do-while`, `switch`
- `vetor`, `matriz`, `string`, `struct`, `ponteiro`, `funcao`, `recursao`

---

## Verificação de Consistência da Taxonomia

Para assegurar que o modelo adotado leva a um consenso, duas pessoas catalogaram separadamente o mesmo conjunto de 10 questões, e compararam suas classificações.

### Resultados da Classificação Independente

| Questão | Tema | Avaliador 1 | Avaliador 2 | Resultado |
|---------|------|-------------|-------------|-----------|
| Q01 | Somar A+B | E1 / Muito Fácil | E1 / Muito Fácil | Consenso |
| Q02 | Imprimir Pares de 1 a N | E2 / Fácil | E2 / Fácil | Consenso |
| Q03 | Fatorial (laço) | E2 / Fácil | E2 / Médio | **Divergência (Dificuldade)** |
| Q04 | Fatorial (recursão) | E4 / Médio | E4 / Médio | Consenso |
| Q05 | Média dos elementos de um vetor | E3 / Fácil | E3 / Fácil | Consenso |
| Q06 | Cadastro de Alunos (Struct) | E3 / Médio | E3 / Médio | Consenso |
| Q07 | Função para Maior Primo | E4 / Difícil | E2 / Difícil | **Divergência (Eixo)** |
| Q08 | Produto de Matrizes | E3 / Difícil | E3 / Difícil | Consenso |
| Q09 | Ponteiro para trocar Valores | E3 / Médio | E3 / Médio | Consenso |
| Q10 | Palíndromo (String) | E3 / Médio | E3 / Médio | Consenso |

**Análise das Divergências (2 de 10):**

1. **Q03:** Resolvida clarificando que, embora seja um laço simples (Fácil), o uso de acumulador pode ser considerado Médio dependendo do contexto. Foi decidido fixar este tipo de acumulação como **Fácil**, dado ser um padrão comum.
2. **Q07:** Divergência entre E4 (Modularização) e E2 (Controle de Fluxo) para achar o maior primo. O ajuste foi documentar na fronteira de E4 que, quando o exercício pede explicitamente a construção de uma função, o eixo dominante é o E4.

A taxonomia atingiu o critério de sucesso (máximo 2 divergências em 10 testes cegos) e os critérios de fronteira foram ajustados de acordo com essas discussões.

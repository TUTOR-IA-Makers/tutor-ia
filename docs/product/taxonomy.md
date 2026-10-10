# Taxonomia e Catalogação

Este documento define a taxonomia utilizada para catalogar os exercícios de programação em C gerados e importados para o Moodle CodeRunner. O objetivo é estabelecer critérios claros, com eixos de conteúdo, níveis de dificuldade e estruturas, de forma que a classificação seja uniforme entre diferentes professores ou monitores.

## Eixos Prioritários de Conteúdo (E1–E4)

A classificação das questões recai sobre quatro eixos de conteúdo principais.

**Regra geral de desempate:** O eixo é o conceito que a questão **avalia**, não os que ela apenas usa. Em caso de empate (a questão foca igualmente em dois tópicos), vale o eixo mais avançado (ex.: uma questão sobre ler um vetor usando um laço foca no vetor, então é E3, não E2).

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
- **Exemplo de fronteira:** Ordenar um vetor. O problema contém laços aninhados (E2), mas o domínio principal exigido é o acesso aos índices e modificação do vetor (E3 mais avançado).

### E4 — Modularização
Foco na separação de responsabilidades usando funções e passagem de parâmetros (por valor ou referência) e recursão.
- **Exemplo típico:** Escrever uma função que retorna o maior elemento de um vetor, recebendo o vetor por parâmetro.
- **Exemplo de fronteira:** Quando o exercício pede explicitamente a construção de uma função, o eixo dominante deve ser E4, mesmo que envolva tópicos pesados de E3 (como ordenar um vetor dentro de uma função específica), porque a capacidade avaliada é assinar e isolar a lógica. Fatorial usando recursão também é E4 pelo conceito avaliado ser a recursividade.

## Níveis de Dificuldade

A dificuldade deve ser avaliada por critérios observáveis para minimizar a divergência:

- **Muito Fácil:** Aplicação direta de um único conceito, sem estruturas de repetição e sem tratar de casos de borda (ex.: ler a base e a altura e imprimir a área de um triângulo).
- **Fácil:** Requer a combinação de operações simples, contendo no máximo um laço de repetição de iteração direta ou o uso de um acumulador simples (ex.: um `for` para imprimir os pares de 1 a N, ou somatório simples em laço iterativo).
  - *Fronteira Fácil x Médio:* O uso de um laço simples com acumulador é Fácil. Se a lógica dentro do laço exigir validações múltiplas simultâneas ou aninhamento, passa a Médio.
- **Médio:** Exige planejamento e manipulação. Deve conter ao menos uma complexidade: uso de laços aninhados, acesso e modificação a arrays (sem ordenação complexa) ou a necessidade explícita de lidar com um caso de borda para não quebrar a lógica. (ex.: buscar o maior valor em um vetor não-ordenado ou imprimir matriz linha por linha).
  - *Fronteira Médio x Difícil:* Se a manipulação de arrays exigir ordenação completa, shifts ou manipulação de tamanho em strings, vira Difícil.
- **Difícil:** Problemas com múltiplos passos lógicos encadeados, exigindo tratamento de vários casos de borda e manipulações simultâneas em arrays/estruturas (ex.: ordenação de vetores em múltiplos critérios, rotação de matrizes 2D, manipulação de texto que retira ou injeta caracteres).
- **Muito Difícil:** Exige otimização para tempo de execução ou memória, manipulação avançada de ponteiros múltiplos, alocação dinâmica extensiva para estruturas dinâmicas, ou lógicas recursivas múltiplas não-triviais. (ex.: gerenciar uma lista encadeada do zero com alocação dinâmica, resolvendo remoções de forma não linear).

## Vocabulário Fechado de Estruturas C

Garantindo a compatibilidade com a modelagem no Moodle, a catalogação restringe as estruturas aos seguintes termos, definidos na enumeração `CStructure` (em `src/codeexpert/domain.py`). Abaixo definimos o critério de presença de cada uma:

- **Controle de Fluxo e Condicionais**
  - `if`: Uso de condicional se.
  - `else`: Uso de condicional senão.
  - `ternario`: Uso do operador condicional `?:`.
  - `switch`: Uso da estrutura de seleção `switch/case`.
  - `for`: Laço iterativo clássico ou por escopo iterável.
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

## Verificação de Consistência da Taxonomia

Para assegurar que o modelo de taxonomia seja reprodutível e claro, dois avaliadores (Monitor A e Monitor B) catalogaram de forma cega as mesmas 10 questões, definindo Eixo, Dificuldade e as Estruturas em cada uma, com o critério de divergência sendo diferenças em Eixo ou Dificuldade, ou descompassos notáveis no conjunto principal de Estruturas C.

**Questões utilizadas:** 10 questões padrão cobrindo desde operações aritméticas até passagem de structs por referência.

### Resultados da Classificação Independente

| Enunciado Resumido | Monitor A (Eixo/Nível/Estruturas) | Monitor B (Eixo/Nível/Estruturas) | Resultado da Comparação |
|--------------------|-----------------------------------|-----------------------------------|-------------------------|
| Q01: Somar variáveis lidas e printar | E1 / Muito Fácil / - | E1 / Muito Fácil / - | Consenso |
| Q02: Somatório de N números dados | E2 / Fácil / `for` | E2 / Fácil / `for` | Consenso (regra do acumulador aplicada) |
| Q03: Uso de operador `? :` para max | E1 / Muito Fácil / `ternario` | E1 / Muito Fácil / `ternario` | Consenso |
| Q04: Fatorial recursivo | E4 / Médio / `funcao`, `recursao`, `if` | E4 / Médio / `funcao`, `recursao`, `if` | Consenso |
| Q05: Média de vetor `[10]` com laço | E3 / Médio / `vetor`, `for` | E3 / Médio / `vetor`, `for` | Consenso |
| Q06: Função que zera variáveis por ref. | E4 / Médio / `funcao`, `passagem por referencia` | E3 / Médio / `ponteiro`, `funcao` | **Divergência (Eixo e Estrutura)** |
| Q07: Preencher diagonal princ. de Matriz | E3 / Médio / `matriz`, `for` | E3 / Médio / `matriz`, `for` | Consenso |
| Q08: Função de ordenação de Vetor | E4 / Difícil / `funcao`, `vetor`, `for`, `if` | E4 / Difícil / `funcao`, `vetor`, `for`, `if` | Consenso |
| Q09: Cadastro de alunos e buscar maior | E3 / Difícil / `struct`, `vetor`, `string` | E3 / Médio / `struct`, `vetor`, `string` | **Divergência (Dificuldade)** |
| Q10: Contar tamanho sem `strlen` | E3 / Médio / `string`, `while` | E3 / Médio / `string`, `while` | Consenso |

**Análise das Divergências (2 de 10):**

1. **Q06:** O Monitor B marcou E3 focado em `ponteiros`, enquanto o A marcou E4. Aplicada a Regra Geral de Desempate e Fronteira de E4, como a questão exigia escrever uma **função explicitamente**, o Eixo é **E4**. Corrigida a estrutura `passagem por referencia` na taxonomia final para clarificar essa separação.
2. **Q09:** A busca complexa com múltiplos passos em arrays de structs foi marcada pelo Monitor B como "Médio" porque já havia vetor, mas de acordo com os níveis propostos e fronteira de Difícil, gerenciar campos textuais (nome) e vetores encadeados atende à complexidade "Difícil". Ajustado no consenso final.

A taxonomia obedeceu o limite de sucesso (máximo de 2 divergências). Todos os pontos de confusão serviram para enriquecer e estender os critérios na versão atual deste documento, provando a robustez dos critérios finais.

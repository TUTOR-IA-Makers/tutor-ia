# Endpoints de geração

<p class="lead">As cinco etapas do pipeline, expostas individualmente. A primeira cria a execução; as outras recebem o <code>run_id</code> que ela devolveu.</p>

Para correr as cinco de uma vez, ver [`POST /create_question`](create-question.md).

---

## `/gen_statement` {#gen_statement}

<span class="ce-badge ce-badge--post">POST</span> `/gen_statement`

**Etapa 1.** Gera o enunciado e, por omissão, **cria uma execução nova**.

### Corpo

```json
{
  "can_has_if": true,
  "can_has_else": true,
  "can_has_repetition": false,
  "can_has_function": false,
  "can_has_matrix": false,
  "difficulty": "muito facil",
  "run_id": null
}
```

| Campo | Tipo | Omissão | Efeito |
| --- | --- | --- | --- |
| `can_has_if` | `bool` | `true` | `false` proíbe condicionais |
| `can_has_else` | `bool` | `true` | Só tem efeito com `can_has_if: true` |
| `can_has_repetition` | `bool` | `false` | `true` **exige** `for`, `while` ou `do while` |
| `can_has_function` | `bool` | `false` | `true` **exige** funções |
| `can_has_matrix` | `bool` | `false` | `true` **exige** vetores ou matrizes |
| `difficulty` | `enum` | `"muito facil"` | `muito facil`, `facil`, `medio`, `dificil`, `muito dificil` |
| `run_id` | `string?` | `null` | Reutiliza uma execução existente em vez de criar uma |

Todos os campos são opcionais; `{}` é um pedido válido.

!!! warning "As restrições são pedidas ao modelo, não verificadas"
    Uma questão gerada com `can_has_repetition: false` pode vir com um ciclo na solução. Nada no serviço o deteta. É a lacuna principal — ver [análise de lacunas](../product/gap-analysis.md#as-restricoes-nao-sao-verificadas).

!!! info "`difficulty` é um conjunto fechado"
    Um valor fora da lista é `422` com a lista dos aceites, e não um prompt silenciosamente sem a linha de nível.

### Resposta

<span class="ce-badge">200</span> `StatementResponse`

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "name": "Soma de dois numeros inteiros",
  "statement": "Soma de dois numeros inteiros\n\nLeia dois numeros..."
}
```

Guarde o `run_id`: todas as etapas seguintes precisam dele.

### Erros

| Estado | Quando |
| --- | --- |
| `422` | `difficulty` fora do conjunto, ou tipo errado num campo |
| `404` | `run_id` fornecido e desconhecido |
| `502` | O fornecedor falhou depois das tentativas |
| `503` | `CODEEXPERT_LLM_API_KEY` não está definida |

---

## `/gen_code` {#gen_code}

<span class="ce-badge ce-badge--post">POST</span> `/gen_code`

**Etapa 2.** Gera a solução de referência em C.

### Corpo

<span class="ce-badge ce-badge--req">Obrigatório</span> — `run_id`, devolvido pela etapa 1.

```json
{ "run_id": "20260918T221305Z-1a2b3c4d" }
```

### Depende de

`statement.json` — ou seja, da etapa 1 na mesma execução.

### Resposta

<span class="ce-badge">200</span> `CodeResponse`

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "code": "#include <stdio.h>\n\nint main(void) {\n    ...\n}"
}
```

O código é gravado em `solution.c` no diretório da execução. Se o modelo tiver envolvido a resposta numa cerca de markdown, ela é removida antes de gravar.

### Erros

| Estado | Quando |
| --- | --- |
| `404` | `run_id` desconhecido ou malformado |
| `409` | A etapa 1 ainda não correu nesta execução |
| `502` / `503` | Como acima |

---

## `/gen_inputs` {#gen_inputs}

<span class="ce-badge ce-badge--post">POST</span> `/gen_inputs`

**Etapa 3.** Gera entradas de teste, analisando o enunciado **e** a solução.

### Corpo

```json
{ "run_id": "20260918T221305Z-1a2b3c4d", "qty": 10 }
```

| Campo | Tipo | Omissão | Limites |
| --- | --- | --- | --- |
| `run_id` | `string` | — | <span class="ce-badge ce-badge--req">Obrigatório</span> |
| `qty` | `int` | `10` | 1 a 100 |

### Depende de

`statement.json` e `solution.c`.

### Resposta

<span class="ce-badge">200</span> `InputResponse`

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "inputs": ["3\n10\n20\n30\n", "1\n5\n"]
}
```

!!! warning "`qty` é um limite, não uma garantia"
    Podem vir **menos** entradas do que as pedidas: a lista é truncada a `qty`, mas nada obriga o modelo a produzir tantas. Uma lista vazia é legítima — significa que o programa não lê de `stdin`.

### Erros

| Estado | Quando |
| --- | --- |
| `422` | `qty` fora de 1–100 |
| `404` | `run_id` desconhecido |
| `409` | Falta o enunciado ou a solução |
| `502` / `503` | Como acima |

---

## `/gen_testcases` {#gen_testcases}

<span class="ce-badge ce-badge--post">POST</span> `/gen_testcases`

**Etapa 4.** Compila a solução e executa-a com cada entrada. **Não chama o modelo.**

### Corpo

<span class="ce-badge ce-badge--req">Obrigatório</span> — `run_id`, devolvido pela etapa 1.

```json
{ "run_id": "20260918T221305Z-1a2b3c4d" }
```

### Depende de

`solution.c` e `inputs.json`. E de `gcc` estar no `PATH`.

### Resposta

<span class="ce-badge">200</span> `TestCaseResponse`

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "testcases": [
    { "input": "3\n10\n20\n30\n", "output": "60\n" },
    { "input": "1\n5\n", "output": "5\n" }
  ]
}
```

!!! quote "A etapa que produz verdade"
    O `output` é o `stdout` real do binário, capturado da execução. É a única informação do pipeline que não veio de um modelo — e a razão de ser de todo o projeto.

### Erros

| Estado | Quando |
| --- | --- |
| `404` | `run_id` desconhecido |
| `409` | Falta a solução ou as entradas |
| `422` | Falha de compilação — com o `stderr` do `gcc` no `detail` |
| `422` | Uma entrada não terminou dentro do tempo limite — com o número dessa entrada |
| `422` | `gcc` não está instalado |

!!! tip "Saídas vazias não são erro"
    Se o `output` de todos os casos vier vazio, o programa provavelmente espera um formato de entrada diferente do que foi gerado. Ver [Resolução de problemas](../development/troubleshooting.md#saidas-vazias-nos-casos-de-teste).

---

## `/export_moodle_xml_question` {#export_moodle_xml_question}

<span class="ce-badge ce-badge--post">POST</span> `/export_moodle_xml_question`

**Etapa 5.** Renderiza a questão e acrescenta-a ao ficheiro de questionário.

### Corpo

<span class="ce-badge ce-badge--req">Obrigatório</span> — `run_id`, devolvido pela etapa 1.

```json
{ "run_id": "20260918T221305Z-1a2b3c4d" }
```

### Lê

`statement.json`, `solution.c`, `testcases.json` e `meta.json`.

### Resposta

<span class="ce-badge">200</span> `ExportResponse`

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "file_path": "var/questions/Moodle_Questionnaire.xml",
  "question_count": 3
}
```

`question_count` é a posição desta questão no ficheiro.

!!! info "Exportações sucessivas acumulam"
    Cada chamada acrescenta uma questão ao mesmo ficheiro, o que permite construir um questionário inteiro com várias execuções. Ver [Templates Moodle XML](../architecture/moodle-xml.md#acumulacao).

### Erros

| Estado | Quando |
| --- | --- |
| `404` | `run_id` desconhecido |
| `409` | Falta o enunciado, a solução ou os casos de teste |

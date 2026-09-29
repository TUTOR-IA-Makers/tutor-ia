# Endpoints de geração

<p class="lead">As cinco etapas do pipeline, expostas individualmente. Cada uma lê o que a anterior escreveu em <code>cache/</code> e responde <code>404</code> se as suas dependências faltarem.</p>

!!! warning "Estes endpoints não limpam a cache"
    Só `POST /create_question` limpa `cache/` antes de começar. Ao invocar estes endpoints manualmente, comece por `rm -rf cache/*` — caso contrário, ficheiros de execuções anteriores podem ser reutilizados sem aviso.

---

## `/gen_statement`

<span class="ce-badge ce-badge--post">POST</span> `/gen_statement`

Gera o enunciado a partir das restrições pedagógicas. É a única etapa sem dependências em `cache/`.

### Corpo

Todos os campos são opcionais, e o próprio corpo também — `StatementRequest` tem valores por omissão para tudo.

| Campo | Tipo | Omissão | Efeito |
| --- | --- | --- | --- |
| `can_has_if` | `boolean` | `true` | `false` proíbe condicionais por completo |
| `can_has_else` | `boolean` | `true` | Só relevante com `can_has_if: true`; `false` pede `if` sem `else` |
| `can_has_repetition` | `boolean` | `false` | `true` exige `for`, `while` ou `do while` |
| `can_has_function` | `boolean` | `false` | `true` exige funções definidas pelo aluno |
| `can_has_matrix` | `boolean` | `false` | `true` exige vetores ou matrizes |
| `difficulty` | `string` | `"muito facil"` | Um de: `muito facil`, `facil`, `medio`, `dificil`, `muito dificil` |

!!! warning "`difficulty` não é validado"
    Um valor fora dos cinco literais **não gera `422`**. A cadeia `if/elif` em `_build_prompt()` simplesmente não encontra correspondência e nenhuma instrução de dificuldade é acrescentada ao prompt. O pedido é bem-sucedido, com um enunciado de dificuldade indeterminada.

    Escreva os valores exatamente como acima: minúsculas, sem acentos, com o espaço.

```bash
curl -X POST http://127.0.0.1:8000/gen_statement \
  -H "Content-Type: application/json" \
  -d '{"can_has_repetition": true, "can_has_function": true, "difficulty": "medio"}'
```

Sem corpo, usa todos os valores por omissão:

```bash
curl -X POST http://127.0.0.1:8000/gen_statement
```

### Resposta

<span class="ce-badge">200</span> `StatementResponse`

```json
{
  "name": "Jogo de Adivinhacao com Niveis de Dificuldade",
  "statement": "Jogo de Adivinhacao com Niveis de Dificuldade\n\nVoce deve criar um jogo de adivinhacao...\n\nA entrada deve conter:\n1. Uma string que representa o nivel de dificuldade...",
  "file_path": "cache/statement.json"
}
```

| Campo | Descrição |
| --- | --- |
| `name` | Título — primeira linha não vazia do enunciado formatado |
| `statement` | Texto completo, com secções separadas por linhas em branco |
| `file_path` | `cache/statement.json` |

### Erros

| Código | Causa |
| --- | --- |
| `500` | Configuração em falta, provedor inalcançável, chave rejeitada |

Não devolve `404` — não depende de nenhum ficheiro em `cache/`.

---

## `/gen_code`

<span class="ce-badge ce-badge--post">POST</span> `/gen_code`

Gera a solução de referência em C a partir do enunciado em cache.

### Corpo

Nenhum.

```bash
curl -X POST http://127.0.0.1:8000/gen_code
```

### Depende de

`cache/statement.json`

### Resposta

<span class="ce-badge">200</span> `CodeResponse`

```json
{
  "code": "#include <stdio.h>\n#include <string.h>\n\n// Function to get user input\nvoid getUserInput(char *difficulty, int *rounds) {\n    scanf(\"%s\", difficulty);\n    scanf(\"%d\", rounds);\n}\n...",
  "file_path": "cache/solution.c"
}
```

O conteúdo é escrito literalmente em `cache/solution.c`, sem qualquer pós-processamento.

!!! warning "Reveja o código antes de continuar"
    Esta é a etapa que determina tudo o que vem a seguir — as entradas são derivadas dos `scanf` deste código e as saídas esperadas são o que este binário imprime.

    Confirme sobretudo que **não imprime mensagens de prompt** antes de ler, e que **não usa `rand()` nem `time()`**. Ambos os padrões produzem questões que nenhum aluno consegue passar. Ver [Importar no Moodle](../guides/import-into-moodle.md#verificacoes-antes-de-usar-com-alunos).

### Erros

| Código | Causa |
| --- | --- |
| `404` | `Statement file not found. Generate a statement first.` |
| `500` | Falha do provedor LLM |

---

## `/gen_inputs`

<span class="ce-badge ce-badge--post">POST</span> `/gen_inputs`

Gera entradas de teste analisando enunciado e código em conjunto.

### Corpo

<span class="ce-badge ce-badge--req">Obrigatório</span>

| Campo | Tipo | Omissão | Validação |
| --- | --- | --- | --- |
| `qty` | `integer` | `10` | `1 ≤ qty ≤ 100`, aplicada por um validador Pydantic |

```bash
curl -X POST http://127.0.0.1:8000/gen_inputs \
  -H "Content-Type: application/json" \
  -d '{"qty": 10}'
```

!!! note "O corpo é obrigatório, o campo não"
    `InputRequest` tem um valor por omissão para `qty`, mas o endpoint declara o parâmetro sem valor por omissão. Um `POST` sem corpo devolve `422`; `{}` é aceite e usa `qty: 10`.

### Depende de

`cache/solution.c` **e** `cache/statement.json`

### Resposta

<span class="ce-badge">200</span> `InputResponse`

```json
{
  "inputs": [
    "facil\n3\n1\n2\n3\n",
    "medio\n2\n25\n30\n",
    "dificil\n1\n50\n"
  ],
  "file_path": "cache/inputs.json"
}
```

Cada entrada é a sequência exata que será escrita no `stdin` do programa. `\n` separa linhas.

!!! info "`qty` é um limite superior"
    A lista é truncada a `qty`, mas se o modelo devolver menos, menos ficam. Uma lista vazia é o resultado correto quando a solução não lê nada de `stdin` — o prompt instrui-o explicitamente nesse sentido.

### Erros

| Código | Causa |
| --- | --- |
| `404` | `Solution file not found. Generate a solution first.` |
| `404` | `Statement file not found. Generate a statement first.` |
| `422` | Corpo ausente, ou `qty` fora de `[1, 100]` |
| `500` | Falha do provedor LLM |

---

## `/gen_testcases`

<span class="ce-badge ce-badge--post">POST</span> `/gen_testcases`

Compila a solução, executa-a com cada entrada e captura o `stdout`. **Não usa o LLM.**

### Corpo

Nenhum.

```bash
curl -X POST http://127.0.0.1:8000/gen_testcases
```

### Depende de

`cache/solution.c` **e** `cache/inputs.json`

### Resposta

<span class="ce-badge">200</span> `TestCaseResponse`

```json
{
  "testcases": [
    {
      "input": "facil\n3\n1\n2\n3\n",
      "output": "Muito baixo!\nMuito alto!\nMuito baixo!\nO numero secreto era: 7\n"
    }
  ],
  "file_path": "cache/testcases.json"
}
```

`output` é o `stdout` real do binário compilado. O `stderr` é capturado mas descartado, e o código de saída do processo é ignorado.

!!! danger "Execução sem isolamento nem timeout"
    O binário corre com os privilégios do processo do servidor, sem *sandbox*, sem limite de tempo e sem limite de memória. Um programa gerado com um ciclo infinito bloqueia o pedido indefinidamente e não pode ser cancelado pela API.

    Ver [Pipeline de geração](../architecture/pipeline.md#limites-desta-etapa).

### Erros

| Código | Causa | `detail` |
| --- | --- | --- |
| `404` | Solução ausente | `Solution file not found. Generate a solution first.` |
| `404` | Entradas ausentes | `Inputs file not found. Generate inputs first.` |
| `500` | O código gerado não compila | `Compilation failed:` seguido do `stderr` do `gcc` |
| `500` | `gcc` ausente do `PATH` | Mensagem de `FileNotFoundError` do `subprocess` |

!!! tip "Falhas de compilação são recuperáveis sem custo"
    Edite `cache/solution.c` diretamente e volte a chamar este endpoint. As etapas 1 a 3, que já foram pagas em tokens, não precisam de ser repetidas.

---

## `/export_moodle_xml_question`

<span class="ce-badge ce-badge--post">POST</span> `/export_moodle_xml_question`

Monta a questão a partir dos templates e escreve-a no XML de saída.

### Corpo

Nenhum.

```bash
curl -X POST http://127.0.0.1:8000/export_moodle_xml_question
```

### Lê

`cache/statement.json`, `cache/solution.c`, `cache/testcases.json` e os três ficheiros em `templates/`.

### Resposta

<span class="ce-badge">200</span>

```json
{
  "status": "success",
  "file_path": "Questions/Moodle_Questionnaire.xml"
}
```

!!! danger "Sucesso não significa que a questão tem conteúdo"
    Ao contrário das outras etapas, esta **não verifica as suas dependências**. Ficheiros ausentes em `cache/` são substituídos por valores vazios, e o resultado é um XML sintaticamente válido, sem enunciado, sem código e sem casos de teste — com `status: "success"`.

    Confirme o conteúdo de `cache/` antes de exportar manualmente.

!!! warning "A exportação acumula"
    Se `Questions/Moodle_Questionnaire.xml` já existir, a nova questão é inserida antes de `</quiz>` em vez de substituir o ficheiro. A resposta é idêntica em ambos os casos. Ver [Acumulação](../architecture/moodle-xml.md#acumulacao).

### Erros

| Código | Causa |
| --- | --- |
| `500` | Um ficheiro de `templates/` está ausente, ou `Questions/` não é gravável |

Os templates são carregados por `_load_template()`, que **não** tem valor por omissão — um template em falta levanta `FileNotFoundError`, traduzido para `500` pelo `except Exception` genérico do router.

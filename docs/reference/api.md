# API

<p class="lead">Contrato HTTP de <code>main</code>: dois endpoints de diagnóstico, as cinco etapas do pipeline e um orquestrador. Todos públicos, síncronos e em JSON.</p>

<span class="ce-badge ce-status--done">Implementado</span> Todos os endpoints desta página. Os endpoints previstos no plano (`POST /questions`, `GET /questions`, aprovação, exportação de seleção) estão em [Roadmap](../product/roadmap.md#estado-da-geracao).

## Visão geral

| | |
| --- | --- |
| Base URL | `http://127.0.0.1:8000` (`make run`) |
| Autenticação | Nenhuma |
| Formato | `Content-Type: application/json` nos pedidos; respostas sempre JSON |
| Explorar | `/` redireciona para `/docs` (Swagger UI). Também há `/redoc` e `/openapi.json` |

| Método | Rota | O que faz |
| --- | --- | --- |
| <span class="ce-badge ce-badge--get">GET</span> | [`/health`](#get-health) | Sonda de vida |
| <span class="ce-badge ce-badge--get">GET</span> | [`/config`](#get-config) | Configuração em uso; opcionalmente testa a chave |
| <span class="ce-badge ce-badge--post">POST</span> | [`/gen_statement`](#post-gen_statement) | Etapa 1 — **cria a execução** e devolve o `run_id` |
| <span class="ce-badge ce-badge--post">POST</span> | [`/gen_code`](#post-gen_code) | Etapa 2 — solução em C |
| <span class="ce-badge ce-badge--post">POST</span> | [`/gen_inputs`](#post-gen_inputs) | Etapa 3 — entradas de teste |
| <span class="ce-badge ce-badge--post">POST</span> | [`/gen_testcases`](#post-gen_testcases) | Etapa 4 — compila e executa |
| <span class="ce-badge ce-badge--post">POST</span> | [`/export_moodle_xml_question`](#post-export_moodle_xml_question) | Etapa 5 — acrescenta a questão ao XML |
| <span class="ce-badge ce-badge--post">POST</span> | [`/create_question`](#post-create_question) | As cinco etapas numa chamada |

Toda resposta de sucesso das etapas inclui o `run_id`. Toda resposta de erro tem a forma `{"detail": "..."}`; erros de `/create_question` trazem também `run_id` (validação é diferente, ver [Erros](#erros)).

| Endpoint | Duração típica | Dominada por |
| --- | --- | --- |
| `/health`, `/config` | milissegundos (~1 s com `?verify=true`) | — |
| Etapas 1, 2, 3 | segundos | O modelo |
| Etapa 4 | segundos | Compilação + `qty` execuções de até 5 s |
| `/create_question` | dezenas de segundos | Tudo acima |

---

## `GET /health` {#get-health}

```json
{ "status": "ok", "version": "0.2.0" }
```

Não lê configuração, disco nem rede. Responde `200` mesmo sem chave — serve como sonda de container, não como diagnóstico.

## `GET /config` {#get-config}

```bash
curl "http://127.0.0.1:8000/config?verify=true"
```

```json
{
  "model": "gpt-4o-mini",
  "api_base_url": "https://api.openai.com/v1",
  "api_key_configured": true,
  "workspace_root": "var/runs",
  "provider_reachable": true,
  "status": "Configuration loaded and provider reachable."
}
```

| Campo | Significado |
| --- | --- |
| `api_key_configured` | Se `CODEEXPERT_LLM_API_KEY` está definida. **Nunca devolve a chave** |
| `provider_reachable` | `null` sem `?verify=true`. Com ele, faz `GET {base_url}/models` e diz se respondeu `200` |
| `status` | Resumo legível |

Sempre responde `200`: ele informa o problema de configuração, não falha por causa dele.

**Recarregar configuração:** cada chamada invalida o cache de configuração. A própria resposta ainda mostra os valores antigos; a chamada seguinte (e qualquer etapa depois) usa o `.env` novo. Chamar no meio de uma geração pode trocar o modelo entre etapas.

---

## `POST /gen_statement` {#post-gen_statement}

**Etapa 1.** Gera o enunciado. Sem `run_id`, cria uma execução nova.

| Campo | Tipo | Padrão | Efeito |
| --- | --- | --- | --- |
| `can_has_if` | `bool` | `true` | `false` proíbe condicionais |
| `can_has_else` | `bool` | `true` | Só vale com `can_has_if: true`; `false` pede `if` sem `else` |
| `can_has_repetition` | `bool` | `false` | `true` **exige** `for`, `while` ou `do while` |
| `can_has_function` | `bool` | `false` | `true` **exige** funções |
| `can_has_matrix` | `bool` | `false` | `true` **exige** vetores ou matrizes |
| `difficulty` | enum | `"muito facil"` | `muito facil`, `facil`, `medio`, `dificil`, `muito dificil` |
| `run_id` | `string?` | `null` | Reusa uma execução existente e sobrescreve o enunciado dela |

`{}` é um pedido válido. As restrições são **pedidas** ao modelo, não verificadas.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "name": "Soma de dois numeros", "statement": "Soma de dois numeros\n\nLeia dois..." }
```

Erros: `422` (campo inválido), `404` (`run_id` desconhecido), `502`, `503`.

## `POST /gen_code` {#post-gen_code}

**Etapa 2.** Corpo: `{"run_id": "..."}` (obrigatório). Requer a etapa 1.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "code": "#include <stdio.h>\n..." }
```

Grava `solution.c`, sem cercas de markdown. Erros: `404`, `409` (falta o enunciado), `502`, `503`.

## `POST /gen_inputs` {#post-gen_inputs}

**Etapa 3.** Corpo: `{"run_id": "...", "qty": 10}`. `qty` vai de 1 a 100, padrão 10. Requer as etapas 1 e 2.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "inputs": ["3\n10\n20\n30\n", "1\n5\n"] }
```

`qty` é um máximo: podem vir menos entradas. Lista vazia é válida (o programa não lê `stdin`). Erros: `422`, `404`, `409`, `502`, `503`.

## `POST /gen_testcases` {#post-gen_testcases}

**Etapa 4.** Corpo: `{"run_id": "..."}`. Requer as etapas 2 e 3 e `gcc` no `PATH`. Não chama o modelo.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "testcases": [{ "input": "1\n5\n", "output": "5\n" }] }
```

`output` é o `stdout` real do binário. Saídas vazias não são erro — geralmente indicam entradas no formato errado. Erros: `404`, `409`, `422` (não compila, entrada que não termina, ou `gcc` ausente).

## `POST /export_moodle_xml_question` {#post-export_moodle_xml_question}

**Etapa 5.** Corpo: `{"run_id": "..."}`. Requer as etapas 1, 2 e 4.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "file_path": "var/questions/Moodle_Questionnaire.xml", "question_count": 3 }
```

Acrescenta a questão ao arquivo; `question_count` é a posição dela. Chamar duas vezes duplica a questão. Erros: `404`, `409`.

---

## `POST /create_question` {#post-create_question}

As cinco etapas em sequência, numa execução nova (ou na indicada em `statement_request.run_id`).

```json
{
  "statement_request": { "difficulty": "facil", "can_has_repetition": true },
  "qty": 10
}
```

| Campo | Tipo | Padrão | Efeito |
| --- | --- | --- | --- |
| `statement_request` | objeto | `{}` | Os campos de [`/gen_statement`](#post-gen_statement) |
| `qty` | `int` | `10` | Número de entradas, 1 a 100 |
| `input_request` | objeto | `null` | Alternativa para `qty`: `{"run_id": "...", "qty": 5}`. Se presente, `run_id` é obrigatório e `qty` dele prevalece. A execução usada é sempre a de `statement_request.run_id` (ou uma nova) |

```json title="200"
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "statement": { "name": "Soma dos numeros pares", "statement": "..." },
  "code": "#include <stdio.h>\n...",
  "inputs": ["5\n1\n2\n3\n4\n5\n"],
  "testcases": [{ "input": "5\n1\n2\n3\n4\n5\n", "output": "6\n" }],
  "export": { "run_id": "20260918T221305Z-1a2b3c4d", "file_path": "var/questions/Moodle_Questionnaire.xml", "question_count": 1 }
}
```

Se uma etapa falha, o erro dela é devolvido com o mesmo status do endpoint individual, e o que já foi gerado fica no disco. Nesse caso a resposta de erro traz também o `run_id`, para retomar etapa por etapa — ver [Gerar uma questão](../guides/generate-a-question.md#retomar-depois-de-uma-falha). Não é idempotente: cada chamada cria uma execução e acrescenta uma questão ao XML.

---

## Erros {#erros}

Os serviços levantam exceções de domínio; `api/errors.py` traduz cada uma pela tabela `STATUS_BY_ERROR`. Exceção fora da tabela vira `500`, com traceback no log.

| Status | Exceção | Quando |
| --- | --- | --- |
| `404` | `RunNotFoundError` | `run_id` inexistente ou com formato inválido (inclusive `../../etc`) |
| `409` | `MissingArtefactError` | Etapa chamada antes da anterior. A mensagem diz qual endpoint roda antes |
| `422` | `CompilationError` | A solução não compila; `detail` traz o `stderr` do `gcc` |
| `422` | `ExecutionError` | Entrada que não terminou no tempo limite, ou `gcc` fora do `PATH` |
| `422` | validação do Pydantic | Corpo inválido. Aqui `detail` é uma **lista** de objetos, não texto |
| `502` | `LLMError` | Provedor falhou após as tentativas, recusou (ex.: `401`) ou respondeu em formato inesperado |
| `503` | `ConfigurationError` | `CODEEXPERT_LLM_API_KEY` não definida |
| `500` | outra | Erro não previsto |

```json title="exemplos de detail"
{ "detail": "Run '20260918T120000Z-deadbeef' not found. Start a new one with POST /gen_statement." }
{ "detail": "'inputs.json' not found in run 20260918T221305Z-1a2b3c4d. Generate inputs first (POST /gen_inputs)." }
{ "detail": "Compilation failed:\nsolution.c:5:5: error: expected ';' before '}' token" }
{ "detail": "Input 2 of 5 did not terminate within the time limit. The generated solution probably loops forever on it; regenerate the solution or drop the input." }
{ "detail": "Call to the model provider failed — HTTP 429: {...}" }
{ "detail": "CODEEXPERT_LLM_API_KEY is not set. Copy .env.example to .env and fill it in, or export the variable in your shell." }
```

Para acrescentar um tipo de erro: uma classe em `errors.py` e uma linha em `STATUS_BY_ERROR`. Nunca `try/except` numa rota.

### Casos que respondem `200` mas estão errados

| Situação | Resultado |
| --- | --- |
| A solução usa uma estrutura proibida | `200`; nada verifica |
| O modelo devolve menos entradas que `qty` | `200`, com lista menor |
| As entradas não batem com o que o programa lê | `200`, com saídas vazias |
| O enunciado ignora o formato de blocos | `200`, com o texto todo como corpo |

Diagnóstico de cada um em [Problemas comuns](troubleshooting.md).

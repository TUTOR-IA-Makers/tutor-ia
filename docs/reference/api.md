# API

<p class="lead">Contrato HTTP do backend: dois endpoints de diagnóstico, as cinco etapas do pipeline, um orquestrador síncrono, a revisão de uma questão e a API de recursos sob <code>/api/v1</code> que o formulário usa. Todos públicos e em JSON.</p>

<span class="ce-badge ce-status--done">Implementado</span> Todos os endpoints desta página. Os endpoints previstos no plano (rejeição e regeneração sob `/api/v1`, exportação de seleção, sessão) estão em [Roadmap](../product/roadmap.md#estado-da-geracao).

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
| <span class="ce-badge ce-badge--get">GET</span> | [`/questions/{run_id}`](#get-questions-run_id) | Tudo o que a tela de revisão precisa, de uma questão concluída |
| <span class="ce-badge ce-badge--post">POST</span> | [`/questions/{run_id}/approve`](#post-questions-run_id-approve) | `GERADA` → `APROVADA`, com quem aprovou e quando |
| <span class="ce-badge ce-badge--post">POST</span> | [`/questions/{run_id}/reject`](#post-questions-run_id-reject) | `GERADA` ou `FALHOU_VERIFICACAO` → `REJEITADA` |
| <span class="ce-badge ce-badge--get">GET</span> | [`/api/v1/structures`](#catalogo-de-estruturas-para-o-formulario) | Vocabulário de estruturas do formulário |
| <span class="ce-badge ce-badge--post">POST</span> | [`/api/v1/questions`](#post-api-v1-questions) | Cria uma questão a partir do formulário e responde `202` na hora |
| <span class="ce-badge ce-badge--get">GET</span> | [`/api/v1/questions`](#get-api-v1-questions) | A biblioteca: lista paginada, com filtros e busca |
| <span class="ce-badge ce-badge--get">GET</span> | [`/api/v1/questions/{id}/generation`](#get-api-v1-generation) | Andamento da geração |
| <span class="ce-badge ce-badge--get">GET</span> | [`/api/v1/questions/{id}`](#get-api-v1-question) | A questão, em qualquer estado |
| <span class="ce-badge ce-badge--post">POST</span> | [`/api/v1/questions/{id}/approve`](#post-api-v1-approve) | O botão Aprovar da tela de revisão; devolve a questão inteira |

Toda resposta de sucesso das etapas inclui o `run_id`. Toda resposta de erro tem a forma `{"detail": "..."}`; erros de `/create_question` trazem também `run_id` (validação é diferente, ver [Erros](#erros)).

| Endpoint | Duração típica | Dominada por |
| --- | --- | --- |
| `/health`, `/config` | milissegundos (~1 s com `?verify=true`) | — |
| Etapas 1, 2, 3 | segundos | O modelo |
| Etapa 4 | segundos | Compilação + `qty` execuções de até 5 s |
| `/create_question` | dezenas de segundos | Tudo acima |

Toda resposta que devolve uma questão traz `state`, o [estado do ciclo de vida](../architecture/question-lifecycle.md): `GERANDO`, `GERADA`, `FALHOU_VERIFICACAO`, `APROVADA` ou `REJEITADA`. Só `APROVADA` pode ir para o aluno.

---

## `GET /health` {#get-health}

```json
{ "status": "ok", "version": "0.2.0", "commit": null }
```

`version` é a versão do pacote; `commit` vem de `CODEEXPERT_COMMIT_SHA` e é `null` quando a variável não está definida. Não chama o provedor nem o compilador. Responde `200` mesmo sem chave — serve como sonda de container, não como diagnóstico.

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
| `axis` | enum ou `null` | `null` | Classificação opcional: `fundamentos`, `controle de fluxo`, `estruturas de dados e ponteiros`, `modularizacao`. É armazenada; não altera o prompt |
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

**Etapa 4.** Corpo: `{"run_id": "..."}`. Requer as etapas 2 e 3 e `gcc` no `PATH`. Não chama o modelo. É a etapa que verifica a questão: se a solução não compila ou não termina numa entrada, a questão passa a `FALHOU_VERIFICACAO`; chamar de novo numa questão nesse estado a devolve a `GERANDO` antes de tentar.

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
  "state": "GERADA",
  "statement": { "name": "Soma dos numeros pares", "statement": "..." },
  "code": "#include <stdio.h>\n...",
  "inputs": ["5\n1\n2\n3\n4\n5\n"],
  "testcases": [{ "input": "5\n1\n2\n3\n4\n5\n", "output": "6\n" }],
  "export": { "run_id": "20260918T221305Z-1a2b3c4d", "file_path": "var/questions/Moodle_Questionnaire.xml", "question_count": 1 }
}
```

Se uma etapa falha, o erro dela é devolvido com o mesmo status do endpoint individual, e o que já foi gerado fica no disco. Nesse caso a resposta de erro traz também o `run_id`, para retomar etapa por etapa — ver [Gerar uma questão](../guides/generate-a-question.md#retomar-depois-de-uma-falha). Não é idempotente: cada chamada cria uma execução e acrescenta uma questão ao XML.

---

## `GET /questions/{run_id}` {#get-questions-run_id}

Devolve numa chamada o que a tela de revisão precisa: estado, enunciado, solução, entradas, casos de teste e o `meta.json`.

```json title="200"
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "state": "GERADA",
  "statement": { "name": "Soma de dois numeros", "statement": "..." },
  "code": "#include <stdio.h>
...",
  "inputs": ["1
2
"],
  "testcases": [{ "input": "1
2
", "output": "3
" }],
  "metadata": { "run_id": "...", "created_at": "...", "steps": [], "reviewed": false, "approved_by": null, "approved_at": null }
}
```

Só responde para uma execução **concluída**, isto é, que terminou a etapa 5. Uma geração que falhou no meio é um rascunho e responde `404`, igual a um `run_id` desconhecido; ela continua retomável pelas etapas. Erros: `404`.

---

## `POST /questions/{run_id}/approve` {#post-questions-run_id-approve}

Aprova uma questão `GERADA` e registra o professor responsável. O corpo é obrigatório.

```json title="Corpo"
{ "approved_by": "Profa. Ana Lima" }
```

| Campo | Regra |
| --- | --- |
| `approved_by` | Obrigatório. Espaços nas pontas são removidos; vazio ou só espaços é `422`. Até 120 caracteres |

```json title="200"
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "state": "APROVADA",
  "reviewed": true,
  "approved_by": "Profa. Ana Lima",
  "approved_at": "2026-11-17T14:02:11.482913+00:00"
}
```

O registro fica gravado: o `GET /questions/{run_id}` seguinte traz `state: "APROVADA"` e, em `metadata`, os mesmos `reviewed`, `approved_by` e `approved_at`. `approved_at` é ISO 8601 em UTC, definido pelo servidor.

**Idempotente.** Aprovar uma questão que já está `APROVADA` responde `200` com o registro **da primeira aprovação**, mesmo que o corpo traga outro nome. Nada é regravado. Se dois professores aprovam ao mesmo tempo, os dois recebem `200` e fica o nome de quem gravou primeiro.

Erros: `404` (`run_id` desconhecido), `422` (sem `approved_by`), `409` (`GERANDO`, `FALHOU_VERIFICACAO` ou `REJEITADA`). Uma recusa não grava nada.

```json title="409"
{ "detail": "Question '20260918T221305Z-1a2b3c4d' is FALHOU_VERIFICACAO and cannot become APROVADA. A question that failed verification cannot be approved. Fix or regenerate the solution and run the test cases again (POST /gen_testcases)." }
```

!!! note "Por que o nome vem no corpo"
    Ainda não há sessão. Quando houver (G8-1), o responsável passa a ser o
    professor da sessão e este campo deixa de existir. Ver
    [ADR-0016](../adr/0016-approval-record-on-runs.md).

## `POST /questions/{run_id}/reject` {#post-questions-run_id-reject}

Rejeita uma questão `GERADA` ou `FALHOU_VERIFICACAO`. Sem corpo. Funciona também numa questão que não concluiu a etapa 5, por isso a resposta traz só o estado, não a questão.

```json title="200"
{ "run_id": "20260918T221305Z-1a2b3c4d", "state": "REJEITADA" }
```

Erros: `404`, `409` (`GERANDO`, `APROVADA` ou já `REJEITADA`). As transições permitidas estão em [Ciclo de vida da questão](../architecture/question-lifecycle.md).

## API de recursos `/api/v1` {#api-v1}

O formulário do front-end (modo `http`) chama estas rotas. O navegador pede uma questão e consulta o andamento; quem encadeia as cinco etapas é o servidor ([ADR-0013](../adr/0013-resource-api-and-cookie-session.md)). Os nomes dos campos seguem `frontend/src/services/http/dto.ts`. O id de uma questão é o `run_id` da execução.

A geração roda numa `BackgroundTask` do FastAPI, no mesmo processo da API, e o estado do job fica no banco: se o servidor reiniciar no meio, o job passa a `INTERROMPIDO` na inicialização seguinte e pode ser [retomado](#post-api-v1-resume) sem repetir as etapas já concluídas. Ver [Geração em segundo plano](../architecture/pipeline.md#geracao-em-segundo-plano).

!!! warning "Limitações"
    Não há fila distribuída nem sessão: as rotas são públicas como o resto da API. A detecção de `INTERROMPIDO` supõe um processo só da API, que é o que roda em produção ([ADR-0017](../adr/0017-resumable-generation-job.md)).

### `POST /api/v1/questions` {#post-api-v1-questions}

```json
{
  "content_id": "condicionais",
  "difficulty_min": 1200,
  "difficulty_max": 1600,
  "test_case_count": 5,
  "test_case_hints": null,
  "context": "Tarifa de estacionamento",
  "structures": { "required": ["if"], "allowed": ["else"], "forbidden": ["for"] }
}
```

```json title="202"
{ "id": "20261105T142233Z-1a2b3c4d" }
```

O corpo é validado e traduzido em restrições (`api/drafts.py`) antes de qualquer chamada ao modelo:

| Campo | Regra | Vira |
| --- | --- | --- |
| `content_id` | Um dos dez conteúdos do formulário (`frontend/src/domain/contents.ts`) | `axis`: `entrada-saida` → fundamentos; `condicionais`, `repeticao` → controle de fluxo; `vetores`, `matrizes`, `strings`, `ponteiros`, `structs` → estruturas de dados e ponteiros; `funcoes`, `recursao` → modularização |
| `difficulty_min`, `difficulty_max` | Inteiros de 500 a 3500, `min ≤ max` | `difficulty`: a faixa de `difficulty_max` (até 950 muito fácil, 1350 fácil, 1850 médio, 2350 difícil, acima disso muito difícil) |
| `test_case_count` | 1 a 20 | Número de entradas pedidas ao modelo |
| `structures` | Ids de `GET /api/v1/structures`; um id não pode estar em `forbidden` e em outra lista | Flags de `/gen_statement`, por grupo: `if`; `else`; `for`/`while`/`do-while` → repetição; `funcao`/`recursao`/`passagem por referencia` → funções; `vetor`/`matriz` → vetores ou matrizes. Pedir ou permitir qualquer estrutura do grupo liga a flag; senão, proibir alguma desliga; grupo não citado fica no padrão |
| `test_case_hints` (até 1000), `context` (até 300) | Opcionais | Guardados em `draft.json`. **Ainda não chegam ao prompt** |

Estruturas sem flag (`switch`, `struct`, `ponteiro`…) também são guardadas e não chegam ao prompt. Usar a faixa de `difficulty_max` é provisório, à espera da decisão da equipe (#38).

Erros: `422` (corpo inválido; `detail` é uma lista). Nada é criado nesse caso. Uma falha **durante** a geração não volta nesta resposta: aparece em `/generation`.

### `GET /api/v1/questions/{id}/generation` {#get-api-v1-generation}

```json title="200"
{
  "question_id": "20261105T142233Z-1a2b3c4d",
  "run_id": "20261105T142233Z-1a2b3c4d",
  "status": "GERANDO",
  "completed_steps": 2,
  "failure_reason": null,
  "job": {
    "state": "EM_ANDAMENTO",
    "step": "inputs",
    "resumable": false,
    "updated_at": "2026-11-18T14:22:41.118204+00:00"
  }
}
```

| `status` | Quando |
| --- | --- |
| `GERANDO` | O job não terminou nem falhou |
| `GERADA` | As cinco etapas terminaram; `completed_steps` é `5` |
| `FALHOU_VERIFICACAO` | Alguma etapa falhou, ou o job foi interrompido por um reinício (`job.state` diz qual). `completed_steps` conta as que terminaram; `failure_reason` explica em português, sem stack trace nem saída do compilador (o detalhe fica no log do servidor, com o `run_id`) |
| `APROVADA`, `REJEITADA` | A questão foi revisada por [`/approve`](#post-questions-run_id-approve) ou [`/reject`](#post-questions-run_id-reject) |

O `status` é o estado do [ciclo de vida da questão](../architecture/question-lifecycle.md), o mesmo que as rotas de revisão leem e gravam. Uma exceção: se uma etapa **anterior** à verificação falha (o modelo, por exemplo) ou o job é interrompido, o ciclo de vida não tem estado para isso e a questão continua `GERANDO` no banco. Como nada mais está rodando, a API responde `FALHOU_VERIFICACAO` com o motivo, para a tela não ficar consultando para sempre. Essa questão não pode ser aprovada nem rejeitada.

`job` é o estado do job de geração, que não é um estado da questão ([ADR-0017](../adr/0017-resumable-generation-job.md)). O front pode ignorá-lo; `status` continua com os cinco valores de sempre.

| `job.state` | Quando |
| --- | --- |
| `EM_ANDAMENTO` | O job está rodando a etapa `job.step` |
| `INTERROMPIDO` | O servidor reiniciou com o job rodando. `job.step` é a etapa em que parou e `job.resumable` é `true`: [`/resume`](#post-api-v1-resume) continua dali. `failure_reason` diz isso ao professor |
| `FALHOU` | Uma etapa levantou erro. `job.step` diz qual; não se retoma, gera-se de novo |
| `CONCLUIDO` | As cinco etapas terminaram |

`job.step` é `statement`, `code`, `inputs`, `testcases` ou `export`, ou `null` antes da primeira etapa e depois da conclusão. `job.updated_at` é a última mudança do registro, em UTC.

`completed_steps` vem de `meta.json → steps` (enunciado, solução, entradas, casos de teste), mais um quando a execução é concluída pela exportação. Erros: `404`.

### `GET /api/v1/questions` {#get-api-v1-questions}

A biblioteca do professor. Lista as questões criadas por [`POST /api/v1/questions`](#post-api-v1-questions), em qualquer estado, da mais recente para a mais antiga. Execuções iniciadas pelas rotas RPC (sem `draft.json`) não aparecem, a mesma regra de [`GET /api/v1/questions/{id}`](#get-api-v1-question). Não há sessão ainda (G8-1): a lista traz as questões de todos.

```bash
curl "http://127.0.0.1:8000/api/v1/questions?axis=controle%20de%20fluxo&status=APROVADA&q=tarifa&page=1&page_size=20"
```

Todos os parâmetros são opcionais e se combinam (uma questão precisa atender a todos):

| Parâmetro | Valores | Filtra por |
| --- | --- | --- |
| `q` | Texto, até 200 caracteres | Cada palavra precisa aparecer no título, no enunciado ou no contexto. Ignora maiúsculas e acentos (`funcao` acha "Função"). Vazio é o mesmo que ausente |
| `content` | Um dos dez conteúdos do formulário (`condicionais`, `vetores`…) | O `content_id` da questão |
| `axis` | `fundamentos`, `controle de fluxo`, `estruturas de dados e ponteiros`, `modularizacao` | O eixo do conteúdo, pela mesma tabela de [`POST /api/v1/questions`](#post-api-v1-questions) |
| `difficulty` | `muito-facil`, `facil`, `medio`, `dificil`, `muito-dificil` (os ids de `frontend/src/domain/difficulty.ts`) | Faixas que **se sobrepõem** ao intervalo `difficulty_min`–`difficulty_max`: uma questão de 1200 a 1600 aparece em `facil` e em `medio` |
| `status` | `GERANDO`, `GERADA`, `FALHOU_VERIFICACAO`, `APROVADA`, `REJEITADA` | O `status` que [`GET /api/v1/questions/{id}`](#get-api-v1-question) responde para a mesma questão: uma geração que falhou antes da verificação ou foi interrompida aparece como `FALHOU_VERIFICACAO`, não como `GERANDO` |
| `page` | Inteiro ≥ 1; padrão `1` | A página |
| `page_size` | 1 a 100; padrão `20` | Questões por página |

```json title="200"
{
  "items": [
    {
      "id": "20261105T142233Z-1a2b3c4d",
      "code": "20261105T142233Z-1a2b3c4d",
      "title": "Tarifa de estacionamento",
      "description": "Tarifa de estacionamento",
      "content_id": "condicionais",
      "difficulty_min": 1200,
      "difficulty_max": 1600,
      "status": "APROVADA",
      "test_case_count": 5
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

Cada item tem os campos de `questionSummaryDto` em `frontend/src/services/http/dto.ts`, os mesmos do início de [`GET /api/v1/questions/{id}`](#get-api-v1-question), que traz o resto. `title` é "Enunciado ainda não gerado" enquanto a etapa 1 não termina; `test_case_count` é o número de casos executados, ou o pedido no formulário antes da etapa 4. A ordem usa `meta.json → created_at`, desempatada pelo id, então duas páginas nunca repetem uma questão.

`total` conta todas as questões que atendem aos filtros, somando as páginas. Banco vazio, filtro sem correspondência e página além do fim respondem `200` com `items` vazio; `total` diz qual dos três é (`0`, `0` ou maior que zero). Erros: `422` para um valor fora das tabelas acima (conteúdo, eixo, faixa ou estado desconhecido, `page` 0, `page_size` acima de 100) e para um parâmetro que não está nela: um filtro com nome errado, como `stauts`, não devolve a biblioteca inteira como se tivesse filtrado.

Os filtros rodam no servidor, em Python, sobre uma única consulta ao banco que traz os artefatos de todas as execuções (`api/library.py`). Basta para centenas de questões; quando não bastar, os filtros passam para o SQL com o mesmo contrato.

### `GET /api/v1/questions/{id}` {#get-api-v1-question}

Responde em qualquer estado, porque o front carrega a questão antes de escolher entre a tela de andamento e a de revisão. Campos que uma etapa ainda não produziu vêm vazios.

```json title="200"
{
  "id": "20261105T142233Z-1a2b3c4d",
  "code": "20261105T142233Z-1a2b3c4d",
  "title": "Tarifa de estacionamento",
  "description": "Tarifa de estacionamento",
  "content_id": "condicionais",
  "difficulty_min": 1200,
  "difficulty_max": 1600,
  "status": "GERADA",
  "test_case_count": 1,
  "statement": { "text": "...", "input": "", "output": "", "example": null },
  "solution": "#include <stdio.h>\n...",
  "test_cases": [
    { "id": "caso-1", "input": "3\n", "expected_output": "6\n", "actual_output": null, "passed": null }
  ],
  "structures": { "required": ["if"], "allowed": ["else"], "forbidden": ["for"] },
  "constraints": [],
  "compilation": null,
  "failure_reason": null,
  "reviewed": false,
  "approved_by": null,
  "approved_at": null,
  "job": { "state": "CONCLUIDO", "step": null, "resumable": false, "updated_at": "2026-11-05T14:23:10.004113+00:00" }
}
```

| Campo | Origem |
| --- | --- |
| `title`, `statement.text` | `statement.json`. Antes da etapa 1, `title` é "Enunciado ainda não gerado" e `text` é vazio |
| `description`, `content_id`, `difficulty_*`, `structures` | O pedido original, guardado em `draft.json` |
| `solution` | `solution.c`, ou `null` antes da etapa 2 |
| `test_cases[].expected_output` | A saída real da execução da solução (etapa 4), nunca do modelo |
| `code` | O próprio `run_id`; o backend não numera questões |
| `statement.input`, `statement.output` | Sempre vazios: o enunciado ainda não é separado em blocos |
| `statement.example`, `actual_output`, `passed`, `compilation` | Sempre `null`: nada os produz ainda |
| `constraints` | Sempre `[]`: a verificação de escopo (FEAT-024) não existe |
| `reviewed`, `approved_by`, `approved_at` | O registro da aprovação (`meta.json`). `false`, `null`, `null` até alguém aprovar |
| `job` | O registro do job de geração, igual ao de [`/generation`](#get-api-v1-generation) |

Erros: `404` para id desconhecido, malformado ou de uma execução criada pelas rotas RPC (sem `draft.json`). As rotas RPC continuam funcionando, inclusive `GET /questions/{run_id}` para uma questão criada aqui.

### `POST /api/v1/questions/{id}/resume` {#post-api-v1-resume}

Continua um job `INTERROMPIDO` a partir da primeira etapa que `meta.json` não registra. As etapas já concluídas não rodam de novo, então nenhuma chamada ao modelo já paga se repete. Sem corpo. Responde antes de rodar qualquer etapa, com o mesmo formato de [`/generation`](#get-api-v1-generation); acompanhe por ele.

```json title="202"
{
  "question_id": "20261105T142233Z-1a2b3c4d",
  "run_id": "20261105T142233Z-1a2b3c4d",
  "status": "GERANDO",
  "completed_steps": 2,
  "failure_reason": null,
  "job": { "state": "EM_ANDAMENTO", "step": "inputs", "resumable": false, "updated_at": "2026-11-18T14:30:02.551930+00:00" }
}
```

Erros: `404` (id desconhecido ou execução sem `draft.json`), `409` (job `EM_ANDAMENTO`, `FALHOU` ou `CONCLUIDO`; dois cliques seguidos iniciam um job só, o segundo recebe `409`).

### `POST /api/v1/questions/{id}/approve` {#post-api-v1-approve}

O botão **Aprovar e salvar** da tela de revisão (G4-5). Mesmas regras de
[`POST /questions/{run_id}/approve`](#post-questions-run_id-approve): mesmo corpo,
idempotente, `409` para `FALHOU_VERIFICACAO`. A diferença é a resposta: a
[questão inteira](#get-api-v1-question), já com `status: "APROVADA"`, porque o
front substitui a sua cópia por ela.

```json title="Corpo"
{ "approved_by": "Profa. Ana Lima" }
```

```json title="200 (trecho)"
{
  "id": "20261105T142233Z-1a2b3c4d",
  "status": "APROVADA",
  "reviewed": true,
  "approved_by": "Profa. Ana Lima",
  "approved_at": "2026-11-17T14:02:11.482913+00:00"
}
```

Erros: `404` (id desconhecido ou execução sem `draft.json`), `409`, `422`.

!!! warning "O front ainda não envia o corpo"
    Hoje `createHttpServices.ts` chama esta rota sem corpo e receberia `422`.
    Para integrar, a G4-5 precisa enviar `approved_by` e, se quiser mostrar quem
    aprovou, ler `reviewed`, `approved_by` e `approved_at` em `dto.ts`.

---

## Erros {#erros}

Os serviços levantam exceções de domínio; `api/errors.py` traduz cada uma pela tabela `STATUS_BY_ERROR`. Exceção fora da tabela vira `500`, com traceback no log.

| Status | Exceção | Quando |
| --- | --- | --- |
| `404` | `RunNotFoundError` | `run_id` inexistente ou com formato inválido (inclusive `../../etc`) |
| `409` | `MissingArtefactError` | Etapa chamada antes da anterior. A mensagem diz qual endpoint roda antes |
| `409` | `InvalidTransitionError` | O estado atual da questão não permite a mudança pedida. A mensagem diz os dois estados |
| `409` | `JobNotResumableError` | Retomar um job que não está `INTERROMPIDO` |
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

## Catálogo de estruturas para o formulário

`GET /api/v1/structures` retorna uma lista de objetos `id` e `label`, derivada de
`CStructure` em `src/codeexpert/domain.py`. As três listas do formulário usam esse
catálogo, sem uma lista de opções própria no componente. O envio fica bloqueado
enquanto o catálogo carrega, falha ou está vazio; a tela permite tentar novamente.
Estruturas desconhecidas e combinações conflitantes são bloqueadas antes do envio.

No modo `mock`, o serviço usa uma resposta de exemplo em
`frontend/src/services/mock/structures.json`, conferida contra a API por teste.
No modo `http`, o envio do formulário vai para
[`POST /api/v1/questions`](#post-api-v1-questions); o roteiro local está em
[Demonstrar o formulário ligado à API](../guides/form-to-database.md).

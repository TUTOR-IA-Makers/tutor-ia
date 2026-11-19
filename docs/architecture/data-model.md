# Modelo de dados

<p class="lead">O Postgres guarda artefatos de trabalho e uma representação estruturada da última geração concluída, ligada pelo run_id. Esta é a entrega de G1-2 (#16).</p>

## Tabelas implementadas

| Tabela | Chave e campos | Papel |
| --- | --- | --- |
| `runs` | `run_id` (PK), `status`, `created_at`, `completed_at` | Execução; `status` diz se os artefatos estão completos (`draft` ou `complete`) |
| `runs` | `state` | Estado da questão: `GERANDO`, `GERADA`, `FALHOU_VERIFICACAO`, `APROVADA` ou `REJEITADA` ([Ciclo de vida](question-lifecycle.md)) |
| `runs` | `constraints` (JSONB), `input_quantity`, `reviewed`, `steps` (JSONB) | Conteúdo de `meta.json` na última conclusão |
| `runs` | `approved_by` (text), `approved_at` (timestamptz) | Quem aprovou e quando; `NULL` até a aprovação. Gravados com `state = 'APROVADA'` na mesma instrução ([ADR-0016](../adr/0016-approval-record-on-runs.md)) |
| `runs` | `job_state`, `job_step`, `job_failure_reason`, `job_error`, `job_updated_at` | O job de geração em segundo plano: `EM_ANDAMENTO`, `INTERROMPIDO`, `FALHOU` ou `CONCLUIDO`, a etapa, o motivo para o professor e a classe da exceção. `NULL` em execuções que nenhum job iniciou ([ADR-0017](../adr/0017-resumable-generation-job.md)) |
| `runs` | `input_tokens`, `output_tokens` (bigint), `cost` (numeric) | Reservados para G2-4; permanecem `NULL`, não zero |
| `questions` | `run_id` (PK e FK para `runs`), `name`, `statement`, `reference_solution`, `constraints` (JSONB), `difficulty`, `axis` | Uma questão por execução; o estado fica em `runs.state`, porque esta linha só existe depois da etapa 5 |
| `test_cases` | (`run_id`, `position`) (PK), `input`, `output` | Casos ligados à questão; ordem a partir de zero, duplicatas e espaços preservados |
| `run_artifacts` | (`run_id`, `name`) (PK), `content`, `updated_at` | Artefatos originais, inclusive trabalho ainda em andamento |

Cada elemento de `steps` contém `step`, `model`, `prompt_version` e
`finished_at`, como em `RunMetadata`. Etapas sem modelo mantêm os valores
opcionais nulos. Repetições de uma etapa permanecem na lista, em ordem.
`created_at` e `completed_at` são `timestamptz`; o horário de cada etapa mantém
a representação ISO recebida em `meta.json`.

`difficulty` usa os cinco valores de `Difficulty`; `axis` usa os quatro valores
de `ContentAxis`, descritos na [taxonomia](../product/taxonomy.md). O pedido de
enunciado aceita `axis` opcional. Esse campo registra classificação; não altera
o prompt e não garante que o modelo gere conteúdo daquele eixo. Pedidos antigos
continuam válidos, com eixo nulo. Restrições ausentes em artefatos antigos
permanecem nulas, sem inferência de classificação.

## Escrita e leitura

`PostgresStore.mark_complete()` lê o conjunto de artefatos e, na mesma transação,
grava os metadados em `runs`, atualiza `questions`, substitui seus `test_cases`
e marca a execução como concluída. As saídas dos casos são copiadas dos
artefatos produzidos pela execução da solução; não são calculadas pelo modelo.
Falha de validação ou de SQL desfaz a transação inteira. Escritas de artefatos
e conclusão usam o bloqueio da linha da execução para evitar uma leitura
parcial de uma escrita concorrente.

`PostgresStore.get_question(run_id)` devolve `StoredQuestion` ou `None`, lendo
apenas as tabelas estruturadas. Inclui enunciado, solução, restrições, nível,
eixo, estado (lido de `runs.state`), casos e metadados. A API existente continua lendo artefatos;
endpoints de listagem e filtros não fazem parte desta entrega.

Uma nova conclusão substitui o retrato anterior, sem criar versões. Alterações
de artefatos depois da conclusão só aparecem nessa representação na próxima
conclusão. Execuções genéricas sem o conjunto de quatro artefatos
(`statement.json`, `solution.c`, `testcases.json`, `meta.json`) mantêm o contrato
do `ArtifactStore`: podem ser concluídas, mas não criam uma questão estruturada.
Excluir uma execução remove artefatos, questão e casos por `ON DELETE CASCADE`.

## Atualização e evidência

`store/schema.sql` é aplicado na inicialização: `CREATE TABLE IF NOT EXISTS`
e `ADD COLUMN IF NOT EXISTS` permitem abrir um banco da versão anterior sem
apagar dados. Questões antigas não recebem preenchimento automático; concluir
novamente uma execução com seus artefatos completos popula as tabelas novas.
A G3-1 acrescentou `runs.state`: execuções já concluídas passam a `GERADA`, as
demais a `GERANDO`, e a coluna provisória `questions.state` (que só aceitava
`draft`) é removida.
O backend local continua guardando arquivos, sem tabelas relacionais.

Para verificar com um **banco de teste descartável**, configure
`CODEEXPERT_TEST_DATABASE_URL` no ambiente e execute `make check`.
`tests/integration/test_question_model.py` cobre leitura por outra instância,
todos os campos, custos nulos, independência dos artefatos, substituição dos
casos, rollback e exclusão em cascata. Sem essa variável, os testes de Postgres
são pulados explicitamente.

Versionamento completo (G1-7) e coleta de tokens/custo (G2-4) permanecem
planejados. A decisão está na
[ADR-0014](../adr/0014-structured-question-snapshot.md).

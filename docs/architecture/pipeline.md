# Pipeline de geração

<p class="lead">Cinco etapas: três chamam o modelo, uma compila e executa, uma monta o XML. Esta página descreve o que cada etapa pede, como interpreta a resposta e onde pode falhar em silêncio.</p>

<span class="ce-badge ce-status--done">Implementado</span> Tudo nesta página. Mudanças previstas — verificação de escopo entre as etapas 2 e 3, entradas categorizadas — estão no [Roadmap](../product/roadmap.md#verificacao-de-escopo).

```mermaid
flowchart TD
    R["POST /gen_statement<br/><small>cria a execução</small>"] --> S1

    S1["1 · statement<br/><small>LLM</small>"] -->|statement.json| S2["2 · code<br/><small>LLM</small>"]
    S2 -->|solution.c| S3["3 · inputs<br/><small>LLM</small>"]
    S3 -->|inputs.json| S4["4 · testcases<br/><small>gcc + execução</small>"]
    S4 -->|testcases.json| S5["5 · export<br/><small>templates</small>"]
    S5 --> X["XML na resposta<br/><small>nenhum arquivo</small>"]

    style S4 stroke-width:3px
```

| # | Endpoint | Módulo | Depende de | Produz |
| --- | --- | --- | --- | --- |
| 1 | `POST /gen_statement` | `generation/statement.py` | Modelo | `statement.json` |
| 2 | `POST /gen_code` | `generation/codegen.py` | Modelo | `solution.c` |
| 3 | `POST /gen_inputs` | `generation/inputs.py` | Modelo | `inputs.json` |
| 4 | `POST /gen_testcases` | `generation/testcases.py` | `gcc` | `solution`, `testcases.json` |
| 5 | `POST /export_moodle_xml_question` | `export/moodle.py` | — | o XML |

`POST /create_question` roda as cinco em ordem (`generation/pipeline.py`). `POST /api/v1/questions` também, mas fora do pedido, como um job — ver [Geração em segundo plano](#geracao-em-segundo-plano).

## 1 · Enunciado

Cria a execução (a resposta traz o `run_id`) e gera o enunciado. As restrições são três listas de estruturas (`required`, `allowed`, `forbidden`, ver [API](../reference/api.md#post-gen_statement)), mas o prompt ainda fala em cinco grupos. `Constraints` (`domain.py`) deriva de cada grupo uma flag — ligada se alguma estrutura do grupo for pedida ou permitida — e `describe_constraints()` transforma as flags em linhas de requisito:

| Flag (grupo) | Linha no prompt |
| --- | --- |
| `can_has_if` desligada (`if`) | `NÃO deve usar estruturas condicionais (if)` |
| `can_has_if` ligada, `can_has_else` desligada (`else`) | `DEVE usar if mas NÃO deve usar else` |
| `can_has_if` e `can_has_else` ligadas | `DEVE usar estruturas condicionais completas (if e else)` |
| `can_has_repetition` (`for`, `while`, `do-while`) | `DEVE` / `NÃO deve usar estruturas de repetição` |
| `can_has_function` (`funcao`, `recursao`, `passagem por referencia`) | `DEVE` / `NÃO deve usar funções` |
| `can_has_matrix` (`vetor`, `matriz`) | `DEVE` / `NÃO deve usar vetores ou matrizes` |
| `difficulty` | `A questão deve ser de nivel …` (conjunto fechado; valor fora dele é `422`) |

Note que uma estrutura só **permitida** já vira `DEVE` no prompt. Estruturas fora dos cinco grupos (`goto`, `struct`…) ficam guardadas em `meta.json` e não aparecem no prompt — um prompt que cite cada lista é mudança em `prompts.py`, ainda não feita ([ADR-0020](../adr/0020-named-structure-constraints.md)).

O prompt pede blocos `[Título]`, `[Descrição]`, `[Entradas]`, `[Saídas]`, sem exemplos, sem markdown e sem acentos (o texto acaba em arquivos lidos por código C). `parse_statement` abre um bloco a cada linha `[…]`; o título é a primeira linha não vazia.

!!! warning "Falha silenciosa"
    Se o modelo ignorar os blocos, o texto inteiro vira corpo e a primeira linha vira título. Resposta `200`, questão com aparência estranha. Por isso `parse_statement` tem testes.

## 2 · Solução

Recebe o enunciado e pede C puro, que lê de `stdin` sem imprimir mensagens. `strip_code_fences` remove uma cerca ` ```c ` se o modelo a incluir apesar da instrução — era a causa mais comum de falha de compilação.

!!! danger "Nada verifica as restrições"
    O código pode usar `for` numa questão pedida sem repetição, e o XML sai mesmo assim. <span class="ce-badge ce-status--planned">Planejado</span> no G2-2: uma etapa nova entre 2 e 3 com `tree-sitter-c` — ver [Roadmap](../product/roadmap.md#verificacao-de-escopo).

## 3 · Entradas

Recebe o enunciado **e** a solução (para acertar o formato dos `scanf`) e pede `qty` entradas como array JSON de strings. `parse_inputs` tenta, em ordem:

1. JSON válido que seja uma lista;
2. uma linha entre colchetes que não é JSON válido;
3. uma entrada por linha, ignorando cercas de markdown.

A lista é cortada em `qty`, mas o modelo pode devolver menos. Lista vazia é válida: o programa não lê nada. O prompt pede "casos-limite e casos normais", mas a categoria não é guardada.

## 4 · Casos de teste {#4-casos-de-teste}

**A única etapa que não fala com o modelo.** Compila e executa.

```mermaid
flowchart LR
    C["solution.c"] --> G["gcc -std=c11 -Wall -Wextra -O1"]
    G -->|falha| E["422 com o stderr do compilador"]
    G -->|sucesso| B["binário"]
    I["inputs.json"] --> R["executar, uma vez por entrada"]
    B --> R
    R --> T["testcases.json<br/><small>stdout real = saída esperada</small>"]
```

| Limite | Padrão | Variável |
| --- | --- | --- |
| Tempo de compilação | 20 s | `CODEEXPERT_COMPILE_TIMEOUT_SECONDS` |
| Tempo de cada execução | 5 s | `CODEEXPERT_RUN_TIMEOUT_SECONDS` |
| Saída capturada por execução | 64 KiB (excedente é truncado) | `CODEEXPERT_RUN_MAX_OUTPUT_BYTES` |

Cada execução roda no próprio grupo de processos; ao estourar o tempo, o grupo inteiro recebe `SIGKILL` e a etapa responde `422` dizendo qual entrada não terminou.

!!! danger "Limitado não é isolado"
    Não há limite de memória, de número de processos, de rede nem de sistema de arquivos. O binário roda com as permissões de quem iniciou o servidor. `CodeRunner` é um protocolo justamente para que um sandbox entre no lugar de `LocalGccRunner` sem mudar o pipeline ([ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md)).

## 5 · Exportação Moodle XML {#5-exportacao-moodle-xml}

Três templates em `backend/src/codeexpert/export/templates/`, lidos via `importlib.resources`:

| Template | Papel |
| --- | --- |
| `questionnaire.xml` | O envelope `<quiz>` |
| `question.xml` | Uma questão `type="coderunner"` |
| `case.xml` | Um `<testcase>` |

| Marcador | Substituído por |
| --- | --- |
| `Macro_QuestionNumber` | Posição da questão na lista exportada, a partir de 1 |
| `Macro_QuestionName` | Título, escapado |
| `Macro_QuestionTextinHTML` | Enunciado escapado, `\n` → `<br>`, dentro de CDATA |
| `Macro_Answer` | Código C dentro de CDATA; um `]]>` literal é neutralizado |
| `Macro_CoderunnerType` | `c_program` |
| `Macro_Hidden` | `0` |
| `Macro_TestCases` | Os `<testcase>` concatenados |
| `Macro_Tags` | `Gerado por IA`, a dificuldade, e `Revisado` ou `Nao revisado` conforme `meta.json` |
| `Macro_StdIn`, `Macro_OutputExpected` | Entrada e saída, com `strip()` e escape XML |
| `Macro_UseAsExample` | `"1"` nos três primeiros casos, `"0"` nos demais |
| `Macro_Display` | vazio |

**Função pura, sem arquivo compartilhado.** O XML é montado em memória e devolvido; nada é lido nem gravado fora da execução. A interface, em `codeexpert.export`, é pensada para ser reutilizada pela exportação de uma seleção (G1-6):

```python
@dataclass(frozen=True)
class ExportQuestion:          # o que o XML de uma questão precisa, e só isso
    statement: Statement
    code: str
    testcases: tuple[TestCase, ...]
    metadata: RunMetadata      # dificuldade e `reviewed`, para as tags

def read_question(workspace: RunWorkspace) -> ExportQuestion: ...
def export_questions(questions: Sequence[ExportQuestion]) -> str: ...
def export_run(workspace: RunWorkspace) -> ExportResult: ...  # a etapa 5
```

| Função | Faz | Não faz |
| --- | --- | --- |
| `export_questions` | Devolve um `<quiz>` com as questões na ordem recebida, numeradas 1, 2, 3… pela posição na lista. A mesma lista dá sempre o mesmo XML. Lista vazia é `ValueError` | Ler ou gravar arquivo, consultar o store, recusar questão não aprovada (isso é do chamador, G3-4) |
| `read_question` | Lê `statement.json`, `solution.c`, `testcases.json` e `meta.json` da execução. Artefato ausente é `MissingArtefactError` (`409`) | Validar o estado da questão |
| `export_run` | A etapa 5: `export_questions([read_question(ws)])`, marca a execução como concluída e devolve `ExportResult(xml, question_count=1)` | Gravar o XML. Chamar de novo devolve o mesmo XML |

Uma seleção é `export_questions([read_question(ws) for ws in selecionadas])`: a numeração sai da ordem da lista, não de um arquivo pré-existente.

```mermaid
flowchart LR
    A["Execução 1"] -->|etapa 5| F1["&lt;quiz&gt;<br/>questão 1<br/>&lt;/quiz&gt;"]
    B["Execução 2"] -->|etapa 5| F2["&lt;quiz&gt;<br/>questão 1<br/>&lt;/quiz&gt;"]
```

Duas exportações ao mesmo tempo não interferem: não há estado compartilhado. Até o G1-8 (#43), a etapa 5 lia `var/questions/Moodle_Questionnaire.xml` inteiro, contava as questões para se numerar e reescrevia o arquivo — com mais de um worker, uma questão sumia sem erro.

Limitações atuais: só C (`c_program` fixo), sem categoria de banco de questões, `generalfeedback` vazio, exemplos escolhidos por posição.

## Geração em segundo plano {#geracao-em-segundo-plano}

`POST /api/v1/questions` responde `202` antes de qualquer etapa e enfileira `run_generation` (`generation/job.py`) numa `BackgroundTask` do FastAPI, no mesmo processo da API. O estado do job fica no store, ao lado do estado da questão e independente dele: colunas `runs.job_*` no Postgres, arquivo `.job` no backend local. A decisão e as alternativas estão no [ADR-0017](../adr/0017-resumable-generation-job.md).

```mermaid
stateDiagram-v2
    [*] --> EM_ANDAMENTO: POST /api/v1/questions
    EM_ANDAMENTO --> CONCLUIDO: etapa 5 conclui
    EM_ANDAMENTO --> FALHOU: uma etapa levanta erro
    EM_ANDAMENTO --> INTERROMPIDO: o servidor reinicia no meio
    INTERROMPIDO --> EM_ANDAMENTO: POST /resume
    CONCLUIDO --> [*]
    FALHOU --> [*]
```

**Persistência.** O registro é gravado antes do `draft.json`, então uma questão nunca aparece sem job. Antes de cada etapa o job grava `EM_ANDAMENTO` com o nome dela (`statement`, `code`, `inputs`, `testcases`, `export`); ao fim, `CONCLUIDO`. É isso que `/generation` lê para a tela de progresso.

**Falhas.** Qualquer exceção numa etapa vira `FALHOU`, com a etapa, um motivo em português para o professor e o nome da classe da exceção. O texto da exceção (saída do compilador, corpo do provedor) fica só no log do servidor, com o `run_id`. Um job `FALHOU` não se retoma: gera-se a questão de novo.

**Interrupção.** Um processo que morre não passa por `except` nenhum: o registro fica `EM_ANDAMENTO`. Na inicialização seguinte, o *lifespan* do app chama `interrupt_running_jobs()`, que passa todo job `EM_ANDAMENTO` para `INTERROMPIDO` mantendo a etapa: naquele instante nenhum job pode estar rodando neste processo. Se o store não responder, o erro vai para o log e o servidor sobe assim mesmo.

**Retomada.** `POST /api/v1/questions/{id}/resume` troca `INTERROMPIDO` por `EM_ANDAMENTO` num *compare-and-set* (dois cliques iniciam um job só) e roda o mesmo `run_generation`. Ele pula as etapas que `meta.json → steps` registra, do início até a primeira lacuna, e roda dali em diante. Nenhuma chamada ao modelo já registrada se repete; os testes conferem isso contando as chamadas ao `FakeLLM`. A retomada é sempre pedida por uma pessoa, nunca automática na inicialização.

!!! warning "Limitações"
    - A varredura na inicialização supõe **um processo só** da API, que é o que roda em produção. Um segundo processo subindo marcaria como interrompidos os jobs vivos do primeiro.
    - Uma etapa que gravou o artefato e morreu antes de se registrar em `meta.json` roda de novo na retomada: no máximo uma chamada repetida.
    - A exportação acrescenta ao arquivo XML compartilhado antes de concluir a execução; uma queda entre as duas coisas exporta a questão duas vezes. O G1-8 remove o arquivo.
    - Execuções anteriores a esta mudança não têm registro de job. Uma inacabada aparece como `INTERROMPIDO` e pode ser retomada; uma que tinha `failure.json` aparece como `FALHOU`.

## Cliente do modelo

`llm/client.py` é o único lugar que fala com um provedor:

```python
class LLMClient(Protocol):
    def complete(self, *, system: str, user: str, temperature: float = 0.7) -> str: ...
```

`OpenAIChatClient` faz `POST {CODEEXPERT_LLM_BASE_URL}/chat/completions` com `model`, uma mensagem `system`, uma `user` e `temperature`. A resposta é reduzida a `choices[0].message.content.strip()`; outro formato vira `LLMError` (`502`).

```mermaid
sequenceDiagram
    autonumber
    participant E as etapa
    participant C as OpenAIChatClient
    participant P as provedor

    E->>C: complete(system, user)
    C->>P: POST /chat/completions
    alt 200
        P-->>C: choices[0].message.content
        C-->>E: texto
    else 408, 409, 429, 5xx ou erro de rede
        P-->>C: erro
        Note over C: espera 1 s, 2 s, 4 s… entre tentativas,<br/>até CODEEXPERT_LLM_MAX_RETRIES (padrão 3)
        C-->>E: LLMError → 502
    else 401, 403, 404, 422…
        P-->>C: erro
        C-->>E: LLMError imediato → 502
    end
```

Com os padrões (3 tentativas, 60 s de timeout), uma etapa pode levar cerca de três minutos no pior caso. Uma questão completa faz **três** chamadas ao modelo. Não há cache, contagem de tokens nem teto de gasto.

**Trocar de provedor:** qualquer serviço com `/chat/completions` no formato OpenAI funciona só com `.env`. Um modelo local é a forma barata de exercitar o formato das respostas ao mexer em prompts:

```bash title=".env — Ollama local"
CODEEXPERT_LLM_BASE_URL=http://127.0.0.1:11434/v1
CODEEXPERT_LLM_MODEL=qwen2.5-coder
CODEEXPERT_LLM_API_KEY=nao-usada-mas-obrigatoria
```

Para um provedor com outra API, escreve-se uma classe que satisfaça `LLMClient` e ela é escolhida em `get_llm_client()`.

## Prompts

Todos em `generation/prompts.py`. O enunciado é pedido em português; código e entradas, em inglês.

| Prompt pede | Parser que depende disso |
| --- | --- |
| Layout em `[blocos]` | `statement.py::parse_statement` |
| Array JSON de strings | `inputs.py::parse_inputs` |
| C puro, sem markdown | `codegen.py::strip_code_fences` |

Mudar a forma do que o prompt pede exige mudar o parser correspondente — os dois falham em silêncio. Todo prompt alterado exige incrementar a entrada em `PROMPT_VERSIONS` no mesmo commit (a versão vai para o `meta.json`) e revisão humana. Regras completas em [`.agents/rules/prompts.md`](https://github.com/TUTOR-IA-Makers/tutor-ia/blob/main/.agents/rules/prompts.md).

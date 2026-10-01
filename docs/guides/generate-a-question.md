# Gerar uma questão

<p class="lead">Duas formas de usar a API hoje: uma chamada que faz tudo, ou as cinco etapas uma a uma, editando os arquivos intermediários entre elas. As duas executam o mesmo código.</p>

<span class="ce-badge ce-status--done">Implementado</span> Tudo nesta página funciona em `main`, via API local. A interface web para o professor está <span class="ce-badge ce-status--planned">Planejada</span> ([Roadmap](../product/roadmap.md#interface-do-professor)).

## Antes de começar

```bash
make run                                          # em um terminal
curl "http://127.0.0.1:8000/config?verify=true"   # em outro
```

`api_key_configured` e `provider_reachable` devem ser `true`. Falhar aqui custa um segundo; falhar no meio do pipeline custa trinta.

## Uma chamada: `POST /create_question`

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{
        "statement_request": {
          "difficulty": "facil",
          "can_has_if": true,
          "can_has_else": true,
          "can_has_repetition": true,
          "can_has_function": false,
          "can_has_matrix": false
        },
        "qty": 5
      }'
```

Todos os campos têm padrão; `{"statement_request": {}, "qty": 3}` já funciona. Use `qty` pequeno para testar e 10 a 20 para uma questão de verdade. Significado de cada campo em [API](../reference/api.md#post-gen_statement).

```mermaid
sequenceDiagram
    participant C as curl
    participant A as API
    participant W as var/runs/&lt;run_id&gt;
    participant M as Modelo
    participant G as gcc

    C->>A: POST /create_question
    A->>W: cria o diretório da execução
    A->>M: enunciado
    A->>W: statement.json
    A->>M: solução em C
    A->>W: solution.c
    A->>M: entradas de teste
    A->>W: inputs.json
    A->>G: compila e executa cada entrada
    G-->>A: stdout real
    A->>W: testcases.json
    A->>A: renderiza o XML
    A-->>C: 200 com run_id e tudo o que foi gerado
```

A resposta traz o `run_id`, o enunciado, o código, as entradas, os casos de teste e o caminho do XML. Guarde o `run_id`: é com ele que você encontra os arquivos e retoma o trabalho.

## Etapa por etapa

Use quando quiser revisar ou corrigir um resultado antes de seguir: ajustar o enunciado antes de gerar a solução, trocar a solução pela sua, acrescentar casos-limite.

```bash
API=http://127.0.0.1:8000
H="Content-Type: application/json"

# 1. Enunciado — cria a execução e devolve o run_id
RUN=$(curl -sX POST $API/gen_statement -H "$H" \
  -d '{"difficulty": "facil", "can_has_repetition": true}' | jq -r .run_id)
$EDITOR var/runs/$RUN/statement.json        # opcional: ajustar título ou texto

# 2. Solução em C
curl -X POST $API/gen_code -H "$H" -d "{\"run_id\": \"$RUN\"}"
$EDITOR var/runs/$RUN/solution.c            # opcional: usar a sua solução

# 3. Entradas de teste
curl -X POST $API/gen_inputs -H "$H" -d "{\"run_id\": \"$RUN\", \"qty\": 8}"
$EDITOR var/runs/$RUN/inputs.json           # opcional: acrescentar zero, negativo, vazio, máximo

# 4. Casos de teste — compila e executa; não chama o modelo
curl -X POST $API/gen_testcases -H "$H" -d "{\"run_id\": \"$RUN\"}"

# 5. Exportar para o XML
curl -X POST $API/export_moodle_xml_question -H "$H" -d "{\"run_id\": \"$RUN\"}"
```

- Chamar uma etapa antes da anterior devolve `409`, dizendo qual arquivo falta e qual endpoint o produz.
- Se você escrever a própria solução em `solution.c`, as saídas esperadas passam a refletir o seu código — dá para usar o serviço só como gerador de casos de teste.
- Entradas precisam seguir exatamente o formato que os `scanf` da solução leem. Números separados por espaço quando o programa espera um por linha geram saídas vazias, sem erro.

!!! warning "Exportar duas vezes duplica a questão"
    O XML acumula. Chamar a etapa 5 duas vezes para o mesmo `run_id` deixa a questão duas vezes no arquivo. Para começar um questionário novo: `rm var/questions/Moodle_Questionnaire.xml`.

## Retomar depois de uma falha {#retomar-depois-de-uma-falha}

Uma falha não apaga o que já foi gerado. O erro de `/create_question` traz o `run_id` da execução:

```json
{ "detail": "Compilation failed:\nsolution.c:5:5: error: ...", "run_id": "20260918T221305Z-1a2b3c4d" }
```

```bash
RUN=20260918T221305Z-1a2b3c4d
ls var/runs/$RUN/                          # até onde chegou (ou ls var/runs/ | tail -3)

$EDITOR var/runs/$RUN/solution.c           # corrigir o que falhou
curl -X POST http://127.0.0.1:8000/gen_testcases \
  -H "Content-Type: application/json" -d "{\"run_id\": \"$RUN\"}"
```

As etapas 1 a 3 são as que custam chamadas ao modelo; retomar da 4 não as repete.

!!! info "O serviço verifica que o arquivo existe, não que faz sentido"
    Se você editar `solution.c` e rodar a etapa 4 de novo, os casos de teste passam a refletir o código novo, mas o enunciado continua descrevendo o problema antigo. Refaça as etapas seguintes à que você editou.

## Conferir o resultado

Um `200` não garante uma boa questão. Antes de importar:

```bash
cat var/runs/$RUN/meta.json | jq .constraints              # o que foi pedido
grep -nE "\b(for|while|do)\b" var/runs/$RUN/solution.c     # usou repetição? (acha comentários também)
grep -nE "rand\(|srand\(|time\(NULL\)" var/runs/$RUN/solution.c   # é determinística?
jq '[.testcases[] | select(.output | test("^\\s*$"))] | length' var/runs/$RUN/testcases.json   # saídas vazias
```

- [ ] A solução respeita as restrições pedidas. **Hoje nada verifica isso** — <span class="ce-badge ce-status--planned">Planejado</span> no G2 ([Roadmap](../product/roadmap.md#verificacao-de-escopo)).
- [ ] A solução é determinística. Com `rand()` ou `time(NULL)`, nenhuma submissão passa, nem a própria resposta.
- [ ] Nenhuma saída esperada está vazia.
- [ ] O enunciado descreve a entrada no formato que a solução lê.

**Próximo passo:** [Importar no Moodle](import-into-moodle.md).

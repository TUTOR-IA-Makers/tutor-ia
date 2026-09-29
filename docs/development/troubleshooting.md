# Resolução de problemas

<p class="lead">Os sintomas mais frequentes, com o diagnóstico e a correção de cada um. Os que aparecem primeiro são os que falham em silêncio — esses são os caros.</p>

## Diagnóstico rápido

```bash
make check                              # ambiente, formatação, lint, testes
curl -s localhost:8000/health           # o servidor está de pé?
curl -s localhost:8000/config           # está configurado?
gcc --version                           # o compilador existe?
ls var/runs/ | tail -3                  # as execuções mais recentes
```

---

## O servidor não arranca

### `ModuleNotFoundError: codeexpert`

O pacote não está instalado no ambiente ativo.

```bash
make setup
```

Ou, sem `make`: `pip install -e ".[dev,docs]"` dentro do ambiente virtual. O modo editável é o que faz as alterações em `src/` terem efeito sem reinstalar.

### `ModuleNotFoundError` de uma dependência

O ambiente foi criado antes de uma dependência nova entrar no `pyproject.toml`. Voltar a correr `make setup` é seguro e resolve.

### A porta 8000 já está ocupada

`make docs` serve a documentação na 8001, precisamente para não colidir. Se for outro processo:

```bash
.venv/bin/uvicorn codeexpert.api.app:app --reload --port 8010
```

---

## `503` em todas as etapas de geração

```json
{ "detail": "CODEEXPERT_LLM_API_KEY is not set. Copy .env.example to .env and fill it in..." }
```

Falta a chave. Confirme em três sítios, por esta ordem:

```bash
curl -s localhost:8000/config | jq .api_key_configured   # o que o servidor vê
grep CODEEXPERT_LLM_API_KEY .env                         # o que o ficheiro tem
echo $CODEEXPERT_LLM_API_KEY                             # o que o shell exporta
```

!!! warning "Uma variável mal escrita não dá erro"
    `CODEEXPERT_LLM_APIKEY` ou `CODEEXPERT_LLM_MODELO` são ignoradas em silêncio. `GET /config` mostra os valores efetivamente em uso — é a forma de confirmar que o que escreveu chegou lá.

Depois de editar o `.env`, chame `GET /config` para recarregar sem reiniciar o processo.

---

## `502` do fornecedor

```json
{ "detail": "Call to the model provider failed — HTTP 401: ..." }
```

| Estado no `detail` | Causa provável |
| --- | --- |
| `401` | Chave errada ou revogada. Não é repetido, de propósito |
| `429` | Limite de utilização. Já foi repetido três vezes antes de chegar aqui |
| `404` | `CODEEXPERT_LLM_MODEL` não existe nesse fornecedor |
| `request failed` | Rede, DNS ou `CODEEXPERT_LLM_BASE_URL` errado |

Para verificar a chave sem gastar uma geração:

```bash
curl -s "localhost:8000/config?verify=true" | jq '.provider_reachable, .status'
```

---

## Falha de compilação

```json
{ "detail": "Compilation failed:\nsolution.c:5:5: error: ..." }
```

O modelo gerou código C inválido. Não é raro; costuma resolver-se regerando.

```bash
RUN=<o run_id>
$EDITOR var/runs/$RUN/solution.c                    # corrigir à mão
curl -X POST localhost:8000/gen_testcases \
  -H "Content-Type: application/json" -d "{\"run_id\": \"$RUN\"}"
```

Retomar só esta etapa poupa as três chamadas ao modelo já pagas.

!!! info "As cercas de markdown já são removidas"
    A causa histórica mais comum — o modelo envolver o código em ` ```c ` — é tratada antes de gravar o ficheiro. Se voltar a vê-la, é um caso que `strip_code_fences` não cobre, e vale um teste novo.

### `gcc` não encontrado

```json
{ "detail": "'gcc' was not found on PATH. Install a C compiler to generate test cases." }
```

| Sistema | Instalar |
| --- | --- |
| Debian/Ubuntu | `sudo apt install build-essential` |
| Fedora | `sudo dnf install gcc` |
| macOS | `xcode-select --install` |
| Windows | Use WSL |

!!! warning "`make check` pode estar verde numa máquina onde a aplicação não funciona"
    A suite ignora automaticamente os testes marcados com `@requires_gcc`. Sem compilador, os testes que exercitam a única etapa que produz verdade ficam por correr — o CI corre-os sempre.

---

## Saídas vazias nos casos de teste {#saidas-vazias-nos-casos-de-teste}

```json
{ "testcases": [{ "input": "10 20 30", "output": "" }] }
```

!!! danger "Não há erro nenhum"
    O programa correu, não conseguiu ler o que esperava e terminou sem imprimir nada. A questão é exportada com saídas esperadas vazias — e só se descobre quando um aluno submete.

### Causa

O formato das entradas geradas não corresponde ao que os `scanf` da solução leem. O caso mais comum: números separados por espaços quando o programa espera um por linha, ou falta de um sentinela de fim.

### Diagnóstico

```bash
RUN=<o run_id>
grep -n "scanf" var/runs/$RUN/solution.c
head -c 200 var/runs/$RUN/inputs.json

# Reproduzir à mão
cd var/runs/$RUN && printf '3\n10\n20\n30\n' | ./solution
```

### Correção

Editar `inputs.json` para o formato certo e repetir só a etapa 4:

```bash
$EDITOR var/runs/$RUN/inputs.json
curl -X POST localhost:8000/gen_testcases \
  -H "Content-Type: application/json" -d "{\"run_id\": \"$RUN\"}"
```

---

## O pedido demora muito, ou uma entrada não termina

```json
{ "detail": "Input 2 of 5 did not terminate within the time limit. The generated solution probably loops forever on it..." }
```

O programa entrou em ciclo infinito com essa entrada — quase sempre porque falta o valor sentinela que a condição de paragem espera.

```bash
RUN=<o run_id>
$EDITOR var/runs/$RUN/inputs.json     # acrescentar o sentinela, ou remover a entrada
```

O limite é `CODEEXPERT_RUN_TIMEOUT_SECONDS` (5 s por omissão) por entrada. Aumentá-lo raramente é a resposta certa: um exercício introdutório que precisa de mais de cinco segundos tem outro problema.

!!! info "Antes isto não dava erro nenhum"
    Sem limite de tempo, o pedido ficava aberto para sempre e o processo ficava bloqueado. Há um teste que gera um `for(;;)` e confirma que a etapa falha em vez de pendurar.

---

## A questão não respeita as restrições pedidas

Pediu uma questão sem repetição e a solução tem um `for`. **O serviço não verifica isto** — nem o deteta, nem avisa.

```bash
RUN=<o run_id>
cat var/runs/$RUN/meta.json | jq .constraints    # o que foi pedido
grep -nE "\b(for|while|do)\b" var/runs/$RUN/solution.c
```

Correções possíveis, por ordem de esforço: regerar; editar a solução à mão e repetir a etapa 4; ou tornar a restrição mais explícita no enunciado antes de gerar o código.

!!! danger "Esta é a lacuna central do protótipo"
    É o requisito FEAT-024 e está na lista "nunca cortar" do MVP. A verificação determinística das estruturas usadas é a alteração de maior valor que este repositório pode receber — ver [análise de lacunas](../product/gap-analysis.md#as-restricoes-nao-sao-verificadas).

---

## A dificuldade parece ignorada

`difficulty` acrescenta uma linha ao prompt e nada mais. Não há calibração, nem verificação, nem correlação garantida entre o valor pedido e a complexidade do resultado.

!!! tip "Combinar restrições funciona melhor do que subir a dificuldade"
    `can_has_function: true` com `can_has_matrix: true` produz consistentemente exercícios mais difíceis do que qualquer valor de `difficulty` sozinho.

---

## O XML tem questões a mais

Exportações **acumulam**, de propósito. Um `create_question` repetido cinco vezes deixa cinco questões no ficheiro.

```bash
grep -c '<question type="coderunner"' var/questions/Moodle_Questionnaire.xml
rm var/questions/Moodle_Questionnaire.xml     # começar de novo
```

---

## O Moodle recusa a importação

| Sintoma | Causa |
| --- | --- |
| "Tipo de questão desconhecido" | O plugin CodeRunner não está instalado no Moodle de destino |
| Erro de XML mal formado | Raro desde que entradas e saídas passaram a ser escapadas. Se acontecer, guarde o ficheiro e abra uma *issue* — é um bug |
| Questões importadas sem casos de teste | `testcases.json` estava vazio na exportação |

Validar o ficheiro antes de o levar ao Moodle:

```bash
python -c "import xml.etree.ElementTree as ET; ET.parse('var/questions/Moodle_Questionnaire.xml'); print('XML válido')"
```

---

## Todas as submissões dos alunos falham

Quase sempre uma de duas coisas:

1. **A solução não é determinística.** `rand()`, `time(NULL)` ou impressão de ponteiros fazem a saída variar entre a geração e a execução do aluno. Nem a resposta de referência passa.
2. **As saídas esperadas estão vazias**, pelo motivo descrito acima.

```bash
grep -nE "rand\(|srand\(|time\(NULL\)|clock\(" var/runs/$RUN/solution.c
```

---

## Resultados incoerentes entre etapas

O enunciado fala de uma coisa e a solução resolve outra. Acontece quando um ficheiro intermédio foi editado e as etapas seguintes não foram repetidas.

A verificação entre etapas é de **existência**, não de coerência: o serviço confirma que o ficheiro existe, nunca que faz sentido. Ver [Workspace de execução](../architecture/cache-and-state.md#verificacao-de-existencia-nao-de-coerencia).

A correção é repetir as etapas a jusante da que foi editada.

---

## Alterações à configuração sem efeito

As definições são lidas uma vez e mantidas em cache no processo. Chamar `GET /config` **invalida essa cache** — mas a resposta dessa mesma chamada ainda traz os valores antigos, porque são lidos antes de o *handler* correr:

```bash
$EDITOR .env
curl -s localhost:8000/config | jq .model     # ainda o valor antigo
curl -s localhost:8000/config | jq .model     # já o novo
```

!!! tip "Com `make run` isto não acontece"
    Qualquer alteração a um ficheiro `.py` reinicia o processo, o que relê tudo. O caso acima só aparece quando se corre o servidor sem recarga automática.

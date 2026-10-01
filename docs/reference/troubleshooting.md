# Problemas comuns

<p class="lead">Sintoma, causa e correção. Os casos que respondem <code>200</code> com resultado errado são os mais caros, porque ninguém percebe até a questão chegar ao aluno.</p>

## Diagnóstico rápido

```bash
make check                                 # ambiente, lint, testes, docs
curl -s localhost:8000/health              # o servidor está no ar?
curl -s "localhost:8000/config?verify=true"   # configurado? a chave funciona?
gcc --version                              # compilador presente?
ls var/runs/ | tail -3                     # execuções mais recentes
```

## Ambiente

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `make: ./scripts/dev-setup.sh: Permission denied` (também em `check`, `fix`, `task`) | Scripts versionados sem permissão de execução | `chmod +x scripts/*.sh` |
| `ModuleNotFoundError: codeexpert` ou de uma dependência | Pacote não instalado no ambiente, ou dependência nova no `pyproject.toml` | `make setup` |
| `make run`: porta 8000 ocupada | Outro processo | `.venv/bin/uvicorn codeexpert.api.app:app --reload --port 8010` |
| `make check` verde, mas a etapa 4 falha | Sem `gcc`, os testes `@requires_gcc` são pulados | Instale o `gcc` (ver [Primeiro dia](../onboarding/index.md#pre-requisitos)) |
| `make task` avisa que não conseguiu atualizar `main` | `main` local divergiu do remoto | Resolva `main` e rode de novo; a branch foi criada a partir da `main` local |

## Configuração e provedor

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `503` em todas as etapas de geração | `CODEEXPERT_LLM_API_KEY` não definida | Preencha o `.env`; confira com `GET /config` |
| Mudança no `.env` sem efeito | Configuração em cache no processo | Chame `GET /config` duas vezes, ou reinicie |
| Variável ignorada | Nome errado (ex.: `CODEEXPERT_LLM_MODELO`) é aceito em silêncio | Confira os valores em uso com `GET /config` |
| `502 … HTTP 401` | Chave errada ou revogada (não há nova tentativa) | Troque a chave |
| `502 … HTTP 404` | `CODEEXPERT_LLM_MODEL` não existe nesse provedor | Corrija o modelo |
| `502 … HTTP 429` | Limite do provedor, já após as tentativas | Espere ou aumente o limite no provedor |
| `502 … request failed` | Rede, DNS ou `CODEEXPERT_LLM_BASE_URL` errado | Confira a URL |

## Geração

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `422 Compilation failed: …` | O modelo gerou C inválido | Regere, ou corrija `solution.c` e rode só `/gen_testcases` |
| `422 Input N of M did not terminate…` | Loop infinito com aquela entrada, quase sempre falta o valor sentinela | Corrija ou remova a entrada em `inputs.json` e rode `/gen_testcases`. Aumentar o timeout raramente é a resposta |
| `422 'gcc' was not found on PATH` | Sem compilador | Instale o `gcc` |
| `409 '…' not found in run …` | Etapa chamada antes da anterior | Rode o endpoint indicado na mensagem |
| `404 Run '…' not found` | `run_id` errado ou `var/` foi limpo | `ls var/runs/`, ou comece com `/gen_statement` |
| `422` em `/create_question` com `input_request.run_id` | `input_request` exige `run_id` hoje | Use `qty` no nível de cima |

## Resultado errado sem erro

| Sintoma | Causa | Correção |
| --- | --- | --- |
| Saídas esperadas vazias | Entradas num formato diferente do que os `scanf` leem (ex.: números separados por espaço, programa espera um por linha) | Compare os `scanf` de `solution.c` com `inputs.json`, rode `var/runs/$RUN/solution` à mão com uma entrada, corrija `inputs.json` e rode `/gen_testcases` |
| A solução usa estrutura proibida | Nada verifica as restrições (G2, planejado) | Regere, ou edite a solução e rode `/gen_testcases` |
| Nenhuma submissão passa no Moodle, nem a resposta | Solução não determinística (`rand()`, `time(NULL)`) ou saídas vazias | Procure `rand(`, `srand(` ou `time(NULL)` em `solution.c`; descarte ou reescreva |
| Enunciado com título estranho | O modelo ignorou o formato em blocos | Edite `statement.json` ou regere |
| A dificuldade parece ignorada | `difficulty` só acrescenta uma linha ao prompt | Combine restrições (`can_has_function` + `can_has_matrix`) para exercícios mais difíceis |
| Enunciado e solução falam de coisas diferentes | Um arquivo intermediário foi editado e as etapas seguintes não foram refeitas | Refaça as etapas a partir da editada |
| XML com questões demais | Exportações acumulam | `rm var/questions/Moodle_Questionnaire.xml` e exporte de novo |

## Moodle

| Sintoma | Causa |
| --- | --- |
| "Tipo de questão desconhecido" | Plugin CodeRunner não instalado |
| XML malformado | Não deveria acontecer. Guarde o arquivo e abra uma issue de Bug |
| Questão sem casos de teste | `testcases.json` estava vazio na exportação |

## Documentação

| Sintoma | Causa | Correção |
| --- | --- | --- |
| `make check` verde, mas o workflow Documentation falha | O gate roda o `mkdocs` com `--quiet`, que esconde os avisos | Rode `.venv/bin/mkdocs build --strict` e corrija os avisos |
| `The following pages exist in the docs directory, but are not included in the "nav"` | Página nova fora do `mkdocs.yml` | Adicione ao `nav` |
| Job `deploy` falha em `configure-pages` | GitHub Pages não habilitado | Ver [Documentação § Publicação](docs.md#publicacao) |

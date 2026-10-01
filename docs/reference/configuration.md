# Comandos e configuração

<p class="lead">Todos os comandos do <code>Makefile</code> e todas as variáveis de ambiente que a aplicação lê.</p>

## Comandos

O `Makefile` só chama os scripts em `scripts/`, então pessoas, agentes e CI rodam exatamente a mesma coisa. `make` sem argumento lista os alvos.

| Comando | O que faz | Script |
| --- | --- | --- |
| `make setup` | Cria `.venv`, instala o pacote editável com extras `dev` e `docs`, copia `.env.example` para `.env` se não existir, avisa se falta `gcc`. Pode rodar de novo | `scripts/dev-setup.sh` |
| `make run` | API com recarga automática em <http://127.0.0.1:8000> | — |
| `make check` | **O gate.** Mesmo script do CI — ver [Harness](harness.md#o-gate) | `scripts/check.sh` |
| `make check-fast` | O gate sem o build da documentação | `scripts/check.sh --fast` |
| `make fix` | `ruff check --fix` e `ruff format` em `src`, `tests` e `main.py` | `scripts/fix.sh` |
| `make test` | `pytest` com cobertura | — |
| `make docs` | Este site em <http://127.0.0.1:8001>, com recarga | — |
| `make task T=feat I=42 S=slug` | Cria a branch `feat/42-slug` a partir de `main` atualizada e o arquivo `.agents/tasks/42-slug.md` | `scripts/new-task.sh` |
| `make clean` | Apaga `var/`, `.dist/`, caches de ferramentas e `__pycache__` | — |

Outras formas de iniciar a API, sem recarga: `.venv/bin/codeexpert`, `python -m codeexpert` ou `python main.py` — as três escutam em `0.0.0.0:8000`.

## Variáveis de ambiente {#variaveis-de-ambiente}

Lidas por `Settings` em `src/codeexpert/settings.py`, com prefixo `CODEEXPERT_`. Em desenvolvimento vêm do `.env` (criado por `make setup`); variáveis do ambiente real têm precedência sobre ele, que é como CI e containers configuram o serviço.

| Variável | Padrão | O que controla |
| --- | --- | --- |
| `CODEEXPERT_LLM_API_KEY` | *(vazia)* | Chave do provedor. Sem ela o servidor sobe, mas as etapas 1–3 respondem `503` |
| `CODEEXPERT_LLM_MODEL` | `gpt-4o-mini` | Campo `model` de cada chamada |
| `CODEEXPERT_LLM_BASE_URL` | `https://api.openai.com/v1` | Provedor. Qualquer API `/chat/completions` compatível com OpenAI |
| `CODEEXPERT_LLM_TIMEOUT_SECONDS` | `60` | Timeout por chamada ao modelo |
| `CODEEXPERT_LLM_MAX_RETRIES` | `3` | Tentativas em erros transitórios (1 a 10) |
| `CODEEXPERT_WORKSPACE_ROOT` | `var/runs` | Diretórios das execuções |
| `CODEEXPERT_QUESTIONS_DIR` | `var/questions` | Onde o XML é escrito |
| `CODEEXPERT_COMPILE_TIMEOUT_SECONDS` | `20` | Timeout da compilação |
| `CODEEXPERT_RUN_TIMEOUT_SECONDS` | `5` | Timeout de **cada** execução do binário |
| `CODEEXPERT_RUN_MAX_OUTPUT_BYTES` | `65536` | Saída capturada por execução; o excedente é truncado |

Caminhos relativos são resolvidos a partir do diretório onde o servidor foi iniciado.

!!! warning "Nome errado é ignorado sem aviso"
    Variáveis desconhecidas são aceitas em silêncio: `CODEEXPERT_LLM_MODELO=...` não faz nada. Confira o que está em uso com `curl http://127.0.0.1:8000/config`.

**Trocar de provedor** (Ollama, vLLM, LM Studio): mude `CODEEXPERT_LLM_BASE_URL` e `CODEEXPERT_LLM_MODEL`; a chave continua obrigatória mesmo que o provedor a ignore. Exemplo em [Pipeline § Cliente do modelo](../architecture/pipeline.md#cliente-do-modelo).

**Aplicar mudanças no `.env`** sem reiniciar: chame `GET /config` duas vezes — a segunda resposta já mostra os valores novos. Com `make run`, editar qualquer `.py` também reinicia o processo.

## Segredos

- `.env` está no `.gitignore`; `.env.example` só tem valores falsos (`sk-XXXX…`).
- A chave é um `SecretStr`: não aparece em `repr`, logs nem em `GET /config`. Um teste garante isso.
- `make check` recusa arquivos versionados com formato de chave (`sk-…` longo, `AIza…`, chave privada PEM) e qualquer coisa versionada em `var/`, `cache/`, `Questions/`, `.env` ou `config/LLM_Config.txt`.
- **Se uma chave vazar:** revogue e gere outra primeiro; depois reescreva o histórico.

Até 30/11 a chave de produção vai para o Secret Manager (G0-3, <span class="ce-badge ce-status--planned">Planejado</span>).

## Portas e caminhos

| O quê | Onde |
| --- | --- |
| API | `127.0.0.1:8000` (`make run`) |
| Documentação local | `127.0.0.1:8001` (`make docs`) |
| Build da documentação | `.dist/site/` |
| Artefatos de execução | `var/runs/<run_id>/` |
| XML exportado | `var/questions/Moodle_Questionnaire.xml` |

`var/` e `.dist/` são ignorados pelo Git. Se `git status` ficar sujo depois de rodar a aplicação, é bug.

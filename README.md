# CodeExpert

Serviço FastAPI que gera exercícios de programação em C — enunciado, solução de
referência, entradas e casos de teste — e exporta como XML para o Moodle
CodeRunner.

As saídas esperadas não são geradas por um modelo de linguagem: a solução é
compilada com `gcc` e executada com cada entrada, e o `stdout` real torna-se a
saída esperada.

> **Protótipo.** Este repositório implementa o EPIC-017 (geração de questões com
> IA), que está na Onda 3 e fora do MVP da plataforma. Não tem autenticação, base
> de dados nem sandbox.

| Se é a primeira vez aqui | Leia |
| --- | --- |
| O que estamos a construir e porquê | **[docs/onboarding/](docs/onboarding/index.md)** |
| Como trabalhamos — pessoas e agentes | **[AGENTS.md](AGENTS.md)**, resumido em [docs/contributing/](docs/contributing/index.md) |
| O que há em `.agents/` | [docs/contributing/harness.md](docs/contributing/harness.md) |
| Porque é que o código está assim | [docs/adr/](docs/adr/index.md) |

## Arranque rápido

Precisa de Python 3.12+, `gcc` no `PATH` e uma chave de API de um fornecedor
compatível com OpenAI. No Windows, use WSL.

```bash
make setup          # .venv, dependências, .env
$EDITOR .env        # preencha CODEEXPERT_LLM_API_KEY
make check          # o portão: formatação, lint, testes, docs
make run            # http://127.0.0.1:8000 → Swagger UI
```

Gerar uma questão completa:

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "facil", "can_has_repetition": true}, "qty": 5}'
```

O XML fica em `var/questions/Moodle_Questionnaire.xml`. Os artefactos de cada
execução — enunciado, solução, entradas, casos de teste e o `meta.json` com o
modelo e a versão de prompt que os produziram — ficam em `var/runs/<run_id>/`.

> **Reveja antes de usar com alunos.** O protótipo ainda não verifica se a solução
> gerada respeitou as restrições pedidas. Ver [análise de
> lacunas](docs/product/gap-analysis.md).

## Comandos

| Comando | O que faz |
| --- | --- |
| `make setup` | Ambiente virtual, dependências e `.env` — uma vez só |
| `make run` | API com recarga automática |
| `make check` | **O portão.** O mesmo que o CI corre |
| `make fix` | Aplica formatação e correções automáticas de lint |
| `make test` | Testes com cobertura |
| `make docs` | Documentação em <http://127.0.0.1:8001> |
| `make task T=feat I=42 S=slug` | Cria a branch e o ficheiro de tarefa |

## Estrutura

```text
src/codeexpert/      a aplicação (ver docs/onboarding/ § 5)
tests/               unit/ e integration/, ambos sem rede
docs/                site MkDocs em português; docs/adr/ em inglês
.agents/             o harness: regras, workflows, ficheiros de tarefa
scripts/             check.sh é o portão; o CI corre o mesmo ficheiro
```

## Documentação

```bash
make docs
```

O site é publicado por `.github/workflows/docs.yml` em cada push para `main`.
Em **Settings → Pages → Source**, selecione **GitHub Actions**. O resultado fica
em <https://hugorosa29.github.io/coderunner_v2/>.

## Licença

MIT — ver [LICENSE](LICENSE).

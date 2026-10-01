# CodeExpert

Serviço FastAPI que gera exercícios de programação em C — enunciado, solução de
referência, entradas e casos de teste — e exporta como XML para o Moodle
CodeRunner.

As saídas esperadas não vêm de um modelo de linguagem: a solução é compilada com
`gcc` e executada com cada entrada, e o `stdout` real vira a saída esperada.

> **Estado em 30/09.** Hoje é uma API local, sem interface, banco de dados nem
> autenticação. Até 30/11 a equipe vai transformá-la num produto usável por um
> professor — ver o [roadmap](docs/product/roadmap.md).

**Documentação:** <https://tutor-ia-makers.github.io/tutor-ia/> (ou `make docs`
para ler localmente).

| Primeira vez aqui? | Leia |
| --- | --- |
| Como instalar, rodar e entender o projeto | [Primeiro dia](docs/onboarding/index.md) |
| Como fazer uma tarefa, da issue ao PR | [Da issue ao PR](docs/guides/first-task.md) e [AGENTS.md](AGENTS.md) |
| Como o sistema funciona | [Arquitetura](docs/architecture/index.md) |
| O que já existe e o que vem | [Roadmap até 30/11](docs/product/roadmap.md) |

## Início rápido

Precisa de Python 3.12+, `gcc` no `PATH` e uma chave de API de um provedor
compatível com OpenAI. No Windows, use WSL.

```bash
git clone https://github.com/TUTOR-IA-Makers/tutor-ia.git && cd tutor-ia
chmod +x scripts/*.sh   # os scripts estão versionados sem permissão de execução
make setup              # .venv, dependências, .env
$EDITOR .env            # preencha CODEEXPERT_LLM_API_KEY
make check              # o gate: formatação, lint, testes, docs
make run                # http://127.0.0.1:8000 → Swagger UI
```

Gerar uma questão completa:

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "facil", "can_has_repetition": true}, "qty": 5}'
```

O XML fica em `var/questions/Moodle_Questionnaire.xml`; os arquivos de cada
execução, incluindo o `meta.json` com o modelo e a versão de prompt usados, em
`var/runs/<run_id>/`.

> **Revise antes de usar com alunos.** Ainda nada verifica se a solução gerada
> respeita as restrições pedidas.

## Comandos

| Comando | O que faz |
| --- | --- |
| `make setup` | Ambiente virtual, dependências e `.env` |
| `make run` | API com recarga automática |
| `make check` | **O gate.** O mesmo que o CI roda |
| `make check-fast` | O gate sem o build da documentação |
| `make fix` | Formatação e correções automáticas de lint |
| `make test` | Testes com cobertura |
| `make docs` | Documentação em <http://127.0.0.1:8001> |
| `make task T=feat I=42 S=slug` | Cria a branch e o arquivo de tarefa da issue 42 |

## Estrutura

```text
src/codeexpert/      a aplicação
tests/               unit/ e integration/, ambos sem rede
docs/                site MkDocs em português; docs/adr/ em inglês
.agents/             o harness: regras, workflows, arquivos de tarefa
scripts/             check.sh é o gate; o CI roda o mesmo arquivo
```

## Licença

MIT — ver [LICENSE](LICENSE).

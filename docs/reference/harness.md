# Harness

<p class="lead">O conjunto de arquivos que faz seis pessoas e três agentes de código trabalharem do mesmo jeito: <code>AGENTS.md</code>, o diretório <code>.agents/</code>, o gate, os templates e o CI. Para usá-lo numa tarefa, siga Da issue ao PR; esta página é a consulta.</p>

<span class="ce-badge ce-status--done">Implementado</span> Tudo nesta página existe em `main`. Não confundir com o **harness de avaliação da IA** (golden set, `make lote`, métricas por lote), que é o épico G7, <span class="ce-badge ce-status--planned">Planejado</span> — ver [Roadmap](../product/roadmap.md#harness-de-avaliacao-da-ia).

## Mapa

```text
AGENTS.md                     acordo de trabalho: fonte única, para pessoas e agentes
CLAUDE.md                     ponteiro para AGENTS.md
.github/copilot-instructions.md   ponteiro para AGENTS.md
.agents/
  README.md                   por que o diretório tem esta forma
  rules/                      o que vale sempre — leia a do que você vai tocar
    code.md                   Python
    prompts.md                generation/prompts.py
    docs.md                   docs/
    security.md               execution/, configuração, chaves
    git.md                    branches, commits, PRs
  workflows/                  passo a passo — leia quando for fazer aquilo
    start-task.md             começar uma tarefa
    finish-task.md            fechar uma tarefa
    review.md                 revisar um PR
    add-adr.md                registrar uma decisão
  tasks/
    TEMPLATE.md               modelo do arquivo de tarefa
    README.md                 por que um arquivo por branch
    <issue>-<slug>.md         um por branch ativa, apagado no PR que fecha a issue
scripts/check.sh              o gate
.github/
  workflows/ci.yml            gate + convenções do PR
  workflows/docs.yml          build e publicação deste site
  workflows/deploy.yml        build, push e deploy no Cloud Run após o CI
  CODEOWNERS                  revisores obrigatórios por área
  PULL_REQUEST_TEMPLATE.md
  ISSUE_TEMPLATE/             feature.yml, bug.yml, chore.yml
```

**Um arquivo de instruções.** `AGENTS.md` é lido por todos os agentes; `CLAUDE.md` e o arquivo do Copilot só apontam para ele. Nada em `.agents/` repete o `AGENTS.md` — é o detalhe para onde ele aponta ([ADR-0005](../adr/0005-single-instruction-file-for-agents.md)). Se o `AGENTS.md` contradiz o código, o código vence e o arquivo é o bug: abra um PR contra ele.

## Por que existe

| Problema de antes | O que o harness faz |
| --- | --- |
| Um `progress.md` compartilhado conflitava em todo merge | Status nas issues; contexto de cada branch num arquivo só dela ([ADR-0006](../adr/0006-issues-plus-task-file-per-branch.md)) |
| Cada agente lia um arquivo de instruções diferente | Um `AGENTS.md`; o resto são ponteiros |
| "Na minha máquina passa" | Um gate, rodado igual por pessoas, agentes e CI ([ADR-0008](../adr/0008-one-gate-for-people-agents-and-ci.md)) |
| Decisões perdidas no chat | ADRs numeradas e imutáveis |
| Trabalho de agente que ninguém audita | Trailer `Assisted-by:` nos commits |

## Arquivo de tarefa

`.agents/tasks/<issue>-<slug>.md`, criado por `make task` junto com a branch de mesmo nome. Guarda **Goal**, **Out of scope**, **Constraints**, **Plan**, **Decisions taken along the way** e **Verification**. É apagado no PR que fecha a issue; o que sobrevive vai para a issue (o quê e por quê), para uma ADR (decisões) ou para os commits (como).

Um arquivo de tarefa em `main` significa trabalho em andamento ou branch abandonada.

## O gate {#o-gate}

`make check` roda `scripts/check.sh`. O CI roda o mesmo script.

| # | Passo | Falha quando |
| --- | --- | --- |
| 1 | Artefatos e segredos versionados | Algo em `var/`, `cache/`, `Questions/`, `.env` ou `config/LLM_Config.txt` está no índice do Git |
| 2 | Credenciais na árvore | Algum arquivo versionado contém `sk-` + 32 caracteres, `AIza…` ou chave privada PEM (exceto `*.example`) |
| 3 | Formatação | `ruff format --check src tests main.py` |
| 4 | Lint | `ruff check src tests main.py` |
| 5 | Testes | `pytest -q` |
| 6 | Documentação | `mkdocs build --strict` (pulado se o `mkdocs` não estiver instalado, e com `make check-fast`) |

Falha que "parece não ter nada a ver" continua sendo falha: o CI vai falhar igual.

## CI

| Workflow | Quando | Jobs |
| --- | --- | --- |
| `ci.yml` | Push em `main`, todo PR, manual | **gate**: instala `.[dev,docs]` em Python 3.13 e roda `./scripts/check.sh`, depois mostra a cobertura. **conventions** (só em PR): título em Conventional Commits; corpo com `Closes/Fixes/Resolves/Refs #N` |
| `docs.yml` | Push em `main`, todo PR, manual | **build**: `mkdocs build --strict`. **deploy** (só push em `main`): publica no GitHub Pages — ver [Documentação](docs.md#publicacao) |
| `deploy.yml` | `ci.yml` concluído em `main` | **deploy** (só se o CI passou e foi push): build da imagem, push no Artifact Registry, deploy no Cloud Run, confere `GET /health` — ver [Deploy](../guides/deploy.md) |

## CODEOWNERS e o que um agente não decide sozinho {#o-que-um-agente-nao-decide-sozinho}

O `CODEOWNERS` exige revisor específico nestas áreas. Um agente pode rascunhar, mas precisa de um humano antes — pergunte antes de abrir um PR que vai ficar parado.

| Área | Por quê |
| --- | --- |
| `src/codeexpert/generation/prompts.py` | Prompts são o produto; a mudança altera a saída de formas que os testes não pegam |
| `src/codeexpert/export/templates/` | Um marcador quebrado só aparece quando a importação no Moodle falha |
| `docs/adr/` | Decisões são de pessoas; agentes rascunham, humanos aceitam |
| `AGENTS.md`, `.agents/`, `.github/`, `scripts/` | Um agente não pode ampliar as próprias permissões nem enfraquecer o gate |
| `pyproject.toml` | Cadeia de suprimentos: dependência nova precisa de um humano e de uma frase explicando por que a biblioteca padrão não serve |

| Um agente pode | Um agente não pode |
| --- | --- |
| Escrever código, testes e documentação | Aprovar ou fazer merge de PR |
| Abrir PR e enviar correções | Mudar `AGENTS.md`, workflows ou `CODEOWNERS` sem um humano |
| Rascunhar uma ADR | Aceitar uma ADR |
| Propor mudança de prompt | Mudar prompt sem revisão humana |

## Atribuição

Todo commit feito com ajuda de agente leva o trailer que nomeia o agente, para que `git log` responda "qual ferramenta produziu o que revertemos depois?":

```text
Assisted-by: claude-opus-5
Assisted-by: codex
Assisted-by: antigravity
```

## ADRs {#adrs}

Escreva uma ADR quando a escolha for cara de reverter e alguém no futuro vai perguntar "por que está assim?": direção de dependência, fronteira, módulo novo, biblioteca ou serviço escolhido, regra que restringe todo o código, reversão de decisão anterior. Não para nomes, formatação ou algo que um comentário resolve.

1. Copie `docs/adr/0000-template.md` para `docs/adr/NNNN-titulo-curto.md` com o próximo número livre.
2. Preencha — **Context** e **Alternatives considered** são as partes mais valiosas. **Consequences** inclui os pontos negativos.
3. Adicione ao `nav` do `mkdocs.yml` e ao [índice](../adr/index.md).
4. Status: `Proposed` → `Accepted` → `Superseded by ADR-NNNN`. Uma ADR aceita nunca é editada para mudar a decisão; escreve-se outra que a substitui.

ADRs são em inglês. O plano de 30/11 já prevê pelo menos duas: `ArtifactStore`/Postgres (G0-4) e stack do front-end (G4-1).

## Templates

| Template | Pede |
| --- | --- |
| Issue **Feature** | O problema, o que é verdade quando estiver pronto, épico ou lacuna, fora de escopo, tamanho (S/M/L) |
| Issue **Bug** | O que deveria acontecer, o que acontece, como reproduzir, commit, se falha em silêncio |
| Issue **Chore** | O que fazer, o que isso desbloqueia, confirmação de que não muda comportamento |
| **PR** | O quê e por quê + `Closes #N`, como foi verificado, checklist da Definition of Done, o que merece atenção |

Issue em branco está desabilitada.

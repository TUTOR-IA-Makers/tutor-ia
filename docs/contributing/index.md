# Contribuir

<p class="lead">O acordo de trabalho deste repositório — para pessoas e para agentes — está em <code>AGENTS.md</code>, na raiz. Esta página é a versão de dez minutos: o ciclo de ponta a ponta, o que o portão exige, e onde está cada detalhe.</p>

!!! info "Um ficheiro, não dois"
    Não há um conjunto de regras para humanos e outro para agentes. [`AGENTS.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/AGENTS.md) é a fonte única; `CLAUDE.md` e o ficheiro do Copilot são apenas ponteiros. O porquê está em [ADR-0005](../adr/0005-single-instruction-file-for-agents.md).

## Antes de começar

| Passo | Onde |
| --- | --- |
| Perceber o que estamos a construir e porquê | [Onboarding](../onboarding/index.md) |
| Perceber onde este repositório se situa | [Contexto do produto](../product/index.md) |
| Pôr o ambiente a funcionar | [Instalação](../getting-started/installation.md) |
| Perceber como o código está organizado | [Estrutura do projeto](../development/project-structure.md) |

!!! tip "A pergunta a fazer antes de qualquer alteração"
    Este é um protótipo do EPIC-017, fora do MVP. Confirme que o problema que quer resolver **pertence a este código** e não a um épico anterior.

    Autenticação, base de dados, filas e *sandbox* pertencem à plataforma. Verificação de escopo, rastreabilidade da geração e qualidade das questões pertencem aqui.

## O ciclo

```bash
make setup                            # uma vez
make task T=feat I=42 S=scope-check   # branch + ficheiro de tarefa, a partir da issue 42
#   ... preencher .agents/tasks/42-scope-check.md antes de escrever código ...
make check                            # o portão
git push -u origin feat/42-scope-check
gh pr create --fill                   # o corpo do PR liga a issue; o template faz o resto
```

**O trabalho começa sempre numa issue.** Sem issue, o trabalho não foi combinado com ninguém, e uma equipa de seis pessoas não absorve *diffs* surpresa.

**O ficheiro de tarefa é onde a branch guarda o seu contexto**: o objetivo, o que está fora de escopo, as decisões tomadas pelo caminho. Um ficheiro por branch, pelo que nunca há conflito de *merge* — e é o que permite a outra pessoa, ou a outro agente, retomar a branch amanhã. É apagado no PR que fecha a issue. Ver [ADR-0006](../adr/0006-issues-plus-task-file-per-branch.md).

<div class="grid cards" markdown>

-   :material-robot-outline: **[O harness](harness.md)**

    ---

    O que há em `.agents/`, o que `make task` faz, o que o portão verifica passo a passo, e como instruir um agente de código.

-   :material-source-pull: **[Rever e fechar](review.md)**

    ---

    Ler o próprio *diff*, abrir o PR, e o que procurar no PR de outra pessoa — incluindo em código escrito por um agente.

-   :material-book-open-page-variant-outline: **[Trabalhar na documentação](documentation.md)**

    ---

    Correr o site, a distinção entre planeado e implementado, e os componentes visuais que este site usa.

-   :material-scale-balance: **[Registar uma decisão](../adr/index.md)**

    ---

    Quando uma escolha merece uma ADR, e porque é que as rejeitadas valem metade do documento.

</div>

## Branches e commits

`type/<issue>-<slug>`, a partir de `main`: `feat/42-scope-check`, `fix/57-export-timeout`.

Os tipos aceites pelo `make task` são `feat`, `fix`, `docs`, `refactor`, `chore` e `test`.

[Conventional Commits](https://www.conventionalcommits.org/), com o corpo a explicar **porquê** — o *diff* já mostra o quê:

```text
fix: aplicar timeout na execucao dos casos de teste

Sem timeout, um programa gerado com ciclo infinito bloqueia o processo
indefinidamente e o pedido nunca termina. Cinco segundos cobre com folga
qualquer exercicio introdutorio.

Closes #57

Assisted-by: claude-opus-5
```

**Um commit, uma alteração.** Uma passagem de formatação é um commit só dela, nunca misturada com comportamento.

Para acompanhar a `main`, **rebase em vez de *merge***, para a branch continuar a ser uma história legível:

```bash
git fetch origin && git rebase origin/main
```

!!! danger "A branch `docs` e a pasta `docs/` colidem"
    O Git recusa `git checkout docs` por ambiguidade. Use `git switch docs` para a branch e `git checkout -- docs/` para a pasta. Fundir a branch em `main` e apagá-la elimina o problema.

## O que é verificado automaticamente

| Onde | O quê |
| --- | --- |
| `make check`, na sua máquina | Artefactos e segredos, formatação, lint, testes, construção do site em modo estrito |
| CI — *gate* | Exatamente o mesmo `scripts/check.sh`, mais um resumo de cobertura |
| CI — *conventions* | O **título do PR** tem de seguir Conventional Commits, e o **corpo** tem de referir a issue (`Closes #42`) |
| `CODEOWNERS` | Revisor humano obrigatório em prompts, templates XML, ADRs, `.github/`, `scripts/`, `.agents/` e `pyproject.toml` |

Nenhum destes substitui a revisão. Substituem a discussão sobre formatação, que é coisa diferente.

## Definição de pronto

Uma alteração está pronta quando tudo isto é verdade — e o PR di-lo explicitamente:

- [x] `make check` passa.
- [x] Comportamento novo tem um teste. Uma correção de *bug* tem um teste que falhava antes dela.
- [x] A documentação corresponde à realidade, ou a alteração não toca em comportamento documentado.
- [x] Uma decisão arquitetural ficou registada numa [ADR](../adr/index.md).
- [x] O ficheiro de tarefa foi apagado e o PR fecha a sua issue.
- [x] Nada no *diff* está fora da tarefa.

## Segurança

!!! danger "Nunca comprometa segredos"
    A chave vive em `.env`, que está no `.gitignore`, e `make check` recusa uma árvore com algo que se pareça com uma chave. Em exemplos, use sempre valores fictícios: `sk-XXXX`.

    Se uma chave for alguma vez enviada: **rode a chave primeiro**, reescreva o histórico depois.

O detalhe está em [`.agents/rules/security.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/.agents/rules/security.md).

## Lacunas que aceitam contribuição

Ordenadas por retorno sobre esforço, com o contexto completo em [Análise de lacunas](../product/gap-analysis.md#o-que-fazer-a-seguir):

| # | Alteração | Esforço | Porque importa |
| --- | --- | --- | --- |
| 1 | Política de retenção para `var/runs/` | Baixo | Cresce sem limite |
| 2 | Registo de *tokens* e custo em `meta.json` | Baixo | Já há onde o pôr; falta contá-lo |
| 3 | Fluxo de aprovação que ponha `reviewed: true` | Médio | O campo existe; falta quem o mude — e é o que torna a etiqueta de revisão honesta |
| 4 | Verificação de escopo com um *parser* | Alto | A lacuna mais grave — FEAT-024 |

!!! tip "Se for a sua primeira contribuição"
    Os itens 1 e 2 são pequenos, independentes e tocam em código que já existe. Cada um dá para perceber o ciclo inteiro — issue, ficheiro de tarefa, portão, PR — sem a alteração em si ser o problema difícil.

## Licença

MIT, © 2026 Hugo Rosa. Contribuições ficam sob os mesmos termos.

# Rever e fechar

<p class="lead">Com seis pessoas e três agentes a produzir código, a revisão é o único sítio onde um padrão consistente é de facto aplicado. Esta página cobre os dois lados: fechar a sua tarefa, e rever a de outra pessoa.</p>

## Fechar a tarefa

### 1. O portão

```bash
make check
```

Tudo verde. Uma falha que parece não ter nada a ver é na mesma uma falha: descubra porquê, porque o CI vai falhar exatamente igual e a próxima pessoa herda o problema.

### 2. Ler o *diff* com os próprios olhos

```bash
git status --short
git diff --stat
git diff
```

À procura de, especificamente:

| Procurar | Porquê |
| --- | --- |
| Qualquer coisa fora da tarefa | Apague ou mova para uma branch própria. Uma branch com dois propósitos não recebe revisão cuidada |
| Algo em `var/`, `cache/`, `Questions/` ou um `.env` | Devia ser impossível. Se aconteceu, corrija a causa e diga-o no PR |
| `print` de depuração, código comentado, um `TODO` sem número de issue | Ruído que sobrevive anos |
| Um prompt alterado sem incrementar `PROMPT_VERSIONS` | O `meta.json` passa a mentir sobre o que gerou a questão |

### 3. Documentação

Mudou comportamento que alguma página descreve? Atualize a página **neste PR**. O portão constrói o site em modo estrito, mas isso só apanha ligações partidas — não apanha uma página que passou simplesmente a ser falsa.

### 4. Apagar o ficheiro de tarefa

```bash
git rm .agents/tasks/42-scope-check.md
```

O contexto que sobrevive à branch vai para a issue, para uma ADR ou para o corpo do commit. O ficheiro em si é andaime.

### 5. Commit e PR

```bash
git commit                      # assunto convencional, corpo a explicar porquê, trailer Assisted-by
git push -u origin feat/42-scope-check
gh pr create --fill
```

O template do PR tem quatro secções. Preencha-as com honestidade:

| Secção | O que lá vai |
| --- | --- |
| **What and why** | Um parágrafo, e `Closes #42`. O *diff* mostra o quê; isto diz porquê |
| **How this was verified** | `make check`, o teste novo, e o que verificou à mão |
| **Checklist** | Nada fora da tarefa, documentação em dia, ADR se houve decisão, ficheiro de tarefa apagado, *trailer* de atribuição |
| **Anything the reviewer should look at closely** | Uma decisão de que não tem a certeza, um ficheiro que merece leitura lenta. "Nada" é uma resposta válida |

!!! tip "\"How this was verified\" é a linha mais útil do PR"
    Mais do que a descrição, porque diz ao revisor o que já está coberto e o que ainda precisa dos olhos dele.

!!! warning "O CI recusa o PR antes de alguém o ler"
    O *job* `conventions` falha se o **título** não seguir Conventional Commits, ou se o **corpo** não referir a issue (`Closes #42`, `Fixes #42`, `Refs #42`). São dois segundos a corrigir e evitam um PR que ninguém consegue localizar daqui a seis meses.

### 6. Durante a revisão

Responda a todos os comentários, nem que seja para dizer porque discorda. Faça *rebase* sobre a `main` em vez de a fundir para dentro. Um agente pode enviar correções; **um humano aprova e funde**.

## Rever o PR de outra pessoa

Reserve tempo a sério para isto. Reveja por esta ordem, e **pare no primeiro nível que falha** — não vale a pena discutir nomes num PR que faz a coisa errada.

1. **É a alteração certa?** Corresponde à issue? Há algo no *diff* fora da tarefa?
2. **Está correta?** Leia o teste, depois o código. Um teste que passaria contra o código antigo não testa nada.
3. **É segura?** Segredos, `subprocess` fora de `execution/`, um caminho novo construído a partir de entrada do cliente, uma dependência nova.
4. **A fronteira está intacta?** Alguma coisa abaixo de `api/` importa FastAPI? Alguma coisa fora de `llm/` chama um modelo?
5. **É honesta?** A documentação afirma comportamento que o *diff* não entrega? Alguma etiqueta no XML afirma uma revisão que não aconteceu?
6. **Só então, estilo.** O `ruff` já decidiu a formatação. O que sobra são nomes e comentários.

### O que merece leitura lenta

| Área | Porquê |
| --- | --- |
| `generation/prompts.py` | São o ativo transferível deste protótipo. Alterá-los muda o resultado de forma difícil de testar — e obriga a incrementar `PROMPT_VERSIONS` no mesmo commit |
| Os analisadores de resposta | `parse_statement` e `parse_inputs` falham **em silêncio**, não com erro |
| `export/templates/` | Um marcador por substituir só se descobre na importação, já em frente à turma |
| `execution/` | É onde código não confiável é compilado e executado |

`CODEOWNERS` exige um revisor humano nestas áreas, além de `.github/`, `scripts/`, `.agents/` e `docs/adr/`.

## Código escrito por um agente {#codigo-escrito-por-um-agente}

Os modos de falha são diferentes dos de uma pessoa. Procure especificamente:

<div class="grid cards" markdown>

-   :material-layers-triple-outline: **Abstrações plausíveis e inúteis**

    ---

    Um protocolo com uma implementação e nenhuma segunda à vista; uma opção que ninguém passa.

-   :material-test-tube-off: **Testes que afirmam a implementação**

    ---

    Em vez do comportamento — ou que repetem a lógica do próprio código. Não detetam nada.

-   :material-arrow-expand-horizontal: **Alargamento silencioso do escopo**

    ---

    Um ficheiro não relacionado "arrumado" pelo caminho.

-   :material-comment-alert-outline: **Comentários confiantes e errados**

    ---

    Um comentário é uma afirmação. Verifique-o como verificaria qualquer outra.

-   :material-file-document-alert-outline: **Factos inventados na documentação**

    ---

    Toda a afirmação sobre comportamento tem de ser confirmável no *diff*.

-   :material-tag-outline: **O *trailer* `Assisted-by:`**

    ---

    Confirme que está lá. Não custa nada agora e responde a uma pergunta real mais tarde.

</div>

## Aprovar

Aprove quando ficaria confortável a ser chamado de madrugada por causa deste código. Um "parece-me bem" num *diff* que leu na diagonal é como uma equipa de seis pessoas perde a capacidade de confiar na revisão.

!!! info "Um agente nunca aprova nem funde"
    Pode escrever o código, abrir o PR e enviar correções. A aprovação é de uma pessoa — é o único ponto do ciclo em que alguém assume responsabilidade pelo que entra na `main`.

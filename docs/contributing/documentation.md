# Trabalhar na documentação

<p class="lead">Este site é MkDocs Material, escrito em português, e faz parte do portão: <code>make check</code> constrói-o em modo estrito, pelo que uma ligação partida ou uma página fora da navegação chumbam a verificação como chumbaria um teste.</p>

## Correr localmente

```bash
make docs        # http://127.0.0.1:8001, com recarga automática
```

A porta é deliberadamente a 8001 — a aplicação usa a 8000, e há-de querer as duas ao mesmo tempo.

```bash
make check-fast  # o portão sem construir o site — para o ciclo curto
make check       # inclui mkdocs build --strict
```

!!! warning "O modo estrito transforma avisos em erros"
    Uma ligação partida, uma âncora que não existe, uma página que não está no `nav` do `mkdocs.yml` — qualquer uma destas chumba o portão. Ao acrescentar uma página, **acrescente-a ao `nav` no mesmo commit**.

## A distinção que esta documentação existe para preservar

Grande parte de [Produto](../product/index.md) descreve uma **plataforma que ainda não existe** — o SAD, os épicos, as ondas. Este repositório implementa um protótipo de um épico da última onda. Cada página tem de deixar claro de que lado da linha está.

| A escrever sobre | Diga assim |
| --- | --- |
| O que o código faz hoje | Simplesmente, no presente |
| O que os documentos de planeamento definem | "O SAD define…", "O EPIC-017 exige…" |
| O que falta | Nomeie a lacuna e ligue à [análise de lacunas](../product/gap-analysis.md) |

!!! danger "É o erro mais caro disponível neste repositório"
    Confundir o planeado com o implementado manda um leitor à procura de código que nunca foi escrito. É também a quinta regra não-negociável do `AGENTS.md`: não afirmar em `docs/` nada que o código não faça.

## Quando o código muda

Se uma alteração muda comportamento que uma página descreve, a página muda no mesmo PR. As páginas que mais facilmente ficam falsas:

| Página | Fica falsa quando muda |
| --- | --- |
| [Arquitetura](../architecture/index.md) | O pipeline, o *workspace*, a integração com o modelo, os templates |
| [API](../api/index.md) | A forma de um pedido ou de uma resposta, um código de estado |
| [Primeiros passos](../getting-started/index.md) | Uma variável de ambiente, um passo da instalação |
| [Desenvolvimento](../development/index.md) | A estrutura de pastas, uma convenção |

## Convenções de escrita

| Aspeto | Convenção |
| --- | --- |
| Idioma | Português. Código, identificadores e logs em inglês, como no código. As ADRs também |
| Abertura | Um parágrafo `<p class="lead">` que resume a página |
| Afirmações | Verificáveis no código. Quando não for determinável, escrever `A confirmar` |
| Exemplos | Valores fictícios, sempre: `sk-XXXX`, `/caminho/para/a/chave.txt` |
| Diagramas | Mermaid, só quando explicam algo que o texto não explica |

## O vocabulário visual

O tema é o Material for MkDocs com um `stylesheets/extra.css` curto por cima. Use os componentes que já existem em vez de inventar CSS — é isso que mantém as páginas com o mesmo aspeto.

### Parágrafo de abertura

````markdown
<p class="lead">Uma frase ou duas a dizer para que serve a página.</p>
````

### Admonitions

| Tipo | Para |
| --- | --- |
| `danger` | O que causa dano silencioso: perder uma chave, enganar um aluno |
| `warning` | Limitações e armadilhas |
| `tip` | Atalhos e o caminho mais curto |
| `info` | Contexto que ajuda mas não é obrigatório |
| `quote` | Um princípio citado de outro documento |

````markdown
!!! danger "Reveja antes de usar com alunos"
    O protótipo não verifica se a solução respeitou as restrições pedidas.
````

### Cartões

Para uma grelha de caminhos possíveis — usados no fim das páginas-índice:

````markdown
<div class="grid cards" markdown>

-   :material-rocket-launch-outline: **[Primeiros passos](../getting-started/index.md)**

    ---

    Pré-requisitos, instalação e arranque.

</div>
````

### Etiquetas

`ce-badge` é a etiqueta própria deste site, definida no `extra.css`. É o que dá às páginas da API o seu aspeto de referência:

````markdown
<span class="ce-badge ce-badge--get">GET</span> `/config`
<span class="ce-badge ce-badge--post">POST</span> `/gen_code`
<span class="ce-badge ce-badge--req">Obrigatório</span>
<span class="ce-badge ce-badge--opt">Opcional</span>
<span class="ce-badge">200</span>
````

| Variante | Cor | Uso |
| --- | --- | --- |
| `ce-badge--get` | verde | Método HTTP de leitura |
| `ce-badge--post` | índigo | Método HTTP de escrita |
| `ce-badge--req` | vermelho | Campo obrigatório |
| `ce-badge--opt` | cinza | Campo opcional |
| *(sem variante)* | neutra | Código de estado, versão, qualquer outro metadado |

### Separadores e teclas

````markdown
=== "Com `make`"

    ```bash
    make run
    ```

=== "Sem `make`"

    ```bash
    .venv/bin/codeexpert
    ```

Prima ++ctrl+c++ para parar.
````

### Diagramas

Mermaid, com `flowchart` para o pipeline e `sequenceDiagram` para trocas entre componentes. Só quando o texto não chega.

!!! tip "Antes de escrever CSS novo"
    O `extra.css` é curto de propósito: tipografia, o *hero* da página inicial, as etiquetas e o rodapé. Se precisa de um componente novo, veja primeiro se o Material já o tem — quase sempre tem, e um componente do tema continua a funcionar quando o tema é atualizado.

## Estrutura do site

```text
docs/
  index.md              a página inicial, com o hero
  onboarding/           o primeiro dia
  product/              a plataforma alvo — planeado, não implementado
  getting-started/      instalar, configurar, arrancar
  guides/               tarefas de ponta a ponta
  architecture/         como funciona por dentro
  adr/                  as decisões, em inglês
  api/                  referência dos endpoints
  development/          alterar o código
  contributing/         o ciclo de trabalho e o harness
  stylesheets/extra.css o tema por cima do Material
  assets/               logótipo e favicon
```

As ADRs são diferentes: escritas em inglês, seguem o [modelo](../adr/0000-template.md), e **uma decisão aceite nunca é editada** — substitui-se por outra que a supersede. Ver [Registar uma decisão](../adr/index.md).

## Publicação

O *workflow* `docs.yml` constrói o site em cada PR e publica-o no GitHub Pages a partir da `main`. Instala `requirements-docs.txt`, que fixa as versões do tema — por isso uma alteração de aspeto que funcione localmente mas não em produção é quase sempre uma diferença de versão entre esse ficheiro e o extra `docs` do `pyproject.toml`.

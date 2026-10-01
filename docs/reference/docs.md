# Documentação

<p class="lead">Como este site é organizado, escrito e publicado. Vale para pessoas e agentes; a versão curta para agentes está em <code>.agents/rules/docs.md</code>.</p>

## Rodar e validar

```bash
make docs                          # http://127.0.0.1:8001, com recarga
.venv/bin/mkdocs build --strict    # o que o CI roda; falha em link quebrado, âncora inexistente ou página fora do nav
```

O site é MkDocs Material, com versões fixadas em `requirements-docs.txt` (usado pelo CI) e no extra `docs` do `pyproject.toml` (usado por `make setup`). Se algo aparece diferente localmente e publicado, compare as versões dos dois.

## Organização

```text
docs/
  index.md                 início: o que é, estado atual, onde achar cada resposta
  onboarding/              Primeiro dia (guia)
  guides/                  guias: fazer algo do começo ao fim
  architecture/            como o sistema funciona hoje
  adr/                     decisões, em inglês
  product/                 roadmap, plano de 30/11, plataforma-alvo
  reference/               consulta rápida: API, comandos, código, harness, esta página
  stylesheets/extra.css    tema por cima do Material
  assets/                  logo e favicon
```

Quatro regras de organização:

1. **Guia ≠ referência.** Guia é passo a passo para quem faz algo pela primeira vez (`onboarding/`, `guides/`). Referência é consulta de quem já sabe o que procura (`reference/`).
2. **Uma informação, um lugar.** Se precisa aparecer em duas páginas, escreva em uma e crie link na outra.
3. **Presente e futuro separados.** O que o código faz hoje fica em `architecture/`, `guides/` e `reference/`. O que vai mudar fica no [Roadmap](../product/roadmap.md), e as outras páginas apontam para lá.
4. **Poucas páginas.** Crie uma página só quando houver conteúdo para ela; assunto curto é seção.

## Estado de uma funcionalidade

Marque o estado onde o assunto aparece:

```html
<span class="ce-badge ce-status--done">Implementado</span>
<span class="ce-badge ce-status--wip">Em desenvolvimento</span>
<span class="ce-badge ce-status--planned">Planejado</span>
```

<span class="ce-badge ce-status--done">Implementado</span> está no código de `main` ·
<span class="ce-badge ce-status--wip">Em desenvolvimento</span> tem issue aberta na sprint atual ·
<span class="ce-badge ce-status--planned">Planejado</span> está no plano, sem código

Nunca descreva no presente algo que é plano. Quando uma issue fecha, o mesmo PR troca o badge no [Roadmap](../product/roadmap.md) e atualiza a página que descreve o presente.

## Escrita

- Português do Brasil. Nomes de código, comandos e ADRs ficam em inglês.
- Direto: diga a informação, sem introdução sobre o que a página vai dizer.
- Toda afirmação sobre comportamento é verificável no código. Se não der para confirmar, escreva **A confirmar**.
- Cada página abre com um parágrafo `<p class="lead">` de uma ou duas frases.
- Exemplos só com valores falsos: `sk-XXXX`, `/caminho/para/a/chave.txt`.
- Comandos reais do projeto. Nada de comando inventado.

| Admonition | Para |
| --- | --- |
| `danger` | Dano silencioso: vazar chave, enganar um aluno |
| `warning` | Limitações e armadilhas |
| `tip` | Atalhos |
| `info` | Contexto útil, mas opcional |
| `quote` | Um princípio citado |

## Componentes visuais

Use os componentes que já existem; o `extra.css` é curto de propósito.

| Componente | Uso |
| --- | --- |
| `<span class="ce-badge ce-badge--get">GET</span>`, `ce-badge--post` | Método HTTP |
| `ce-badge--req`, `ce-badge--opt` | Campo obrigatório ou opcional |
| `<span class="ce-badge">200</span>` | Status, versão, outro metadado |
| `ce-status--done`, `--wip`, `--planned` | Estado de funcionalidade |
| `<div class="grid cards" markdown>` | Grade de caminhos, como na página inicial |
| `=== "Aba"` | Alternativas (ex.: com e sem `make`) |
| ` ```mermaid ` | Diagramas: `flowchart` para fluxo, `sequenceDiagram` para troca entre componentes. Só quando o texto não basta |
| `.ce-hero` | Só na página inicial |

Cores: preto como primária, índigo `#4B4EDE` como destaque (o mesmo do favicon), fontes Inter e JetBrains Mono, modos claro e escuro.

## Quando o código muda

Se a mudança altera comportamento descrito aqui, a página muda no mesmo PR. As que mais desatualizam:

| Página | Desatualiza quando muda |
| --- | --- |
| [Arquitetura](../architecture/index.md), [Pipeline](../architecture/pipeline.md) | Etapas, estado, cliente do modelo, templates, limites |
| [API](api.md) | Endpoint, corpo, resposta, status |
| [Comandos e configuração](configuration.md) | `Makefile`, `scripts/`, `Settings`, `.env.example` |
| [Harness](harness.md) | `AGENTS.md`, `.agents/`, CI, `CODEOWNERS` |
| [Roadmap](../product/roadmap.md) | Uma issue do plano fecha ou o plano muda |

Página nova entra no `nav` do `mkdocs.yml` no mesmo commit, ou o build estrito falha.

## Publicação {#publicacao}

`.github/workflows/docs.yml` roda em todo PR (só build) e, em push para `main`, constrói com `mkdocs build --strict` e publica o conteúdo de `.dist/site` no GitHub Pages usando o artefato oficial (`actions/upload-pages-artifact` + `actions/deploy-pages`). Não há branch `gh-pages`.

**Endereço:** <https://tutor-ia-makers.github.io/tutor-ia/> (definido em `site_url` no `mkdocs.yml`).

!!! warning "Habilitar uma vez no repositório"
    Hoje o Pages não está habilitado e o job `deploy` falha em `configure-pages`. Alguém com permissão de administrador precisa, uma vez:

    **Settings → Pages → Build and deployment → Source: GitHub Actions.**

    Depois disso, o próximo push em `main` (ou *Run workflow* em **Documentation**) publica o site.

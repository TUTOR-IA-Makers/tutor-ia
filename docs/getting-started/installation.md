# Instalação

<p class="lead">Um comando. O projeto declara as suas dependências em <code>pyproject.toml</code> e instala-se como um pacote, pelo que não há lista para copiar à mão.</p>

## Clonar

```bash
git clone https://github.com/HugoRosa29/coderunner_v2.git
cd coderunner_v2
```

!!! info "A branch `docs` e a pasta `docs/`"
    Este repositório tem uma branch chamada `docs` **e** um diretório chamado `docs/`. Comandos como `git checkout docs` tornam-se ambíguos e o Git recusa-os. Use as formas explícitas:

    ```bash
    git switch docs          # mudar de branch
    git checkout -- docs/    # descartar alterações na pasta
    ```

    Quando a branch for fundida em `main` e apagada, o problema desaparece.

## Instalar

```bash
make setup
```

O que isto faz, em `scripts/dev-setup.sh`:

1. cria `.venv` se ainda não existir;
2. instala o pacote em modo editável com os extras `dev` e `docs`;
3. copia `.env.example` para `.env` se ainda não existir;
4. avisa se o `gcc` não estiver no `PATH`.

Nada disto é destrutivo, e correr de novo é seguro.

=== "Sem `make`"

    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install -e ".[dev,docs]"
    cp .env.example .env
    ```

=== "Com `uv`"

    ```bash
    uv venv
    uv pip install -e ".[dev,docs]"
    cp .env.example .env
    ```

## O que fica instalado

| Grupo | Pacotes | Para quê |
| --- | --- | --- |
| Aplicação | `fastapi`, `uvicorn`, `httpx`, `pydantic`, `pydantic-settings` | O serviço |
| `dev` | `pytest`, `pytest-cov`, `ruff` | O portão |
| `docs` | `mkdocs`, `mkdocs-material`, `pymdown-extensions` | Este site |

O modo editável (`-e`) significa que uma alteração em `src/codeexpert/` tem efeito imediato, sem reinstalar.

!!! note "`requirements-docs.txt` continua a existir"
    É usado pelo *workflow* que publica o site, que instala apenas a cadeia de documentação. Para desenvolvimento local, o extra `docs` do `pyproject.toml` cobre o mesmo.

## Confirmar

```bash
make check
```

Formatação, lint, testes e a construção do site, na mesma ordem em que o CI os corre. Numa árvore acabada de clonar deve ficar tudo verde — se não ficar, é um problema de ambiente e não do seu trabalho.

## Passo seguinte

O código está instalado, mas ainda não sabe a que modelo se ligar. Continue em [Configuração](configuration.md).

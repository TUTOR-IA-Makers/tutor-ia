# Instalação

<p class="lead">Clonar o repositório, criar um ambiente virtual e instalar as dependências. A aplicação são quatro pacotes diretos; o resto da lista instalada é transitivo.</p>

## Clonar

```bash
git clone https://github.com/hugosousa9202/coderunner_v2.git
cd coderunner_v2
```

!!! info "A branch `docs` e a pasta `docs/`"
    Este repositório tem uma branch chamada `docs` **e** um diretório chamado `docs/`. Comandos como `git checkout docs` tornam-se ambíguos e o Git recusa-os. Use as formas explícitas:

    ```bash
    git switch docs          # mudar de branch
    git checkout -- docs/    # descartar alterações na pasta
    ```

## Criar o ambiente virtual

=== "uv (usado no projeto)"

    ```bash
    uv venv
    source .venv/Scripts/activate   # Windows (Git Bash)
    # source .venv/bin/activate     # Linux / macOS
    ```

=== "venv + pip"

    ```bash
    python -m venv .venv
    .venv\Scripts\activate          # Windows (PowerShell)
    # source .venv/bin/activate     # Linux / macOS
    ```

## Instalar as dependências

!!! warning "O repositório não declara as suas dependências"
    Não existe `requirements.txt`, `pyproject.toml` nem `setup.py`. A lista abaixo foi derivada dos `import` do código e confirmada contra o ambiente `.venv` presente na máquina de desenvolvimento. Instalar as dependências é, hoje, um passo manual.

    Fechar esta lacuna é a alteração de maior retorno para quem entra no projeto — ver [Sugestões futuras](../development/index.md#lacunas-conhecidas).

Quatro pacotes cobrem tudo o que o código importa:

```bash
uv pip install fastapi uvicorn requests pydantic
```

| Pacote | Versão no ambiente de referência | Onde é usado |
| --- | --- | --- |
| `fastapi` | 0.141.1 | Aplicação, router, `HTTPException`, `TestClient` |
| `uvicorn` | 0.52.3 | Servidor ASGI invocado por `main.py` |
| `requests` | 2.34.2 | Chamadas HTTP ao provedor LLM em `services/llm.py` |
| `pydantic` | 2.13.4 | Modelos de pedido e resposta em `models.py` |

`starlette`, `httpx`, `anyio`, `pydantic-core`, `certifi` e restantes são dependências transitivas — não precisam de ser instaladas explicitamente.

!!! note "`TestClient` precisa de `httpx`"
    `POST /create_question` usa `fastapi.testclient.TestClient`, que depende de `httpx`. Nas versões recentes do FastAPI o `httpx` vem incluído; se o endpoint falhar com `RuntimeError` a pedir a instalação do `httpx`, instale-o explicitamente:

    ```bash
    uv pip install httpx
    ```

## Dependências da documentação

A documentação é independente da aplicação e tem o seu próprio ficheiro:

```bash
uv pip install -r requirements-docs.txt
mkdocs serve
```

Detalhes em [Contribuir](../contributing/index.md#trabalhar-na-documentacao).

## Passo seguinte

O código está instalado, mas ainda não sabe a que modelo se ligar. Continue em [Configuração](configuration.md).

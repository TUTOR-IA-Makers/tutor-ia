# Convenções

<p class="lead">Os padrões que o código segue. A formatação é decidida por ferramenta e não se discute em revisão; o que fica são as convenções que uma ferramenta não consegue verificar.</p>

!!! info "A versão operacional destas regras"
    Esta página explica **porquê**. A lista que um agente lê antes de escrever código está em [`.agents/rules/code.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/.agents/rules/code.md). As duas dizem o mesmo; se divergirem, o ficheiro de regras é o que vale.

## A fronteira que mais importa

Nada abaixo de `codeexpert/api/` importa FastAPI.

```python title="generation/codegen.py — correto"
raise MissingArtefactError(
    "'statement.json' not found. Generate a statement first (POST /gen_statement)."
)
```

```python title="quebraria a convenção"
from fastapi import HTTPException
raise HTTPException(status_code=409, detail="...")
```

O benefício é concreto: cada função de serviço continua chamável a partir de um *script*, de um teste, de uma CLI ou de um futuro *worker*, sem arrastar a pilha HTTP.

A tradução acontece uma vez, numa tabela:

```python title="api/errors.py"
STATUS_BY_ERROR = [
    (RunNotFoundError, 404),
    (MissingArtefactError, 409),
    (ConfigurationError, 503),
    (LLMError, 502),
    (CompilationError, 422),
    (ExecutionError, 422),
]
```

!!! warning "Um `try/except` dentro de um endpoint é quase sempre a correção errada"
    A certa é acrescentar uma linha a esta tabela. Cada endpoint repetia o mesmo bloco de quatro ramos, e o que se esquecesse de um devolvia `500` para um erro do cliente.

## Mensagens de exceção são interface

Chegam ao cliente como `detail`. Dizem o que falta **e** o que fazer:

```python
"'solution.c' not found in run 20260918T221305Z-1a2b3c4d. Generate a solution first (POST /gen_code)."
```

!!! tip "Escreva-as como se um utilizador as fosse ler"
    Porque vai. Uma mensagem que diz apenas o que falta obriga a abrir o código; uma que diz o que fazer resolve o problema no sítio.

## Os efeitos entram por injeção

O fornecedor de modelos, o compilador e as definições chegam como dependências. `LLMClient` e `CodeRunner` são `Protocol`, não classes base.

```python
def generate_code(workspace: RunWorkspace, llm: LLMClient) -> str: ...
```

É isto que permite à suite inteira correr sem rede, sem chave e sem compilador. Um módulo que importe `httpx` ou `subprocess` fora de `llm/` e `execution/` está a quebrar a convenção — e a fechar a porta ao sandbox que há-de substituir a execução local.

## Forma de um módulo

```python
"""Uma linha a dizer para que serve, e porque existe se não for óbvio."""

import ...                                   # stdlib, terceiros, codeexpert — o ruff ordena

logger = logging.getLogger(__name__)
CONSTANTES = ...

def _auxiliar(): ...                          # privados primeiro
def funcao_publica(...) -> Modelo: ...        # a entrada pública, no fim
```

Uma função pública por módulo de etapa, com o nome da etapa. Auxiliares com prefixo `_`.

## Caminhos

`pathlib.Path` em todo o lado. Os diretórios base vêm das definições, nunca de literais dispersos:

```python
directory = output_dir or get_settings().questions_dir
```

Os caminhos dos artefactos de uma execução vêm sempre de `RunWorkspace`, que valida o `run_id` antes de o transformar em caminho. Construir um caminho a partir de entrada do cliente fora dessa classe é um problema de segurança, não de estilo.

## Escrita de ficheiros

Sempre com codificação explícita:

```python
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
```

!!! danger "`encoding=\"utf-8\"` não é opcional"
    Os enunciados são em português e a codificação por omissão do Windows corromperia o conteúdo — em silêncio, e só visível quando a questão chega ao Moodle. `ensure_ascii=False` mantém os acentos legíveis no JSON.

## Registo

Um logger por módulo, com `logging.getLogger(__name__)`. Formatação com `%s` e argumentos, nunca f-strings — a interpolação só acontece se a mensagem for efetivamente emitida.

```python
logger.info("Statement saved to %s", workspace.path(STATEMENT))
```

!!! success "Nada sensível é registado"
    O nome do modelo, sim; a chave, nunca. `llm_api_key` é um `SecretStr`, o que faz com que nem um `repr` acidental a exponha. Há um teste que o verifica.

## Modelos

| Onde | Para quê |
| --- | --- |
| `domain.py` | Entidades: `Constraints`, `Statement`, `TestCase`, `RunMetadata`. Sem I/O, sem HTTP |
| `api/schemas.py` | Contratos de entrada e saída, com sufixo `Request` ou `Response` |

Estão separados de propósito: as entidades podem mudar de forma sem que a API mude silenciosamente com elas.

Valores fechados são `enum`, não `str` — `difficulty` inválida é um `422`, e não um prompt sem a linha de nível.

## Estilo

| Aspeto | Convenção |
| --- | --- |
| Formatação | `ruff format`. Não é tema de revisão |
| Lint | `ruff check`, com as regras de segurança (`S`) ativas |
| Nomes | `snake_case`, `PascalCase` para classes, `UPPER_SNAKE` para constantes |
| Anotações de tipo | Em todas as assinaturas públicas, tipo de retorno incluído |
| Docstrings | Onde a intenção não é óbvia; a explicar *porquê* |
| Comentários | Explicam **porquê**, não o quê |
| Idioma | Código, comentários, logs e testes em **inglês**; prompts e conteúdo gerado em **português** |

O comentário mais ilustrativo do estilo pretendido:

```python
HOST = "0.0.0.0"  # noqa: S104 - bind address; see the log line below
```

Explica uma decisão, não a linha seguinte.

!!! info "As regras de segurança do `ruff` estão ativas de propósito"
    O conjunto `S` (flake8-bandit) está ligado porque este projeto compila e executa código. Onde um aviso é aceitável, o `noqa` traz a razão escrita ao lado — nunca um `noqa` mudo.

## Prompts

Todos em `generation/prompts.py`, e em mais nenhum sítio. Duas convenções específicas do domínio:

- **As restrições de formato aparecem nos dois prompts**, no *system* e no *user*. Redundância deliberada: custa pouco e a conformidade melhora.
- **Os prompts em português mantêm os acentos.** A instrução *dentro* do prompt que pede texto sem acentos refere-se ao exercício gerado, por causa do C — não ao texto do prompt.

Alterar um prompt obriga a incrementar `PROMPT_VERSIONS` no mesmo commit, e a confirmar o analisador correspondente. O detalhe está em [`.agents/rules/prompts.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/.agents/rules/prompts.md).

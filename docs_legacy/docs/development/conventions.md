# Convenções

<p class="lead">Os padrões que o código segue de forma consistente. Segui-los mantém o projeto legível; onde já existem incoerências, estão assinaladas.</p>

## Separação entre serviços e HTTP

A convenção mais importante do projeto, e a única cumprida sem exceção:

!!! success "Nenhum ficheiro em `services/` importa de `fastapi`"
    Os serviços levantam exceções Python normais. O router traduz cada tipo num `HTTPException`.

```python title="services/inputs.py — correto"
if not os.path.exists(path):
    raise FileNotFoundError("Solution file not found. Generate a solution first.")
```

```python title="services/inputs.py — quebraria a convenção"
from fastapi import HTTPException
raise HTTPException(status_code=404, detail="...")
```

O benefício é concreto: as funções de serviço são chamáveis a partir de um script, de um teste ou de uma CLI sem arrastar a stack HTTP.

**Mensagens de exceção acionáveis.** Cada `FileNotFoundError` diz o que falta *e* o que fazer:

```python
"Solution file not found. Generate a solution first."
```

O texto chega ao cliente como `detail`. Escreva-o como se o utilizador o fosse ler — porque vai.

## Estrutura de um módulo de serviço

Todos os cinco seguem a mesma ordem, o que torna qualquer um previsível de ler:

```python
import ...                                    # 1. imports
logger = logging.getLogger(__name__)          # 2. logger de módulo
STATEMENT_FILE = os.path.join(CACHE_DIR, ...) # 3. constantes de caminhos
SYSTEM_PROMPT = "..."                         # 4. constantes de prompt
def _helper(): ...                            # 5. auxiliares privados
def generate_x(request) -> XResponse: ...     # 6. função pública, no fim
```

Uma função pública por módulo, com o nome da etapa. Auxiliares com prefixo `_`.

## Caminhos

Constantes de módulo construídas com `os.path.join` sobre os diretórios de `config.py`:

```python
STATEMENT_FILE = os.path.join(CACHE_DIR, "statement.json")
```

Nunca literais dispersos pelo código. Quando dois módulos precisam do mesmo ficheiro, cada um define a sua constante — há duplicação deliberada em vez de um módulo de caminhos partilhado.

!!! warning "Todos os caminhos são relativos"
    `CACHE_DIR = "cache"` é relativo ao diretório de trabalho, não à localização do código. É a razão pela qual o servidor tem de arrancar a partir da raiz do repositório. Se acrescentar caminhos, mantenha a convenção — ou converta todos de uma vez com `pathlib` e `__file__`.

## Escrita de ficheiros

Sempre com `os.makedirs(..., exist_ok=True)` antes, e sempre com codificação explícita:

```python
os.makedirs(CACHE_DIR, exist_ok=True)
with open(STATEMENT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

`encoding="utf-8"` é obrigatório: os enunciados são em português e a codificação por omissão do Windows corromperia o conteúdo. `ensure_ascii=False` mantém os acentos legíveis no JSON.

!!! note "Uma exceção existente"
    `Config._read_api_key()` abre o ficheiro da chave **sem** `encoding`. Como a chave é ASCII, funciona — mas destoa do resto do código.

## Registo

Um logger por módulo, obtido com `logging.getLogger(__name__)`. `main.py` configura o nível a `INFO`.

Cada etapa regista o ficheiro que escreveu:

```python
logger.info("Statement saved to %s", STATEMENT_FILE)
```

Formatação com `%s` e argumentos, nunca f-strings — a interpolação só acontece se a mensagem for efetivamente emitida.

!!! success "Nada sensível é registado"
    `Config._load()` regista o nome do modelo, nunca a chave nem o caminho para ela. Mantenha assim.

## Modelos Pydantic

Nomes com sufixo `Request` ou `Response`, agrupados por comentários de secção em `models.py`. Todos os campos de resposta têm valores por omissão.

```python
class StatementResponse(BaseModel):
    name: str = ""
    statement: str = ""
    file_path: str = ""
```

Cada resposta inclui `file_path`, apontando para o artefacto escrito — é o que permite ao cliente inspecionar ou editar o resultado intermédio.

!!! warning "Duas APIs descontinuadas em uso"
    O projeto corre sobre Pydantic 2.13 mas usa a API v1 em dois pontos:

    | Em uso | Equivalente v2 | Onde |
    | --- | --- | --- |
    | `@validator("qty")` | `@field_validator("qty")` | `models.py` |
    | `request.dict()` | `request.model_dump()` | `routers/question.py` |

    Ambos funcionam, com avisos de descontinuação. Se tocar nestes ficheiros, migre — são substituições diretas.

## Estilo

Convenções observáveis no código existente:

| Aspeto | Convenção |
| --- | --- |
| Nomes | `snake_case` para funções e variáveis, `PascalCase` para classes, `UPPER_SNAKE` para constantes |
| Anotações de tipo | Presentes nas assinaturas públicas, incluindo o tipo de retorno |
| Docstrings | Raras, e só onde a intenção não é óbvia |
| Comentários | Explicam **porquê**, não o quê |
| Separadores de secção | `# ── Nome ───...` em `models.py` e `routers/question.py` |
| Idioma | Código, comentários e registos em **inglês**; prompts e conteúdo gerado em **português** |

O comentário mais ilustrativo do estilo pretendido está em `main.py`:

```python
# 0.0.0.0 is the bind address, not a browsable one — show the URL that works.
```

Explica uma decisão, não a linha seguinte.

!!! info "Nenhum formatador ou linter está configurado"
    Não há `black`, `ruff`, `flake8` nem `.editorconfig` no repositório. O `.gitignore` menciona `.ruff_cache/`, mas é o modelo padrão do GitHub para Python, não um sinal de que o `ruff` seja usado.

    Sem ferramenta configurada, o estilo é mantido por imitação do código circundante. Adotar `ruff` — formatador e linter numa só ferramenta — é uma alteração de baixo custo, desde que a primeira passagem seja um commit isolado, para não misturar reformatação com alterações de comportamento.

## Prompts

Os prompts são parte do código e beneficiam do mesmo cuidado.

**System prompt como constante de módulo**, definindo o papel e as restrições de formato:

```python
SYSTEM_PROMPT = (
    "You are a C code generator for programming exercises. "
    "Do not use any markdown formatting in your responses. "
    "Return only the raw C code without backticks or language indicators."
)
```

**Prompt do utilizador construído em f-string**, com as regras numeradas:

```python
prompt = f"""Write C code that solves this problem:

{statement_data['statement']}

Rules:
1. Use function for input without any prompting messages
...
"""
```

Duas convenções específicas do domínio:

- **Restrições de formato repetidas em ambos os prompts.** A instrução anti-markdown aparece no *system* e no *user* prompt. É redundância deliberada — o custo é baixo e a taxa de conformidade melhora.
- **Os prompts de conteúdo são em português.** `statement.py` escreve integralmente em português porque o enunciado é para alunos lusófonos. `codegen.py` e `inputs.py` são em inglês, porque produzem código e dados.

!!! tip "Ao alterar um prompt, verifique o analisador correspondente"
    `_parse_statement()` depende da convenção `[bloco]` pedida no prompt. `_parse_inputs()` depende de o formato ser um array JSON. Alterar o formato pedido sem atualizar o analisador produz falhas silenciosas, não erros. Ver [Testes](testing.md).

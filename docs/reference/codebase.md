# Código

<p class="lead">Estrutura de diretórios, onde colocar código novo, as convenções que a ferramenta não verifica e como a suíte de testes funciona. A versão que os agentes leem é <code>.agents/rules/code.md</code>; se as duas divergirem, vale o arquivo de regras.</p>

## Estrutura

```text
src/codeexpert/
├── __init__.py          versão do pacote
├── __main__.py          python -m codeexpert / console script `codeexpert`
├── settings.py          Settings: configuração, só do ambiente
├── errors.py            exceções de domínio
├── domain.py            Difficulty, Constraints, Statement, TestCase, RunMetadata
├── workspace.py         RunWorkspace: um diretório por execução
├── llm/client.py        LLMClient (protocolo), OpenAIChatClient
├── execution/
│   ├── runner.py        CodeRunner (protocolo), RunOutcome
│   └── local.py         LocalGccRunner
├── generation/
│   ├── prompts.py       todos os prompts e PROMPT_VERSIONS
│   ├── statement.py     etapa 1 + parse_statement
│   ├── codegen.py       etapa 2 + strip_code_fences
│   ├── inputs.py        etapa 3 + parse_inputs
│   ├── testcases.py     etapa 4
│   ├── pipeline.py      create_question: as cinco em sequência
│   └── _trace.py        grava modelo e versão de prompt no meta.json
├── export/
│   ├── moodle.py        etapa 5
│   └── templates/       questionnaire.xml, question.xml, case.xml
└── api/
    ├── app.py           create_app()
    ├── deps.py          dependências injetáveis
    ├── errors.py        STATUS_BY_ERROR: exceção → status HTTP
    ├── schemas.py       contratos *Request / *Response
    └── routes/          health.py (/health, /config), questions.py (etapas)

tests/unit/              funções puras — sem rede, sem compilador
tests/integration/       vários módulos juntos — ainda offline
scripts/                 check.sh (gate), front-check.sh, dev-setup.sh, fix.sh, new-task.sh
frontend/                SPA em React + Vite; ver frontend/README.md
docs/                    este site; docs/adr/ em inglês
.agents/                 regras, workflows e arquivos de tarefa (ver Harness)
main.py                  atalho de compatibilidade para `python main.py`
Dockerfile               imagem com a API e o gcc (ver Rodar com Docker)
.dockerignore            o que nunca entra no contexto de build: .env, var/, .git
```

Cerca de 1.500 linhas em `src/`. Um pacote só, sem monorepo ([ADR-0002](../adr/0002-modular-monolith-src-layout.md)). Direção das dependências e invariantes em [Arquitetura](../architecture/index.md#direcao-das-dependencias).

## Onde colocar código novo

| Quer acrescentar | Onde |
| --- | --- |
| Uma etapa no pipeline | Um módulo em `generation/` com uma função pública, chamada em `pipeline.py` |
| Um endpoint | `api/routes/`, sem `try/except` |
| Um tipo de erro | Classe em `errors.py` + linha em `api/errors.py::STATUS_BY_ERROR` |
| Outro provedor de modelos | Classe que satisfaça `LLMClient`, escolhida em `get_llm_client()` |
| Execução isolada (ex.: Judge0) | Classe que satisfaça `CodeRunner`, escolhida em `get_code_runner()` |
| Uma configuração | Campo em `Settings` + linha em `.env.example` |
| Uma área nova do produto | Pacote irmão dentro de `src/codeexpert/`, respeitando a direção das dependências |

Outra linguagem além de C toca quatro pontos fixos hoje: `CODE_SYSTEM`/`build_code_prompt` em `prompts.py`, o comando de compilação e de execução em `execution/local.py`, e `CODERUNNER_TYPE` em `export/moodle.py`. A linguagem teria de viajar no `meta.json`, porque as etapas só conhecem o que está no diretório da execução.

## Convenções

**Serviços não conhecem HTTP.** Levantam exceções de `errors.py`; nunca `HTTPException`.

```python
# certo — a função continua chamável de um script, teste ou worker
raise MissingArtefactError("'statement.json' not found. Generate a statement first (POST /gen_statement).")
```

**Mensagem de exceção é interface.** Chega ao cliente como `detail`. Diga o que falta **e** o que fazer.

**Efeitos entram por injeção.** Modelo, compilador e configuração chegam como parâmetros (`LLMClient`, `CodeRunner`, `Settings`). Importar `httpx` fora de `llm/` ou `subprocess` fora de `execution/` é bug.

**Caminhos de execução vêm de `RunWorkspace`,** que valida o `run_id` antes de virar caminho. Montar caminho a partir de entrada do cliente em outro lugar é problema de segurança.

| Aspecto | Regra |
| --- | --- |
| Formatação e lint | `ruff format` e `ruff check`, incluindo as regras de segurança `S`. Não se discute em revisão |
| `noqa` | Sempre com o motivo ao lado (`# noqa: S104 - bind address; ...`) |
| Caminhos | `pathlib.Path`, nunca `os.path` |
| Escrita de arquivo | `encoding="utf-8"` sempre; JSON com `ensure_ascii=False` |
| Log | `logger = logging.getLogger(__name__)`; `logger.info("Saved to %s", path)`, nunca f-string. Nunca a chave |
| Tipos | Em toda assinatura pública, com retorno |
| Modelos | Entidades em `domain.py`; contratos HTTP em `api/schemas.py` com sufixo `Request`/`Response`. Valores fechados são `enum` |
| Módulo | Docstring de uma linha no topo; privados (`_nome`) antes; a função pública por último |
| Comentários | Explicam **por quê** |
| Idioma | Código, comentários, logs, testes e ADRs em inglês. Prompts e texto para aluno ou professor em português |

**Prompts** só em `generation/prompts.py`; mudança exige versão nova em `PROMPT_VERSIONS`, parser acompanhando e revisão humana — ver [Pipeline § Prompts](../architecture/pipeline.md#prompts). Os prompts em português mantêm os acentos; a instrução "sem acentos" dentro deles vale para o exercício gerado.

## Testes

```text
tests/
├── conftest.py                FakeLLM, FakeRunner, isolated_settings, client, requires_gcc
├── unit/
│   ├── test_parsers.py        parse_statement, parse_inputs, strip_code_fences
│   ├── test_workspace.py      isolamento entre execuções, path traversal
│   ├── test_moodle_export.py  XML válido, escape, etiquetas, acumulação
│   └── test_settings.py       precedência do ambiente, chave não exposta
└── integration/
    ├── test_pipeline.py       as cinco etapas; timeout; compilação real
    └── test_api.py            contrato HTTP e códigos de status
```

- **Nenhum teste acessa a rede.** O modelo é sempre `FakeLLM`, com respostas roteirizadas em ordem.
- **Nenhum teste escreve fora de `tmp_path`.** A fixture automática `isolated_settings` redireciona `var/` e injeta uma chave falsa.
- Testes que precisam de compilador usam `@requires_gcc` e são pulados sem `gcc`. **`make check` passa sem `gcc`, mas os testes da etapa 4 não rodam** — o CI roda.
- Correção de bug vem com o teste que falhava antes.
- Teste o comportamento, não a implementação.

Os alvos principais são os que falham em silêncio: os parsers das respostas do modelo, o `run_id` virando caminho, o XML que só quebra na importação, e o mapeamento de status.

**A suíte não substitui uma geração real.** Depois de mexer em prompt ou pipeline, rode `make run`, gere uma questão com `qty` pequeno e confira o resultado como em [Gerar uma questão](../guides/generate-a-question.md#conferir-o-resultado).

Cobertura: `make test` mostra o relatório. Não há mínimo imposto.

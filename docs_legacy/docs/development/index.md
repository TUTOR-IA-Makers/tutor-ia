# Desenvolvimento

<p class="lead">O que é preciso saber para alterar este código com confiança: como está organizado, que convenções seguir, como verificar alterações sem uma suite de testes, e as lacunas que já são conhecidas.</p>

!!! info "Onde este código se situa"
    Este repositório é um protótipo do EPIC-017, fora do MVP. Antes de abrir uma alteração significativa, vale confirmar que o problema pertence a este código e não a um épico anterior — ver [Contexto do produto](../product/index.md).

## Dimensão do projeto

Cerca de 600 linhas de Python em onze ficheiros. Não há frameworks internos, camadas de abstração nem geração de código — o percurso de um pedido HTTP até ao ficheiro escrito lê-se de uma ponta à outra em poucos minutos.

```text
main.py              app FastAPI e ponto de entrada
config.py            singleton de configuração
models.py            esquemas Pydantic
routers/question.py  os seis endpoints e o orquestrador
services/            uma etapa do pipeline por ficheiro
templates/           três templates Moodle XML
```

## Nesta secção

<div class="grid cards" markdown>

-   :material-folder-outline: **[Estrutura do projeto](project-structure.md)**

    ---

    O papel de cada ficheiro, a direção das dependências e onde acrescentar código novo.

-   :material-format-list-checks: **[Convenções](conventions.md)**

    ---

    Os padrões que o código segue de forma consistente, e as incoerências que já existem.

-   :material-test-tube: **[Testes e verificação](testing.md)**

    ---

    Não há testes automatizados. O que verificar à mão, e por onde começar se quiser criar uma suite.

-   :material-lifebuoy: **[Resolução de problemas](troubleshooting.md)**

    ---

    Os sintomas mais frequentes, com o diagnóstico e a correção de cada um.

</div>

## O modelo mental

Três ideias explicam quase todo o código:

**1. Os serviços não conhecem HTTP.** Nenhum ficheiro em `services/` importa de `fastapi`. Levantam `FileNotFoundError` e `RuntimeError`; o router traduz para `HTTPException`. Manter esta separação é a convenção mais importante do projeto.

**2. O estado vive em ficheiros, não em memória.** Cada etapa lê o disco, trabalha e escreve o disco. Não há objetos partilhados entre etapas, nem sessão, nem base de dados. É isso que torna o pipeline retomável — e o que impede pedidos concorrentes.

**3. Só uma etapa produz a verdade.** As saídas esperadas vêm da execução real do binário compilado, não do modelo. Tudo o resto é geração assistida que um humano deve rever.

## Adicionar outra linguagem

Suportar Python ou Java, por exemplo, toca em quatro pontos — todos com valores fixos no código:

| Ponto | Ficheiro | Valor atual |
| --- | --- | --- |
| Prompt de geração de código | `services/codegen.py` | *"You are a C code generator"* e as regras do prompt |
| Comando de compilação | `services/testcases.py` | `["gcc", "-o", BINARY_FILE, CODE_FILE]` |
| Comando de execução | `services/testcases.py` | `[BINARY_FILE]` |
| Tipo de questão CodeRunner | `services/moodle.py` | `"c_program"` |

Uma abordagem incremental que não exige reescrever o pipeline:

1. Acrescentar um campo `language` a `StatementRequest`, com `Literal["c"]` como único valor aceite inicialmente.
2. Extrair as quatro constantes acima para uma tabela indexada por linguagem — prompt, comando de compilação, comando de execução, tipo CodeRunner.
3. Propagar `language` através de `statement.json`, que hoje guarda apenas `name` e `statement`.

O terceiro ponto é o que exige mais cuidado: as etapas seguintes só conhecem o que está no ficheiro.

!!! note "Linguagens interpretadas simplificam a etapa 4"
    Para Python, a fase de compilação desaparece e a execução passa a `["python", CODE_FILE]`. A tabela de linguagens precisa de tornar a compilação opcional, não apenas parametrizável.

## Lacunas conhecidas

Estas não são hipóteses — cada uma está confirmada no código e documentada na secção correspondente.

### Prioridade alta

| Lacuna | Impacto | Onde ler mais |
| --- | --- | --- |
| **Sem ficheiro de dependências** | Não é possível reproduzir o ambiente. Cada pessoa instala de memória | [Instalação](../getting-started/installation.md#instalar-as-dependencias) |
| **Sem testes automatizados** | Nenhuma alteração pode ser validada sem execução manual | [Testes](testing.md) |
| **Estado global em `cache/`** | Pedidos concorrentes corrompem-se mutuamente, sem erro | [Cache e estado](../architecture/cache-and-state.md#concorrencia) |
| **Execução de código sem isolamento** | O código gerado corre sem sandbox, timeout ou limite de memória | [Pipeline](../architecture/pipeline.md#limites-desta-etapa) |
| **Sem autenticação** | Qualquer cliente que alcance a porta consome a chave de API | [Deploy](../deployment/index.md#o-que-falta-antes-de-expor-o-servico) |

### Prioridade média

| Lacuna | Impacto | Onde ler mais |
| --- | --- | --- |
| **`difficulty` sem validação** | Valores com grafia errada são ignorados em silêncio | [Erros](../api/errors.md#422-validacao) |
| **Tags fixas no template** | Todas as questões saem como `Fácil` e `Revisado` | [Templates](../architecture/moodle-xml.md#limitacoes-conhecidas) |
| **Entradas e saídas não escapadas no XML** | Saídas com `<`, `>` ou `&` produzem XML mal formado | [Templates](../architecture/moodle-xml.md#nivel-do-caso-de-teste) |
| **Sem saneamento de cercas de markdown** | Uma cerca na resposta do modelo falha na etapa 4 | [Pipeline](../architecture/pipeline.md#2-gen_code) |
| **URL base fixa no código** | Trocar de provedor exige editar `config.py` | [Integração com o LLM](../architecture/llm-integration.md#trocar-de-provedor) |
| **Artefactos versionados** | `cache/` e um binário `.exe` estão no controlo de versões | [Cache e estado](../architecture/cache-and-state.md#ficheiros-versionados-que-nao-deviam-estar) |
| **Configuração versionada** | `config/LLM_Config.txt` contém um caminho de uma máquina real | [Configuração](../getting-started/configuration.md) |

### Sinalizado pelas ferramentas

| Item | Detalhe |
| --- | --- |
| **API Pydantic v1 sobre Pydantic v2** | `models.py` usa `@validator` e o router usa `.dict()`. Ambos funcionam com avisos de descontinuação; os equivalentes são `@field_validator` e `.model_dump()` |
| **`TestClient` em produção** | O orquestrador usa uma ferramenta de teste para se chamar a si próprio. Ver [Arquitetura](../architecture/index.md#o-orquestrador-chama-a-sua-propria-api) |

!!! tip "Por onde começar"
    Um `requirements.txt` e uma entrada em `.gitignore` para `cache/` são alterações de minutos que removem fricção real para quem entra no projeto. A seguir, um `Literal` em `difficulty` e a remoção de cercas de markdown em `codegen.py` eliminam as duas classes de erro silencioso mais frequentes.

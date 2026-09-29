# Desenvolvimento

<p class="lead">O que é preciso saber para alterar este código com confiança: como está organizado, que convenções seguir, como verificar alterações, e as lacunas que já são conhecidas.</p>

!!! info "Antes de mais, o harness"
    Como se trabalha aqui — branches, ficheiros de tarefa, o portão, revisão, agentes — está em [`AGENTS.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/AGENTS.md), na raiz do repositório. Esta secção cobre o código; esse ficheiro cobre o processo.

!!! warning "Confirme que o problema pertence a este repositório"
    Este é um protótipo do EPIC-017, fora do MVP. Autenticação, base de dados, filas e sandbox pertencem à plataforma. Verificação de escopo, rastreabilidade da geração e qualidade das questões pertencem aqui. Ver [Contexto do produto](../product/index.md).

## Dimensão do projeto

Cerca de mil linhas de Python, em módulos pequenos com uma responsabilidade cada. O percurso de um pedido HTTP até ao ficheiro escrito continua a ler-se de ponta a ponta em poucos minutos.

```text
src/codeexpert/   aplicação
tests/            unit/ e integration/
scripts/          check.sh é o portão
docs/adr/         porque é que as coisas estão assim
```

## Nesta secção

<div class="grid cards" markdown>

-   :material-folder-outline: **[Estrutura do projeto](project-structure.md)**

    ---

    O papel de cada módulo, a direção das dependências e onde acrescentar código novo.

-   :material-format-list-checks: **[Convenções](conventions.md)**

    ---

    Os padrões que o código segue, e o que a ferramenta já decide por si.

-   :material-test-tube: **[Testes e verificação](testing.md)**

    ---

    Como a suite corre sem rede e sem compilador, e o que ainda só se confirma à mão.

-   :material-lifebuoy: **[Resolução de problemas](troubleshooting.md)**

    ---

    Os sintomas mais frequentes, com o diagnóstico e a correção de cada um.

</div>

## O modelo mental

Três ideias explicam quase todo o código:

**1. Os serviços não conhecem HTTP.** Nada abaixo de `api/` importa FastAPI. Os serviços levantam as exceções de `errors.py` e uma tabela única em `api/errors.py` traduz cada uma num código de estado. É a convenção mais importante do projeto.

**2. O estado vive em ficheiros, um diretório por execução.** Cada etapa lê o *workspace* da execução, trabalha e volta a escrever. É isso que torna o pipeline retomável e inspecionável — e o `run_id` é o que permite duas gerações em paralelo.

**3. Só uma etapa produz verdade.** As saídas esperadas vêm da execução real do binário compilado, nunca do modelo. Tudo o resto é geração assistida que um humano deve rever.

## Lacunas conhecidas {#lacunas-conhecidas}

Ordenadas por retorno sobre esforço. O contexto completo está na [análise de lacunas](../product/gap-analysis.md#o-que-fazer-a-seguir).

| # | Alteração | Esforço | Porque importa |
| --- | --- | --- | --- |
| 1 | Verificação de escopo com um *parser* | Alto | A lacuna mais grave — FEAT-024. Hoje nada confirma que a solução respeitou as restrições pedidas |
| 2 | Portão de aprovação humana | Médio | `meta.json` já tem o campo `reviewed`; falta o fluxo que o põe a `true` |
| 3 | Acervo de referência para ancoragem | Alto | A geração não se apoia em questões aprovadas anteriores |
| 4 | Isolamento real da execução | Alto | `LocalGccRunner` limita tempo e saída, mas não isola. Ver [ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md) |
| 5 | Política de retenção para `var/runs/` | Baixo | Cresce sem limite; hoje só `make clean` o esvazia |
| 6 | Registo de custo por execução | Baixo | `meta.json` regista modelo e versão de prompt, mas não *tokens* nem custo |

!!! tip "Se for a sua primeira contribuição"
    Os itens 5 e 6 são pequenos, independentes e tocam em código que já existe — bons primeiros PRs. O item 1 é o que desbloqueia o valor real do protótipo.

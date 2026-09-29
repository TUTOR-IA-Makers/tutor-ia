---
hide:
  - navigation
  - toc
---

<div class="ce-hero" markdown>

<span class="ce-hero__eyebrow">Protótipo · Pilar 1 · EPIC-017</span>

# CodeExpert

<p class="ce-hero__sub">
Serviço HTTP que gera exercícios de programação em C do zero — enunciado, solução de referência, entradas de teste e casos de teste verificados por execução real — e exporta tudo como um ficheiro XML pronto a importar no Moodle CodeRunner.
</p>

[Começar agora](getting-started/index.md){ .md-button .md-button--primary }
[Contexto do produto](product/index.md){ .md-button }

</div>

!!! info "O que este repositório é, e o que não é"
    O CodeExpert é um **protótipo do EPIC-017 — Geração de questões com IA**, o Pilar 1 de uma plataforma educacional mais ampla. Nos documentos de planeamento, esse épico está na **Onda 3 e explicitamente fora do MVP**.

    Este código **não** é a plataforma. Não tem autenticação, base de dados, sandbox, análise estrutural nem cálculo de notas — nada disso lhe compete, e todos esses itens pertencem a épicos anteriores que ainda não existem.

    O que faz, faz de ponta a ponta: produz uma questão CodeRunner utilizável a partir de um conjunto de restrições pedagógicas. Ver [Contexto do produto](product/index.md) para o enquadramento e [Análise de lacunas](product/gap-analysis.md) para a distância até ao alvo.

## O que é

Criar uma questão de CodeRunner à mão é trabalho repetitivo: escrever o enunciado, programar a solução, inventar dezenas de entradas, executar cada uma para saber a saída esperada e depois embrulhar tudo em XML.

O CodeExpert automatiza esse ciclo. Um pedido HTTP descreve as **restrições pedagógicas** do exercício — pode usar `if`? e `else`? repetição? funções? vetores? qual a dificuldade? — e o serviço devolve uma questão completa.

O ponto crítico é que as saídas esperadas **não são geradas por um modelo de linguagem**. O serviço compila a solução com `gcc` e executa-a com cada entrada, capturando o `stdout` real. O que vai para o Moodle é o comportamento observado do programa, não uma previsão.

!!! quote "Porque isso importa mais do que parece"
    É o mesmo princípio que atravessa toda a plataforma alvo: **a IA produz texto, não veredictos.** A regra `RN-NOTA-01` proíbe qualquer saída de modelo de entrar no cálculo de uma nota. Este protótipo aplica a versão correspondente na geração — o que é verificável, verifica-se por execução.

## Principais funcionalidades

<div class="grid cards" markdown>

-   :material-text-box-outline: **Enunciados sob restrições**

    ---

    Cinco eixos combináveis (`if`, `else`, repetição, funções, vetores/matrizes) e cinco níveis de dificuldade traduzem-se num prompt em português que descreve exatamente o que a solução pode e não pode usar.

    [:octicons-arrow-right-24: Referência dos parâmetros](api/generation.md#gen_statement)

-   :material-language-c: **Solução de referência em C**

    ---

    O modelo recebe o enunciado gerado e produz código C puro, sem markdown, que lê de `stdin` sem imprimir mensagens de prompt — o formato que o CodeRunner espera.

    [:octicons-arrow-right-24: Como funciona](architecture/pipeline.md#2-gen_code)

-   :material-console: **Casos de teste executados, não previstos**

    ---

    `gcc` compila a solução, o binário é executado com cada entrada e o `stdout` capturado torna-se a saída esperada. Se o código não compilar, o pipeline falha em vez de exportar lixo.

    [:octicons-arrow-right-24: Geração de casos de teste](architecture/pipeline.md#4-gen_testcases)

-   :material-file-xml-box: **Exportação Moodle XML**

    ---

    Três templates com marcadores `Macro_*` montam o XML final. Exportações sucessivas **acumulam** questões no mesmo ficheiro, permitindo construir um questionário inteiro.

    [:octicons-arrow-right-24: Templates e acumulação](architecture/moodle-xml.md)

-   :material-swap-horizontal: **Provedor LLM configurável**

    ---

    A integração usa a API de *chat completions* compatível com OpenAI. Modelo e chave vivem num ficheiro de configuração fora do código, recarregável em tempo de execução.

    [:octicons-arrow-right-24: Configuração](getting-started/configuration.md)

-   :material-play-box-multiple: **Um endpoint ou cinco**

    ---

    `POST /create_question` corre o pipeline inteiro. Os cinco endpoints individuais expõem cada etapa isoladamente, para inspecionar ou repetir apenas uma parte.

    [:octicons-arrow-right-24: Pipeline passo a passo](guides/step-by-step-pipeline.md)

</div>

## Quick start

!!! warning "Pré-requisitos obrigatórios"
    Python 3.13, um compilador `gcc` no `PATH` e uma chave de API OpenAI guardada num ficheiro local. Os detalhes estão em [Instalação](getting-started/installation.md).

```bash
# 1. Dependências da aplicação
uv venv
uv pip install fastapi uvicorn requests pydantic

# 2. Aponte config/LLM_Config.txt para o ficheiro da sua chave
#    (ver Configuração)

# 3. Arranque o servidor
python main.py
```

O servidor fica em `http://127.0.0.1:8000` e a raiz redireciona para o Swagger UI em `/docs`. Para gerar a primeira questão:

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "facil", "can_has_repetition": true},
       "input_request": {"qty": 10}}'
```

O resultado fica em `Questions/Moodle_Questionnaire.xml`.

!!! danger "Reveja antes de usar com alunos"
    O protótipo **não verifica se a solução gerada respeitou as restrições pedidas**, e o XML exportado declara todas as questões como `Revisado` sem que nenhuma revisão tenha ocorrido.

    Não é um detalhe cosmético: é a lacuna que separa este protótipo do requisito FEAT-024, e está na lista *"nunca cortar"* do MVP. Ver [Verificações antes de usar com alunos](guides/import-into-moodle.md#verificacoes-antes-de-usar-com-alunos).

[:octicons-arrow-right-24: Guia completo, com respostas de cada etapa](guides/generate-a-question.md)

## Por onde continuar

<div class="grid cards" markdown>

-   :material-lightbulb-outline: **[Contexto do produto](product/index.md)**

    ---

    A plataforma que este protótipo antecipa: problema, pilares, personas, e onde o EPIC-017 se encaixa no roadmap.

-   :material-rocket-launch-outline: **[Primeiros passos](getting-started/index.md)**

    ---

    Pré-requisitos, instalação, o formato do ficheiro de configuração e como arrancar o servidor.

-   :material-sitemap-outline: **[Arquitetura](architecture/index.md)**

    ---

    Como as cinco etapas comunicam através do diretório `cache/`, e porque é que o orquestrador chama a sua própria API.

-   :material-api: **[API](api/index.md)**

    ---

    Os seis endpoints, com corpos de pedido, respostas reais e os códigos de erro que cada um pode devolver.

-   :material-compare: **[Análise de lacunas](product/gap-analysis.md)**

    ---

    Este protótipo confrontado com os requisitos do EPIC-017, item a item, ordenado por retorno sobre esforço.

-   :material-code-braces: **[Desenvolvimento](development/index.md)**

    ---

    Estrutura de pastas, convenções em uso, como verificar alterações e os problemas mais comuns.

</div>

## Estado do projeto

O CodeExpert é um protótipo. Vale saber, antes de o adotar:

| Área | Estado |
| --- | --- |
| Pipeline de geração | Funcional ponta a ponta |
| Verificação das restrições declaradas | :material-close: Não implementada — [lacuna 1](product/gap-analysis.md#as-restricoes-nao-sao-verificadas) |
| Portão de aprovação humana | :material-close: Ausente, apesar da tag `Revisado` — [lacuna 2](product/gap-analysis.md#o-portao-humano-nao-existe) |
| Acervo de referência para ancoragem | :material-close: Gera sem referência — [lacuna 3](product/gap-analysis.md#nao-ha-acervo-de-referencia) |
| Isolamento da execução | :material-close: Sem sandbox nem timeout — [lacuna 4](product/gap-analysis.md#execucao-sem-isolamento) |
| Testes automatizados | :material-close: Nenhum no repositório |
| Ficheiro de dependências da aplicação | :material-close: Ausente — ver [Instalação](getting-started/installation.md) |
| Autenticação da API | :material-close: Nenhuma — todos os endpoints são públicos |
| CI/CD | :material-close: Nenhum pipeline configurado |
| Suporte a linguagens além de C | :material-close: `gcc` e `c_program` estão fixos no código |

Cada um destes pontos está detalhado na secção correspondente, com o que existe e o que teria de mudar.

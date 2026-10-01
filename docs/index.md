---
hide:
  - navigation
  - toc
---

<div class="ce-hero" markdown>

<span class="ce-hero__eyebrow">Protótipo · EPIC-017 · Sprint 0 de 5</span>

# CodeExpert

<p class="ce-hero__sub">
Serviço HTTP que gera exercícios de programação em C — enunciado, solução de referência e casos de teste — e exporta como XML para o Moodle CodeRunner. As saídas esperadas vêm da execução real da solução, nunca de um modelo.
</p>

[Primeiro dia](onboarding/index.md){ .md-button .md-button--primary }
[Arquitetura](architecture/index.md){ .md-button }
[Roadmap até 30/11](product/roadmap.md){ .md-button }

</div>

## O que é

Hoje o CodeExpert é uma API FastAPI sem interface, sem banco de dados e sem autenticação, que roda na máquina de quem desenvolve. Um pedido descreve as restrições pedagógicas do exercício (pode usar `if`? repetição? funções? vetores? qual o nível?) e o serviço:

1. pede a um modelo de linguagem o enunciado, a solução em C e as entradas de teste;
2. compila a solução com `gcc` e executa com cada entrada — o `stdout` real vira a saída esperada;
3. monta um XML que o Moodle CodeRunner importa.

Até **30/11** a equipe vai transformar isso num produto usável por um professor: interface web, banco de questões, verificação de escopo, aprovação humana e deploy público. O recorte está no [Plano de entrega](product/plano-30-11.md).

!!! quote "A regra que explica o código"
    **O que pode ser verificado por execução nunca é previsto por um modelo.** Detalhe em [Primeiro dia](onboarding/index.md#a-regra-que-explica-o-codigo).

## Estado atual

<span class="ce-badge ce-status--done">Implementado</span> existe no código de `main` ·
<span class="ce-badge ce-status--wip">Em desenvolvimento</span> tem issue aberta na sprint atual ·
<span class="ce-badge ce-status--planned">Planejado</span> está no plano, ainda sem código

| Área | Estado | Onde |
| --- | --- | --- |
| Pipeline de geração (5 etapas) e exportação Moodle XML | <span class="ce-badge ce-status--done">Implementado</span> | [Pipeline](architecture/pipeline.md) |
| Saídas esperadas por execução real, com limite de tempo e de saída | <span class="ce-badge ce-status--done">Implementado</span> | [Pipeline § 4](architecture/pipeline.md#4-casos-de-teste) |
| Rastreabilidade (modelo e versão de prompt por execução) | <span class="ce-badge ce-status--done">Implementado</span> | [Visão geral](architecture/index.md#o-diretorio-da-execucao) |
| Gate único (`make check`), CI e harness para agentes | <span class="ce-badge ce-status--done">Implementado</span> | [Harness](reference/harness.md) |
| Imagem Docker com `gcc` e deploy contínuo no Cloud Run | <span class="ce-badge ce-status--wip">Em desenvolvimento</span> | [Roadmap](product/roadmap.md#infraestrutura-e-deploy) |
| Esqueleto do front-end e design system | <span class="ce-badge ce-status--wip">Em desenvolvimento</span> | [Roadmap](product/roadmap.md#interface-do-professor) |
| Taxonomia e catalogação do acervo de referência | <span class="ce-badge ce-status--wip">Em desenvolvimento</span> | [Roadmap](product/roadmap.md#acervo-de-referencia) |
| Postgres, banco de questões e geração como job | <span class="ce-badge ce-status--planned">Planejado</span> | [Roadmap](product/roadmap.md#estado-da-geracao) |
| Verificação de escopo com `tree-sitter-c` | <span class="ce-badge ce-status--planned">Planejado</span> | [Roadmap](product/roadmap.md#verificacao-de-escopo) |
| Revisão e aprovação humana | <span class="ce-badge ce-status--planned">Planejado</span> | [Roadmap](product/roadmap.md#revisao-e-aprovacao) |
| Acesso por convite, cota e teto de custo | <span class="ce-badge ce-status--planned">Planejado</span> | [Roadmap](product/roadmap.md#acesso-e-custo) |
| Sandbox isolado (Judge0) | Fora do recorte de 30/11 | [Roadmap](product/roadmap.md#execucao-de-codigo) |

!!! danger "Revise antes de usar com alunos"
    Hoje nada verifica se a solução gerada respeita as restrições pedidas. Uma questão "sem repetição" pode sair com um `for`. As questões exportadas chegam ao Moodle com a etiqueta `Nao revisado`.

## Onde encontrar cada resposta

<div class="grid cards" markdown>

-   :material-compass-outline: **Como eu rodo?**

    ---

    Pré-requisitos, clone, configuração, primeira questão gerada.

    [:octicons-arrow-right-24: Primeiro dia](onboarding/index.md)

-   :material-source-pull: **Como eu contribuo?**

    ---

    Da issue ao PR, com o harness, o gate e o agente de código.

    [:octicons-arrow-right-24: Da issue ao PR](guides/first-task.md)

-   :material-sitemap-outline: **Como funciona a arquitetura?**

    ---

    Componentes, fluxo de dados, onde fica o estado, o que não existe.

    [:octicons-arrow-right-24: Arquitetura](architecture/index.md)

-   :material-robot-outline: **Como funciona o harness?**

    ---

    `AGENTS.md`, `.agents/`, arquivo de tarefa, gate, CODEOWNERS.

    [:octicons-arrow-right-24: Harness](reference/harness.md)

-   :material-map-outline: **O que ainda vamos desenvolver?**

    ---

    Cada mudança como Hoje → Planejado → Esperado, sprint a sprint.

    [:octicons-arrow-right-24: Roadmap até 30/11](product/roadmap.md)

-   :material-api: **Qual é o contrato da API?**

    ---

    Endpoints, corpos, respostas e códigos de erro.

    [:octicons-arrow-right-24: Referência da API](reference/api.md)

</div>

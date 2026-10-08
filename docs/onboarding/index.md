# Primeiro dia

<p class="lead">Do zero até gerar a primeira questão na sua máquina, mais o contexto mínimo para entender o código. Leva cerca de 30 minutos. O passo seguinte é a sua primeira tarefa.</p>

## 1. O que estamos construindo

A equipe faz parte de um projeto maior: uma plataforma de avaliação formativa de programação em C para disciplinas introdutórias. Ela é descrita em documentos de planejamento (visão, épicos, SAD) e **ainda não existe** — está resumida em [Plataforma-alvo](../product/index.md).

Este repositório implementa uma parte dela: o **EPIC-017, geração de questões com IA**. Até 30/11 o objetivo é entregar esse gerador como produto usável por um professor:

> Um professor que já usa o Moodle CodeRunner abre uma URL, descreve as restrições pedagógicas de um exercício, recebe uma questão gerada e verificada, edita o que quiser, aprova e baixa um XML pronto para importar.

Hoje só existe a parte de gerar e exportar, via API. O que falta, e em que ordem, está em [Roadmap até 30/11](../product/roadmap.md).

## 2. A regra que explica o código {#a-regra-que-explica-o-codigo}

!!! quote "A regra"
    **Nenhuma saída de modelo de linguagem entra no cálculo de uma nota, em nenhuma proporção.**

Neste repositório ela aparece assim: **o que pode ser verificado por execução nunca é previsto.** O modelo escreve o enunciado e uma solução candidata; depois o serviço compila essa solução com `gcc`, executa com cada entrada, e o `stdout` real vira a saída esperada. Nunca se pergunta ao modelo o que o programa imprimiria — e, no plano, nunca se deixa uma pessoa digitar a saída esperada.

Isso explica `execution/`, o protocolo `CodeRunner`, os limites de tempo e por que os testes cuidam tanto de uma etapa que parece só encanamento.

## 3. Instalar e rodar

### Pré-requisitos

| Requisito | Para quê | Verificar |
| --- | --- | --- |
| Python 3.12 ou superior | A aplicação | `python3 --version` |
| `gcc` | A etapa 4 compila a solução gerada | `gcc --version` |
| `git`, `bash`, `make` | Scripts do projeto. No Windows, use WSL | `make --version` |
| Chave de API de um provedor compatível com OpenAI | As etapas 1 a 3 chamam o modelo | — peça à equipe |
| `gh` (GitHub CLI), opcional | `make task` preenche o título da issue; `gh pr create` | `gh --version` |

Instalar o `gcc`: `sudo apt install build-essential` (Debian/Ubuntu), `sudo dnf install gcc` (Fedora), `xcode-select --install` (macOS).

### Clonar e instalar

```bash
git clone https://github.com/TUTOR-IA-Makers/tutor-ia.git
cd tutor-ia
make setup                # cria .venv, instala dependências, copia .env.example para .env
```

`make setup` pode ser executado de novo quando quiser. Ele instala o pacote em modo editável com os extras `dev` e `docs`, então mudanças em `src/` têm efeito sem reinstalar.

??? note "Sem `make`"
    ```bash
    python3 -m venv .venv
    .venv/bin/pip install -e ".[dev,docs]"
    cp .env.example .env
    ```

### Configurar

Abra o `.env` e preencha a chave:

```bash title=".env"
CODEEXPERT_LLM_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX
CODEEXPERT_LLM_MODEL=gpt-4o-mini
```

O `.env` está no `.gitignore` e nunca é commitado. As demais variáveis têm valores padrão; a lista completa está em [Comandos e configuração](../reference/configuration.md#variaveis-de-ambiente).

### Verificar e rodar

```bash
make check      # o gate: formatação, lint, testes, docs. Deve ficar verde num clone novo
make run        # API em http://127.0.0.1:8000, com recarga automática
```

Em outro terminal:

```bash
curl http://127.0.0.1:8000/health                 # {"status": "ok", "version": "0.2.0", "commit": null}
curl "http://127.0.0.1:8000/config?verify=true"   # api_key_configured e provider_reachable devem ser true
```

A raiz `http://127.0.0.1:8000/` abre o Swagger UI, onde dá para chamar todos os endpoints pelo navegador.

### Gerar a primeira questão

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "facil", "can_has_repetition": true}, "qty": 5}'
```

Leva algumas dezenas de segundos. O resultado fica em:

| Caminho | Conteúdo |
| --- | --- |
| `var/runs/<run_id>/` | Enunciado, solução, entradas, casos de teste e `meta.json` (modelo e versão de prompt usados) |
| `var/questions/Moodle_Questionnaire.xml` | O XML para importar no Moodle. Cada exportação acrescenta uma questão |

`var/` é ignorado pelo Git. Se algo falhar, veja [Problemas comuns](../reference/troubleshooting.md). Para controlar cada etapa, veja [Gerar uma questão](../guides/generate-a-question.md).

## 4. O código em cinco minutos

```text
src/codeexpert/
  settings.py    configuração, só do ambiente
  errors.py      exceções de domínio; a API traduz cada uma num status HTTP
  domain.py      Constraints, Statement, TestCase, RunMetadata
  workspace.py   um diretório por execução, em var/runs/<run_id>/
  llm/           o único módulo que fala com o provedor de modelos
  execution/     compila e executa C — o ponto onde um sandbox real entra
  generation/    as etapas do pipeline, e prompts.py
  export/        Moodle CodeRunner XML e seus templates
  api/           FastAPI: rotas, schemas, dependências, mapeamento de erros
```

As dependências têm um sentido só:

```text
api → generation → {llm, execution, export, workspace} → {domain, settings, errors}
```

Nada abaixo de `api/` importa FastAPI. Nada fora de `llm/` chama um modelo. Nada fora de `execution/` chama `subprocess`. Detalhes em [Arquitetura](../architecture/index.md) e [Código](../reference/codebase.md).

## 5. Como a equipe trabalha

| Aspecto | Como é |
| --- | --- |
| Equipe | Seis pessoas em três duplas: **A** backend e infra, **B** front-end e comunicação, **C** acervo, harness da IA e exposição segura |
| Ciclo | Cinco sprints de 28/09 a 30/11; congelamento em 23/11 |
| Trabalho | Uma issue por história, com labels de épico, dupla, sprint e prioridade |
| Rotina | Daily assíncrona no canal (ontem / hoje / bloqueio), sincronização às quartas, review e retro no fim da sprint |
| Revisão | PR revisado em até 24 h úteis; um humano aprova e faz o merge |
| Agentes | Claude Code, Codex e Antigravity, todos com as mesmas instruções: `AGENTS.md` |

Detalhes do calendário, das duplas e das cerimônias estão no [Plano de entrega](../product/plano-30-11.md#3-as-tres-duplas-e-a-regra-de-atravessar).

**Próximo passo:** [Da issue ao PR](../guides/first-task.md) — o fluxo completo da sua primeira tarefa.

## Vocabulário

| Termo | Significado |
| --- | --- |
| **Execução** (*run*) | Uma passagem pelo pipeline, com seu `run_id` e seu diretório em `var/runs/` |
| **Gate** | `make check` — o mesmo script que o CI roda |
| **Arquivo de tarefa** | `.agents/tasks/<issue>-<slug>.md`, o contexto de uma branch |
| **G0 … G9** | Os épicos do plano de 30/11 (ex.: G2 = confiabilidade da geração) |
| **S0 … S4** | As sprints do plano |
| **EPIC-nnn, FEAT-nnn** | Épicos e features dos documentos de planejamento da plataforma |
| **SAD** | O documento de arquitetura da plataforma-alvo (v0.1, rascunho) |
| **Onda 0–3** | As fases de entrega da plataforma-alvo. O EPIC-017 é da Onda 3 |
| **Violação de escopo** | A solução usa uma estrutura que o exercício proíbe (ex.: `for` numa questão "sem repetição") |
| **Acervo** | Questões reais, catalogadas e aprovadas, usadas como referência para a geração |
| **Eixo × nível** | A combinação conteúdo × dificuldade que classifica uma questão |

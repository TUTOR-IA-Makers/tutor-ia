# 18 e 19 · G4-3 Etapas da geração e G4-4 Estados de erro e vazio

- **Branch** `feat/18-generation-progress`
- **Issues** #18 e #19, numa PR só (pedido do driver)
- **Started** 2026-10-26, retomada sobre a `main` em 2026-11-23
- **Driver** Diih-Olivv

## Goal

O professor acompanha as cinco etapas da geração em sequência, com a atual
destacada. Quando a geração falha, a tela diz em qual etapa parou e o que fazer,
sem stack trace; quando o servidor reiniciou no meio, oferece retomar. Fechar e
reabrir a página não perde a geração. Todo erro tem texto em português que diz o
que fazer a seguir, com mensagens distintas para cota, provedor de IA e sessão
expirada, e a biblioteca vazia convida a gerar a primeira questão.

## Out of scope

- Backend: nada em `backend/src/`. O front usa o contrato que a `main` já expõe
  (`job.resumable`, `POST /questions/{id}/resume`).
- Cota de gerações no backend (G0-6). O front trata o `429`; o backend não o emite.
- `/regenerate`, que o front chama e o backend não tem.
- Guarda de rota para sessão: o `401` vira um link para o login, sem redirecionar sozinho.

## Constraints

- `localStorage` é proibido pelo ESLint. Nada da geração fica no navegador.
- `failureReason` pode trazer traceback ou saída do `gcc`.
- O `detail` do backend vem em inglês.

## Plan

- [x] `failedStep`, `stepPosition`, `failureSummary` e texto `recovery` por etapa
- [x] `GenerationFailure` no progresso e na revisão
- [x] `resumable` no domínio, lido de `job.resumable`; `resume` no contrato, no http e no mock
- [x] Botão **Retomar geração** quando a geração foi interrompida
- [x] `describeError` com motivo e próximo passo; `401`, `429`, `502` e `503` distintos
- [x] `detail` do backend fora das mensagens
- [x] `401` nas telas de carregamento oferece **Entrar de novo** (`/entrar?proximo=`)
- [x] Biblioteca vazia com convite (já existia; testes reforçados)
- [x] Testes e documentação

## Decisions taken along the way

- Fechar e reabrir: o estado vem do servidor (`GET .../generation`) a cada montagem.
  O teste desmonta a tela, avança o relógio do mock e monta de novo sem cache.
- Etapa que falhou = `GENERATION_STEPS[completedSteps]`, limitada à última.
- `failureSummary` mostra só a primeira linha (até 240 caracteres) e descarta o
  motivo inteiro se ele parecer traceback.
- Interrupção não é falha da etapa: título "A geração foi interrompida na etapa N
  de 5", tom de aviso, e a ação é retomar o mesmo run em vez de gerar de novo.
- `job` é opcional no DTO, para um backend anterior ao ADR-0017 continuar válido.
- O WIP de outubro usava o `detail` do backend como motivo. Desde então o backend
  passou a responder em inglês, então o `detail` saiu da tela.
- O `401` no formulário de geração não leva link: sair da página perderia o
  formulário preenchido. A mensagem diz para entrar de novo.
- No modo simulado, `q-0142` começa interrompida, para a demonstração.
- Revisão do driver (2026-11-23): o aviso de interrupção mostra só a etapa, com uma
  barra da posição; **Retomar geração** (verde) fica nas ações, ao lado de **Gerar de
  novo** (azul), em tamanho grande. As notas "Confira o enunciado..." e "Ao aprovar..."
  saíram da revisão. A questão inexistente ganhou tela própria, centralizada, com só
  o link de volta.

## Verification

`make check` em 2026-11-23: todas as etapas passam.

- Python: formatação, lint e 416 testes (389 passam, 27 pulados, 0 falhas).
- Front: tipos, lint, contraste de tokens; 484 testes em 73 arquivos, cobertura
  de 94.38% em statements; build com 70.96 kB de 150 kB.
- Auditoria de dependências: passa, com um aviso moderado em `fast-uri` que já
  vem da `main`.
- Documentação: `mkdocs build --strict` passa.
- `make front-e2e`: não rodou nesta máquina, porque falta o Chromium do Playwright
  (`npx playwright install chromium`). Precisa rodar antes do merge.

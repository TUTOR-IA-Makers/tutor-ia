# frontend-setup-inicial — Front-end: scaffold, componentes, telas mockadas e base de integração

- **Branch** `frontend/setup-inicial`
- **Issue** A confirmar
- **Started** 2026-10-05
- **Driver** A confirmar

## Goal

`frontend/` tem a stack da `SPEC.md`, a identidade de `TutorIA-Identidade-Visual.md` em `tokens.css`, componentes padronizados em `components/ui`, todas as telas de `telas-mock/` funcionando com dados simulados e uma camada de serviços pronta para trocar o mock pelo FastAPI com uma variável de ambiente.

## Out of scope

- FastAPI servindo a SPA, headers de segurança no backend (SPEC PR 3).
- Dockerfile e `.dockerignore` (SPEC PR 4).
- Job de Node e Playwright no `ci.yml` (SPEC PR 5, exige aprovação humana).
- ADR-0009 e ADR-0010 (decisão humana).
- orval e `openapi.json` (SPEC PR 9); endpoints reais do backend.
- Landing com vídeo (G5-2) e entrada por convite (G4-9).
- Mover `TutorIA-Identidade-Visual.md` para `docs/design/identidade.md`.

## Constraints

- `frontend/` não importa nada de `src/`.
- Nenhum valor visual fora de `tokens.css`.
- Versões exatas em `package-lock.json`.

## Plan

- [x] Scaffold e configuração das ferramentas
- [x] Tokens da identidade visual, fontes self-hosted, logo SVG
- [x] Componentes de `components/ui`
- [x] Telas: biblioteca, exportação, gerar, acompanhar, revisar, ajuda, 404
- [x] Mudanças pedidas: dificuldade 500 a 3500 em passos de 50, casos de teste específicos, revisão em duas abas com editor de código
- [x] Camada `services/` com adaptadores mock e http
- [x] Testes unitários, de componente, integração, e2e e acessibilidade
- [x] Documentação atualizada

## Decisions taken along the way

- TypeScript 6.0 em vez de 7.0: `typescript-eslint` 8.71 aceita até `<6.1`.
- ESLint 9 em vez de 10: `eslint-plugin-jsx-a11y` 6.10 aceita até ESLint 9.
- `zod/mini` em vez de `zod`, pelo orçamento de 150 KB do bundle inicial.
- `npm audit` no gate só para dependências de produção: `braces` (via `stylelint`) tem advisory alto sem versão corrigida.
- `check.sh` pula o front quando `npm` ou `node_modules` não existem, para não quebrar o CI antes do PR 5.
- Faixas de dificuldade em palavras alinhadas à grade de 50: Muito fácil até 950, Fácil até 1350, Médio até 1850, Difícil até 2350.
- Uma rota `/questoes/:id` para progresso e revisão, como na SPEC §9.1; a tela muda com o estado.
- Endpoints e DTOs do modo http são proposta, marcada como tal no README do front.
- Sem `VITE_PUBLIC_API_MODE`, o dev server usa `mock` e o build usa `http`: um build sem `.env` não publica dados falsos. O mock entra por `import()` dinâmico, fora do chunk inicial; o Playwright pede `mock` no `webServer.env`.

## Verification

Ver descrição do PR.

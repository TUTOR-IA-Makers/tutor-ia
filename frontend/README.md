# Front-end do CodeExpert

SPA em React 19 + TypeScript estrito, empacotada pelo Vite. Gera arquivos estáticos que o FastAPI vai servir no mesmo container (ainda não implementado). Não existe servidor Node em produção.

No `make front-dev` todas as telas rodam com **dados simulados** (modo `mock`). O build de produção usa a API real (modo `http`), a menos que `VITE_PUBLIC_API_MODE=mock` seja pedido explicitamente; ver [Integração com o FastAPI](#integração-com-o-fastapi).

## Requisitos

Node `24.21.0` (ver `.nvmrc`) e npm 11. O `.npmrc` exige a versão certa (`engine-strict`), fixa versões exatas e desliga scripts de instalação de pacotes (`ignore-scripts`).

```bash
make front-install   # npm ci
make front-dev       # Vite em 127.0.0.1:5173, com dados simulados
make run             # API em 127.0.0.1:8000, só necessária no modo http
```

Para rodar os testes de ponta a ponta uma vez por máquina: `npx playwright install chromium`.

## Telas

| Rota | Tela | Captura |
| --- | --- | --- |
| `/` | Redireciona para `/biblioteca` | |
| `/biblioteca` | Busca, filtros na URL, grade de questões, seleção de aprovadas e modal de exportação | [biblioteca](../docs/design/telas/biblioteca.png), [exportar](../docs/design/telas/exportar.png) |
| `/gerar` | Conteúdo, dificuldade em intervalo, casos de teste, casos específicos e estruturas em C | [gerar](../docs/design/telas/gerar.png) |
| `/questoes/:id` | Acompanhar geração enquanto o estado é `GERANDO`; revisão nos demais | [progresso](../docs/design/telas/progresso.png), [revisão: enunciado](../docs/design/telas/revisao-enunciado.png), [revisão: testes](../docs/design/telas/revisao-testes.png) |
| `/ajuda` | Passo a passo, estados, importação no Moodle, glossário, status do servidor | |
| `*` | 404 com volta à biblioteca | |

Mudanças em relação aos protótipos:

- **Dificuldade** é um intervalo de rating no estilo Codeforces: duas alças de 500 a 3500, passo 50. A faixa em palavras (Muito fácil a Muito difícil) é derivada do rating em `src/domain/difficulty.ts`.
- **Casos de teste específicos** é um campo opcional abaixo da quantidade. O texto vai no pedido de geração como `test_case_hints`.
- **Revisão** tem duas abas: "Enunciado e solução" (enunciado e, abaixo, a solução num editor escuro com números de linha, comentários em cor própria e terminal com o resultado da compilação) e "Casos de teste e restrições" (tabela entrada / esperada / obtida e verificação das estruturas). A aba fica na URL (`?aba=testes`).
- Rejeitar pede confirmação; estruturas em conflito ficam desabilitadas antes de o erro acontecer.

## Estrutura

```text
src/
  main.tsx             ponto de entrada; fontes, tokens.css e base.css
  app/                 providers, rotas (lazy), QueryClient, layout raiz e navbar
  routes/<tela>/       uma pasta por tela; compõe features
  features/<domínio>/  hooks do TanStack Query e componentes de domínio
    questions/         consultas, mutações, card, badge e tags da questão
    library/           filtros, seleção, barra e modal de exportação
    generate/          formulário de geração e schema Zod
    progress/          acompanhamento da geração com polling
    review/            abas da revisão e barra lateral de ações
    session/           professor da sessão e menu da conta
    health/            status do servidor
  services/            contrato de dados e adaptadores mock e http
  domain/              tipos e regras puras: estados, dificuldade, estruturas, filtros
  components/ui/       componentes visuais sem conhecimento de domínio
  lib/                 utilitários: cliente HTTP, erros, download, tokenizador de C
  styles/              tokens.css (fonte única de valores visuais) e base.css
  assets/brand/        logo.svg e logo-mono.svg
  test/                setup do Vitest, MSW, render com providers, axe
tests/
  unit/                testes dos scripts Node
  e2e/                 Playwright: fluxo completo, CSP, reflow, capturas
  a11y/                axe-core por rota
scripts/               contrast.mjs, check-bundle-secrets.mjs
```

Cada pasta expõe sua API por um `index.ts`. Importe pelo alias `@/`.

### Direção das dependências

```text
app → routes → features → services → domain → lib
                    └────→ components/ui ────→ lib
```

O ESLint bloqueia importações no sentido contrário. `components/ui` não conhece `domain` nem `services`; `domain` não conhece React Query nem HTTP. O front não importa nada de `src/` do backend.

### Componentes de `components/ui`

Avatar, BackLink, Button e LinkButton, Callout, Checkbox, Chip, CodeViewer, DescriptionList, Dialog, Disclosure, EmptyState, Field e FieldGroup, Icon, NumberStepper, PageHeader, Panel, ProgressBar, RangeSlider, SearchInput, Select, SkipLink, Spinner, LoadingState e ErrorState, StatusBadge, Tabs, Tag, Textarea, TextInput, Toast.

## Integração com o FastAPI

As telas nunca chamam `fetch`. Elas usam `useServices()`, que entrega um objeto com o contrato de `src/services/contracts.ts`:

| Serviço | Métodos |
| --- | --- |
| `questions` | `list`, `get`, `create`, `generation`, `approve`, `reject`, `regenerate`, `updateStatement`, `exportMoodleXml` |
| `session` | `currentTeacher`, `logout` |
| `system` | `health` |

Existem dois adaptadores para o mesmo contrato:

| Modo | Onde | O que faz |
| --- | --- | --- |
| `mock` (padrão no `make front-dev`) | `services/mock/`, carregado sob demanda e fora do chunk inicial | Banco em memória com as questões dos mocks, latência simulada, etapas que avançam com o tempo e `409` em transições inválidas |
| `http` (padrão no build) | `services/http/` | Chama a API real pelo cliente de `lib/http` |

Para usar o backend real:

```bash
cp .env.example .env.local
# VITE_PUBLIC_API_MODE=http
# VITE_PUBLIC_API_BASE_URL=/api/v1
```

O que já está pronto no modo `http`:

| Peça | Arquivo |
| --- | --- |
| Rotas e prefixo (`/api/v1`, proposta ainda sem ADR) | `services/http/endpoints.ts` |
| Formato das respostas, validado com Zod | `services/http/dto.ts` |
| Conversão DTO (snake_case) ↔ domínio (camelCase) | `services/http/mappers.ts` |
| Cliente: mesma origem, `credentials: 'same-origin'`, header anti-CSRF nas mutações, timeout, query string, download com `Content-Disposition` | `lib/http/` |
| Erros HTTP, rede e timeout traduzidos para o professor | `lib/http/describeError.ts` |
| Cache, polling da geração a cada 1,5 s e invalidação depois de cada ação | `features/questions/queries.ts` e `mutations.ts` |

O contrato do backend ainda não existe. Endpoints e DTOs são uma proposta. Quando a API ficar pronta:

1. Ajuste `endpoints.ts` e `dto.ts` ao `openapi.json` (ou troque por um cliente gerado a partir do `openapi.json`, por exemplo com o orval).
2. Ajuste `mappers.ts`. As telas não mudam, porque dependem só do domínio.
3. Rode `src/services/http/createHttpServices.test.ts`: ele usa MSW e mostra o que quebrou.

## Segurança

| Regra | Onde é garantida |
| --- | --- |
| Sem `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `eval`, `new Function` | ESLint |
| Sem `localStorage` nem `document.cookie` | ESLint |
| Requisições só para caminhos relativos à origem, com `credentials: 'same-origin'` e `redirect: 'error'` | `lib/http/client.ts` |
| Header `X-Requested-With` em toda mutação (proteção CSRF junto com `SameSite=Strict`) | `lib/http/client.ts` |
| Resposta da API validada com Zod antes de chegar à tela | `services/http/dto.ts` |
| Nome de arquivo baixado sem barras | `filenameFrom` em `lib/http/client.ts` |
| Erros 5xx não mostram o `detail` do servidor | `lib/http/describeError.ts` |
| `?next=` aceita só caminhos internos | `lib/navigation/safeNextPath.ts` |
| CSP restritiva em `<meta>` no build | plugin em `vite.config.ts` |
| Só variáveis `VITE_PUBLIC_*` chegam ao bundle | `envPrefix` em `vite.config.ts` |
| Nenhum padrão de chave, variável `CODEEXPERT_*` ou caminho de usuário em `dist/` | `npm run check:bundle-secrets` |
| Sem sourcemap em produção; dev server preso a `127.0.0.1` | `vite.config.ts` |
| Dependências de produção sem vulnerabilidade alta | `npm run audit:deps` |

A CSP em `<meta>` não suporta `frame-ancestors`. Os headers de segurança completos (incluindo `frame-ancestors`) ficam a cargo do FastAPI quando ele passar a servir a SPA.

## Estilo

Os valores vêm da página [Identidade visual](../docs/design/identidade.md) da documentação: azul `#243C8C` para navegar e iniciar, verde-azulado `#1B7A70` para concluir e aprovar, Source Sans 3 e IBM Plex Mono servidas pelo próprio projeto (latin, 4 arquivos woff2), ícones Lucide com traço 1,75.

Todo valor de cor, espaço, fonte, raio, sombra e duração vem de `src/styles/tokens.css`. O Stylelint recusa hex, `rgb()` e valores literais nessas propriedades em qualquer outro arquivo. `npm run contrast` recalcula o contraste WCAG de 32 pares de tokens e falha abaixo de 4.5 (texto) ou 3 (não-texto).

## Testes

| Comando | O que roda |
| --- | --- |
| `npm test` | Vitest: unitários (`lib`, `domain`, `services`), componentes e integração das telas com serviços mock, MSW e axe-core |
| `npm run test:coverage` | O mesmo, exigindo 80% em `features/`, `components/ui/`, `lib/`, `domain/` e `services/` |
| `npm run test:e2e` | Playwright contra o build de produção, em 1280px e 320px: fluxo completo, CSP, reflow e axe por rota |
| `SCREENSHOTS=1 npx playwright test tests/e2e/screens.spec.ts` | Capturas de todas as telas em `test-results/`; copie para `docs/design/telas/` ao atualizar |

O MSW recusa qualquer requisição sem handler, então um teste nunca chega à rede.

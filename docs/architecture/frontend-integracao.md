# Integração front-end e backend

<p class="lead">Como o front-end em <code>frontend/</code> vai falar com a API. Hoje os dois não se conectam: o front roda com dados simulados e o backend expõe outra forma de API. Esta página descreve a lacuna, a forma combinada para fechá-la e a ordem de trabalho.</p>

!!! warning "Quase tudo aqui é planejado"
    <span class="ce-badge ce-status--done">Implementado</span> as camadas do front-end, o contrato de serviços, o modo simulado e o cliente HTTP com cabeçalho anti-CSRF.
    <span class="ce-badge ce-status--planned">Planejado</span> a API de recursos em `/api/v1`, a sessão por cookie, as contas e convites, e cada fase da seção 6. A decisão está proposta no [ADR-0013](../adr/0013-resource-api-and-cookie-session.md) e ainda depende de aceite da equipe.

## 1. A lacuna, rota por rota

O front-end já chama uma API de recursos sob `/api/v1` (`frontend/src/services/http/endpoints.ts`). O backend de `main` expõe chamadas no estilo RPC na raiz, uma por etapa do pipeline (`src/codeexpert/api/routes/`), sem banco e sem sessão.

| O front chama | O backend de `main` tem | Falta |
|---|---|---|
| `GET /api/v1/questions` com filtros | nada | listar questões guardadas (G1-5); depende do banco (G0-4) |
| `POST /api/v1/questions` → `202 {id}` | `POST /create_question` síncrono, ou as quatro etapas `/gen_statement`, `/gen_code`, `/gen_inputs`, `/gen_testcases` | geração como job fora do ciclo da requisição (G0-8) |
| `GET /api/v1/questions/{id}` | nada | questão completa com casos e restrições |
| `GET /api/v1/questions/{id}/generation` | nada | andamento do job: etapa atual, estado, motivo da falha |
| `POST /api/v1/questions/{id}/approve`, `/reject`, `/regenerate` | nada | ciclo de vida da questão (G3-1, G3-2) |
| `PATCH /api/v1/questions/{id}/statement` | nada | edição do enunciado pelo professor |
| `POST /api/v1/exports/moodle` com `question_ids` | `POST /export_moodle_xml_question`, que escreve num arquivo compartilhado | exportador puro que devolve o XML na resposta (G1-8) |
| `GET /api/v1/session`, `POST /api/v1/session`, `POST /api/v1/session/logout` | nada | sessão (G4-9, G8-1) |
| `POST /api/v1/accounts` com `invite_code` | nada | cadastro por convite (G8-1) |
| `GET /health` | `GET /health` | nada; já bate |

## 2. A forma combinada

O backend ganha uma API de recursos em `/api/v1` que orquestra o pipeline no servidor. O navegador pede "crie uma questão" e consulta o andamento; quem encadeia as cinco etapas é o backend.

A alternativa de o navegador chamar as quatro etapas em sequência foi descartada: ela leva a orquestração para o cliente, deixa o estado de uma geração na memória de uma aba e obriga o front a conhecer a ordem das etapas. Fechar a aba no meio perderia a geração e o custo já pago ao modelo. O [ADR-0013](../adr/0013-resource-api-and-cookie-session.md) registra as alternativas.

As rotas RPC atuais continuam enquanto servirem ao Swagger e aos testes do pipeline. Elas saem quando a API de recursos cobrir o mesmo caso.

```mermaid
sequenceDiagram
    participant N as Navegador
    participant A as API /api/v1
    participant J as Job de geração
    participant B as Banco
    N->>A: POST /questions (rascunho)
    A->>B: cria questão GERANDO
    A-->>N: 202 {id}
    A->>J: inicia fora da requisição
    loop a cada poucos segundos
        N->>A: GET /questions/{id}/generation
        A->>B: lê etapa e estado
        A-->>N: etapa atual
    end
    J->>B: grava solução, casos, saídas esperadas
    N->>A: GET /questions/{id}
    A-->>N: questão completa
```

As saídas esperadas continuam vindo de compilar e executar a solução no job, nunca do modelo (regra 4 do `AGENTS.md`).

## 3. Camadas do front-end

<span class="ce-badge ce-status--done">Implementado</span> As camadas abaixo já existem, e o ESLint (`frontend/eslint.config.js`) recusa import na direção errada.

```mermaid
flowchart TD
    app["app/<br/><small>providers, rotas, layouts</small>"]
    routes["routes/<br/><small>uma página por rota</small>"]
    features["features/<br/><small>hooks do React Query e componentes de tela</small>"]
    services["services/<br/><small>contracts, http, mock</small>"]
    components["components/ui<br/><small>botões, campos, avisos</small>"]
    domain["domain/<br/><small>tipos e regras puras</small>"]
    lib["lib/<br/><small>http, navegação, dom</small>"]
    app --> routes --> features
    features --> services
    features --> components
    services --> domain
    features --> domain
    domain --> lib
    services --> lib
```

| Camada | Responsabilidade | Não pode |
|---|---|---|
| `domain/` | tipos do produto (`Question`, `Teacher`, `LoginCredentials`) e regras sem efeito colateral | importar serviço, componente, feature ou React |
| `services/contracts.ts` | interfaces `QuestionsService`, `SessionService`, `SystemService` | conhecer URL ou formato de fio |
| `services/http/` | endpoints, validação da resposta com zod (`dto.ts`), tradução snake_case para o domínio (`mappers.ts`) | importar feature ou componente |
| `services/mock/` | a mesma interface com dados fictícios em memória | entrar no bundle de produção; o carregamento é por `import()` dinâmico |
| `features/` | telas e hooks; falam com o backend só por `useServices()` | importar `app/` ou `routes/`; chamar `fetch` direto |
| `routes/` | monta a página da rota e o título do documento | conter regra de negócio |
| `app/` | providers, roteador e layouts | ser importado por quem está abaixo |
| `components/ui` | peças visuais sem conhecimento do produto | importar domínio, serviço ou feature |
| `lib/` | utilidades genéricas (cliente HTTP, `safeNextPath`) | importar qualquer camada do produto |

O efeito prático: trocar de backend mexe só em `services/http/`. Uma mudança de nome de campo no fio é uma linha em `mappers.ts` e um campo em `dto.ts`; nenhuma tela muda.

## 4. Isolamento

| Mecanismo | Situação |
|---|---|
| A troca entre dados simulados e API real é só `VITE_PUBLIC_API_MODE` (`mock` ou `http`). Build de produção sem a variável usa `http`, para nunca cair em dado falso por acidente | <span class="ce-badge ce-status--done">Implementado</span> |
| Toda resposta passa por um schema zod antes de virar tipo do domínio; resposta fora do contrato vira `ResponseShapeError`, não tela quebrada | <span class="ce-badge ce-status--done">Implementado</span> |
| O cliente HTTP manda `credentials: 'same-origin'` e o cabeçalho `X-Requested-With: codeexpert-web` em todo método que não é GET | <span class="ce-badge ce-status--done">Implementado</span> |
| O ESLint proíbe `localStorage`, `document.cookie`, `dangerouslySetInnerHTML` e import entre camadas na direção errada | <span class="ce-badge ce-status--done">Implementado</span> |
| Uma suíte de contrato roda contra o mock e contra o cliente http com MSW, para os dois não divergirem | <span class="ce-badge ce-status--planned">Planejado</span> |
| O CI compara `/openapi.json` do backend com os DTOs do front e falha se divergirem | <span class="ce-badge ce-status--planned">Planejado</span> |
| Em produção, front e API no mesmo domínio atrás do proxy da VPS ([ADR-0011](../adr/0011-host-on-a-hostinger-vps.md)); CORS fechado | <span class="ce-badge ce-status--planned">Planejado</span> |

## 5. Contrato de autenticação

<span class="ce-badge ce-status--planned">Planejado</span> As telas `/entrar` e `/criar-conta` já existem no front e funcionam no modo simulado. O backend precisa responder assim:

| Requisição | Resposta |
|---|---|
| `POST /api/v1/session` com `{email, password}` | `204` e cookie de sessão `HttpOnly; Secure; SameSite=Lax; Path=/`. Credencial errada: `401` com a mesma mensagem para e-mail inexistente e senha errada |
| `GET /api/v1/session` | `200 {name, department}` ou `401` |
| `POST /api/v1/session/logout` | `204` e o cookie expirado |
| `POST /api/v1/accounts` com `{name, email, password, invite_code}` | `201` e sessão aberta. Qualquer recusa (convite inválido, já usado, e-mail já cadastrado) devolve a mesma resposta genérica |
| Excesso de tentativas | `429` com `Retry-After` (G8-2) |

Regras que o backend assume, porque o front não pode garantir nenhuma delas:

- **A validação do front é conforto.** O schema em `frontend/src/features/auth/schema.ts` impede o envio de dado malformado e o hook de envio valida de novo antes da chamada, mas qualquer pessoa chama a API sem a página. O backend repete cada regra: formato e tamanho do e-mail, senha de 10 a 128 caracteres fora da lista de senhas comuns, formato do convite.
- **O bloqueio de 30 segundos após 5 falhas no front é só para a tela.** O limite real é por conta e por IP no backend.
- **Nenhum token chega ao JavaScript.** A sessão vive só no cookie; o ESLint já proíbe `document.cookie` e `localStorage`.
- **Todo método que muda estado confere o cabeçalho `X-Requested-With`.** Junto com `SameSite=Lax`, isso fecha o CSRF por formulário de outro site.
- **Mensagem de erro não revela conta nem convite.** O front já troca qualquer detalhe do servidor por uma mensagem genérica; o backend também não deve mandar o detalhe.
- **Senha guardada com hash lento** (Argon2id ou bcrypt), nunca registrada em log.

Os botões "Entrar com Google" e "Entrar com GitHub" são simulados e não fazem requisição. Entrar por provedor externo exige outra decisão (OAuth, novas origens na CSP, vínculo com convite) e fica fora deste plano.

## 6. Fases

Cada fase vira uma issue própria e só começa quando a anterior está no `main`. Todas estão <span class="ce-badge ce-status--planned">Planejado</span>.

| Fase | Entrega | Depende de | Front-end |
|---|---|---|---|
| F1 Sessão | contas, convites, `/session`, `/accounts`, cookie, limite de tentativas | G8-1, G4-9, G8-2 | guarda de rota `RequireSession` nas rotas do app, redirecionando para `/entrar?proximo=...`; botão de sair |
| F2 Questões guardadas | `GET /questions`, `GET /questions/{id}`, aprovar, rejeitar, editar enunciado | G0-4, G1-5, G3-1, G3-2 | nenhuma mudança de tela; só `dto.ts` se o formato mudar |
| F3 Geração assíncrona | `POST /questions` → `202`, `/generation`, `/regenerate`, estado `INTERROMPIDO` | G0-8 | a tela de acompanhamento já consulta `/generation` |
| F4 Exportação | `POST /exports/moodle` devolvendo o XML na resposta | G1-8 | nenhuma |
| F5 Modo http por padrão | ambiente público com `VITE_PUBLIC_API_MODE=http`, mesmo domínio, CSP revisada | F1 a F4, ADR-0011 | remover a dependência do modo simulado fora de testes e demonstração |

Ao fim de cada fase, o mesmo teste de ponta a ponta que hoje roda no modo simulado (`frontend/tests/e2e/`) passa a rodar também contra a API real.

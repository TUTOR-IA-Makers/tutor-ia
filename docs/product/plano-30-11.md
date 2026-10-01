# Plano de entrega — 30 de novembro

<p class="lead">O recorte, o backlog completo, as histórias de usuário e as cinco sprints que levam este repositório de protótipo a um produto no ar em <strong>30/11</strong>. Nove semanas, seis pessoas, cada uma com outras matérias.</p>

!!! warning "Isto é um plano, não uma descrição do sistema"
    Nada nesta página está construído por estar aqui. O que existe hoje está em
    [Arquitetura](../architecture/index.md); o que falta, em
    [Análise de lacunas](roadmap.md#lacunas-conhecidas). Esta página substitui o
    [Backlog do MVP](mvp-backlog.md) como lista de trabalho acordada — aquele
    documento continua válido como direção de longo prazo da plataforma.

---

## 1 · O recorte, e porquê

**Decisão de PO:** até 30/11 entregamos o **gerador de questões como produto usável
por um professor** — parametrizar, gerar, revisar, editar, aprovar, guardar no banco
e exportar para o Moodle CodeRunner. No ar, numa URL pública.

Isto é um **re-escopo deliberado** do roadmap documentado, e vale dizer em voz alta:

| O roadmap diz | Nós vamos fazer | Porquê |
| --- | --- | --- |
| MVP = Onda 1 (Pilar 2: submissão, sandbox, nota, feedback) | EPIC-017 (Onda 3: geração de questões) | ~80% do núcleo já existe e passa nos testes. A Onda 1 exige sandbox, identidade, análise de AST de código de aluno e cálculo de nota — tudo de zero |
| EPIC-017 depende de EPIC-004, 005, 006 e 013 | Construímos as partes de 004/005/013 de que a geração precisa, e nada mais | Banco de questões, curadoria e governança de IA entram no recorte *porque* o gerador precisa delas, não como épicos completos |

!!! quote "O produto numa frase"
    Um professor que já usa o Moodle CodeRunner abre uma URL, descreve as restrições
    pedagógicas de um exercício, recebe uma questão gerada e **verificada**, edita o
    que quiser, aprova, e baixa um XML pronto para importar — com o banco de questões
    dele guardando tudo o que já aprovou.

### O que este recorte preserva do que não se pode cortar

A [ordem de sacrifício](index.md#ordem-de-sacrificio) lista sete features que nunca
se cortam. Três tocam este repositório, e duas delas entram no recorte:

| Feature | Estado hoje | Neste plano |
| --- | --- | --- |
| **FEAT-024** — validação automática da questão | Parcial: compila, mas não verifica restrições | **G2** fecha a parte que falta |
| **FEAT-040** — verificação de escopo | Ausente | **G2-2**, com `tree-sitter-c` |
| **FEAT-033** — isolamento da execução | Ausente | **Fora do recorte.** Mitigado, não resolvido — ver [§11](#11-o-que-fica-fora-e-porque) |

### O que explicitamente não fazemos

Submissão de aluno, cálculo de nota, análise estrutural de código de aluno, feedback
por IA, relatórios de analítica, multi-tenancy com RLS, sandbox Judge0, filas
Cloud Tasks/Pub/Sub, Vertex AI. Detalhe e razão de cada um em [§11](#11-o-que-fica-fora-e-porque).

---

## 2 · Capacidade real, e como estimamos

Nove semanas exatas: **segunda 28/09 → segunda 30/11**.

- **6 pessoas × 11 h/semana** = 66 h/semana de equipe.
- **1 ponto de história (SP) ≈ 2 h** de uma pessoa, **já incluindo** escrever o teste,
  passar `make check` e responder à revisão do PR. Não é tempo de teclado; é tempo até
  o PR ser mergeado.
- Cada dupla tem, portanto, **11 SP por semana**.

Aplicamos um desconto crescente sobre novembro, que é quando as outras matérias cobram:

| Sprint | Datas | Semanas | Capacidade | Planejado | Ocupação |
| --- | --- | --- | --- | --- | --- |
| **S0** — Chão firme | 28/09 → 04/10 | 1 | 33 SP | 28 SP | 85% |
| **S1** — Persistir e mostrar | 05/10 → 18/10 | 2 | 60 SP | 52 SP | 87% |
| **S2** — O fluxo completo | 19/10 → 01/11 | 2 | 55 SP | 47 SP | 85% |
| **S3** — Confiança | 02/11 → 15/11 | 2 | 52 SP | 48 SP | 92% |
| **S4** — Fechar | 16/11 → 29/11 | 2 | 46 SP | 33 SP | 72% |
| | | **9** | **246 SP** | **208 SP** | **85%** |

!!! note "Por que a S4 está a 72%"
    Porque a segunda semana dela não é de trabalho novo. **Congelamento em 23/11**: a
    partir daí só correção de bug, deploy final e documentação. Uma sprint que termina
    no dia da entrega não tem margem para nada dar errado, e algo vai dar errado.

**Dos 208 SP planejados, 179 são P0** — o produto não existe sem eles. Os outros 29 SP
são P1: se a velocidade real ficar 20% abaixo do previsto, eles caem e a entrega
continua de pé. É para isso que existe a [ordem de sacrifício](#7-ordem-de-sacrificio).

### Feriados e buracos de calendário

| Data | Dia | O quê | Sprint |
| --- | --- | --- | --- |
| 12/10 | seg | N. Sra. Aparecida | S1 |
| 02/11 | seg | Finados — **primeiro dia da S3** | S3 |
| 15/11 | dom | Proclamação da República | S3 |
| 20/11 | sex | Consciência Negra | S4 |

Para universitários, feriado pode ser mais tempo, não menos — mas não conte com isso no
planejamento. O desconto de capacidade acima já assume que não.

---

## 3 · As três duplas, e a regra de atravessar

| Dupla | Foco | Épicos donos |
| --- | --- | --- |
| **A — Backend & Infra** | Pipeline, banco de dados, Cloud Run, CI/CD | G0, G1, G2, G3 |
| **B — Front-end, identidade & comunicação** | Interface do professor, design, landing, docs de usuário | G4, G5, G9 |
| **C — Acervo, catalogação & harness da IA** | Taxonomia, banco de referência, prompts, métricas, exposição segura | G6, G7, G8 |

**A regra de atravessar.** Qualquer pessoa pega qualquer item de maior prioridade — é
por isso que a Dupla C carrega G8 (exposição segura) e a Dupla B carrega G9 (docs):
o trabalho foi distribuído por **capacidade**, não por rótulo. Duas restrições:

- **Máximo 2 histórias em andamento por dupla.** Trabalho em progresso não entregue é
  trabalho que não existe.
- **Ninguém pega item de outra dupla sem avisar no canal.** Não é permissão, é aviso —
  para ninguém começar duas vezes a mesma coisa.

!!! tip "Onde o harness da IA encosta no backend"
    G7 (harness) é código Python que vive em `src/codeexpert/generation/` e em
    `scripts/`. A Dupla C escreve, a Dupla A revisa. E
    [`prompts.py` exige um humano no portão](https://github.com/TUTOR-IA-Makers/tutor-ia/blob/main/AGENTS.md)
    — nenhum agente muda prompt sozinho, e nenhuma pessoa muda prompt sem rodar o
    lote de regressão do G7-2.

---

## 4 · Os dez épicos

| ID | Épico | Dono | SP | Antecipa, do plano longo |
| --- | --- | --- | --- | --- |
| **G0** | Fundação e entrega contínua | A | 26 | ÉPICO 0 (0.1, 0.4, 0.8, 0.11) |
| **G1** | Banco de questões | A | 22 | EPIC-004 · Histórias 3.1, 3.2 |
| **G2** | Confiabilidade da geração | A | 19 | FEAT-024, FEAT-040 · lacunas 1, 5, 7 |
| **G3** | Revisão e aprovação humana | A | 13 | EPIC-005 · História 3.3 · lacuna 2 |
| **G4** | Interface do professor | B | 45 | — (não existe no plano longo) |
| **G5** | Identidade visual e comunicação | B | 13 | — |
| **G6** | Acervo de referência e catalogação | C | 34 | EPIC-005 · critério de saída 12 |
| **G7** | Harness de avaliação da IA | C | 13 | EPIC-013 (governança de IA) |
| **G8** | Exposição segura do serviço | C | 14 | EPIC-001 e 011, mínimos |
| **G9** | Documentação e entrega | B | 9 | — |
| | | | **208** | |

---

## 5 · Backlog completo — histórias de usuário

Legenda: **P0** o produto não existe sem isso · **P1** o produto fica pior sem isso, mas existe ·
**P2** fora do recorte de 30/11.

Personas: **Professor** (quem gera e aprova) · **Monitor** (quem cataloga o acervo) ·
**Equipe** (nós, quando a história é técnica) · **Visitante** (quem chega pela landing page).

---

### G0 — Fundação e entrega contínua

#### G0-1 · Imagem única com a API e o compilador — `5 SP · A · S0 · P0`

**Como** Equipe, **quero** uma imagem Docker que sirva a API e tenha `gcc` dentro,
**para que** o mesmo artefato rode na máquina de qualquer um e no Cloud Run.

- [ ] `docker build` produz imagem que responde `GET /health` e compila um `.c` de teste.
- [ ] A imagem não contém `.env`, chave nem nada de `var/`.
- [ ] `docker run` com as variáveis de ambiente corretas gera uma questão de ponta a ponta.

#### G0-2 · Deploy contínuo a partir de `main` — `5 SP · A · S0 · P0`

**Como** Equipe, **quero** que todo merge em `main` suba para o Cloud Run sozinho,
**para que** ninguém precise saber deployar e a URL nunca fique velha.

- [ ] Workflow no GitHub Actions: `make check` → build → push → deploy.
- [ ] `make check` vermelho não deploya.
- [ ] A URL de produção está no `README.md` e responde `GET /health` com a versão que está em `main`.

#### G0-3 · Segredos fora do repositório — `3 SP · A · S1 · P0`

**Como** Equipe, **quero** a chave do provedor de LLM no Secret Manager,
**para que** ninguém a veja no repositório, nos logs ou no painel do Cloud Run.

- [ ] Chave lida do Secret Manager pela conta de serviço do Cloud Run.
- [ ] Um teste automatizado falha se uma chave aparecer em log ou em resposta de erro.
- [ ] `.env.example` continua com valores falsos, e `scripts/check.sh` continua caçando segredos.

#### G0-4 · A fonte de verdade sai do disco — `5 SP · A · S1 · P0`

**Como** Equipe, **quero** que o estado de uma geração viva no Postgres e não no disco da
instância, **para que** o pipeline não quebre quando duas requisições caírem em instâncias
diferentes — e para que a questão de um cliente não desapareça quando o Cloud Run reciclar
o contêiner.

- [ ] ADR escrita, com a alternativa recusada e o que nos faria mudar de ideia.
- [ ] Um protocolo `ArtifactStore`, no mesmo espírito do `CodeRunner` do
      [ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md): `LocalFilesystemStore`
      para desenvolvimento e testes offline, `PostgresStore` em produção.
- [ ] `RunWorkspace.open()` deixa de depender de `root.is_dir()`. Um teste abre uma execução
      criada por outro processo, com o diretório local apagado, e as cinco etapas terminam.
- [ ] O disco passa a ser rascunho de **uma** etapa: `/tmp/<run_id>` só para o `.c` e o
      binário, apagado ao fim. **Absorve a antiga história G1-3.**

!!! danger "Esta é a armadilha técnica do plano, e o mecanismo exato é este"
    Cada etapa lê `var/runs/<run_id>/`, trabalha e escreve de volta
    ([ADR-0003](../adr/0003-one-workspace-per-run.md)). `RunWorkspace.open()` faz
    `root.is_dir()` e, se não achar, levanta `RunNotFoundError` — que
    `api/errors.py` mapeia para **404**.

    No Cloud Run cada instância tem o seu próprio sistema de arquivos, em memória, que morre
    com ela. Logo: `POST /gen_statement` cai na instância 1 e escreve `statement.json`;
    `POST /gen_code` com o mesmo `run_id` cai na instância 2 e responde **404 — Run not
    found**. Sem escala nenhuma isto também acontece: `min-instances=0` mata a instância
    ociosa, e o primeiro passo de amanhã não encontra o de hoje.

    Resolver na S1 é barato. Descobrir em 25/11 não é.

#### G0-5 · Logs estruturados com `run_id` — `3 SP · A · sem sprint · P1`

**Como** Equipe, **quero** rastrear uma geração inteira pelo `run_id` no Cloud Logging,
**para que** eu descubra em que etapa uma falha aconteceu sem reproduzir o problema.

- [ ] Todo log de uma geração carrega `run_id`, etapa e duração.
- [ ] Uma consulta salva mostra as gerações que falharam nas últimas 24 h.
- [ ] Nenhum log contém a chave de API nem o código gerado inteiro.

#### G0-6 · Teto de custo — `3 SP · C · S3 · P0`

**Como** Equipe, **quero** um limite duro de gasto com o provedor de LLM,
**para que** um bug em loop, ou um visitante curioso, não consuma o orçamento num fim de semana.

- [ ] Alerta de orçamento no GCP e no provedor de LLM, em 50% e 80%, para o canal da equipe.
- [ ] Limite diário de gerações no serviço; ao atingir, responde `429` com mensagem clara.
- [ ] O limite é configurável por variável de ambiente, e o teste cobre o caso de estouro.

#### G0-8 · Geração como job retomável — `5 SP · A · S2 · P0`

**Como** Professor, **quero** que uma geração em andamento não se perca se o servidor for
reiniciado, **para que** eu não descubra pelo silêncio que tenho de começar de novo.

- [ ] `POST /questions` responde `202` com um id em poucos milissegundos; as cinco etapas
      rodam num processo só, fora do ciclo de vida da requisição.
- [ ] O estado do job (etapa atual, estado, erro) vive no banco, e `GET /questions/{id}`
      alimenta a tela de progresso do G4-3.
- [ ] Job interrompido no meio volta como `INTERROMPIDO`, com as etapas já pagas preservadas
      — retomar não repete chamada ao modelo que já foi cobrada.

!!! tip "Isto não é fila distribuída, e não precisa ser"
    Uma `BackgroundTask` no mesmo processo resolve a v1.0. O que a torna aceitável é o estado
    estar no banco (G0-4): se a instância morrer no meio, o job fica `INTERROMPIDO` em vez de
    ficar `GERANDO` para sempre. Trocar por Cloud Tasks depois é mudar quem chama a função —
    é a mesma decisão que o SAD já tomou para submissões (divergência D-3).

#### G0-7 · Ambiente de staging separado — `3 SP · P2`

**Como** Equipe, **quero** um ambiente separado do de demonstração,
**para que** um deploy quebrado não apareça na URL que o professor está usando.

> Fora do recorte. Com `main` protegido e `make check` no portão, o risco é aceitável
> por nove semanas. Entra depois de 30/11.

---

### G1 — Banco de questões

#### G1-1 · Postgres com migrações versionadas — `5 SP · A · S1 · P0`

**Como** Equipe, **quero** um Postgres gerenciado e migrações no repositório,
**para que** o esquema seja o mesmo em qualquer máquina e a mudança dele passe por PR.

- [ ] Instância provisionada e alcançável pelo Cloud Run; credenciais no Secret Manager.
- [ ] Migrações versionadas (Alembic) aplicadas no deploy, não à mão.
- [ ] Os testes rodam contra um banco descartável, e `make check` continua funcionando offline.

#### G1-2 · O modelo de dados — `5 SP · A · S1 · P0`

**Como** Equipe, **quero** questão, versão, caso de teste e execução modelados,
**para que** uma questão gerada deixe de viver apenas num diretório temporário.

- [ ] Tabelas para questão, caso de teste e execução de geração, com o `run_id` como ligação.
- [ ] A questão guarda: enunciado, solução de referência, restrições pedidas, nível, eixo, estado.
- [ ] A execução guarda: modelo, versão de prompt, tokens, custo e horário de cada etapa —
      o que hoje está em `meta.json`.

#### G1-3 · A questão gerada é persistida — *absorvida por G0-4*

Era uma história separada — "no fim da geração, gravar no banco". Deixou de ser: se o
`ArtifactStore` do G0-4 é o Postgres, a questão está no banco **a cada etapa**, não no fim.
Os critérios que importavam migraram para lá. Ficam aqui dois, que continuam valendo:

- [ ] `GET /questions/{id}` devolve tudo o que a tela de revisão precisa, numa chamada.
- [ ] Uma geração que falha no meio não deixa questão pela metade visível na biblioteca.

#### G1-4 · Casos de teste com categoria e visibilidade — `3 SP · A · S2 · P1`

**Como** Professor, **quero** que cada caso de teste tenha categoria (típico, limite, borda,
inválido) e visibilidade (público, privado), **para que** o XML exportado esconda os casos
privados do aluno e eu possa dar pesos diferentes depois.

- [ ] Campos persistidos e expostos na API.
- [ ] O XML exportado marca os casos públicos como exemplo e os privados como ocultos.
- [ ] Pelo menos 1 público e 1 privado são exigidos para a questão poder ser aprovada.

#### G1-5 · Listar, filtrar e buscar — `3 SP · A · S2 · P0`

**Como** Professor, **quero** listar minhas questões filtrando por eixo, nível e estado,
**para que** eu encontre o que já aprovei sem rolar uma lista inteira.

- [ ] `GET /questions` com filtros por eixo, nível, estado e busca por texto no enunciado.
- [ ] Paginação, com a mais recente primeiro.
- [ ] Teste cobre lista vazia, filtro sem resultado e página além do fim.

#### G1-6 · Exportar uma seleção aprovada — `3 SP · A · S4 · P0`

**Como** Professor, **quero** escolher várias questões aprovadas e baixar um único XML,
**para que** eu monte uma lista de exercícios numa importação só.

- [ ] `POST /export` recebe ids e devolve um XML com todas as questões.
- [ ] Questões não aprovadas são recusadas com `422` e mensagem que diz quais.
- [ ] O XML gerado importa num Moodle real — verificado à mão, uma vez, e registrado.

#### G1-8 · Exportador puro, sem arquivo compartilhado — `3 SP · A · S2 · P0`

**Como** Equipe, **quero** que exportar deixe de ler-modificar-escrever um arquivo único,
**para que** duas exportações simultâneas não perdam uma questão.

- [ ] `export_question` vira função pura: recebe as questões, devolve o XML. Não toca
      `questions_dir`, não acrescenta a `Moodle_Questionnaire.xml`, e não deriva a numeração
      contando `<question type="coderunner">` no que o arquivo já tinha.
- [ ] A numeração da questão passa a ser o índice na lista exportada.
- [ ] Teste cobre duas exportações concorrentes.

!!! note "Por que isto é correção e não funcionalidade"
    `export_question` hoje lê o arquivo inteiro, conta as questões, calcula a sua numeração e
    reescreve tudo. Duas chamadas ao mesmo tempo leem o mesmo estado e uma sobrescreve a
    outra: uma questão desaparece, sem erro.

    Não acontece hoje por acidente — o endpoint é `async def` executando código síncrono, o
    que serializa tudo dentro de um processo. **É uma proteção que desaparece no primeiro
    `--workers 2` ou na segunda instância do Cloud Run.** E um arquivo em `var/questions/`
    dentro de um contêiner efêmero não é lugar para o banco de questões de um cliente.

#### G1-7 · Versionamento da questão — `5 SP · P2`

**Como** Professor, **quero** que editar uma questão publicada crie uma nova versão,
**para que** uma atividade que aponta para a versão antiga não mude sozinha.

> Fora do recorte. Só importa quando existir atividade apontando para questão — o que
> depende do EPIC-007. Até lá, editar no lugar é honesto.

---

### G2 — Confiabilidade da geração

!!! danger "Este épico é o que separa 'demo bonita' de 'usável com alunos'"
    Hoje o pedido diz `can_has_repetition: false`, o prompt pede ao modelo para não usar
    repetição, e **nada verifica**. A questão é exportada de qualquer forma. É a
    [lacuna 1](roadmap.md#lacunas-conhecidas), e é silenciosa: a API
    responde `200` e o artefato parece correto.

#### G2-1 · Restrições nomeadas, não booleanos — `5 SP · A · S3 · P0`

**Como** Professor, **quero** declarar estruturas permitidas, proibidas e obrigatórias
por nome, **para que** o pedido seja expressivo e — sobretudo — verificável por AST.

- [ ] Vocabulário controlado de estruturas definido em um só lugar, compartilhado com G6-1.
- [ ] Três listas (`permitidas`, `proibidas`, `obrigatorias`) substituem os cinco booleanos.
- [ ] Os cinco booleanos continuam aceitos e traduzidos para as listas, ou a quebra de
      contrato está documentada.

#### G2-2 · Verificação de escopo com `tree-sitter-c` — `8 SP · A · S3 · P0`

**Como** Professor, **quero** que o sistema verifique se a solução gerada respeitou as
restrições que pedi, **para que** eu nunca descubra em frente à turma que o gabarito usa
um `for` numa questão "sem repetição".

- [ ] `tree-sitter-c` — **não** regex, **não** `pycparser` — detecta as estruturas usadas
      em `solution.c`. Uma etapa nova entre `gen_code` e `gen_inputs`.
- [ ] Zero falsos positivos num conjunto adversarial: a palavra `for` em comentário, em
      string literal e dentro de identificador (`format`, `before`) não conta como
      estrutura de repetição.
- [ ] O veredito (estruturas detectadas × restrições pedidas) é persistido e exposto na API.

#### G2-3 · Rejeitar e regerar quando viola — `3 SP · A · S3 · P0`

**Como** Professor, **quero** que uma solução que viola o escopo seja regerada
automaticamente, **para que** eu não perca tempo revisando questão inválida.

- [ ] Violação dispara nova tentativa, no máximo N vezes (configurável, padrão 2).
- [ ] Esgotadas as tentativas, a questão vai para `FALHOU_VERIFICACAO` com o motivo — nunca
      para `GERADA`.
- [ ] Cada tentativa é registrada na execução, com o seu custo.

#### G2-4 · Custo e tokens por execução — `3 SP · A · sem sprint · P1`

**Como** Equipe, **quero** saber quanto custou cada questão gerada,
**para que** possamos responder "quanto custa isto por questão?" com um número.

- [ ] O campo `usage` da resposta do provedor é persistido por etapa.
- [ ] Custo em reais calculado a partir de uma tabela de preço configurável.
- [ ] `GET /metrics` mostra custo médio por questão gerada e por questão aprovada —
      são números diferentes, e a diferença é a taxa de desperdício.

#### G2-5 · Entradas categorizadas pelo modelo — `3 SP · C · S2 · P1`

**Como** Professor, **quero** que as entradas de teste vêm rotuladas por categoria,
**para que** eu saiba quais são casos-limite sem lê-las uma a uma.

- [ ] `gen_inputs` devolve objetos `{entrada, categoria}`, não strings soltas.
- [ ] Categoria fora do vocabulário é rejeitada e a etapa pede de novo.
- [ ] A categoria alimenta G1-4 — o prompt já pede "casos-limite e casos normais" hoje, e a
      resposta é jogada fora.

#### G2-6 · Alerta de similaridade com o acervo — `5 SP · P2`

**Como** Professor, **quero** ser avisado quando a questão gerada é quase igual a uma que
já existe, **para que** eu não publique duas vezes o mesmo exercício.

> Fora do recorte. Vira necessário quando o acervo passar de ~100 questões.

---

### G3 — Revisão e aprovação humana

#### G3-1 · O ciclo de vida da questão — `3 SP · A · S2 · P0`

**Como** Equipe, **quero** estados explícitos para a questão,
**para que** "o que já pode ir para o aluno" seja uma coluna, não uma convenção.

- [ ] Estados: `GERANDO`, `GERADA`, `FALHOU_VERIFICACAO`, `APROVADA`, `REJEITADA`.
- [ ] Transições inválidas recusadas com `409` — não se aprova o que falhou na verificação.
- [ ] O estado é visível em toda resposta que devolve uma questão.

#### G3-2 · Aprovar uma questão — `3 SP · A · S2 · P0`

**Como** Professor, **quero** marcar uma questão como aprovada, com meu nome e a data,
**para que** exista um humano responsável por cada questão que chega ao aluno.

- [ ] `POST /questions/{id}/approve` grava quem aprovou e quando, e põe `reviewed: true`.
- [ ] O campo e o exportador já existem — falta apenas quem os altere
      ([lacuna 2](roadmap.md#lacunas-conhecidas)).
- [ ] Aprovar duas vezes é idempotente; aprovar o que está em `FALHOU_VERIFICACAO` é `409`.

#### G3-3 · Editar antes de aprovar, revalidando — `5 SP · A · S4 · P0`

**Como** Professor, **quero** corrigir o enunciado, a solução ou os casos antes de aprovar,
**para que** uma questão quase boa não seja descartada.

- [ ] Editar enunciado: salva direto.
- [ ] Editar a solução: **reexecuta** a compilação, a verificação de escopo e a geração de
      saídas esperadas. As saídas nunca são digitadas à mão, nem herdadas da versão antiga.
- [ ] Editar ou remover um caso de teste recalcula a saída esperada executando a solução.

!!! quote "A regra que esta história não pode violar"
    **O que pode ser verificado por execução nunca é previsto.** Um campo de texto onde o
    professor digita a saída esperada quebraria a única coisa que este repositório existe
    para provar. Ver [a regra](../onboarding/index.md#a-regra-que-explica-o-codigo).

#### G3-4 · Só o aprovado sai no XML — `2 SP · A · S4 · P0`

**Como** Professor, **quero** que só questões aprovadas possam ser exportadas,
**para que** seja impossível levar para a turma algo que ninguém revisou.

- [ ] O exportador recusa questão em qualquer estado que não `APROVADA`.
- [ ] Teste cobre a tentativa e verifica a mensagem de erro.
- [ ] O XML deixa de declarar aprovação que não aconteceu.

#### G3-5 · Rejeitar com motivo — `3 SP · P2` (candidata a entrar se sobrar folga)

**Como** Professor, **quero** rejeitar uma questão dizendo porquê,
**para que** o motivo vire dado para melhorar o prompt.

- [ ] Motivo de um vocabulário curto (enunciado confuso, solução errada, nível errado,
      fora do escopo pedido, outro) + texto livre.
- [ ] Os motivos entram no relatório do G7-2.

#### G3-6 · Trilha de auditoria e aprovador ≠ solicitante — `3 SP · P2`

> Fora do recorte. Exige papéis de verdade (EPIC-001). Com um professor piloto, a regra
> não tem como ser aplicada nem verificada.

---

### G4 — Interface do professor

#### G4-1 · Esqueleto do front-end no mesmo container — `5 SP · B · S0 · P0`

**Como** Equipe, **quero** escolher a stack e ter uma página servida pela mesma imagem
Docker, **para que** front e back subam num deploy só e não exista problema de CORS nem
de segundo domínio.

- [ ] Decisão de stack registrada em ADR, com a alternativa recusada e o motivo.
- [ ] `npm build` roda no `Dockerfile` e o resultado é servido pelo FastAPI como estático.
- [ ] Uma página vazia com o logo está no ar pela URL de produção no fim da S0.

#### G4-2 · Formulário de parametrização — `5 SP · B · S1 · P0`

**Como** Professor, **quero** descrever a questão que preciso num formulário,
**para que** eu não tenha que montar JSON no `curl`.

- [ ] Nível, eixo de conteúdo, quantidade de entradas e as três listas de estruturas.
- [ ] Combinação inválida é bloqueada antes de enviar, com o motivo ao lado do campo.
- [ ] O formulário lê o vocabulário de estruturas da API — não tem lista copiada no código.

#### G4-3 · Acompanhar o progresso da geração — `5 SP · B · S1 · P0`

**Como** Professor, **quero** ver em que etapa a geração está,
**para que** eu não fique olhando um spinner por 90 segundos sem saber se travou.

- [ ] As cinco etapas aparecem em sequência, com a atual destacada.
- [ ] Falha mostra em qual etapa e o que fazer, não um stack trace.
- [ ] Fechar e reabrir a página não perde a geração em andamento.

#### G4-4 · Erro, carregamento e vazio — `3 SP · B · S1 · P1`

**Como** Professor, **quero** entender o que aconteceu quando algo dá errado,
**para que** eu saiba se o problema é meu, do sistema ou da minha internet.

- [ ] Todo estado de erro tem texto em português que diz o que fazer a seguir.
- [ ] Cota estourada, provedor indisponível e sessão expirada têm mensagens distintas.
- [ ] Banco vazio convida a gerar a primeira questão, em vez de mostrar tabela vazia.

#### G4-5 · Tela de revisão — `8 SP · B · S2 · P0`

**Como** Professor, **quero** ver enunciado, solução, entradas, saídas esperadas e o
veredito da verificação de escopo numa tela, **para que** eu decida em um minuto se aprovo.

- [ ] Solução com destaque de sintaxe; casos de teste em tabela com entrada e saída.
- [ ] O veredito da verificação de escopo aparece em destaque: o que foi pedido, o que foi
      detectado, e se confere.
- [ ] Botões **Aprovar** e **Rejeitar** com o efeito de cada um explicado sem jargão.

#### G4-6 · Biblioteca do banco — `5 SP · B · S2 · P0`

**Como** Professor, **quero** ver minhas questões com filtros,
**para que** o banco seja algo que eu uso, não algo que eu alimento.

- [ ] Lista com eixo, nível, estado e data; filtros combináveis.
- [ ] Seleção múltipla para exportar (liga no G1-6).
- [ ] Contagem por combinação eixo × nível visível, preparando o G6-6.

#### G4-7 · Edição inline antes de aprovar — `5 SP · B · S3 · P0`

**Como** Professor, **quero** editar na própria tela de revisão,
**para que** corrigir uma vírgula não exija abrir outra página.

- [ ] Enunciado, solução e casos editáveis no lugar.
- [ ] Editar a solução avisa que as saídas esperadas serão recalculadas, e mostra o resultado.
- [ ] Sair com alteração não salva pede confirmação.

#### G4-8 · Download do XML com instruções — `3 SP · B · S3 · P0`

**Como** Professor, **quero** baixar o XML e saber exatamente o que fazer no Moodle,
**para que** a última etapa não seja onde eu desisto.

- [ ] Botão de download do XML da seleção.
- [ ] Passo a passo da importação na própria tela, com os nomes dos menus do Moodle.
- [ ] Liga para o [guia de importação](../guides/import-into-moodle.md).

#### G4-9 · Entrada na interface — `2 SP · B · S2 · P1`

**Como** Professor, **quero** entrar com o código de convite que recebi,
**para que** meu banco seja meu.

- [ ] Tela de entrada, sessão persistida, botão de sair.
- [ ] Código inválido dá mensagem clara e não diz se o código existe.

#### G4-10 · Polimento — `4 SP · B · S4 · P1`

**Como** Visitante, **quero** que funcione no celular e seja legível,
**para que** a primeira impressão não seja de trabalho de faculdade.

- [ ] Funciona em tela de celular, sem rolagem horizontal.
- [ ] Navegação por teclado nas telas principais; contraste conferido.
- [ ] Todos os textos revisados por alguém que não os escreveu.

---

### G5 — Identidade visual e comunicação

#### G5-1 · Design system mínimo — `5 SP · B · S0 · P0`

**Como** Equipe, **quero** nome, logo, paleta e tipografia decididos antes da primeira tela,
**para que** ninguém escolha cor no meio de um PR.

- [ ] Nome do produto decidido e usado em todo lugar.
- [ ] Logo em SVG, paleta com contraste conferido, duas fontes no máximo.
- [ ] Tokens (cor, espaçamento, tipografia) num arquivo só, consumido pelo front-end.

#### G5-2 · Landing page pública — `5 SP · B · S1 · P0`

**Como** Visitante, **quero** entender em 30 segundos o que isto faz e para quem,
**para que** eu decida se peço acesso.

- [ ] O problema, o que a ferramenta faz e para quem é, acima da primeira dobra.
- [ ] Diz o que a ferramenta **não** faz — não é juiz automático, não dá nota.
- [ ] Chamada para pedir acesso, e liga para a [documentação](../index.md).

#### G5-3 · Vídeo de demonstração de 2 minutos — `3 SP · B · S3 · P1`

**Como** Visitante, **quero** ver o fluxo funcionando sem instalar nada,
**para que** eu confie que existe.

- [ ] Gravação do fluxo completo: parametrizar → gerar → revisar → aprovar → XML no Moodle.
- [ ] Sem chave de API, sem terminal, sem dado real de pessoa na tela.
- [ ] Embutido na landing page.

#### G5-4 · Texto de divulgação para professores — `2 SP · P2`

---

### G6 — Acervo de referência e catalogação

!!! info "Por que este épico existe"
    O critério de saída 12 do MVP exige **≥ 8 questões aprovadas por combinação eixo × nível**,
    e é exatamente esse limiar que habilita a geração por IA. Sem acervo, o gerador produz
    questões plausíveis e desancoradas — valida que a geração funciona, não que ela
    reproduz o estilo pedagógico da instituição (hipótese H7).

#### G6-1 · Taxonomia e vocabulário — `5 SP · C · S0 · P0`

**Como** Monitor, **quero** uma taxonomia fechada de eixos de conteúdo, níveis e estruturas,
**para que** duas pessoas catalogando a mesma questão a classifiquem igual.

- [ ] Quatro eixos prioritários (E1–E4) definidos, com exemplos de fronteira em cada um.
- [ ] Vocabulário de estruturas de C fechado, em um arquivo, compartilhado com G2-1.
- [ ] Teste de concordância: duas pessoas catalogam as mesmas 10 questões separadamente e
      divergem em no máximo 2. Divergência maior significa que a taxonomia é ambígua, não
      que alguém errou.

#### G6-2 · Catalogar E1 e E2 — `6 SP · C · S1 · P0`

**Como** Monitor, **quero** catalogar ao menos 8 questões reais por combinação nos eixos
E1 e E2, **para que** a geração ancorada tenha de onde puxar exemplo.

- [ ] ≥ 8 questões por combinação, cada uma com enunciado, solução de referência, casos de
      teste e classificação completa.
- [ ] A origem de cada questão registrada, incluindo **situação de direitos** — questão de
      origem restrita não pode ser servida a outra instituição, e este campo se preenche na
      curadoria ou nunca mais.
- [ ] Formato de arquivo único e validado por script, não planilha livre.

#### G6-3 · Importar o acervo para o banco — `3 SP · C · S1 · P0`

**Como** Monitor, **quero** um comando que carregue o acervo catalogado no banco,
**para que** catalogar e usar não sejam dois mundos.

- [ ] `make import-acervo` valida e carrega; arquivo inválido falha com a linha e o motivo.
- [ ] Reimportar não duplica.
- [ ] Questões importadas entram como `APROVADA`, com a origem marcada como curadoria humana.

#### G6-4 · Catalogar E3 e E4 — `7 SP · C · S2 · P0`

Como G6-2, para os eixos E3 e E4. Fecha o critério de saída 12 nos quatro eixos.

#### G6-5 · Geração ancorada no acervo — `5 SP · C · S2 · P0`

**Como** Professor, **quero** que a questão gerada se pareça com as do meu acervo,
**para que** ela caiba na minha disciplina em vez de parecer vinda de outro lugar.

- [ ] O prompt de enunciado recebe exemplos reais do acervo, da mesma combinação eixo × nível.
- [ ] A seleção dos exemplos é determinística dado o pedido — mesmo pedido, mesmos exemplos.
- [ ] A mudança em `prompts.py` tem aprovação humana e roda o lote de regressão do G7-2 antes
      do merge. **Esta é a mudança de prompt mais importante do projeto.**

#### G6-6 · Habilitação por cobertura mínima — `3 SP · C · S3 · P1`

**Como** Professor, **quero** ver quantas questões faltam para liberar a geração numa
combinação, **para que** o começo do zero seja uma barra de progresso e não um resultado ruim.

- [ ] Combinação com menos de 8 questões de referência não habilita geração ancorada.
- [ ] A interface mostra "faltam N questões" em vez de desabilitar o botão sem explicação.
- [ ] O limiar é configurável.

#### G6-7 · Avaliação cega pelo professor — `5 SP · C · S3 · P1`

**Como** Equipe, **quero** testar a hipótese H7 com um professor que não sabe o que é o quê,
**para que** tenhamos um número, não uma opinião nossa.

- [ ] 10 questões geradas e 10 do acervo, embaralhadas, sem marcação de origem.
- [ ] O professor classifica cada uma por adequação e qualidade, com a rubrica do G7-3.
- [ ] Resultado registrado na documentação, **inclusive se for ruim**. Um resultado ruim em
      08/11 é informação; em 30/11 é um problema.

---

### G7 — Harness de avaliação da IA

#### G7-1 · Golden set e geração em lote — `5 SP · C · S1 · P0`

**Como** Equipe, **quero** um conjunto fixo de pedidos e um comando que gere todos,
**para que** "o prompt melhorou" deixe de ser impressão.

- [ ] 20 pedidos cobrindo os quatro eixos e os cinco níveis, versionados no repositório.
- [ ] `make lote` roda os 20 e grava os resultados em `var/`, com o modelo e a versão de
      prompt usados.
- [ ] O lote é retomável: não repete o que já gerou e não repete o que já foi pago.

#### G7-2 · Métricas do lote — `5 SP · C · S1 · P0`

**Como** Equipe, **quero** um relatório automático de cada lote,
**para que** uma mudança de prompt seja aceita ou recusada por número.

- [ ] Taxa de compilação, conformidade de escopo, custo médio, tempo médio, taxa de
      regeração — por eixo e por nível.
- [ ] Relatório comparável entre lotes: dois lotes lado a lado, com a diferença.
- [ ] Nenhuma métrica depende de julgamento humano. As que dependem vivem no G7-3.

#### G7-3 · Rubrica humana de qualidade — `3 SP · C · S3 · P1`

**Como** Monitor, **quero** uma rubrica curta para avaliar questão gerada,
**para que** duas pessoas cheguem a notas parecidas.

- [ ] No máximo 5 critérios, cada um com escala de 3 pontos e exemplo do que é cada ponto.
- [ ] Testada por duas pessoas nas mesmas 10 questões, com divergência medida.
- [ ] Usada pelo G6-7.

#### G7-4 · Comparação entre versões de prompt — `5 SP · P2`

#### G7-5 · Relatório de regressão obrigatório — `3 SP · P2`

---

### G8 — Exposição segura do serviço

!!! danger "Este épico existe porque o deploy é público"
    Hoje os seis endpoints são públicos e sem autenticação
    ([lacuna 8](roadmap.md#lacunas-conhecidas)). Num protótipo local isso é aceitável. **No momento em
    que a URL é pública, qualquer pessoa que alcance a porta gasta a nossa chave de API.**
    G8 é o mínimo para que a decisão de expor não seja irresponsável — não é o EPIC-001.

#### G8-1 · Acesso por convite — `5 SP · C · S4 · P0`

**Como** Equipe, **quero** que só quem tem convite use o serviço,
**para que** a chave de API e o custo sejam nossos e não de um robô.

- [ ] Código de convite gerado por nós, associado a um banco de questões próprio.
- [ ] Todo endpoint de geração exige sessão válida; `GET /health` e a landing continuam abertos.
- [ ] Tentativa sem sessão é `401`, registrada, e não revela se o código existe.

#### G8-2 · Cota e limite por usuário — `4 SP · C · S3 · P0`

**Como** Equipe, **quero** cota de gerações por usuário e limite de requisições,
**para que** um usuário não consuma o orçamento de todos.

- [ ] Cota diária e mensal por convite, configuráveis.
- [ ] Ao atingir, `429` com quanto falta para renovar — degrada, não quebra.
- [ ] Consumo visível para nós, e para o professor, na interface.

#### G8-3 · Revisão de segurança antes de expor — `3 SP · C · S4 · P0`

**Como** Equipe, **quero** revisar a superfície exposta antes do anúncio,
**para que** não descubramos o problema pelo cartão de crédito.

- [ ] Checklist: nenhum segredo em log ou resposta; `/config` não devolve chave; CORS fechado;
      conta de serviço com o mínimo de permissão; imagem com sistema de arquivos read-only
      fora de `/tmp`.
- [ ] Os limites reais de `execution/local.py` conferidos no contêiner: tempo de compilação,
      tempo de execução, teto de saída e morte do grupo de processos. **Não há limite de
      memória nem de número de processos** — com `--concurrency` alto, um `malloc` em laço no
      código gerado derruba a instância e, com ela, toda requisição em voo naquela instância.
- [ ] `--concurrency` do Cloud Run baixo (4–8) e CPU ≥ 2, porque compilar e executar dentro
      da requisição não convive com 80 requisições por instância.
- [ ] Registrado na documentação que **executamos código gerado por modelo sem isolamento
      real** ([lacuna 4](roadmap.md#lacunas-conhecidas)), o risco aceito e porquê. Isto **não** é FEAT-033
      cumprida.

#### G8-4 · LGPD mínimo — `2 SP · C · S4 · P1`

**Como** Professor, **quero** saber o que vocês guardam sobre mim,
**para que** eu decida se uso.

- [ ] Página dizendo o que é guardado (e-mail do convite, questões geradas, prompts enviados
      ao provedor), por quanto tempo, e como pedir exclusão.
- [ ] Nenhum dado de aluno em lugar nenhum — o produto não toca aluno neste recorte.

---

### G9 — Documentação e entrega

#### G9-1 · Documentação alinhada com a realidade — `3 SP · B · S4 · P0`

**Como** pessoa nova, **quero** que a documentação descreva o que existe,
**para que** eu não perca uma tarde procurando algo que é plano.

- [ ] `README.md`, onboarding e [análise de lacunas](roadmap.md#lacunas-conhecidas) atualizados.
- [ ] Toda afirmação sobre a plataforma marcada como planejada.
- [ ] `make check` (que constrói a documentação) verde.

#### G9-2 · Guia do professor — `3 SP · B · S3 · P0`

**Como** Professor, **quero** um guia de uma página,
**para que** eu consiga usar sozinho na primeira vez.

- [ ] Entrar, gerar, revisar, aprovar, exportar, importar no Moodle — com captura de tela.
- [ ] Diz explicitamente que **toda questão gerada precisa de revisão humana**, e porquê.
- [ ] Testado com alguém de fora da equipe, sem ajuda.

#### G9-3 · Ensaio geral e checklist de entrega — `3 SP · B · S4 · P0`

**Como** Equipe, **quero** ensaiar a entrega antes do dia,
**para que** 30/11 seja um dia comum.

- [ ] Em 25/11: clone limpo, deploy do zero, fluxo completo pela URL pública.
- [ ] Checklist de entrega verificado item a item ([§10](#10-o-que-e-entregue-em-3011)).
- [ ] Tudo o que falhar no ensaio vira issue com dono e prazo antes de 29/11.

---

## 6 · As cinco sprints

### Sprint 0 — Chão firme · 28/09 → 04/10 · 28 SP

**Meta:** no domingo, `main` deploya sozinho para uma URL pública, e as três decisões que
travam todo mundo estão tomadas.

| Dupla | Histórias | SP |
| --- | --- | --- |
| A | G0-1 imagem com `gcc` · G0-2 deploy contínuo | 10 |
| B | G4-1 esqueleto do front · G5-1 design system | 10 |
| C | G6-1 taxonomia · começo do G6-2 | 8 |

**Saída da sprint:** URL pública com uma página do produto no ar. Taxonomia fechada.
Backlog importado no GitHub Projects, com labels por épico e dupla.

!!! tip "Por que infra primeiro"
    Porque "deployar" é a tarefa que sempre revela um problema de duas semanas quando é
    feita na última. Se o container com `gcc` não subir no Cloud Run, queremos saber em
    02/10 — quando ainda há oito semanas para escolher outra coisa.

---

### Sprint 1 — Persistir e mostrar · 05/10 → 18/10 · 52 SP

**Meta:** a questão gerada deixa de viver num diretório temporário, e existe uma interface
onde o professor a pede.

| Dupla | Histórias | SP |
| --- | --- | --- |
| A | G0-3 segredos · **G0-4 fonte de verdade no Postgres** · G1-1 Postgres · G1-2 modelo | 18 |
| B | G4-2 formulário · G4-3 progresso · G4-4 erros e vazios · G5-2 landing | 18 |
| C | G6-2 catalogar E1 e E2 · G6-3 importar acervo · G7-1 golden set · G7-2 métricas | 16 |

**Saída da sprint:** pela URL pública, alguém preenche um formulário e a questão gerada
fica no banco. ≥ 16 questões de referência importadas. Primeiro lote do golden set rodado,
com métricas — o número de referência contra o qual tudo depois é comparado.

**Risco da sprint:** G0-4. Se o `ArtifactStore` exigir redesenho maior que os 5 SP estimados,
corta-se G4-4 e G5-2 da sprint, **nunca o G0-4** — todo o resto do plano assume que o estado
sobreviveu ao Cloud Run.

---

### Sprint 2 — O fluxo completo · 19/10 → 01/11 · 47 SP

**Meta:** o caminho inteiro funciona ponta a ponta — gerar, revisar, aprovar, listar. É a
sprint mais importante do plano.

| Dupla | Histórias | SP |
| --- | --- | --- |
| A | G3-1 ciclo de vida · G3-2 aprovar · G1-5 listar · **G0-8 geração como job** · **G1-8 exportador puro** | 17 |
| B | G4-5 tela de revisão · G4-6 biblioteca · G4-9 entrada | 15 |
| C | G6-4 catalogar E3 e E4 · G6-5 geração ancorada · G2-5 entradas categorizadas | 15 |

**Saída da sprint:** um professor gera, revisa, aprova e vê no banco. Critério de saída 12
fechado nos quatro eixos (≥ 32 questões). Geração ancorada no acervo funcionando.

!!! warning "Ponto de decisão em 01/11"
    Se ao fim da S2 o fluxo completo não estiver fechado, a resposta **não** é empurrar para
    a S3. É cortar G6-7 (avaliação cega), G5-3 (vídeo) e G4-10 (polimento) e usar a S3 inteira
    para fechar o fluxo. Produto que faz pouco e faz bem entrega; produto que faz muito pela
    metade não.

---

### Sprint 3 — Confiança · 02/11 → 15/11 · 48 SP

**Meta:** a questão aprovada passa a ser confiável. É a sprint que fecha a lacuna 1 — a
única que produz resultado errado sem produzir erro.

| Dupla | Histórias | SP |
| --- | --- | --- |
| A | G2-1 restrições nomeadas · G2-2 verificação de escopo · G2-3 rejeitar e regerar | 16 |
| B | G4-7 edição inline · G4-8 download com instruções · G5-3 vídeo · G9-2 guia do professor | 14 |
| C | G8-2 cota e limite · G0-6 teto de custo · G7-3 rubrica · G6-6 cobertura mínima · G6-7 avaliação cega | 18 |

**Saída da sprint:** nenhuma questão aprovada viola as restrições que foram pedidas.
Avaliação cega feita, com resultado escrito. Teto de custo no lugar.

**Risco da sprint:** G2-2 está em 8 SP e é a maior estimativa do plano. Se estourar,
G2-3 desce de automático para um aviso na tela de revisão — o professor vê que viola e
decide. Metade do valor, um quarto do custo, e o produto continua honesto.

---

### Sprint 4 — Fechar · 16/11 → 29/11 · 33 SP

**Congelamento em 23/11.** Da segunda 23/11 em diante: bug, deploy, documentação. Nada novo.

| Dupla | Histórias (até 23/11) | SP |
| --- | --- | --- |
| A | G3-3 editar e revalidar · G1-6 exportar seleção · G3-4 só aprovadas no XML · G1-4 categoria e visibilidade | 13 |
| B | G4-10 polimento · G9-1 documentação · G9-3 ensaio geral | 10 |
| C | G8-1 acesso por convite · G8-3 revisão de segurança · G8-4 LGPD mínimo | 10 |

**24/11 → 29/11:** ensaio geral em 25/11, correção do que ele revelar, deploy final,
convite ao professor piloto.

---

## 7 · Ordem de sacrifício

Se a velocidade real ficar abaixo do previsto, corta-se **nesta ordem**, de cima para baixo.
A decisão é do PO, no dia da revisão de sprint, e fica registrada na issue.

!!! note "Dois itens já começam fora das sprints"
    **G0-5** (logs estruturados) e **G2-4** (custo por execução) saíram da S2 para pagar o
    G0-8 e o G1-8. Continuam P1 e entram na primeira folga que aparecer — o G2-4 de
    preferência antes de a primeira fatura chegar.

| Ordem | O que cai | Custo de cortar |
| --- | --- | --- |
| 1 | G5-3 vídeo de demonstração | Landing menos convincente |
| 2 | G4-10 polimento | Parece trabalho de faculdade — e é |
| 3 | G6-7 avaliação cega | Perdemos o número da hipótese H7. Doloroso, não fatal |
| 4 | G7-3 rubrica de qualidade | Cai junto com o item 3 |
| 5 | G0-5 logs estruturados | Depurar em produção fica muito mais caro |
| 6 | G2-5 e G1-4 categoria dos casos | Todo caso de teste passa a valer o mesmo |
| 7 | G2-4 custo por execução | Não sabemos quanto custa uma questão |
| 8 | G4-4 estados de erro | O professor trava e não sabe porquê |
| 9 | G6-6 cobertura mínima | Geração ancorada roda com acervo raso |
| 10 | G8-4 LGPD mínimo | Só aceitável se o acesso continuar restrito a nós |

!!! danger "O que não se corta, em nenhuma hipótese"
    **G2-2** (verificação de escopo), **G3-2** (aprovação humana), **G3-4** (só aprovadas no
    XML), **G8-1** (acesso por convite), **G8-2** e **G0-6** (cota e teto de custo).

    Cortar G2-2 ou G3-4 entrega questão inválida a uma turma. Cortar G8-1, G8-2 ou G0-6
    entrega a nossa chave de API à internet. Se o prazo não couber com estes seis dentro,
    o que muda é o escopo do resto — nunca estes.

---

## 8 · Pronto para começar, e pronto

### Definition of Ready — a história pode entrar numa sprint

- [ ] Tem "como / quero / para que", e o "para que" não é circular.
- [ ] Tem critérios de aceite verificáveis — alguém que não escreveu sabe dizer se passou.
- [ ] Tem estimativa em SP, dupla e prioridade.
- [ ] Não depende de nada que não esteja pronto ou na mesma sprint.
- [ ] Se toca `prompts.py` ou `export/templates/`, tem revisor humano nomeado.

### Definition of Done

A da [`AGENTS.md` §6](https://github.com/TUTOR-IA-Makers/tutor-ia/blob/main/AGENTS.md),
sem mudanças, mais dois itens:

- [ ] `make check` passa.
- [ ] Comportamento novo tem teste; correção de bug tem teste que falhava antes.
- [ ] Documentação corresponde à realidade.
- [ ] Decisão arquitetural registrada como ADR.
- [ ] Arquivo de tarefa apagado, PR fecha a issue.
- [ ] Nada no diff está fora da tarefa.
- [ ] **Demonstrado na revisão de sprint**, rodando pela URL de produção — não em `localhost`.
- [ ] **Se mudou o prompt:** lote de regressão do G7-2 rodado, e o relatório está no PR.

---

## 9 · Cerimônias, dimensionadas para quem tem outras matérias

| Quando | O quê | Duração |
| --- | --- | --- |
| Primeiro dia da sprint | Planning: revisar o plano, estimar o que mudou, cada dupla pega o seu | 60 min |
| Todo dia, assíncrono | No canal, até as 22 h: ontem / hoje / bloqueio. Três linhas | 2 min |
| Quarta | Sincronização: só bloqueios e decisões | 30 min |
| Último dia da sprint | Review (demo pela URL) + retro (o que cortar, o que mudar) | 45 min |

**Regra de revisão de PR:** revisão em até 24 h úteis. PR aberto na sexta não espera revisão
no sábado — e por isso PR grande não se abre na sexta.

**Regra do bloqueio:** ninguém fica bloqueado mais de 24 h em silêncio. Bloqueio anunciado é
problema da equipe; bloqueio escondido é problema da sprint.

---

## 10 · O que é entregue em 30/11

Doze critérios verificáveis. Não é "está bonito" — é passa ou não passa.

| # | Critério | Como se verifica |
| --- | --- | --- |
| 1 | URL pública no ar | Respondeu `GET /health` nas 72 h anteriores, sem queda |
| 2 | O fluxo funciona sem nós | Um professor convidado gera → revisa → aprova → baixa XML → importa no Moodle, **sem ajuda** |
| 3 | Acervo catalogado | ≥ 8 questões de referência por combinação nos eixos E1–E4 |
| 4 | Questões geradas pelo fluxo | ≥ 20 questões geradas, revisadas e aprovadas |
| 5 | Toda aprovada compila | 100% das aprovadas compilam e passam nos seus próprios casos |
| 6 | Nenhuma aprovada viola o escopo | 0 violações, verificadas por `tree-sitter-c` |
| 7 | Nenhum falso positivo de escopo | Conjunto adversarial (`for` em comentário, string, identificador) com 0 falsos positivos |
| 8 | O custo é conhecido | Custo médio por questão gerada e por questão aprovada, registrados |
| 9 | O acesso é controlado | Nenhum endpoint de geração responde sem sessão; cota e teto de custo ativos |
| 10 | O portão está verde | `make check` verde em `main`, cobertura não menor que hoje |
| 11 | Nenhum segredo no repositório | `scripts/check.sh` verde; histórico conferido |
| 12 | A documentação não mente | Nenhuma afirmação sobre a plataforma apresentada como construída |

!!! success "O critério 2 é o único que importa de verdade"
    Os outros onze são condições para ele. Se um professor consegue usar sozinho e o
    resultado importa no Moodle dele, entregamos um produto. Se não, entregamos um repositório.

---

## 11 · O que fica fora, e porquê {#11-o-que-fica-fora-e-porque}

| Fora do recorte | Por quê | Quando |
| --- | --- | --- |
| **Submissão de aluno, nota, feedback por IA** | É a Onda 1 inteira. Exige sandbox, identidade, análise de AST de código de aluno, filas. Nove semanas não cabem | Depois |
| **Sandbox Judge0 (FEAT-033)** | VPCs separadas, GCE com cgroup v1, versão fixada e monitorada por CVE — 2 sprints de duas pessoas, sozinho | Antes de qualquer código de aluno rodar |
| **Multi-tenancy e RLS** | Um professor piloto não precisa. E RLS mal feita é pior que ausência de RLS | Antes do segundo cliente |
| **Vertex AI, cache de feedback, circuit breaker** | Pertencem ao feedback, que não existe neste recorte | Onda 1 |
| **Análise estrutural de código de aluno (C2)** | Usamos `tree-sitter-c` para verificar **a nossa** solução (G2-2), não a do aluno. São problemas diferentes | Onda 1 |
| **Versionamento de questão, aprovador ≠ solicitante** | Exigem atividade e papéis, que não existem aqui | Ondas 0 e 1 |

!!! danger "A dívida que assumimos com nome e sobrenome"
    Vamos **compilar e executar código gerado por um modelo, dentro do processo do Cloud Run,
    sem isolamento real** — com tempo-limite de compilação e de execução, teto de saída e
    morte do grupo de processos, mas **sem limite de memória, sem limite de número de
    processos e sem restrição de rede ou de sistema de arquivos**. É contenção, não
    isolamento. Ver [ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md)
    e [lacuna 4](roadmap.md#lacunas-conhecidas).

    É aceitável aqui por três razões, todas condicionais: o código vem de um modelo e não de
    um adversário; nenhum código de aluno chega perto disto; e o acesso é por convite (G8-1).
    **Se qualquer uma das três deixar de ser verdade, FEAT-033 passa a bloquear.** G8-3
    registra isso por escrito, para ninguém confundir "está aceito" com "está resolvido".

---

## 12 · Riscos

| Risco | Impacto | Mitigação | Dono |
| --- | --- | --- | --- |
| Estado no sistema de arquivos não sobrevive ao Cloud Run | Alto | G0-4 na S1, com ADR. Descobrir em outubro, não em novembro | A |
| `tree-sitter-c` não distingue algum caso de escopo | Alto | Conjunto adversarial escrito **antes** do parser (G2-2). Plano B: aviso na tela em vez de rejeição automática | A |
| Novembro come a capacidade (provas, trabalhos finais) | Alto | Desconto já aplicado; S4 a 72%; ordem de sacrifício decidida antes de doer | PO |
| Custo de LLM estoura | Médio | G0-6 e G8-2, teto duro, alerta em 50% | C |
| Catalogar 32 questões é mais lento que o estimado | Médio | Começa na S0, distribuído em três sprints. Se atrasar, reduz de 4 eixos para 2 e diz isso na documentação | C |
| Uma dupla fica bloqueada esperando outra | Médio | Backend entrega API antes da tela; front trabalha contra mock até a API existir | Todos |
| `gcc` não roda no Cloud Run como esperado | Médio | G0-1 e G0-2 na S0. É a primeira coisa que testamos | A |
| Geração ancorada piora a qualidade em vez de melhorar | Médio | G7-2 dá o número antes e depois. Se piorar, reverte — o prompt é versionado | C |
| Professor piloto não aparece | Médio | Convidar na S1, não na S4. Segundo nome de reserva | PO |
| Uma pessoa desaparece por duas semanas | Médio | Duplas, não indivíduos. Arquivo de tarefa por branch carrega o contexto | Todos |
| Mudança de prompt quebra o que funcionava | Baixo | Versão de prompt explícita + lote de regressão obrigatório na DoD | C |

---

## 13 · Onde este plano vive

- **Esta página** é o contrato de escopo. Muda por PR, com a razão da mudança.
- **As issues do GitHub** são o trabalho. Uma issue por história, label do épico e da dupla.
- **O arquivo de tarefa** em `.agents/tasks/` carrega o contexto de cada branch.
- **O [backlog do MVP](mvp-backlog.md)** continua descrevendo a plataforma-alvo, para depois.

!!! quote "A regra que sobrevive a este plano"
    Nenhuma saída de modelo entra no cálculo de uma nota. Neste recorte, isso aparece como:
    **a saída esperada de um caso de teste nunca é escrita por um modelo nem digitada por uma
    pessoa — ela é o que a solução compilada imprimiu.** Se uma história deste plano parecer
    exigir o contrário, a história está errada.

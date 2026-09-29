# Backlog do MVP

<p class="lead">O backlog das Ondas 0 e 1 derivado do SAD v0.1, organizado para importação no GitHub Projects (Épicos → Histórias de Utilizador → Tarefas). Descreve a <strong>plataforma alvo</strong>, não este repositório.</p>

!!! warning "Documento em reformulação — direção, não contrato"
    Este backlog reflete o SAD v0.1 e **está a ser reformulado** pela equipa. Trate-o como a direção pretendida, não como a lista de trabalho acordada: os números, as prioridades e o recorte dos épicos vão mudar.

    O trabalho efetivamente em curso vive nas [*issues* do GitHub](https://github.com/HugoRosa29/coderunner_v2/issues). O que este repositório implementa hoje é um protótipo do EPIC-017, da Onda 3 — nada nesta página está construído aqui. Ver [Análise de lacunas](gap-analysis.md).

!!! info "Onde o SAD e o briefing divergem"
    Onde o SAD regista uma **divergência arquitetural (D-1, D-2, D-3)**, o backlog já reflete a decisão corrigida, e não o briefing original.

---

## Legenda de prioridade
- **P0** — bloqueia o MVP, sem isso o sistema não funciona ou não é seguro.
- **P1** — necessário para o MVP funcional completo.
- **P2** — importante, mas pode ser ajustado após o piloto.

---

## ÉPICO 0 — Fundação de Infraestrutura e DevOps (Chores)

Tarefas técnicas que precisam existir antes (ou em paralelo com) a primeira linha de código de produto.

| # | Tarefa | Prioridade |
|---|--------|------------|
| 0.1 | Criar monorepo (API + Worker de Avaliação + Worker de Feedback no mesmo repositório, entrypoints distintos) | P0 |
| 0.2 | Configurar projeto GCP com **VPCs separadas**: aplicação (Cloud Run) e sandbox (GCE/GKE), sem rota entre elas exceto pela porta da API do Judge0 | P0 |
| 0.3 | Provisionar Cloud SQL (PostgreSQL 16) com backup automático e réplica de leitura (se orçamento permitir) | P0 |
| 0.4 | Configurar Cloud Run para API (autoscale, min-instances=0) e para Worker de Avaliação (min-instances ≥ 1) | P0 |
| 0.5 | Provisionar GCE MIG (ou GKE com node pool dedicado) para Judge0 CE, com cgroup v1 habilitado via GRUB, isolado em VPC própria, sem saída à internet | P0 |
| 0.6 | Configurar Cloud Tasks (fila de avaliação) e Pub/Sub (fila de feedback) | P0 |
| 0.7 | Provisionar Memorystore/Redis (cache de feedback por hash + controle de cota) | P1 |
| 0.8 | Pipeline CI/CD (lint, testes, build de imagem, deploy automatizado por serviço) | P0 |
| 0.9 | Configurar ambiente de staging isolado (dados fictícios, sem PII real) | P1 |
| 0.10 | Definir Row Level Security (RLS) no PostgreSQL por `tenant_id`, incluindo usuário de conexão **sem** `BYPASSRLS` | P0 |
| 0.11 | Configurar observabilidade: métricas (fila, p50/p95/p99, erro por etapa, custo IA), tracing por `submission_id`, alertas (fila, p95, cota 80%, falha de sandbox, acesso cruzado entre tenants) | P0 |
| 0.12 | Prova de conceito: Judge0 rodando em GCE com 20 execuções concorrentes (valida D-1 antes de qualquer tela) | P0 |
| 0.13 | Protótipo do analisador C2 (tree-sitter-c) sobre 50 códigos reais de aluno, incluindo códigos que não compilam (valida D-2) | P0 |
| 0.14 | Definir política de retenção e criptografia em repouso para código de aluno (dado pessoal) | P1 |
| 0.15 | Contratar/configurar Vertex AI com residência de dados no Brasil (quando disponível) e cláusula contratual vedando uso de dados para treinamento | P1 |
| 0.16 | Configurar serviço de e-mail (convites, recuperação de senha) | P2 |

---

## ÉPICO 1 — Identidade, Multi-tenancy e Controle de Acesso

### História 1.1
**Como** Administrador, **eu quero** criar e configurar um tenant (instituição) **para que** cada instituição opere isolada das demais na mesma plataforma.

**Critérios de aceite:**
- Criar instituição gera `tenant_id` único e registro em `INSTITUICAO` (nome, plano, `config_ia`).
- Nenhuma consulta de outro tenant retorna dados desta instituição, mesmo com filtro esquecido no código (validado via RLS).
- Ação registrada em log de auditoria.

### História 1.2
**Como** Administrador, **eu quero** convidar e gerenciar usuários (papéis: Professor, Tutor, Monitor, Coordenador, Aluno, Administrador) **para que** cada pessoa tenha acesso apenas ao que seu papel permite.

**Critérios de aceite:**
- Convite por e-mail cria usuário vinculado ao `tenant_id` correto.
- Papel definido em `VINCULO` restringe endpoints e ações visíveis.
- Usuário menor de idade (`eh_menor`) exige registro de consentimento antes da ativação.

### História 1.3
**Como** usuário de qualquer papel, **eu quero** fazer login e recuperar senha com segurança **para que** eu acesse apenas meus próprios dados.

**Critérios de aceite:**
- Autenticação valida tenant + papel a cada requisição (variável de sessão para RLS).
- Fluxo de recuperação de senha via e-mail funcional e com expiração de token.
- Tentativas de acesso cruzado entre tenants geram alerta automático.

### História 1.4
**Como** Administrador, **eu quero** definir cotas de uso de IA por instituição **para que** o custo de IA seja previsível e controlável.

**Critérios de aceite:**
- Registro em `COTA_IA` com `teto_periodo` e `consumo_atual`.
- Alerta automático ao atingir 80% da cota.
- Ao atingir 100%, sistema degrada (não bloqueia nota).

---

## ÉPICO 2 — Gestão Acadêmica (Disciplinas, Turmas, Vínculos)

### História 2.1
**Como** Professor, **eu quero** criar disciplinas e turmas **para que** eu possa organizar minhas atividades por período letivo.

**Critérios de aceite:**
- Disciplina e turma sempre vinculadas ao `tenant_id`.
- Turma suporta até 120 alunos (conforme premissa de carga) sem degradação perceptível.
- Professor só visualiza turmas às quais está vinculado.

### História 2.2
**Como** Professor/Administrador, **eu quero** vincular alunos e outros papéis (Tutor, Monitor) a uma turma **para que** cada pessoa tenha o acesso correto às atividades daquela turma.

**Critérios de aceite:**
- Vínculo cria registro em `VINCULO` com papel explícito.
- Aluno vinculado só vê atividades da própria turma.
- Remoção de vínculo revoga acesso imediatamente.

---

## ÉPICO 3 — Banco de Questões

### História 3.1
**Como** Tutor/Professor, **eu quero** criar uma questão de programação em C com enunciado, estruturas permitidas/proibidas/obrigatórias e solução de referência **para que** eu possa reutilizá-la em diferentes atividades.

**Critérios de aceite:**
- Questão versionada (`QUESTAO_VERSAO` com `numero_versao`), nunca editada in-place após publicação.
- Campos `estruturas_permitidas`, `estruturas_proibidas`, `estruturas_obrigatorias` armazenados em JSON e validados na criação.
- Status da questão (rascunho/publicada) controla se pode ser usada em nova atividade.

### História 3.2
**Como** Tutor/Professor, **eu quero** cadastrar casos de teste (típico, limite, borda, inválido) para cada questão **para que** a avaliação C1 seja objetiva e completa.

**Critérios de aceite:**
- Caso de teste tem `visibilidade` (público/privado), `categoria`, entrada e saída esperada.
- Pelo menos 1 caso público e 1 privado exigidos antes de publicar a questão.
- Casos privados nunca são expostos ao aluno, nem em mensagens de erro.

### História 3.3
**Como** Tutor, **eu quero** validar uma questão (rodando a solução de referência contra os casos de teste) antes de publicá-la **para que** eu não publique uma questão com gabarito incorreto.

**Critérios de aceite:**
- Botão "Validar questão" executa a solução de referência no sandbox e compara com saídas esperadas.
- Falha em qualquer caso bloqueia a publicação com mensagem clara.
- Resultado da validação fica registrado (rastreabilidade).

---

## ÉPICO 4 — Atividades e o Toggle de Modo de Avaliação

### História 4.1
**Como** Professor, **eu quero** publicar uma atividade a partir de uma ou mais questões, com prazo e número máximo de tentativas **para que** meus alunos saibam o que e até quando submeter.

**Critérios de aceite:**
- Atividade referencia `QUESTAO_VERSAO` específica (imutável mesmo se a questão for atualizada depois).
- Prazo e `max_tentativas` aplicados no momento da submissão.
- Aluno vê a atividade apenas após publicação.

### História 4.2
**Como** Professor, **eu quero** escolher o modo de avaliação da atividade entre **FORMATIVO, ESCOPO e ESTRITO** **para que** eu controle se e como as violações de C2 afetam a nota.

**Critérios de aceite:**
- Três posições distintas implementadas (não apenas duas, conforme correção do SAD): FORMATIVO (nada penaliza), ESCOPO (só violação de escopo penaliza), ESTRITO (escopo + qualidade determinística).
- Padrão da atividade nova é FORMATIVO (ou ESCOPO, conforme decisão final do time com professores).
- Modo aplicado é salvo por submissão (snapshot), não é recalculado retroativamente ao ser alterado.

### História 4.3
**Como** Professor, **eu quero** definir pesos por categoria de caso de teste e penalidades por tipo de violação de C2 **para que** a nota reflita a rubrica da minha disciplina.

**Critérios de aceite:**
- `pesos_categorias` e `penalidades_c2` editáveis por atividade.
- Apenas critérios 100% determinísticos entram na conta no modo ESTRITO (nunca critérios de julgamento como "nomes ruins").
- Alteração de pesos após publicação não afeta submissões já avaliadas.

### História 4.4
**Como** Professor, **eu quero** alterar o modo de avaliação de uma atividade já publicada e, opcionalmente, recalcular submissões antigas **para que** eu tenha flexibilidade sem violar a confiança do aluno.

**Critérios de aceite:**
- Mudança de toggle afeta apenas submissões futuras por padrão (RN-ARQ-02).
- Recálculo retroativo é ação explícita, separada, que gera nova `AVALIACAO` (submissão original nunca é sobrescrita).
- Ação de recálculo registrada em auditoria e alunos afetados são notificados.

---

## ÉPICO 5 — Submissão de Código

### História 5.1
**Como** Aluno, **eu quero** submeter meu código C para uma questão de uma atividade **para que** eu receba nota e feedback.

**Critérios de aceite:**
- API valida payload, tenant, prazo e número de tentativas antes de aceitar.
- Resposta é HTTP 202 com `id` da submissão em dezenas de milissegundos (a API nunca processa a submissão de forma síncrona).
- Submissão persiste snapshot de `modo_avaliacao`, `pesos_categorias`, `versao_questao` e `versao_rubrica` (RN-ARQ-01).

### História 5.2
**Como** Aluno, **eu quero** ver minha posição na fila e uma estimativa de tempo **para que** eu não fique no escuro sobre o processamento da minha submissão.

**Critérios de aceite:**
- Status da submissão consultável em tempo real (ex.: ENFILEIRADA, EM_AVALIACAO, AVALIADA, FALHA_INFRA).
- Estimativa exibida com base em profundidade e velocidade de drenagem da fila.
- Limite de submissões por aluno/minuto aplicado e comunicado ao usuário.

### História 5.3
**Como** Aluno, **eu quero** que reenvios idênticos da minha submissão não gerem avaliações duplicadas **para que** o sistema seja consistente mesmo se eu clicar duas vezes ou a rede falhar.

**Critérios de aceite:**
- Idempotência garantida pela chave da tarefa = `id` da submissão.
- Reentrega da fila não gera segunda `AVALIACAO`.
- Teste automatizado cobre o cenário de reentrega.

---

## ÉPICO 6 — Execução Segura de Código (Sandbox / C1)

### História 6.1
**Como** sistema, **eu quero** compilar e executar o código do aluno de forma isolada contra os casos de teste **para que** o resultado (C1) seja confiável e não comprometa a infraestrutura.

**Critérios de aceite:**
- Execução ocorre exclusivamente no serviço Judge0 (GCE/GKE), nunca no processo da API ou do Worker (D-1).
- Limites aplicados: tempo de CPU, tempo real, memória, número de processos, tamanho de saída; sem acesso à rede.
- Pior caso de CPU por submissão (~20s) respeitado sem impactar outras submissões em paralelo.

### História 6.2
**Como** Aluno, **eu quero** ver claramente quais casos de teste públicos passaram ou falharam **para que** eu entenda meu resultado sem expor os casos privados.

**Critérios de aceite:**
- Resultado por caso (`resultado_por_caso`) exibido apenas para casos com `visibilidade=PUBLICO`.
- Casos privados contam para a nota mas não revelam entrada/saída esperada.
- Erro de compilação exibido com a mensagem original do compilador.

### História 6.3
**Como** time de Engenharia, **eu quero** que o host do sandbox seja tratado como comprometido por padrão **para que** um escape de sandbox não comprometa a aplicação ou os dados.

**Critérios de aceite:**
- VPC do sandbox sem rota de saída à internet e sem acesso à VPC da aplicação, exceto pela porta da API do Judge0.
- Instâncias efêmeras, recicladas periodicamente, sem estado persistente no host.
- Versão do Judge0 fixada e monitorada quanto a CVEs (vulnerabilidades de escape corrigidas em 2024).

---

## ÉPICO 7 — Análise Estrutural (C2)

### História 7.1
**Como** sistema, **eu quero** analisar a estrutura do código do aluno (mesmo que ele não compile) **para que** eu detecte violações de escopo e métricas de qualidade de forma determinística.

**Critérios de aceite:**
- Parser primário é tree-sitter-c (tolerante a erro), não pycparser (D-2).
- Código que não compila ainda gera análise estrutural parcial (não é bloqueado por erro de sintaxe).
- Resultado versionado (`versao_analisador`) e persistido em `ANALISE_ESTRUTURAL`.

### História 7.2
**Como** sistema, **eu quero** usar libclang como camada complementar quando o código compila **para que** eu obtenha informação semântica (tipos, resolução de símbolos) que o tree-sitter não fornece.

**Critérios de aceite:**
- libclang acionado apenas para código que compila com sucesso.
- Falha do libclang não impede a análise sintática do tree-sitter de ser entregue.
- Resultados de ambas as camadas combinados em `estruturas_detectadas` / `criterios_rubrica`.

### História 7.3
**Como** Professor, **eu quero** que apenas critérios objetivos (uso de estrutura proibida/obrigatória) contem como "violação de escopo", separados de critérios de "qualidade" (nomes, duplicação, aninhamento) **para que** a penalização seja justa e não gere contestação.

**Critérios de aceite:**
- Violação de escopo e violação de qualidade tratadas como categorias distintas no modelo de dados e na rubrica.
- Modo ESCOPO penaliza apenas violações objetivas de escopo.
- Modo ESTRITO penaliza escopo + apenas critérios de qualidade 100% determinísticos (layout, duplicação, memória/segurança) — nunca os que dependem de julgamento.

---

## ÉPICO 8 — Cálculo de Nota (Avaliação Determinística)

### História 8.1
**Como** sistema, **eu quero** compor a nota final a partir de C1 e C2 conforme o modo de avaliação da atividade **para que** a nota seja sempre reprodutível e auditável.

**Critérios de aceite:**
- Reexecutar a mesma submissão com o mesmo snapshot produz nota idêntica (nota é função exclusiva do snapshot + código).
- Nenhuma chamada à Vertex AI ocorre no caminho de cálculo/escrita da nota — verificável por teste automatizado.
- Nota é publicada e visível ao aluno antes de qualquer processamento de feedback por IA.

### História 8.2
**Como** Professor, **eu quero** sobrescrever manualmente a nota de uma submissão, com justificativa **para que** eu possa corrigir casos excepcionais.

**Critérios de aceite:**
- Sobrescrita registrada em `AVALIACAO.sobrescrita_professor` com `justificativa` obrigatória.
- Ação auditada (quem, quando, valor anterior/novo).
- Aluno é notificado da alteração.

### História 8.3
**Como** Aluno, **eu quero** que uma falha de infraestrutura nunca resulte em nota zero **para que** eu não seja penalizado por um problema que não causei.

**Critérios de aceite:**
- Falha do Judge0 mantém submissão em status de processamento/retentativa, nunca avaliada como zero.
- Falha do analisador estrutural marca C2 como INDISPONÍVEL; nota calculada apenas com C1, sem penalização por violação não detectada.
- Status `FALHA_INFRA` visível ao aluno e ao professor (nunca silencioso).

---

## ÉPICO 9 — Feedback Formativo por IA

### História 9.1
**Como** Aluno, **eu quero** receber um feedback textual explicando meus erros e acertos **para que** eu aprenda com a submissão, além de apenas ver a nota.

**Critérios de aceite:**
- Feedback gerado de forma assíncrona, após a nota já estar persistida e visível ao aluno.
- Prompt enviado ao Gemini Flash contém apenas evidências estruturadas de C1/C2 (casos falhos, violações, métricas) — nunca a tarefa de "julgar".
- Toda afirmação do feedback é rastreável a uma evidência; afirmações sem âncora são descartadas (filtro anti-ancoragem).

### História 9.2
**Como** sistema, **eu quero** evitar chamadas desnecessárias à IA (erro de compilação óbvio, submissão idêntica, 100% de acerto sem violação) **para que** o custo de IA seja controlado.

**Critérios de aceite:**
- As três condições de "não chamar IA" implementadas e testadas.
- Feedback determinístico curto gerado nesses casos, com `origem=DETERMINISTICO`.
- Métrica de taxa de acionamento condicional disponível no painel de observabilidade.

### História 9.3
**Como** sistema, **eu quero** cachear feedback por hash de código + versão de questão + versão de prompt + modelo **para que** submissões repetidas na turma não gerem custo de IA duplicado.

**Critérios de aceite:**
- Chave composta implementada exatamente com as 4 dimensões (evita servir feedback obsoleto após mudança de questão/prompt).
- Cache hit registra `origem=CACHE` em `FEEDBACK`.
- Taxa de acerto do cache visível na observabilidade.

### História 9.4
**Como** sistema, **eu quero** aplicar um filtro anti-solução no texto gerado **para que** o feedback nunca entregue a resposta pronta ao aluno.

**Critérios de aceite:**
- Filtro roda antes da persistência do feedback.
- Conjunto adversarial de casos de teste cobre tentativas de "vazamento de solução".
- Reportes de vazamento passam por revisão manual periódica.

### História 9.5
**Como** Aluno, **eu quero** continuar recebendo algum feedback mesmo se a IA estiver indisponível ou a cota esgotada **para que** minha experiência de aprendizado não seja interrompida.

**Critérios de aceite:**
- Circuit breaker abre em falha/indisponibilidade da Vertex AI e aciona feedback determinístico a partir de C1/C2.
- Estado do circuit breaker visível na observabilidade.
- Cota em 100% degrada (gera feedback determinístico) em vez de bloquear a entrega ao aluno.

---

## ÉPICO 10 — Resiliência e Absorção de Pico

### História 10.1
**Como** time de Engenharia, **eu quero** que a fila de avaliação seja durável e externa ao processo da API **para que** nenhuma submissão seja perdida em caso de reciclagem de instância (D-3).

**Critérios de aceite:**
- Fila implementada em Cloud Tasks (avaliação) e Pub/Sub (feedback), nunca em memória do processo FastAPI.
- Retentativa com backoff exponencial configurada; após N falhas, vai para fila morta e gera alerta.
- Teste de carga simula reciclagem de instância do Cloud Run sem perda de submissão.

### História 10.2
**Como** time de Engenharia, **eu quero** dimensionar o pool de execução do Judge0 para absorver o pico de véspera de prazo **para que** o p95 de 30s seja respeitado mesmo sob rajada.

**Critérios de aceite:**
- Dimensionamento inicial calculado (≈13 execuções simultâneas, pool com margem para 20) e validado em teste de carga com 50-100 submissões/min.
- Cloud Tasks configurado com taxa de despacho limitada para proteger o Judge0 (gargalo real).
- Alerta configurado para profundidade/idade de fila acima do limite.

---

## ÉPICO 11 — Segurança e Privacidade (Transversal)

### História 11.1
**Como** Encarregado de Dados (DPO)/Administrador, **eu quero** garantir que dados enviados à Vertex AI nunca identifiquem o aluno **para que** a plataforma esteja em conformidade com privacidade de dados de menores (RN-PRIV-01).

**Critérios de aceite:**
- Payload enviado à IA auditado para confirmar ausência de nome, matrícula, e-mail ou qualquer identificador direto.
- Contrato com a Vertex AI confirma não uso de dados para treinamento e residência de dados no Brasil, quando disponível.
- Teste automatizado bloqueia deploy se um campo de PII for adicionado ao payload de IA por engano.

### História 11.2
**Como** Administrador, **eu quero** que vazamento de dados entre tenants seja tecnicamente impossível, não apenas uma boa prática de código **para que** um incidente de segurança grave seja evitado.

**Critérios de aceite:**
- RLS ativa em toda tabela de domínio, com política por `tenant_id`.
- Suíte automatizada de teste de vazamento cobre todos os endpoints (contínua, roda no CI).
- Usuário de conexão da aplicação nunca tem `BYPASSRLS`.

### História 11.3
**Como** Administrador, **eu quero** gerenciar o consentimento e o direito de exclusão de dados de alunos menores de idade **para que** a plataforma cumpra obrigações legais.

**Critérios de aceite:**
- Vínculo de consentimento (`consentimento_id`) separado do cadastro do usuário, facilitando exclusão pontual.
- Fluxo de solicitação de exclusão implementado e testado.
- Auditoria registra toda operação de exclusão/anonimização.

---

## ÉPICO 12 — Observabilidade e Painéis de Gestão

### História 12.1
**Como** Coordenador, **eu quero** ver relatórios agregados de desempenho das turmas **para que** eu tenha visão institucional sem acessar submissão por submissão.

**Critérios de aceite:**
- Relatório agregado por turma/disciplina, respeitando escopo de tenant e papel.
- Dados sensíveis (código-fonte do aluno) não expostos no relatório agregado.
- Exportação básica (CSV) disponível.

### História 12.2
**Como** time de Engenharia/Operação, **eu quero** um painel com métricas de fila, latência (p50/p95/p99), custo de IA e taxa de cache **para que** eu detecte degradação antes que afete o aluno.

**Critérios de aceite:**
- Painel exibe profundidade/idade da fila, p50/p95/p99 de C1, C2 e feedback, taxa de erro por etapa.
- Alertas configurados conforme seção 5.4 do SAD (fila, p95, cota 80%, falha de sandbox, acesso cruzado).
- `submission_id` funciona como trace id de ponta a ponta em todos os logs.

---

## Resumo de Épicos (para colunas/labels no GitHub Projects)

1. Fundação de Infraestrutura e DevOps *(chores)*
2. Identidade, Multi-tenancy e Controle de Acesso
3. Gestão Acadêmica
4. Banco de Questões
5. Atividades e Toggle de Avaliação
6. Submissão de Código
7. Execução Segura (Sandbox / C1)
8. Análise Estrutural (C2)
9. Cálculo de Nota
10. Feedback Formativo por IA
11. Resiliência e Absorção de Pico
12. Segurança e Privacidade
13. Observabilidade e Painéis

## Riscos que devem virar Issues de acompanhamento (não histórias, mas itens de tracking)
- Judge0 não sobe conforme esperado no GCP → PoC no bloco 1.
- tree-sitter insuficiente para alguma verificação de escopo → conjunto adversarial de códigos-teste.
- Custo de VM do sandbox ociosa → escala mínima 1, medir no piloto.
- RLS mal configurada vazando entre tenants → suíte contínua de teste de vazamento.
- Feedback vazando solução → conjunto adversarial + filtro + revisão manual.

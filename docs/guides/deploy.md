# Deploy no Cloud Run

<p class="lead">Todo merge em <code>main</code> que passa no portão vira uma revisão nova no Cloud Run, sem ninguém rodar comando. Esta página explica o que o workflow faz, o que impede um deploy e a configuração do GCP que precisa existir, uma vez, antes do primeiro.</p>

<span class="ce-badge ce-status--wip">Em desenvolvimento</span> `.github/workflows/deploy.yml` existe; o projeto GCP ainda não foi configurado, então nenhum deploy rodou e não há URL de produção ([G0-2](../product/roadmap.md#infraestrutura-e-deploy)).

!!! danger "A imagem não é um sandbox"
    O serviço compila e roda o código gerado sem isolamento além de tempo e tamanho de saída ([ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md)). O workflow **não** torna o serviço público: quem pode chamá-lo é configurado no próprio serviço, por uma pessoa. Veja [Quem pode chamar o serviço](#quem-pode-chamar).

## O que acontece num merge

1. O `ci.yml` roda o portão, o mesmo `./scripts/check.sh` de sempre.
2. Quando ele termina, o `deploy.yml` é disparado (`workflow_run`). O job só roda se o CI **passou** e foi um push em `main`; falha, cancelamento ou PR não chegam ao deploy.
3. Faz checkout do commit exato que o CI verificou, constrói a imagem com o [`Dockerfile`](docker.md) e a envia ao Artifact Registry com o SHA como tag.
4. Publica a imagem no serviço do Cloud Run com `--port=8000` e `CODEEXPERT_COMMIT_SHA=<sha>`. As outras variáveis do serviço são mantidas.
5. Chama `GET /health` na URL do serviço e falha se `commit` não for o SHA publicado.

Deploys nunca são cancelados no meio. O GitHub guarda **um** deploy pendente por vez, então, se vários merges chegam em sequência, os do meio são descartados. Antes de construir, um job confere se o commit ainda é a ponta de `main`; se não for, o deploy é pulado (não falha), porque o commit mais novo publica a si mesmo depois do próprio CI.

## Conferir o que está no ar

```bash
curl https://SERVICO-XXXX.a.run.app/health
# {"status":"ok","version":"0.2.0","commit":"<sha do último merge em main>"}
```

`commit` deve ser igual a `git rev-parse origin/main`. Se o serviço não for público, acrescente `-H "Authorization: Bearer $(gcloud auth print-identity-token)"`.

## Configuração única do GCP {#configuracao-gcp}

Feita uma vez, à mão, por quem tem acesso ao projeto. O workflow não cria infraestrutura.

**Não há chave de conta de serviço.** O GitHub emite um token OIDC de curta duração para o job, e o GCP o troca por credenciais via Workload Identity Federation. Nada secreto fica no repositório nem nos *secrets* do GitHub.

Os valores abaixo são fictícios; troque pelos do projeto.

```bash
PROJECT_ID=meu-projeto
REGION=southamerica-east1
REPO=TUTOR-IA-Makers/tutor-ia
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  iamcredentials.googleapis.com --project "$PROJECT_ID"

# Onde as imagens ficam
gcloud artifacts repositories create codeexpert --repository-format=docker \
  --location="$REGION" --project "$PROJECT_ID"

# Quem faz o deploy
gcloud iam service-accounts create github-deploy --project "$PROJECT_ID"
SA="github-deploy@$PROJECT_ID.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/run.developer
gcloud artifacts repositories add-iam-policy-binding codeexpert --location="$REGION" \
  --project "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/artifactregistry.writer
# Necessário para publicar uma revisão que roda como a conta de serviço do serviço
gcloud iam service-accounts add-iam-policy-binding \
  "$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --project "$PROJECT_ID" --member="serviceAccount:$SA" --role=roles/iam.serviceAccountUser

# Confiança no GitHub, restrita ao ambiente "production" deste repositório
gcloud iam workload-identity-pools create github --location=global --project "$PROJECT_ID"
gcloud iam workload-identity-pools providers create-oidc tutor-ia \
  --location=global --workload-identity-pool=github --project "$PROJECT_ID" \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub" \
  --attribute-condition="assertion.sub == 'repo:$REPO:environment:production'"
gcloud iam service-accounts add-iam-policy-binding "$SA" --project "$PROJECT_ID" \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/subject/repo:$REPO:environment:production"
```

A condição restringe o acesso a jobs do ambiente `production`. Em **Settings → Environments → production** do GitHub, limite o ambiente à branch `main`; assim nem um workflow de outra branch obtém credenciais.

*A confirmar:* se `roles/iam.workloadIdentityUser` basta para o passo que gera o token de identidade usado na verificação do `/health`, ou se a conta também precisa de `roles/iam.serviceAccountTokenCreator` sobre si mesma.

### Variáveis do repositório

Em **Settings → Secrets and variables → Actions → Variables** (são identificadores, não segredos). O workflow para com erro se alguma faltar.

| Variável | Exemplo |
| --- | --- |
| `GCP_PROJECT_ID` | `meu-projeto` |
| `GCP_REGION` | `southamerica-east1` |
| `GCP_ARTIFACT_REPOSITORY` | `codeexpert` |
| `CLOUD_RUN_SERVICE` | `codeexpert` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/tutor-ia` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `github-deploy@meu-projeto.iam.gserviceaccount.com` |

## Quem pode chamar o serviço {#quem-pode-chamar}

O workflow não passa `--allow-unauthenticated`, então o primeiro deploy cria um serviço **privado** e os seguintes não mudam isso. Tornar a URL pública é decisão da equipe, não do pipeline: as [regras de segurança](https://github.com/TUTOR-IA-Makers/tutor-ia/blob/main/.agents/rules/security.md) pedem que o serviço não fique exposto à internet enquanto não houver autenticação (G8-1).

Com o serviço privado, a conta `github-deploy` precisa de `roles/run.invoker` para a verificação do `/health` passar. Concedido no projeto, vale já no primeiro deploy, antes de o serviço existir:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA" --role=roles/run.invoker
```

## Chave do modelo

O workflow não toca na chave. Sem `CODEEXPERT_LLM_API_KEY` o serviço sobe e responde `GET /health`, mas a geração responde `503` ([configuração](../reference/configuration.md#variaveis-de-ambiente)). Levar a chave ao Secret Manager é o G0-3, <span class="ce-badge ce-status--planned">Planejado</span>.

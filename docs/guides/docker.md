# Rodar com Docker

<p class="lead">A API, o <code>gcc</code> e o front-end numa imagem só, para que o mesmo artefato rode na máquina de qualquer pessoa. Esta página mostra como construir a imagem, subir o container, conferir que ela está limpa e gerar uma questão de ponta a ponta.</p>

<span class="ce-badge ce-status--done">Implementado</span> `Dockerfile` e `.dockerignore` em `backend/`; o contexto de build é essa pasta, e `frontend/` entra como um segundo contexto, com nome, só para o build do Vite (#56). O [deploy na VPS da Hostinger](deploy.md) está <span class="ce-badge ce-status--wip">Em desenvolvimento</span>.

!!! danger "A imagem não é um sandbox"
    O container não acrescenta isolamento à execução do código gerado: o serviço continua só limitando tempo e tamanho de saída ([ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md)). Sem autenticação, não exponha a porta à internet. Veja [Arquitetura](../architecture/index.md).

## O que a imagem contém {#o-que-a-imagem-contem}

- Python 3.12 (`python:3.12-slim`), `gcc` e `libc6-dev` (sem ele, nem `#include <stdio.h>` compila).
- O pacote `codeexpert`, instalado a partir de `backend/pyproject.toml` e `backend/src/`.
- O front-end já construído (`frontend/dist`) em `/app/frontend`, servido pela própria API em `/`, nas rotas da SPA e em `/assets` (`CODEEXPERT_FRONTEND_DIR`). O Node e o `node_modules` ficam num estágio de build e não chegam à imagem final.
- Um usuário sem privilégios (`app`, UID 1000) e um `/app/var` vazio e gravável por ele.
- Um `HEALTHCHECK` que chama `GET /health`.

E o que **não** contém, garantido pelo `.dockerignore`: `.env`, chaves, `config/LLM_Config.txt`, `var/`, `cache/`, `Questions/`, `.git`, testes, documentação e scripts. O `frontend/.dockerignore` deixa de fora `.env`, `node_modules/` e builds anteriores; o estágio do front fixa `VITE_PUBLIC_API_MODE=http`, então um `frontend/.env` em `mock` não muda a imagem.

## Construir

```bash
docker build --build-context frontend=frontend -t codeexpert:dev backend
```

Rode da raiz do repositório. Sem `--build-context frontend=frontend` o build falha no estágio do front, porque o `Dockerfile` não encontra o contexto `frontend`.

## Subir o container

A imagem não traz configuração. Tudo chega pelas variáveis `CODEEXPERT_*` na hora do `docker run` (lista completa em [Comandos e configuração](../reference/configuration.md#variaveis-de-ambiente)).

=== "Com o .env"

    ```bash
    docker run --rm -d --name ce -p 8000:8000 \
      --env-file backend/.env \
      -v ce-var:/app/var \
      codeexpert:dev
    ```

    `--env-file` lê o `.env` do seu computador e passa as variáveis ao container; o arquivo em si não entra na imagem. O Docker lê o valor literalmente: **não ponha aspas** em volta dele no `.env`.

=== "Variável a variável"

    ```bash
    docker run --rm -d --name ce -p 8000:8000 \
      -e CODEEXPERT_LLM_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX \
      -e CODEEXPERT_LLM_MODEL=gpt-4o-mini \
      -v ce-var:/app/var \
      codeexpert:dev
    ```

    `sk-XXXX…` é um valor fictício: use a sua chave. Escrita assim, ela fica no histórico do shell. Prefira `--env-file`, ou passe só o nome (`-e CODEEXPERT_LLM_API_KEY`) com a variável já definida no shell.

Sem `CODEEXPERT_LLM_API_KEY` o servidor sobe e responde `GET /health`, mas as etapas que chamam o modelo falham ([Comandos e configuração](../reference/configuration.md#variaveis-de-ambiente)).

O volume `ce-var` guarda `/app/var`, onde ficam as execuções e o XML. Sem ele, tudo some quando o container é removido. Um diretório do seu computador no lugar do volume (bind mount) precisa ser gravável pelo UID 1000.

## Conferir

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok","version":"0.2.0","commit":null}

curl "http://127.0.0.1:8000/config?verify=true"
# api_key_configured e provider_reachable devem ser true

docker ps --filter name=ce       # o estado deve terminar em (healthy)
```

Abra <http://127.0.0.1:8000/> no navegador: é o front-end, falando com a API do mesmo container. O Swagger continua em `/docs`.

**Compilar um `.c` dentro da imagem:**

```bash
docker run --rm codeexpert:dev sh -c \
  'printf "#include <stdio.h>\nint main(void){puts(\"ok\");return 0;}\n" > /tmp/t.c \
   && gcc -std=c11 -Wall -Wextra -O1 -o /tmp/t /tmp/t.c && /tmp/t'
# ok
```

## Gerar uma questão

Com o container no ar e a chave configurada, o fluxo é o de [Gerar uma questão](generate-a-question.md):

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" -d '{}'
```

Os artefatos da execução ficam dentro do container. O XML para o Moodle vem na resposta, no campo `export.xml`:

```bash
curl -s -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" -d '{"qty": 3}' | jq -r .export.xml > questao.xml
```

!!! warning "Isto chama o provedor e gasta tokens"
    As etapas 1 a 3 chamam o modelo. Use `{"qty": 3}` para testar.

Para encerrar: `docker stop ce` (o `--rm` remove o container) e, se não quiser guardar os dados, `docker volume rm ce-var`.

## Auditar a imagem

Para provar que nada sensível entrou, inclusive com um `.env` presente na pasta durante o build:

```bash
docker run --rm --entrypoint sh codeexpert:dev -c \
  'ls -A /app; ls -A /app/var; find / -xdev -name ".env*" -not -path "/proc/*" 2>/dev/null'
```

O esperado: `/app` com `README.md`, `frontend`, `pyproject.toml`, `src` e `var`; `var` vazio; nenhum arquivo `.env*`.

## Limitações de hoje

| Tema | Hoje |
| --- | --- |
| Porta | Fixa em `8000` (`backend/src/codeexpert/__main__.py`). Na VPS o proxy encaminha para ela pela rede do Compose, sem publicá-la (`deploy/compose.yaml`, [Deploy](deploy.md)) |
| Recarga automática | Não há. Para desenvolver, use `make run` |
| Estado | Em `/app/var` dentro do container, em disco local; cada container tem o seu |

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| `port is already allocated` | Outro processo usa a 8000 (por exemplo `make run`). Pare-o ou use `-p 8001:8000` |
| `api_key_configured: false` com `--env-file` | O `.env` não está na pasta onde você rodou o comando, ou a variável está com outro nome (nomes errados são ignorados em silêncio) |
| Chave rejeitada com `--env-file` | Aspas no valor do `.env`: o Docker as inclui na chave |
| `failed to connect to the docker API` | O Docker Desktop não está rodando |

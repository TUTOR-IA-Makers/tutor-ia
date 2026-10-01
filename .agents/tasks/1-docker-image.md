# 1 — Imagem Docker que serve a API e tem gcc (G0-1)

- **Branch** `feat/imagem-docker`
- **Issue** #1
- **Started** 2026-10-01
- **Driver** Hugo Rosa

## Goal

Existe uma imagem Docker que sobe a API (`codeexpert.api.app:app`) e traz `gcc`
dentro, de modo que o mesmo artefato roda na máquina de qualquer pessoa e,
depois, no Cloud Run. Ao fim: `docker build` produz uma imagem que responde
`GET /health`, compila um `.c` de teste e, com as variáveis de ambiente
corretas, gera uma questão de ponta a ponta (`POST /create_question`). A imagem
não contém `.env`, chave nem nada de `var/`. Base para G0-2.

## Out of scope

- Deploy no Cloud Run, CI de build/push da imagem e `.github/workflows/` (G0-2).
- Incluir o front-end na mesma imagem (G4-1 — coordenar depois, multi-stage).
- Sandbox de execução (Judge0, ADR 0004): a imagem não isola o código gerado.
- Ler `$PORT` em `__main__.py`: hoje a porta é fixa em 8000. Se o Cloud Run
  precisar, abrir issue própria.
- Novas dependências em `pyproject.toml`.

## Constraints

- Nenhum segredo na imagem: nada de `ENV`/`ARG` com chave; `.dockerignore`
  barra `.env*`, `var/`, `cache/`, `Questions/`, `config/LLM_Config.txt`
  (AGENTS.md §1, regras 1 e 2).
- Configuração só por variáveis `CODEEXPERT_*` (ADR 0007).
- O runner local não é sandbox: documentar que a imagem não deve ser exposta
  à internet pública (`.agents/rules/security.md`).
- `pyproject.toml` usa `readme = "README.md"` e `license = { file = "LICENSE" }`:
  esses arquivos precisam estar no contexto de build e fora do `.dockerignore`.
- `gcc` precisa de `libc6-dev` para compilar `#include <stdio.h>`.
- Rodar como usuário não-root, com `var/` gravável (`workspace_root` e
  `questions_dir` são relativos).
- Documentação só afirma o que existe; Cloud Run e front-end ficam marcados
  como planejados (regra 5). Evidências do PR sem segredos.
- ADR é rascunhado por agente, aceito por humano; mudanças em `docs/adr/`
  passam por CODEOWNERS.

## Plan

- [x] Decidir a versão do Python na imagem (3.12; ver Decisions)
- [x] `.dockerignore` com as exclusões do contexto de build
- [x] `Dockerfile`: base slim, `gcc` + `libc6-dev`, `pip install .`, usuário não-root, `EXPOSE 8000`, `CMD ["codeexpert"]`
- [x] Build local e `GET /health` respondendo
- [x] Compilar e executar um `.c` de teste dentro da imagem
- [x] Auditar a imagem: sem `.env`, chave nem conteúdo de `var/` (inclusive construindo com um `.env` falso presente)
- [x] `docker run` com variáveis de ambiente gera uma questão de ponta a ponta
- [x] Teste: `tests/unit/test_dockerignore.py` garante as exclusões e que o `Dockerfile` não define a chave
- [x] Documentação (PT-BR): `docs/guides/docker.md`, com comandos e variáveis fictícias; aviso de que não é sandbox; Cloud Run/front-end como planejados; páginas afetadas atualizadas
- [x] Rascunho do ADR `docs/adr/0009-container-image-with-gcc.md` (status Proposed) e entrada no `nav` e no índice
- [x] `make check` verde (ver Verification)
- [ ] Evidências anexadas ao PR (health, compilação, geração completa), sem segredos
- [ ] Apagar este arquivo no PR que fecha a issue

## Decisions taken along the way

- **Python 3.12** na imagem: é o mínimo de `requires-python`. O CI usa 3.13, então
  os dois podem divergir; registrado no ADR 0009. Quem aceitar o ADR confirma.
- **Porta fixa em 8000**, como em `__main__.py`. O Cloud Run injeta `PORT=8080`;
  resolver no G0-2 configurando a porta do serviço, ou em issue própria se o
  código passar a ler `$PORT`.
- **Usuário `app` (UID 1000)** com `/app/var` vazio e gravável; sem root.
- **Chave só por `docker run`** (`--env-file` ou `-e`), nunca no `Dockerfile`.
- **`make check` rodado em container** (`python:3.12-slim` com `gcc` e `git`) por
  falta de Python no Windows do autor. Os `.sh` foram convertidos de CRLF para LF
  só na cópia usada no container.
- **G0-1 marcado como Implementado** em `roadmap.md` e `index.md`; G0-2 segue
  Em desenvolvimento.

## Verification

Tudo com a imagem `codeexpert:dev`, Docker 29.7.2, sem expor a chave:

- `docker build -t codeexpert:dev .` — ok; pacote `codeexpert-0.2.0` instalado.
- `GET /health` — `{"status":"ok","version":"0.2.0"}`; `docker ps` mostra `(healthy)`.
- `GET /config` sem chave — `api_key_configured:false`.
- `.c` de teste compilado com `gcc 14.2.0` (`-std=c11 -Wall -Wextra -O1`) como
  usuário `app`; executou e imprimiu `ok`.
- Auditoria: `/app` só com `LICENSE`, `README.md`, `pyproject.toml`, `src`, `var`;
  `var` vazio; nenhum `.env*` nem `LLM_Config*`; nenhuma variável `CODEEXPERT_*`
  na imagem. Build com um `.env` e um `var/runs/...` falsos na pasta: nenhum
  entrou na imagem.
- `GET /config?verify=true` com a chave via `--env-file` — `api_key_configured:true`,
  `provider_reachable:true`.
- `POST /create_question` com `{}` — HTTP 200, 10 entradas, 10 testcases com saída
  produzida pelo `gcc` na imagem, `export.question_count: 1`; XML bem formado
  (raiz `quiz`). Nenhuma ocorrência da chave em `/app/var` nem nos logs.
- `scripts/check.sh` em container: artefatos, credenciais, formatação, lint,
  65 testes (inclusive os de `gcc`) e docs em modo strict — todos verdes.
  O CI (Python 3.13) dá a palavra final.
- Não verificado: importação do XML no Moodle; execução no Cloud Run.

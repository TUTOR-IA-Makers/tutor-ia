# Demonstrar o formulário ligado à API

<p class="lead">Roteiro para mostrar, na sua máquina, o critério de saída da S1: alguém preenche o formulário, acompanha a geração, vê a questão, e a questão fica gravada no Postgres.</p>

<span class="ce-badge ce-status--done">Implementado</span> Tudo neste roteiro, **só localmente**. Não há ambiente público com o modo `http` nem sessão: a VPS é [#25](../product/plano-30-11.md#g0-9) e a sessão é a fase F1 de [Integração com o front-end](../architecture/frontend-integracao.md#6-fases).

!!! warning "Isto não é produção"
    O Postgres sobe num container descartável, a API roda com `--reload` e as rotas não pedem login. A geração roda dentro do processo da API: se você parar o `make run` no meio, a questão fica `GERANDO` para sempre.

## O que você precisa

- `make setup` e `make front-install` já rodados.
- Uma chave de verdade em `backend/.env` (`CODEEXPERT_LLM_API_KEY`). Cada questão custa uma geração.
- `gcc` no `PATH`, porque as saídas esperadas vêm de compilar e executar a solução.
- Docker ou Podman, para o Postgres.

## 1. Postgres local

```bash
docker run --rm -d --name codeexpert-db \
  -e POSTGRES_USER=codeexpert -e POSTGRES_PASSWORD=senha-local -e POSTGRES_DB=codeexpert \
  -p 5432:5432 postgres:16
```

Em `backend/.env`, troque o armazenamento para o banco:

```bash
CODEEXPERT_STORE_BACKEND=postgres
CODEEXPERT_DATABASE_URL=postgresql://codeexpert:senha-local@localhost:5432/codeexpert
```

As tabelas são criadas quando a API sobe (`store/schema.sql`, ver [Modelo de dados](../architecture/data-model.md)).

## 2. API e front-end em modo `http`

```bash
make run                                  # terminal 1: API em http://127.0.0.1:8000
VITE_PUBLIC_API_MODE=http make front-dev  # terminal 2: front em http://127.0.0.1:5173
```

A variável no shell vence o `frontend/.env`, que costuma estar em `mock`. O Vite repassa `/api` e `/health` para a API, então front e API ficam na mesma origem, como em produção.

O menu da conta, no canto, fica vazio: `GET /api/v1/session` responde `404` até a fase F1, e o front trata isso como "sem sessão". O resto da tela funciona.

## 3. Gerar pelo formulário

1. Abra <http://127.0.0.1:5173/gerar>.
2. Escolha conteúdo, dificuldade, quantidade de casos e pelo menos uma estrutura obrigatória. As listas de estruturas vêm de `GET /api/v1/structures`.
3. Envie. O front recebe `202 {id}` e abre a tela de andamento, que consulta `/generation` a cada 1,5 s. As etapas vão sendo marcadas: enunciado, solução, entradas, compilação e testes, exportação.
4. No fim, a tela troca para a questão: enunciado, solução e casos de teste.

Se uma etapa falhar, a tela mostra "A questão falhou na verificação" e o motivo, em português. O detalhe técnico (saída do `gcc`, resposta do provedor) fica no log do terminal 1, junto com o id da execução.

Campos que ainda não têm origem aparecem vazios, e não inventados: verificação de restrições, resultado da compilação, saída obtida e "passou" de cada caso. O que cada campo significa está em [API](../reference/api.md#get-api-v1-question).

## 4. Ver a linha gravada

O id da questão aparece em "Ver detalhes técnicos", na tela de andamento, e na URL (`/questoes/<id>`).

```bash
docker exec -it codeexpert-db psql -U codeexpert -d codeexpert
```

```sql
SELECT run_id, status, completed_at FROM runs ORDER BY created_at DESC LIMIT 3;

SELECT run_id, name, difficulty, axis, state
FROM questions WHERE run_id = '20261105T142233Z-1a2b3c4d';

SELECT position, input, output
FROM test_cases WHERE run_id = '20261105T142233Z-1a2b3c4d' ORDER BY position;
```

Troque o id de exemplo pelo seu. Uma questão `GERADA` tem `runs.status = 'complete'`, uma linha em `questions` e um caso por posição em `test_cases`. Uma questão que falhou fica `draft`, sem linha em `questions`; o motivo está em `run_artifacts`, no artefato `failure.json`.

## Desfazer

```bash
docker stop codeexpert-db   # --rm apaga o container e os dados
```

Volte `CODEEXPERT_STORE_BACKEND` para `local` em `backend/.env`. As questões exportadas também foram acrescentadas a `backend/var/questions/Moodle_Questionnaire.xml`, que é ignorado pelo git.

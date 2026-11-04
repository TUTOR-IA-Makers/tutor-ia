**Sprint:** S1 — Persistir e mostrar · 05/10–18/10/2026
**Épico:** G1 — Banco de questões
**Dupla:** A — Backend & Infra · **Prioridade:** P0 · **Estimativa:** 5 SP

## História

Como Equipe, quero um Postgres na VPS, com backup, e migrações no repositório, para que o esquema seja o mesmo em qualquer máquina, a mudança dele passe por PR e um disco perdido não leve o banco de questões junto.

## Critérios de aceite

- [ ] Postgres 16 como serviço do Compose, com volume nomeado, alcançável só pela rede interna (a porta 5432 não é publicada); senha como segredo do G0-3.
- [ ] Migrações versionadas (Alembic) aplicadas no deploy, por um serviço que roda antes da API, não à mão.
- [ ] `pg_dump` diário copiado para fora da VPS, e um restore feito uma vez e registrado.
- [ ] Os testes rodam contra um banco descartável, e `make check` continua funcionando offline.

## Execução e evidências

Anexar evidência das migrações no deploy, de que a 5432 não responde de fora da VPS, do backup fora da máquina e do restore, e dos testes contra banco descartável, sem credenciais. A Hostinger não tem Postgres gerenciado; a alternativa externa (Neon, Supabase) está no ADR-0011.

**Dependências:** G0-9 (#25, VPS e deploy) e G0-3; alinhar o esquema com G1-2.

## Definição de pronto

- [ ] `make check` passa; testes cobrem o comportamento novo quando aplicável.
- [ ] Documentação corresponde ao que foi entregue; decisões arquiteturais registradas em ADR quando aplicável.
- [ ] PR revisado, restrito à tarefa, vinculado a esta issue; arquivo de tarefa encerrado conforme o fluxo do repositório.
- [ ] Resultado demonstrado na revisão da sprint pela URL de produção, quando aplicável.
- [ ] Se mudou o prompt: lote de regressão do G7-2 rodado e relatório anexado ao PR.
## Goal

The database schema is a chain of Alembic revisions in the repository, applied
by `codeexpert migrate`. On the VPS, a Compose service runs that command before
the API starts, and the API refuses a database at any other revision. The
repository has a Compose file with Postgres 16 on an internal network, a daily
backup script that copies the dump off the machine, and a restore check. The
Postgres tests run in a disposable database, in CI on every PR, and skip
locally so `make check` stays offline.

## Out of scope

- The VPS itself, the reverse proxy, the deploy workflow that runs Compose, and
  replacing `deploy.yml` (Cloud Run). Those are G0-9 (#25).
- The question model and its tables. That is G1-2; it adds revision `0002`.
- Choosing the off-VPS backup destination and installing the cron entry. Both
  need the VPS.
- Moving `var/questions` into the database (ADR-0012 leaves it on disk).

## Constraints

- AGENTS.md rule 5: the docs must not claim production runs any of this.
- AGENTS.md §7: `pyproject.toml` (alembic, sqlalchemy), `.github/workflows/ci.yml`
  and the ADR are human-gated. Asked and agreed with the driver before the
  change; CODEOWNERS review still applies.
- `make check` must pass with no database and no network.
- ADR-0011: secrets stay on the VPS. The deploy job must never need the DB URL.

## Plan

- [x] `alembic` + `sqlalchemy`; revision `0001` = the old `schema.sql`, which is deleted
- [x] `codeexpert migrate`; `PostgresStore` checks the revision instead of creating tables
- [x] `deploy/compose.yaml`: db → migrate → api, `data` network internal, no ports
- [x] `deploy/backup.sh` and `deploy/restore-check.sh`
- [x] Disposable database per test session; migration tests; offline single-head test
- [x] CI: `postgres:16` service and `CODEEXPERT_TEST_DATABASE_URL`
- [x] ADR-0013 (Proposed) and docs: configuration, deploy, architecture, codebase
- [ ] On the VPS (after #25): migrate in a real deploy, 5432 closed from outside, backup off-site, one restore recorded

## Decisions taken along the way

- **One way to migrate.** `env.py` only runs with the connection `codeexpert migrate`
  passes. The DSN never goes through `alembic.ini` or a URL rewrite: SQLAlchemy gets
  a `creator` that calls `psycopg.connect(dsn)`, so key=value DSNs and `%` in
  passwords work.
- **Revision 0001 keeps `IF NOT EXISTS`** to adopt databases created by the old
  startup schema. Covered by a test.
- **The store refuses a mismatched revision** rather than migrating itself, so a
  failed `migrate` cannot be hidden by the API starting anyway.
- **Tests never write to the database named in the URL.** They create
  `codeexpert_test_<random>` and drop it `WITH (FORCE)`.
- **Compose file under `deploy/`**, next to the scripts that use it. G0-9 adds the proxy there.

## Verification

- `make check` (2026-11-04): every step passes except the front-end
  `production dependency audit` (npm, 1 moderate + 1 high). This branch does not
  touch `frontend/`; it is the open audit issue (#26), not this change.
- With `CODEEXPERT_TEST_DATABASE_URL` pointing at a throwaway `postgres:16`
  container: the whole suite passes with no skips, and no `codeexpert_test_*`
  database is left on the server afterwards.
- `deploy/compose.yaml` on a Fedora laptop (secrets in a temp dir, relabelled for
  SELinux): `migrate` logs `Running upgrade  -> 0001` and exits 0. Then `api` is
  healthy and on `PostgresStore`. Host port 5432 refuses connections.
  `backup.sh` wrote and rsynced a dump. `restore-check.sh` restored it (revision
  0001, 1 run, 1 artefact) and dropped the scratch database.

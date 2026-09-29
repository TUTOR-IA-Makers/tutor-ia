# Architecture Decision Records

<p class="lead">Decisões que são caras de reverter, registadas uma a uma, em inglês. Uma ADR aceite nunca é editada: é substituída por outra que a supersede.</p>

!!! info "Porquê em inglês"
    O site é em português porque descreve o produto para quem o vai usar. As ADRs
    são em inglês porque são o registo técnico da equipa, alinhado com o código,
    os comentários e os logs. Ver `.agents/rules/docs.md`.

## Índice

| # | Decisão | Estado |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-modular-monolith-src-layout.md) | Modular monolith in a `src/` layout | Accepted |
| [0003](0003-one-workspace-per-run.md) | One workspace per generation run | Accepted |
| [0004](0004-execution-behind-a-runner-protocol.md) | Code execution behind a runner protocol | Accepted |
| [0005](0005-single-instruction-file-for-agents.md) | One instruction file for every agent | Accepted |
| [0006](0006-issues-plus-task-file-per-branch.md) | GitHub issues plus one task file per branch | Accepted |
| [0007](0007-configuration-from-the-environment.md) | Configuration from the environment | Accepted |
| [0008](0008-one-gate-for-people-agents-and-ci.md) | One gate for people, agents and CI | Accepted |

Para escrever uma nova, ver [`.agents/workflows/add-adr.md`](https://github.com/HugoRosa29/coderunner_v2/blob/main/.agents/workflows/add-adr.md) e o [modelo](0000-template.md).

!!! note "Relação com as ADRs do SAD"
    O SAD v0.1 traz as suas próprias ADRs (ADR-001 a ADR-005), que decidem a
    arquitetura da **plataforma**. As desta secção decidem a arquitetura deste
    **repositório**. Onde se cruzam — sandbox, parser, separação entre nota e IA —
    a ADR local cita a do SAD em vez de a repetir.

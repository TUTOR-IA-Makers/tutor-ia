# ADR-0004 — Code execution behind a runner protocol

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

The prototype compiles generated C with `gcc` and runs the binary to capture its
real output. That is the correct product behaviour — expected outputs are
observed, never predicted by a model — and it is also the most dangerous code in
the repository.

As written, it had no limits at all. `process.communicate()` had no timeout, so a
generated program containing an infinite loop — a routine outcome — hung the
server thread until someone killed it. Output size was unbounded. Nothing
restricted the filesystem or the network.

The SAD is unambiguous about where this ends up: untrusted code runs in Judge0 on
a dedicated VM in an isolated VPC, never in the application process, and the host
is treated as already compromised (D-1, ADR-002). That infrastructure does not
exist yet and is not this repository's to build.

The risk here is narrower than the platform's — the code is model output from a
teacher's prompt, not a student's submission — but "narrower" is not "absent",
and risk R1 in the gap analysis names it.

## Decision

Execution lives behind a `CodeRunner` protocol with two methods, `compile` and
`run`. `LocalGccRunner` implements it today; a `Judge0Runner` implements it when
the platform's sandbox exists. Callers receive a `RunOutcome` and never touch
`subprocess`.

`LocalGccRunner` bounds what it can bound locally:

- wall-clock timeouts on both compilation and execution, from settings;
- `start_new_session=True` plus `killpg` on timeout, so a program that forks
  cannot outlive the request;
- a cap on captured output.

These are resource limits, not isolation, and the module says so in its first
line. Calling `subprocess` anywhere outside `execution/` breaks this decision.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Run Judge0 locally in Docker now | Judge0 needs `CAP_SYS_ADMIN`, a privileged container and cgroup v1 via a GRUB change on the host (SAD D-1). Six developer machines, three operating systems — not a prototype-sized ask |
| Containerise just the compile-and-run step | Meaningful isolation, real cost: image build, lifecycle, per-run start-up. Worth revisiting; not worth blocking on |
| Keep calling `subprocess` directly, just add a timeout | Fixes the hang and leaves no seam. The swap to Judge0 then edits every call site instead of adding one class |
| Stop executing and ask the model for expected outputs | Abandons the one rule the whole product rests on |

## Consequences

**Good**

- The infinite loop that hung the server now fails as a 422 naming the input, and
  a test proves it.
- The Judge0 migration is a new class plus a settings switch.
- Tests run without a compiler: `FakeRunner` implements the same protocol.

**Bad, or costly**

- It is still not a sandbox, and the wording must not drift into implying it is.
  Do not expose this service publicly, and do not add an endpoint that compiles a
  caller-supplied source file.
- One more indirection between the pipeline and `gcc`.

## Revisit when

The platform's Judge0 service exists — then `Judge0Runner` is written and
`LocalGccRunner` becomes a development-only default. Sooner, if this service is
ever reachable by anyone outside the team.

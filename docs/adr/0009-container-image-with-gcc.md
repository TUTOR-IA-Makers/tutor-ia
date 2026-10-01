# ADR-0009 — One container image with the API and gcc

- **Status** Proposed
- **Date** 2026-10-01
- **Deciders** the team (draft — a person accepts)

## Context

The service compiles and runs C with the `gcc` found on `PATH`
(`execution/local.py`), and sends its output through `os.killpg`, so it needs
Linux. Until now it ran only where someone had set up a Python virtualenv and a
compiler by hand, and the one place the project must eventually run — Cloud Run —
had never been tried. The delivery plan lists `gcc` not running
there as a medium risk and puts the image in the first sprint so it is found out
early.

Two things were already decided and constrain the image. Configuration comes only
from `CODEEXPERT_*` variables (ADR-0007), and execution is not a sandbox
(ADR-0004): the runner bounds time and output size and nothing else. A container
does not change the second fact, and it is easy to read it as if it did.

## Decision

Ship a single `Dockerfile` that builds one image holding the API and `gcc`:

- Base `python:3.12-slim`, the minimum in `requires-python`, with `gcc` and
  `libc6-dev` from apt (`--no-install-recommends`).
- The package is installed with `pip install .` from `pyproject.toml` and `src/`,
  so the image runs the same code path as the `codeexpert` console script. No
  reload, no dev dependencies.
- The process runs as an unprivileged user (`app`, UID 1000) in `/app`, where an
  empty `var/` is writable, because the workspace and questions paths are
  relative.
- The image carries no configuration. Every setting, the API key included, is
  passed at `docker run` time. A `.dockerignore` keeps `.env`, `var/`, `.git`,
  legacy artefacts, tests and docs out of the build context, and a unit test
  asserts the entries and that the `Dockerfile` never sets the key.
- The port stays `8000`, as in `__main__.py`.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Slim image without `gcc`, execution in a separate service now | The target is Judge0 on an isolated VM (ADR-0004), but that is a platform decision with its own infrastructure. The prototype cannot generate expected outputs without a compiler next to the API |
| Alpine (musl) base | Smaller, but the generated C is compiled and run inside the image, and musl is not the glibc that Debian-based images and most Linux machines use. Any difference in library behaviour would put the "expected output comes from running the solution" rule on a different footing from where the exercise is later graded, and ruling that out costs more than the megabytes saved |
| Multi-stage build | Nothing to compile for the Python package, so a second stage would only copy the same files. Worth revisiting when the front-end is built into the image |
| Bake a `.env` into the image | Puts a secret in a layer that anyone with the image can read, and makes the image unusable for anyone else |
| Run as root | Fewer permission surprises with bind mounts, but gives generated code more than it needs. An unprivileged user costs one `chown` |
| Read `$PORT` in `__main__.py` for Cloud Run | Probably needed, but it changes application code and belongs with the deploy work, not with the image |

## Consequences

**Good**

- The same artefact runs on any machine with Docker and, once deployed, in
  Cloud Run.
- The image can be audited: no `.env`, no key, empty `var/`, and a test that
  fails if the exclusion rules are weakened.
- `gcc` and the API are pinned together, so a change of compiler version is a
  visible change to the `Dockerfile`.

**Bad, or costly**

- The image holds a compiler. That is the point of it, and also a larger attack
  surface than a plain API image. It is **not** a sandbox: the container isolates
  the host from the project, not the generated program from the service. It must
  not be exposed to untrusted users.
- The port is fixed at `8000`, and Cloud Run injects `8080` by default, so the
  service has to be configured to use `8000` until the entry point reads `$PORT`.
- State lives under `/app/var` inside the container. Without a volume it is lost
  when the container is removed, and each instance has its own copy.
- `python:3.12-slim` is a moving tag. The base image is rebuilt from upstream on
  each build unless the digest is pinned, which has not been done.
- CI uses Python 3.13 and the image uses 3.12, so the two can diverge.

## Revisit when

The front-end is added to the same image (G4-1), the entry point starts reading
`$PORT`, a second language needs another compiler, or execution moves to Judge0
and the compiler leaves this image.

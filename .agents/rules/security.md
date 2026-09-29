# Rules — security and privacy

Two things in this repository deserve real care: credentials, and the fact that
it compiles and runs code it did not write.

## Credentials

- Configuration comes from the environment. `Settings` in
  `src/codeexpert/settings.py` is the only reader.
- `.env` is git-ignored. `.env.example` contains fake values only.
- The key is a `SecretStr`: it does not appear in `repr`, in logs, or in
  `GET /config`. A test asserts this. Keep it that way.
- `make check` refuses a working tree containing anything shaped like a provider
  key.
- If a key is ever pushed: rotate it first, rewrite history second. In that
  order — history rewriting takes minutes, and the key is public the whole time.

## Executing generated code

`execution/local.py` compiles with `gcc` and runs the binary as a subprocess. It
bounds wall-clock time and output size, and kills the whole process group on
timeout. **It is not a sandbox.** It does not restrict the filesystem, the
network, memory or syscalls.

The exposure is narrower than the platform's — the code is model output from a
teacher's prompt, not a student's submission — but it is real:

- Do not expose this service to untrusted users or to the public internet.
- Do not add an endpoint that compiles a caller-supplied source file. That turns
  a bounded risk into remote code execution.
- Do not remove the timeouts. An infinite loop used to hang the server forever;
  there is a test that would fail again.

The target architecture runs everything in Judge0 on an isolated VM
(`docs/adr/0004`). `CodeRunner` is a protocol so that becomes a new class, not a
rewrite. If you are tempted to call `subprocess` outside `execution/`, that is
the seam you are breaking.

## Data

Generated statements and solutions carry no personal data today. The platform
this feeds into handles data about minors, under a rule that no direct
identifier ever reaches a model provider. If this prototype ever accepts student
data — a class profile, a submission — that rule applies here first, and it needs
an ADR before the code.

## Dependencies

A new dependency needs a human reviewer and a sentence in the PR saying why the
standard library will not do.

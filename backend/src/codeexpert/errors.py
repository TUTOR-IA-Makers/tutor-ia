"""Domain exceptions.

Nothing below `codeexpert.api` knows about HTTP. Services raise these; a single
set of handlers in `codeexpert.api.errors` turns them into responses. That keeps
every service callable from a test, a script or a future worker process.

Every message is written for a human to read, because it reaches the client as
the `detail` field. State what is missing *and* what to do about it.
"""


class CodeExpertError(Exception):
    """Base class for every error this package raises deliberately.

    `run_id` is set when the failure happened inside a run that stays on disk,
    so the client can resume it step by step instead of starting over.
    """

    run_id: str | None = None


class ConfigurationError(CodeExpertError):
    """A required setting is missing or unusable."""


class RunNotFoundError(CodeExpertError):
    """The requested run id does not exist under the workspace root."""


class MissingArtefactError(CodeExpertError):
    """A pipeline step ran before the step that produces its input."""


class LLMError(CodeExpertError):
    """The language model provider failed or answered in an unusable shape."""


class CompilationError(CodeExpertError):
    """The generated C source did not compile."""

    def __init__(self, stderr: str) -> None:
        super().__init__(f"Compilation failed:\n{stderr}")
        self.stderr = stderr


class ExecutionError(CodeExpertError):
    """The compiled program could not be run to completion."""

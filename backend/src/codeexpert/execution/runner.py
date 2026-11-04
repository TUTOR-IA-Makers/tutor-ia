"""The seam where local execution is later replaced by a real sandbox.

The target architecture runs student and generated code in Judge0 on a dedicated
VM, never in the application process (SAD D-1 / ADR-002). This prototype runs it
locally, which is the single largest known risk in the repository (R1). Keeping
execution behind a protocol means that swap is a new implementation of two
methods, not a rewrite of the pipeline. See docs/adr/0004.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class RunOutcome:
    """The result of feeding one input to the compiled program."""

    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    truncated: bool


class CodeRunner(Protocol):
    """Compile a C source file, then run the produced program against inputs."""

    def compile(self, source: Path, binary: Path) -> None:
        """Raise `CompilationError` if the source does not build."""
        ...

    def run(self, binary: Path, stdin: str) -> RunOutcome: ...

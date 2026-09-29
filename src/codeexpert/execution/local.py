"""Local `gcc` implementation of `CodeRunner`.

!! This is not a sandbox. !!

It bounds wall-clock time and output size, and it kills the whole process group
on timeout so a forking program cannot outlive the request. It does *not*
restrict the filesystem, the network, memory or syscalls. Generated code is
model output built from a teacher's prompt, not student input, so the exposure
is narrower than the platform's — but it is real, and it is why `docs/adr/0004`
exists.
"""

import logging
import os
import signal
import subprocess
from pathlib import Path

from codeexpert.errors import CompilationError, ExecutionError
from codeexpert.execution.runner import CodeRunner, RunOutcome
from codeexpert.settings import Settings, get_settings

logger = logging.getLogger(__name__)

COMPILER = "gcc"
COMPILER_FLAGS = ["-std=c11", "-Wall", "-Wextra", "-O1"]


class LocalGccRunner:
    """Compiles with the `gcc` found on PATH and runs the binary as a subprocess."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def compile(self, source: Path, binary: Path) -> None:
        try:
            result = subprocess.run(  # noqa: S603 - fixed argv, no shell
                [COMPILER, *COMPILER_FLAGS, "-o", str(binary), str(source)],
                capture_output=True,
                text=True,
                timeout=self._settings.compile_timeout_seconds,
            )
        except FileNotFoundError as exc:
            raise ExecutionError(
                f"'{COMPILER}' was not found on PATH. Install a C compiler to generate test cases."
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise CompilationError(
                f"Compilation exceeded {self._settings.compile_timeout_seconds:.0f}s."
            ) from exc

        if result.returncode != 0:
            raise CompilationError(result.stderr)
        if result.stderr.strip():
            logger.info("Compiler warnings for %s:\n%s", source.name, result.stderr.strip())

    def run(self, binary: Path, stdin: str) -> RunOutcome:
        limit = self._settings.run_max_output_bytes
        timeout = self._settings.run_timeout_seconds

        process = subprocess.Popen(  # noqa: S603 - fixed argv, no shell
            [str(binary)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            start_new_session=True,  # own process group, so a fork bomb dies with it
        )

        timed_out = False
        try:
            stdout, stderr = process.communicate(input=stdin, timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
            _kill_group(process)
            stdout, stderr = process.communicate()
            logger.warning("Execution of %s exceeded %.1fs and was killed.", binary.name, timeout)

        truncated = len(stdout) > limit
        if truncated:
            stdout = stdout[:limit]
            logger.warning("Output of %s truncated to %d bytes.", binary.name, limit)

        return RunOutcome(
            stdout=stdout,
            stderr=stderr[:limit],
            exit_code=process.returncode if process.returncode is not None else -1,
            timed_out=timed_out,
            truncated=truncated,
        )


def _kill_group(process: subprocess.Popen) -> None:
    try:
        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
    except (ProcessLookupError, PermissionError):  # pragma: no cover - race with exit
        process.kill()


def get_code_runner() -> CodeRunner:
    """FastAPI dependency. Swapping in a Judge0 runner happens here."""
    return LocalGccRunner()

"""Compiling and running untrusted C code."""

from codeexpert.execution.local import LocalGccRunner, get_code_runner
from codeexpert.execution.runner import CodeRunner, RunOutcome

__all__ = ["CodeRunner", "LocalGccRunner", "RunOutcome", "get_code_runner"]

"""Compatibility entry point: `python main.py` still starts the server.

The application now lives in `src/codeexpert`. Prefer `make run`, which uses the
`codeexpert` console script and enables auto-reload.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from codeexpert.__main__ import main

if __name__ == "__main__":
    main()

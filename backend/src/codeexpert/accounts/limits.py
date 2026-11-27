"""Too many failed sign-ins: a per-key window kept in memory.

In memory on purpose for now: one process serves the API (docs/adr/0011), and
a restart forgetting the count only gives an attacker a few more tries. Several
processes would need the count in the database.
"""

import math
import threading
import time
from collections import deque
from collections.abc import Callable


class AttemptLimiter:
    def __init__(
        self,
        *,
        max_failures: int,
        window_seconds: float,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._max = max_failures
        self._window = window_seconds
        self._clock = clock
        self._failures: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def _recent(self, key: str, now: float) -> deque[float]:
        failures = self._failures.setdefault(key, deque())
        while failures and now - failures[0] >= self._window:
            failures.popleft()
        return failures

    def retry_after(self, key: str) -> int | None:
        """Seconds to wait before `key` may try again, or `None` when it may now."""
        with self._lock:
            now = self._clock()
            failures = self._recent(key, now)
            if len(failures) < self._max:
                return None
            return max(1, math.ceil(self._window - (now - failures[0])))

    def record(self, key: str) -> None:
        with self._lock:
            self._recent(key, self._clock()).append(self._clock())

    def clear(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)


class AuthLimits:
    """The three windows the session routes use, built once per app.

    Per e-mail, a password guesser is stopped on one account. Per IP, one
    machine is stopped on many. The IP windows are generous because the deploy
    may put every teacher behind the proxy's address (see docs/adr/0019).
    """

    def __init__(self) -> None:
        self.login_by_email = AttemptLimiter(max_failures=10, window_seconds=15 * 60)
        self.login_by_ip = AttemptLimiter(max_failures=100, window_seconds=15 * 60)
        self.signup_by_ip = AttemptLimiter(max_failures=20, window_seconds=60 * 60)

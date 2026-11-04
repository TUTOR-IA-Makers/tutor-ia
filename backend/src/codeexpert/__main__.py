"""`python -m codeexpert` / the `codeexpert` console script.

codeexpert            serve the API on port 8000
codeexpert migrate    bring the database to the schema this code expects
"""

import logging
import sys

HOST = "0.0.0.0"  # noqa: S104 - bind address; see the log line below
PORT = 8000

USAGE = "usage: codeexpert [migrate]"


def serve() -> None:
    import uvicorn

    # 0.0.0.0 is the bind address, not a browsable one — show the URL that works.
    logging.info("Open http://127.0.0.1:%d", PORT)
    uvicorn.run("codeexpert.api.app:app", host=HOST, port=PORT)


def migrate() -> None:
    """Apply every pending revision. Run by the Compose service `migrate`; see docs/adr/0013."""
    from codeexpert.settings import get_settings
    from codeexpert.store.migrate import upgrade

    upgrade(get_settings().require_database_url())


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s — %(message)s")
    if not args:
        serve()
        return 0
    if args == ["migrate"]:
        from codeexpert.errors import ConfigurationError

        try:
            migrate()
        except ConfigurationError as exc:
            # A deploy log should say what to set, not show a traceback.
            logging.error("%s", exc)
            return 1
        return 0
    print(USAGE, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())

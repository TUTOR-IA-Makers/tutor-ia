"""`python -m codeexpert` / the `codeexpert` console script."""

import logging

import uvicorn

HOST = "0.0.0.0"  # noqa: S104 - bind address; see the log line below
PORT = 8000


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s — %(message)s")
    # 0.0.0.0 is the bind address, not a browsable one — show the URL that works.
    logging.info("Open http://127.0.0.1:%d", PORT)
    uvicorn.run("codeexpert.api.app:app", host=HOST, port=PORT)


if __name__ == "__main__":
    main()

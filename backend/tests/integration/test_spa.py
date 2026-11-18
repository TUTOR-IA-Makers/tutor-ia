"""The API image serves the built front-end from the same origin (G4-1, #56).

A fake `dist/` under tmp_path stands in for the Vite build, so these tests need
neither Node nor Docker.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from codeexpert.api.app import create_app
from codeexpert.errors import ConfigurationError
from codeexpert.settings import reset_settings_cache

INDEX = "<!doctype html><title>CodeExpert</title><div id=root></div>"


@pytest.fixture
def dist(tmp_path: Path) -> Path:
    root = tmp_path / "dist"
    (root / "assets").mkdir(parents=True)
    (root / "index.html").write_text(INDEX, encoding="utf-8")
    (root / "assets" / "index-3f2a9c.js").write_text("console.log('ok')", encoding="utf-8")
    (root / "favicon.svg").write_text("<svg/>", encoding="utf-8")
    # Outside the build: must never be reachable through the catch-all.
    (tmp_path / "secret.txt").write_text("do not serve", encoding="utf-8")
    return root


@pytest.fixture
def spa_client(isolated_settings, dist: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CODEEXPERT_FRONTEND_DIR", str(dist))
    reset_settings_cache()
    with TestClient(create_app()) as test_client:
        yield test_client
    reset_settings_cache()


def _is_index(response) -> bool:
    return response.status_code == 200 and response.text == INDEX


def test_root_serves_the_spa(spa_client) -> None:
    response = spa_client.get("/", follow_redirects=False)
    assert _is_index(response)
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["cache-control"] == "no-cache"


@pytest.mark.parametrize(
    "path", ["/gerar", "/biblioteca", "/questoes/42", "/entrar", "/nao-existe"]
)
def test_client_side_routes_get_the_index(spa_client, path: str) -> None:
    response = spa_client.get(path)
    assert _is_index(response)
    assert response.headers["cache-control"] == "no-cache"


def test_hashed_assets_are_served_and_cached_for_good(spa_client) -> None:
    response = spa_client.get("/assets/index-3f2a9c.js")
    assert response.status_code == 200
    assert response.text == "console.log('ok')"
    assert "immutable" in response.headers["cache-control"]


def test_top_level_files_are_served_but_revalidated(spa_client) -> None:
    response = spa_client.get("/favicon.svg")
    assert response.status_code == 200
    assert response.text == "<svg/>"
    assert response.headers["cache-control"] == "no-cache"


def test_an_asset_from_an_earlier_deploy_is_a_404_not_html(spa_client) -> None:
    response = spa_client.get("/assets/index-old.js")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


@pytest.mark.parametrize("path", ["/api", "/api/v1/nope", "/api/v1/questions/x/nope"])
def test_unknown_api_paths_stay_json_404(spa_client, path: str) -> None:
    response = spa_client.get(path)
    assert response.status_code == 404
    assert response.headers["content-type"] == "application/json"


def test_api_routes_still_answer_first(spa_client) -> None:
    health = spa_client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    assert spa_client.get("/openapi.json").json()["info"]["title"] == "CodeExpert"
    assert spa_client.get("/docs").status_code == 200


def test_the_catch_all_is_not_in_the_openapi_schema(spa_client) -> None:
    paths = spa_client.get("/openapi.json").json()["paths"]
    assert "/{path}" not in paths


@pytest.mark.parametrize(
    "path",
    ["/../secret.txt", "/%2e%2e/secret.txt", "/assets/../../secret.txt", "/..%2fsecret.txt"],
)
def test_nothing_outside_the_build_is_served(spa_client, path: str) -> None:
    response = spa_client.get(path)
    assert "do not serve" not in response.text


def test_without_the_setting_root_still_redirects_to_the_docs(client) -> None:
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"
    assert client.get("/gerar").status_code == 404


def test_a_directory_without_index_fails_at_startup(
    isolated_settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    empty = tmp_path / "empty"
    empty.mkdir()
    monkeypatch.setenv("CODEEXPERT_FRONTEND_DIR", str(empty))
    reset_settings_cache()
    with pytest.raises(ConfigurationError, match=r"no index\.html"):
        create_app()

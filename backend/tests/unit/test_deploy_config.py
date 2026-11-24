"""The production Compose file and deploy script keep the promises of ADR-0011.

A mistake here is invisible until it is live: a published Postgres port, an API
key in `docker inspect`, a deploy key that runs whatever it is sent. These tests
read the files in `deploy/` and need neither Docker nor a VPS.
"""

import shutil
import subprocess
from pathlib import Path

import pytest

DEPLOY = Path(__file__).resolve().parents[3] / "deploy"
WORKFLOW = DEPLOY.parent / ".github" / "workflows" / "deploy.yml"
# Absolute, because the script runs with an empty PATH: no git, no docker.
BASH = shutil.which("bash") or "/bin/bash"


@pytest.fixture(scope="module")
def compose() -> dict:
    yaml = pytest.importorskip("yaml", reason="PyYAML comes with the docs extra (mkdocs)")
    return yaml.safe_load((DEPLOY / "compose.yaml").read_text(encoding="utf-8"))


def test_only_the_proxy_publishes_ports(compose: dict) -> None:
    publishing = {name for name, svc in compose["services"].items() if svc.get("ports")}
    assert publishing == {"proxy"}


def test_proxy_publishes_only_http_and_https(compose: dict) -> None:
    hosts = {str(port).split(":")[0] for port in compose["services"]["proxy"]["ports"]}
    assert hosts == {"80", "443"}


@pytest.mark.parametrize("service", ["api", "db", "proxy"])
def test_no_secret_reaches_a_container_environment(compose: dict, service: str) -> None:
    svc = compose["services"][service]
    assert "env_file" not in svc
    names = {name.upper() for name in svc.get("environment", {})}
    assert not names & {"CODEEXPERT_LLM_API_KEY", "CODEEXPERT_DATABASE_URL", "POSTGRES_PASSWORD"}


def test_api_reads_its_secrets_from_files(compose: dict) -> None:
    targets = {s["target"] for s in compose["services"]["api"]["secrets"]}
    assert targets == {"codeexpert_llm_api_key", "codeexpert_database_url"}
    for secret in compose["secrets"].values():
        assert secret["file"].startswith("/etc/codeexpert/secrets/")


def test_api_runs_the_deployed_commit_with_limits(compose: dict) -> None:
    api = compose["services"]["api"]
    assert api["image"].endswith(":${SHA:?SHA is the commit to deploy}")
    assert api["environment"]["CODEEXPERT_COMMIT_SHA"] == "${SHA}"
    assert api["mem_limit"] and api["pids_limit"]


def test_caddy_protects_everything_but_health() -> None:
    caddyfile = (DEPLOY / "Caddyfile").read_text(encoding="utf-8")
    assert "@protected not path /health" in caddyfile
    assert "basic_auth @protected" in caddyfile


def test_the_deploy_builds_the_front_end_into_the_image() -> None:
    # Without the named context the spa stage has nothing to build, and the
    # image would fail to build only after the merge to main.
    assert "--build-context frontend=frontend" in WORKFLOW.read_text(encoding="utf-8")


@pytest.mark.parametrize(
    "requested",
    [
        "",
        "main",
        "abc123",
        "A" * 40,
        "0" * 39,
        "0" * 41,
        "0" * 40 + "; rm -rf /",
        "$(id)",
    ],
)
def test_deploy_script_accepts_nothing_but_a_full_sha(requested: str, tmp_path: Path) -> None:
    result = _deploy(requested, tmp_path)
    assert result.returncode == 2
    assert "usage" in result.stderr
    assert list(tmp_path.iterdir()) == []


def test_deploy_script_lets_a_full_sha_through(tmp_path: Path) -> None:
    # Past validation it needs flock, git and docker, which the empty PATH hides:
    # it fails, but not as a usage error.
    result = _deploy("0123456789abcdef0123456789abcdef01234567", tmp_path)
    assert result.returncode not in (0, 2)
    assert "usage" not in result.stderr


def _deploy(requested: str, root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # noqa: S603 - our own script, fixed argv
        [BASH, str(DEPLOY / "deploy.sh")],
        env={"SSH_ORIGINAL_COMMAND": requested, "CODEEXPERT_ROOT": str(root), "PATH": ""},
        capture_output=True,
        text=True,
        check=False,
    )

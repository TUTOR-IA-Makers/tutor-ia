"""Unit tests for scripts/validate_catalog.py (G6-2).

Tests cover: directory parsing, missing required files, C compilation errors,
index synchronization, and strict coverage enforcement (fails if < 8).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

# Make scripts/ importable without installing the package.
SCRIPTS_DIR = Path(__file__).parent.parent.parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

# Caminho para o novo validador
VALIDATOR_SCRIPT = SCRIPTS_DIR / "validate_catalog.py"


# ---------------------------------------------------------------------------
# Fixtures & Helpers
# ---------------------------------------------------------------------------


def _create_mock_question(
    base_path: Path, q_id: str, eixo: str, nivel: str, valid_c: bool = True
) -> None:
    """Cria a estrutura de pastas e arquivos de uma questão mockada em questions/."""
    q_dir = base_path / "questions" / eixo.lower() / q_id
    q_dir.mkdir(parents=True, exist_ok=True)

    # enunciado.md
    (q_dir / "enunciado.md").write_text("Enunciado mockado.\n", encoding="utf-8")

    # meta.yaml
    meta_content = f'id: "{q_id}"\neixo: "{eixo}"\nnivel: "{nivel}"\ndireitos_restritos: true\n'
    (q_dir / "meta.yaml").write_text(meta_content, encoding="utf-8")

    # solucao.c
    c_code = (
        "#include <stdio.h>\nint main(){ return 0; }" if valid_c else "int main() { erro_sintaxe }"
    )
    (q_dir / "solucao.c").write_text(c_code, encoding="utf-8")

    # entradas/01.in
    entradas_dir = q_dir / "entradas"
    entradas_dir.mkdir(exist_ok=True)
    (entradas_dir / "01.in").write_text("1 2\n", encoding="utf-8")


def _write_mock_index(base_path: Path, eixo: str, nivel: str, q_ids: list[str]) -> None:
    """Cria o arquivo de índice correspondente em index/{eixo}/{eixo}_{nivel}.json."""
    index_dir = base_path / "index" / eixo.lower()
    index_dir.mkdir(parents=True, exist_ok=True)
    index_file = index_dir / f"{eixo.lower()}_{nivel.upper()}.json"

    payload = {
        "eixo": eixo.upper(),
        "nivel": nivel.upper(),
        "total": len(q_ids),
        "questoes": [{"id": qid, "eixo": eixo.upper(), "nivel": nivel.upper()} for qid in q_ids],
    }
    index_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_validator(catalog_dir: Path) -> subprocess.CompletedProcess:
    """Roda o validador injetando um diretório customizado."""
    env = {**os.environ, "CATALOG_DIR_OVERRIDE": str(catalog_dir)}
    # O subprocesso é seguro pois não há input de usuário externo
    return subprocess.run(  # noqa: S603
        [sys.executable, str(VALIDATOR_SCRIPT)], capture_output=True, text=True, env=env
    )


# ---------------------------------------------------------------------------
# Testes de Cobertura e Erros (Item 4 do PR)
# ---------------------------------------------------------------------------


def test_coverage_fails_if_below_8(tmp_path: Path) -> None:
    """Garante que a execução FALHA se tivermos menos de 8 questões."""
    # Cria apenas 7 questões para o E1-MF
    for i in range(1, 8):
        _create_mock_question(tmp_path, f"E1-MF-00{i}", "E1", "MF")

    result = run_validator(tmp_path)
    assert result.returncode != 0
    assert "FALHOU" in result.stdout
    assert "cobertura insuficiente" in result.stdout


def test_coverage_passes_if_exactly_8(tmp_path: Path) -> None:
    """Garante que a contagem de E1-MF chega a 8 e o índice sincroniza."""
    q_ids = [f"E1-MF-00{i}" for i in range(1, 9)]
    for qid in q_ids:
        _create_mock_question(tmp_path, qid, "E1", "MF")
    _write_mock_index(tmp_path, "E1", "MF", q_ids)

    result = run_validator(tmp_path)
    assert "E1 Nível MF: 8/8 [OK]" in result.stdout
    assert "[OK] e1/e1_MF.json (8/8 sincronizadas)" in result.stdout


def test_index_desync_fails_validation(tmp_path: Path) -> None:
    """Garante que uma dessincronia entre questions/ e index/ quebra a validação."""
    q_ids = [f"E1-MF-00{i}" for i in range(1, 9)]
    for qid in q_ids:
        _create_mock_question(tmp_path, qid, "E1", "MF")

    # Índice omite a oitava questão
    _write_mock_index(tmp_path, "E1", "MF", q_ids[:7])

    result = run_validator(tmp_path)
    assert result.returncode != 0
    assert "Dessincronia em e1_MF.json" in result.stdout


def test_invalid_c_code_fails_validation(tmp_path: Path) -> None:
    """Garante que código C que não compila gera erro."""
    _create_mock_question(tmp_path, "E1-MF-001", "E1", "MF", valid_c=False)
    result = run_validator(tmp_path)
    assert result.returncode != 0
    assert "Falha na compilação" in result.stdout


def test_missing_essential_files_fails(tmp_path: Path) -> None:
    """Garante que a falta de meta.yaml ou solucao.c quebra a validação."""
    _create_mock_question(tmp_path, "E1-MF-001", "E1", "MF")
    (tmp_path / "questions" / "e1" / "E1-MF-001" / "meta.yaml").unlink()  # Deleta o meta

    result = run_validator(tmp_path)
    assert result.returncode != 0
    assert "Arquivos essenciais" in result.stdout


# ---------------------------------------------------------------------------
# Testes do Catálogo Real (Sem pytest.skip)
# ---------------------------------------------------------------------------


def test_real_e1_catalog_exists() -> None:
    """Garante que as pastas de questões e índices do E1 existem. (Sem skip!)"""
    catalog_root = Path(__file__).parent.parent.parent.parent / "data" / "catalog"
    assert (catalog_root / "questions" / "e1").exists(), "A pasta questions/e1 não foi encontrada!"
    assert (catalog_root / "index" / "e1").exists(), "A pasta index/e1 não foi encontrada!"


def test_real_e2_catalog_exists() -> None:
    """Garante que as pastas de questões e índices do E2 existem. (Sem skip!)"""
    catalog_root = Path(__file__).parent.parent.parent.parent / "data" / "catalog"
    assert (catalog_root / "questions" / "e2").exists(), "A pasta questions/e2 não foi encontrada!"
    assert (catalog_root / "index" / "e2").exists(), "A pasta index/e2 não foi encontrada!"

"""Keep the form vocabulary and its offline response in sync with the domain."""

import json
from pathlib import Path

from codeexpert.domain import CStructure


def test_structure_catalog_matches_domain_and_mock(client) -> None:
    response = client.get("/api/v1/structures")
    assert response.status_code == 200
    catalog = response.json()
    assert [item["id"] for item in catalog] == [item.value for item in CStructure]
    assert all(item["label"].strip() for item in catalog)
    snapshot = Path(__file__).parents[2] / "frontend/src/services/mock/structures.json"
    assert catalog == json.loads(snapshot.read_text())

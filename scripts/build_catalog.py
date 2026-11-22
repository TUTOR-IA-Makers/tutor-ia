import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
CATALOG_DIR = os.environ.get("CATALOG_DIR_OVERRIDE", os.path.join(REPO_ROOT, "data", "catalog"))

INDEX_DIR = os.path.join(CATALOG_DIR, "index")
QUESTIONS_DIR = os.path.join(CATALOG_DIR, "questions")

MAPA_NIVEIS = {
    "MUITO FACIL": "MF", "MUITO FÁCIL": "MF",
    "FACIL": "F", "FÁCIL": "F",
    "MEDIO": "M", "MÉDIO": "M",
    "DIFICIL": "D", "DIFÍCIL": "D",
    "MUITO DIFICIL": "MD", "MUITO DIFÍCIL": "MD",
}


def write_yaml(filepath, meta):
    yaml_lines = [
        f'id: "{meta["id"]}"',
        f'eixo: "{meta["eixo"]}"',
        f'nivel: "{meta["nivel"]}"',
    ]

    if meta["estruturas"]:
        yaml_lines.append("estruturas:")
        for est in meta["estruturas"]:
            yaml_lines.append(f'  - "{est}"')
    else:
        yaml_lines.append("estruturas: []")

    yaml_lines.append(f'origem: "{meta["origem"]}"')
    yaml_lines.append(f'direitos_restritos: {str(meta["direitos_restritos"]).lower()}')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(yaml_lines) + "\n")


def build_questions_from_index():
    """Materializa data/catalog/questions/{eixo}/{id} a partir de data/catalog/index/."""
    if not os.path.exists(INDEX_DIR):
        print(f"[ERRO] Diretório {INDEX_DIR} não encontrado.")
        return

    total_geradas = 0

    for eixo_folder in sorted(os.listdir(INDEX_DIR)):
        eixo_index_path = os.path.join(INDEX_DIR, eixo_folder)
        if not os.path.isdir(eixo_index_path):
            continue

        for filename in sorted(os.listdir(eixo_index_path)):
            if not filename.endswith(".json"):
                continue

            json_path = os.path.join(eixo_index_path, filename)
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            questoes = data.get("questoes", data if isinstance(data, list) else [])

            for q in questoes:
                qid = q.get("id")
                if not qid:
                    continue

                pasta_eixo = q.get("eixo", qid.split("-")[0]).lower()
                q_dir = os.path.join(QUESTIONS_DIR, pasta_eixo, qid)
                entradas_dir = os.path.join(q_dir, "entradas")
                saidas_dir = os.path.join(q_dir, "saidas")
                os.makedirs(entradas_dir, exist_ok=True)
                os.makedirs(saidas_dir, exist_ok=True)

                with open(os.path.join(q_dir, "enunciado.md"), "w", encoding="utf-8") as f:
                    f.write(q.get("enunciado", ""))

                codigo_c = q.get("solucao_referencia", q.get("solucao", ""))
                with open(os.path.join(q_dir, "solucao.c"), "w", encoding="utf-8") as f:
                    f.write(codigo_c)

                casos = q.get("casos_teste", q.get("casos_de_teste", []))
                for idx, caso in enumerate(casos, start=1):
                    prefixo = f"{idx:02d}"
                    with open(
                        os.path.join(entradas_dir, f"{prefixo}.in"),
                        "w",
                        encoding="utf-8",
                        newline="\n",
                    ) as f_in:
                        f_in.write(caso.get("input", caso.get("entrada", "")))

                    with open(
                        os.path.join(saidas_dir, f"{prefixo}.out"),
                        "w",
                        encoding="utf-8",
                        newline="\n",
                    ) as f_out:
                        f_out.write(caso.get("output", caso.get("saida", "")))

                origem = q.get("origem", "")
                estruturas = q.get("estruturas") or []
                is_restricted = q.get("direitos_restritos", False)
                if "genéric" in origem.lower() or "clássic" in origem.lower():
                    is_restricted = True

                nivel_raw = q.get("nivel", qid.split("-")[1]).upper().strip()
                nivel_formatado = MAPA_NIVEIS.get(nivel_raw, nivel_raw)

                meta = {
                    "id": qid,
                    "eixo": pasta_eixo.upper(),
                    "nivel": nivel_formatado,
                    "estruturas": estruturas,
                    "origem": origem,
                    "direitos_restritos": is_restricted,
                }
                write_yaml(os.path.join(q_dir, "meta.yaml"), meta)
                total_geradas += 1

    print(f"Materialização concluída: {total_geradas} questão(ões) gerada(s) em questions/.")


if __name__ == "__main__":
    build_questions_from_index()
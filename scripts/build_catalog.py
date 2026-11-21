import json
import os
import glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
CATALOG_DIR = os.environ.get("CATALOG_DIR_OVERRIDE", os.path.join(REPO_ROOT, "data", "catalog"))

QUESTIONS_DIR = os.path.join(CATALOG_DIR, "questions")
INDEX_DIR = os.path.join(CATALOG_DIR, "index")


def parse_yaml_full(meta_path):
    meta = {
        "id": "",
        "eixo": "",
        "nivel": "",
        "estruturas": [],
        "origem": "",
        "direitos_restritos": False,
    }
    in_estruturas = False

    with open(meta_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line:
                continue

            if in_estruturas and line.startswith("- "):
                val = line[2:].strip().strip('"').strip("'")
                meta["estruturas"].append(val)
                continue
            else:
                in_estruturas = False

            if line.startswith("id:"):
                meta["id"] = line.split(":", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("eixo:"):
                meta["eixo"] = line.split(":", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("nivel:"):
                meta["nivel"] = line.split(":", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("origem:"):
                meta["origem"] = line.split(":", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("direitos_restritos:"):
                val = line.split(":", 1)[1].strip().lower()
                meta["direitos_restritos"] = val == "true"
            elif line.startswith("estruturas:"):
                rest = line.split(":", 1)[1].strip()
                if rest != "[]":
                    in_estruturas = True

    return meta


def build_split_indexes():
    """Gera data/catalog/index/{eixo}/{eixo}_{nivel}.json a partir de questions/."""
    if not os.path.exists(QUESTIONS_DIR):
        print(f"[ERRO] Diretório {QUESTIONS_DIR} não encontrado.")
        return

    grouped = {}  # chave: (eixo_lower, nivel_upper) -> lista de questões

    for eixo_folder in sorted(os.listdir(QUESTIONS_DIR)):
        eixo_path = os.path.join(QUESTIONS_DIR, eixo_folder)
        if not os.path.isdir(eixo_path):
            continue

        for q_id in sorted(os.listdir(eixo_path)):
            q_dir = os.path.join(eixo_path, q_id)
            meta_path = os.path.join(q_dir, "meta.yaml")
            enunciado_path = os.path.join(q_dir, "enunciado.md")
            solucao_path = os.path.join(q_dir, "solucao.c")

            if not (os.path.isdir(q_dir) and os.path.exists(meta_path)):
                continue

            meta = parse_yaml_full(meta_path)
            eixo_lower = meta["eixo"].lower() or eixo_folder.lower()
            nivel_upper = meta["nivel"].upper()

            enunciado = ""
            if os.path.exists(enunciado_path):
                with open(enunciado_path, "r", encoding="utf-8") as f:
                    enunciado = f.read()

            solucao = ""
            if os.path.exists(solucao_path):
                with open(solucao_path, "r", encoding="utf-8") as f:
                    solucao = f.read()

            casos_teste = []
            for in_file in sorted(glob.glob(os.path.join(q_dir, "entradas", "*.in"))):
                base = os.path.splitext(os.path.basename(in_file))[0]
                out_file = os.path.join(q_dir, "saidas", f"{base}.out")
                with open(in_file, "r", encoding="utf-8") as f_in:
                    inp = f_in.read()
                out = ""
                if os.path.exists(out_file):
                    with open(out_file, "r", encoding="utf-8") as f_out:
                        out = f_out.read()
                casos_teste.append({"entrada": inp, "saida": out})

            entry = {
                "id": meta["id"] or q_id,
                "eixo": meta["eixo"],
                "nivel": nivel_upper,
                "estruturas": meta["estruturas"],
                "origem": meta["origem"],
                "direitos_restritos": meta["direitos_restritos"],
                "path": f"questions/{eixo_lower}/{q_id}",
                "enunciado": enunciado,
                "solucao_referencia": solucao,
                "casos_teste": casos_teste,
            }

            grouped.setdefault((eixo_lower, nivel_upper), []).append(entry)

    for (eixo_lower, nivel_upper), itens in sorted(grouped.items()):
        out_dir = os.path.join(INDEX_DIR, eixo_lower)
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, f"{eixo_lower}_{nivel_upper}.json")

        payload = {
            "eixo": eixo_lower.upper(),
            "nivel": nivel_upper,
            "total": len(itens),
            "questoes": itens,
        }

        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        print(f"[GERADO] {out_file} ({len(itens)} questões)")


if __name__ == "__main__":
    build_split_indexes()
    print("Sincronização do catálogo concluída.")
import os
import sys
import json
import subprocess
import glob

CATALOG_DIR = os.environ.get("CATALOG_DIR_OVERRIDE", "../data/catalog")
QUESTIONS_DIR = os.path.join(CATALOG_DIR, "questions")
INDEX_DIR = os.path.join(CATALOG_DIR, "index")

REQUIRED_COVERAGE = 8
EXPECTED_LEVELS = ["MF", "F", "M", "D", "MD"]
EXPECTED_AXES = ["E1", "E2"]


def parse_meta(meta_path):
    meta = {}
    with open(meta_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("id:"):
                meta["id"] = line.split(":", 1)[1].strip().replace('"', "").replace("'", "")
            elif line.startswith("eixo:"):
                meta["eixo"] = line.split(":", 1)[1].strip().replace('"', "").replace("'", "")
            elif line.startswith("nivel:"):
                meta["nivel"] = line.split(":", 1)[1].strip().replace('"', "").replace("'", "")
    return meta


def validate_indexes(ids_por_grupo):
    """Valida se data/catalog/index/{eixo}/{eixo}_{nivel}.json existe e bate 1:1 com questions/."""
    has_index_errors = False

    print("\n--- Validação dos Índices (index/) ---")
    for eixo in EXPECTED_AXES:
        eixo_lower = eixo.lower()
        for nivel in EXPECTED_LEVELS:
            index_file = os.path.join(INDEX_DIR, eixo_lower, f"{eixo_lower}_{nivel}.json")
            expected_ids = sorted(ids_por_grupo[eixo][nivel])

            if not os.path.exists(index_file):
                print(f"[ERRO] Índice ausente: {index_file}")
                has_index_errors = True
                continue

            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError as exc:
                print(f"[ERRO] JSON inválido em {index_file}: {exc}")
                has_index_errors = True
                continue

            questoes = data.get("questoes", data if isinstance(data, list) else [])
            indexed_ids = sorted(q.get("id", "") for q in questoes if isinstance(q, dict))

            if indexed_ids != expected_ids:
                missing_in_json = set(expected_ids) - set(indexed_ids)
                orphan_in_json = set(indexed_ids) - set(expected_ids)
                print(
                    f"[ERRO] Dessincronia em {eixo_lower}_{nivel}.json | "
                    f"Faltando no JSON: {sorted(missing_in_json)} | "
                    f"Órfãos no JSON: {sorted(orphan_in_json)}"
                )
                has_index_errors = True
            elif len(indexed_ids) < REQUIRED_COVERAGE:
                print(
                    f"[ERRO] {eixo_lower}_{nivel}.json possui {len(indexed_ids)}/{REQUIRED_COVERAGE} questões."
                )
                has_index_errors = True
            else:
                print(f"[OK] {eixo_lower}/{eixo_lower}_{nivel}.json ({len(indexed_ids)}/{REQUIRED_COVERAGE} sincronizadas)")

    return has_index_errors


def main():
    if not os.path.exists(QUESTIONS_DIR):
        print(f"[ERRO] Diretório de questões {QUESTIONS_DIR} não encontrado.")
        sys.exit(1)

    ids_por_grupo = {
        eixo: {nivel: [] for nivel in EXPECTED_LEVELS}
        for eixo in EXPECTED_AXES
    }
    has_errors = False
    encontrou_alguma_questao = False

    for eixo_dir in EXPECTED_AXES:
        eixo_path = os.path.join(QUESTIONS_DIR, eixo_dir.lower())

        if not os.path.exists(eixo_path):
            print(f"[AVISO] Pasta do eixo não encontrada: {eixo_path}")
            continue

        for q_id in sorted(os.listdir(eixo_path)):
            q_dir = os.path.join(eixo_path, q_id)
            if not os.path.isdir(q_dir):
                continue

            encontrou_alguma_questao = True
            enunciado_path = os.path.join(q_dir, "enunciado.md")
            meta_path = os.path.join(q_dir, "meta.yaml")
            c_file = os.path.join(q_dir, "solucao.c")
            in_dir = os.path.join(q_dir, "entradas")
            out_dir = os.path.join(q_dir, "saidas")

            if (
                not os.path.exists(enunciado_path)
                or not os.path.exists(meta_path)
                or not os.path.exists(c_file)
            ):
                print(f"[ERRO] {q_id}: Arquivos essenciais (enunciado.md, meta.yaml ou solucao.c) faltando.")
                has_errors = True
                continue

            meta = parse_meta(meta_path)
            eixo = meta.get("eixo", "").upper()
            nivel = meta.get("nivel", "").upper()

            if eixo in ids_por_grupo and nivel in ids_por_grupo[eixo]:
                ids_por_grupo[eixo][nivel].append(meta.get("id") or q_id)
            else:
                print(f"[AVISO] {q_id}: Nível ({nivel}) ou Eixo ({eixo}) fora do padrão esperado.")

            bin_file = os.path.join(q_dir, "exec_temp")
            compile_cmd = ["gcc", "-Wall", c_file, "-o", bin_file, "-lm"]
            comp_res = subprocess.run(compile_cmd, capture_output=True, text=True)

            if comp_res.returncode != 0:
                print(f"[ERRO] {q_id}: Falha na compilação.\n{comp_res.stderr}")
                has_errors = True
                continue

            try:
                in_files = sorted(glob.glob(os.path.join(in_dir, "*.in")))
                if not in_files:
                    print(f"[ERRO] {q_id}: Nenhum arquivo de entrada (.in) encontrado em {in_dir}.")
                    has_errors = True
                    continue

                os.makedirs(out_dir, exist_ok=True)
                valid_bases = {os.path.splitext(os.path.basename(f))[0] for f in in_files}
                for old_out in glob.glob(os.path.join(out_dir, "*.out")):
                    base_name = os.path.splitext(os.path.basename(old_out))[0]
                    if base_name not in valid_bases:
                        os.remove(old_out)

                for in_file in in_files:
                    base_name = os.path.splitext(os.path.basename(in_file))[0]
                    out_file = os.path.join(out_dir, f"{base_name}.out")

                    try:
                        with open(in_file, "rb") as f_in:
                            run_res = subprocess.run(
                                [bin_file],
                                stdin=f_in,
                                capture_output=True,
                                timeout=2,
                            )
                    except subprocess.TimeoutExpired:
                        print(f"[ERRO] {q_id}: Timeout (loop infinito) no caso {base_name}.in.")
                        has_errors = True
                        continue

                    if run_res.returncode != 0:
                        stderr_msg = run_res.stderr.decode("utf-8", errors="replace")
                        print(f"[ERRO] {q_id}: Erro de execução no caso {base_name}.in.\n{stderr_msg}")
                        has_errors = True
                        continue

                    with open(out_file, "wb") as f_out:
                        f_out.write(run_res.stdout)

                print(f"[OK] {q_id}: {len(in_files)} caso(s) validado(s) (entradas/*.in -> saidas/*.out).")
            finally:
                if os.path.exists(bin_file):
                    os.remove(bin_file)

    if not encontrou_alguma_questao:
        print(f"\n[ERRO CRÍTICO] Nenhuma questão foi lida. Verifique se as pastas estão dentro de {QUESTIONS_DIR}/e1/ e e2/")
        sys.exit(1)

    print("\n--- Relatório de Cobertura (questions/) ---")
    coverage_failed = False
    for eixo in EXPECTED_AXES:
        for nivel in EXPECTED_LEVELS:
            count = len(ids_por_grupo[eixo][nivel])
            status = "OK" if count >= REQUIRED_COVERAGE else "FALHOU"
            print(f"{eixo} Nível {nivel}: {count}/{REQUIRED_COVERAGE} [{status}]")
            if count < REQUIRED_COVERAGE:
                coverage_failed = True

    index_errors = validate_indexes(ids_por_grupo)

    if has_errors or coverage_failed or index_errors:
        print("\n[FALHA] Validação finalizada com erros, cobertura insuficiente ou índices dessincronizados.")
        sys.exit(1)
    else:
        print("\n[SUCESSO] Catálogo validado. Saídas geradas, cobertura atingida e índices sincronizados.")
        sys.exit(0)


if __name__ == "__main__":
    main()
import os
import sys
import subprocess
import glob

CATALOG_DIR = os.environ.get("CATALOG_DIR_OVERRIDE", "../data/catalog")
REQUIRED_COVERAGE = 8

EXPECTED_LEVELS = ["MF", "F", "M", "D", "MD"]
EXPECTED_AXES = ["E1", "E2"]


def parse_meta(meta_path):
    meta = {}
    with open(meta_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("eixo:"):
                meta["eixo"] = line.split(":", 1)[1].strip().replace('"', "").replace("'", "")
            elif line.startswith("nivel:"):
                meta["nivel"] = line.split(":", 1)[1].strip().replace('"', "").replace("'", "")
    return meta


def main():
    if not os.path.exists(CATALOG_DIR):
        print(f"[ERRO] Diretório raiz {CATALOG_DIR} não encontrado.")
        sys.exit(1)

    coverage = {eixo: {nivel: 0 for nivel in EXPECTED_LEVELS} for eixo in EXPECTED_AXES}
    has_errors = False
    encontrou_alguma_questao = False

    for eixo_dir in EXPECTED_AXES:
        eixo_path = os.path.join(CATALOG_DIR, eixo_dir.lower())

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

            if eixo in coverage and nivel in coverage[eixo]:
                coverage[eixo][nivel] += 1
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
        print("\n[ERRO CRÍTICO] Nenhuma questão foi lida. Verifique se as pastas estão dentro de data/catalog/e1/ e data/catalog/e2/")
        sys.exit(1)

    print("\n--- Relatório de Cobertura ---")
    coverage_failed = False
    for eixo in EXPECTED_AXES:
        for nivel in EXPECTED_LEVELS:
            count = coverage[eixo][nivel]
            status = "OK" if count >= REQUIRED_COVERAGE else "FALHOU"
            print(f"{eixo} Nível {nivel}: {count}/{REQUIRED_COVERAGE} [{status}]")
            if count < REQUIRED_COVERAGE:
                coverage_failed = True

    if has_errors or coverage_failed:
        print("\n[FALHA] Validação finalizada com erros ou cobertura insuficiente.")
        sys.exit(1)
    else:
        print("\n[SUCESSO] Catálogo validado. Saídas geradas e cobertura atingida.")
        sys.exit(0)


if __name__ == "__main__":
    main()
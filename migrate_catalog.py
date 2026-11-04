import json
import os

JSON_PATH = "data/catalog/catalogo_atual.json"
BASE_OUT_DIR = "data/catalog"

def write_yaml(filepath, meta):
    yaml_lines = []
    yaml_lines.append(f'id: "{meta["id"]}"')
    yaml_lines.append(f'eixo: "{meta["eixo"]}"')
    yaml_lines.append(f'nivel: "{meta["nivel"]}"')
    
    yaml_lines.append('estruturas:')
    if meta["estruturas"]:
        for est in meta["estruturas"]:
            yaml_lines.append(f'  - "{est}"')
    else:
        yaml_lines.append('  []') 
        
    yaml_lines.append(f'origem: "{meta["origem"]}"')
    
    yaml_lines.append(f'direitos_restritos: {str(meta["direitos_restritos"]).lower()}')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(yaml_lines) + '\n')

def run_migration():
    if not os.path.exists(JSON_PATH):
        print(f"Erro: Arquivo {JSON_PATH} não encontrado.")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        questoes = json.load(f)

    for q in questoes:
        qid = q.get('id')
        if not qid:
            continue
            
        eixo_str = q.get('eixo', '').lower()
        if not eixo_str:
             eixo_str = qid.split('-')[0].lower()
             
        q_dir = os.path.join(BASE_OUT_DIR, eixo_str, qid)
        entradas_dir = os.path.join(q_dir, "entradas")
        os.makedirs(entradas_dir, exist_ok=True)
        
        with open(os.path.join(q_dir, "enunciado.md"), 'w', encoding='utf-8') as f:
            f.write(q.get('enunciado', ''))
            
        with open(os.path.join(q_dir, "solucao.c"), 'w', encoding='utf-8') as f:
            f.write(q.get('solucao', ''))
            
        casos = q.get('casos_de_teste', [])
        for idx, caso in enumerate(casos, start=1):
            nome_arquivo = f"{idx:02d}.txt"
            with open(os.path.join(entradas_dir, nome_arquivo), 'w', encoding='utf-8') as f:
                entrada_str = caso.get('input', caso.get('entrada', ''))
                f.write(entrada_str)
                
        origem = q.get('origem', '')
        estruturas = q.get('estruturas') or []
        
        is_restricted = q.get('direitos_restritos', False)
        if "genéric" in origem.lower() or "clássic" in origem.lower():
            is_restricted = True
            
        meta = {
            "id": qid,
            "eixo": q.get('eixo', qid.split('-')[0]), 
            "nivel": q.get('nivel', ''),
            "estruturas": estruturas,
            "origem": origem,
            "direitos_restritos": is_restricted
        }
        write_yaml(os.path.join(q_dir, "meta.yaml"), meta)
        
    print(f"Migração concluída! {len(questoes)} questões extraídas e separadas por eixo em {BASE_OUT_DIR}/")

if __name__ == "__main__":
    run_migration()
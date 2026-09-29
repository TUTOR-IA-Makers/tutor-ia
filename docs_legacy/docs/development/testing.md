# Testes e verificação

<p class="lead">O repositório não contém testes automatizados. Esta página descreve como verificar alterações à mão hoje, e como seria uma suite de testes se alguém a quisesse criar.</p>

!!! warning "Estado atual"
    Não existe diretório `tests/`, ficheiro `test_*.py`, configuração de `pytest` nem pipeline de CI. Nenhuma alteração a este código é validada automaticamente.

    O `.gitignore` menciona `.pytest_cache/` e `htmlcov/`, mas por ser o modelo padrão do GitHub para Python — não porque essas ferramentas estejam em uso.

## Verificação manual

Até existir uma suite, este é o percurso mínimo depois de qualquer alteração.

### 1. O servidor arranca

```bash
python main.py
```

Falhas de importação e erros de sintaxe aparecem aqui. O arranque deve registar `Open http://127.0.0.1:8000` sem exceções.

### 2. A configuração carrega e a ligação funciona

```bash
curl -i http://127.0.0.1:8000/config
```

Um `200` confirma ficheiro de configuração, chave e conectividade. Isola problemas de ambiente dos problemas da alteração em causa.

### 3. O pipeline corre de ponta a ponta

```bash
rm -rf cache/* Questions/Moodle_Questionnaire.xml

curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "muito facil"}, "input_request": {"qty": 3}}'
```

`qty: 3` mantém o ciclo curto. Um `200` significa que as cinco etapas passaram.

### 4. Os artefactos fazem sentido

Um `200` não garante conteúdo útil. Este script verifica os erros silenciosos mais frequentes:

```bash
python - <<'PY'
import json, os, re

ok = True
def check(cond, msg):
    global ok
    print(("  OK   " if cond else "  FALHA") + " " + msg)
    ok = ok and cond

st = json.load(open("cache/statement.json", encoding="utf-8"))
check(bool(st["name"].strip()), "enunciado tem titulo")
check(len(st["statement"]) > 100, "enunciado tem corpo")

code = open("cache/solution.c", encoding="utf-8").read()
check("```" not in code, "solucao sem cercas de markdown")
check("int main" in code, "solucao tem main")
check(not re.search(r"\b(rand|srand|time)\s*\(", code),
      "solucao e determinista (sem rand/time)")

tc = json.load(open("cache/testcases.json", encoding="utf-8"))["testcases"]
check(len(tc) > 0, f"ha casos de teste ({len(tc)})")
vazias = sum(1 for t in tc if not t["output"].strip())
check(vazias == 0, f"nenhuma saida vazia ({vazias} vazias)")
check(len({t["output"] for t in tc}) > 1 or len(tc) == 1,
      "as saidas variam entre casos")

xml = open("Questions/Moodle_Questionnaire.xml", encoding="utf-8").read()
check(xml.count("<question type=") == 1, "o XML tem exatamente uma questao")
check("Macro_" not in xml, "nenhum marcador Macro_ por substituir")
check(xml.rstrip().endswith("</quiz>"), "o XML fecha corretamente")

print("\n" + ("TUDO OK" if ok else "HA FALHAS"))
PY
```

A verificação de `Macro_` é a mais valiosa depois de mexer nos templates: um marcador por substituir passa despercebido no XML e só falha no Moodle.

### 5. O XML importa no Moodle

Nenhuma verificação local substitui uma importação real num Moodle de teste, com o plugin CodeRunner instalado. Ver [Importar no Moodle](../guides/import-into-moodle.md).

## O que é fácil de testar hoje

Três funções são puras — sem entrada/saída, sem rede — e podem ser testadas sem qualquer refactor:

| Função | Módulo | Verifica |
| --- | --- | --- |
| `_build_prompt(request)` | `services/statement.py` | Que cada combinação de restrições produz as instruções corretas |
| `_parse_statement(raw)` | `services/statement.py` | A análise de blocos e a extração do título |
| `_parse_inputs(raw)` | `services/inputs.py` | Os três níveis de interpretação |

`_parse_inputs` é a mais valiosa: os seus dois níveis de recurso são a origem de uma classe conhecida de erros silenciosos.

```python title="tests/test_parse_inputs.py — esboço"
from services.inputs import _parse_inputs

def test_json_valido():
    assert _parse_inputs('["3\\n10\\n", "2\\n5\\n"]') == ["3\n10\n", "2\n5\n"]

def test_resposta_vazia_do_modelo():
    assert _parse_inputs("[]") == []

def test_entrada_multilinha_sobrevive():
    # Documenta o comportamento do nivel de recurso por linhas,
    # que hoje parte entradas multilinha.
    ...
```

```python title="tests/test_build_prompt.py — esboço"
from models import StatementRequest
from services.statement import _build_prompt

def test_sem_if_proibe_condicionais():
    p = _build_prompt(StatementRequest(can_has_if=False))
    assert "NÃO deve usar estruturas condicionais" in p

def test_if_sem_else():
    p = _build_prompt(StatementRequest(can_has_if=True, can_has_else=False))
    assert "NÃO deve usar else" in p

def test_dificuldade_invalida_nao_acrescenta_nada():
    # Documenta a lacuna: nenhum ramo corresponde, e nao ha erro.
    p = _build_prompt(StatementRequest(difficulty="inexistente"))
    assert "nivel" not in p.lower()
```

Estes testes correm em milissegundos e não custam tokens.

## O que exige mais trabalho

| Alvo | Obstáculo | Abordagem |
| --- | --- | --- |
| `chat_completion` | Chamada HTTP real | Simular `requests.post` com `unittest.mock`, ou `responses` |
| `generate_statement`, `generate_code`, `generate_inputs` | Rede **e** escrita em disco | Simular `chat_completion`; `tmp_path` para os caminhos de cache |
| `generate_testcases` | Precisa de `gcc` | Testar com um `.c` fixo e conhecido — é um teste de integração legítimo, rápido, sem custo em tokens |
| `export_moodle_xml` | Lê cinco ficheiros | `tmp_path` com artefactos de exemplo. **O melhor retorno de todos** — é determinístico e cobre os marcadores |
| Endpoints | Estado global em `cache/` | `TestClient` com `monkeypatch` sobre `CACHE_DIR` |

!!! tip "Comece pelo exportador"
    `export_moodle_xml` não usa rede nem `gcc`, é totalmente determinístico e é onde os erros mais caros aparecem — marcadores por substituir, XML mal formado, acumulação inesperada. Um teste com artefactos de exemplo em `tmp_path` cobre a etapa mais frágil pelo menor esforço.

!!! warning "As constantes de caminhos dificultam o isolamento"
    Os caminhos são constantes de módulo avaliadas no `import`, o que obriga a `monkeypatch` por módulo em vez de por chamada. Testes que escrevam em `cache/` real interferem entre si e com o servidor de desenvolvimento.

    Aceitar um parâmetro `cache_dir` opcional nas funções de serviço resolveria o problema — e é o mesmo refactor que resolveria a [concorrência](../architecture/cache-and-state.md#concorrencia).

## Se criar uma suite

Nada está configurado, portanto as escolhas estão em aberto. Uma base convencional:

```bash
uv pip install pytest pytest-cov
```

```text
tests/
├── conftest.py           # fixtures: artefactos de cache, respostas simuladas
├── test_prompts.py       # _build_prompt — funções puras
├── test_parsing.py       # _parse_statement, _parse_inputs — funções puras
├── test_moodle_export.py # substituição de marcadores, acumulação
└── test_api.py           # endpoints com TestClient e cache isolada
```

```bash
pytest -q
pytest --cov=services --cov=routers --cov-report=term-missing
```

!!! danger "Nenhum teste deve chamar o provedor real"
    Uma suite que faça chamadas reais custa dinheiro, é não determinística e falha sem rede. Simule `services.llm.chat_completion` — é o único ponto de saída, o que torna a simulação trivial.

O passo seguinte natural é ligar `pytest` a um workflow de CI. O workflow atual apenas constrói e publica a documentação; ver [Deploy](../deployment/index.md#ci-cd).

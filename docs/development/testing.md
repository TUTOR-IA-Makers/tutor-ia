# Testes e verificação

<p class="lead">A suite corre sem rede, sem chave de API e — quando é preciso — sem compilador. É o que a torna utilizável por seis pessoas, em qualquer máquina, e pelo CI.</p>

## Correr

```bash
make check      # o portão completo: artefactos, segredos, formatação, lint, testes, docs
make test       # só os testes, com cobertura
```

`make check` é o mesmo *script* que o CI corre. Se passa aqui, passa lá.

## Como está organizada

```text
tests/
├── conftest.py              fixtures: FakeLLM, FakeRunner, definições isoladas
├── unit/
│   ├── test_parsers.py      os leitores de resposta do modelo
│   ├── test_workspace.py    isolamento entre execuções e travessia de caminhos
│   ├── test_moodle_export.py  o XML que chega ao Moodle
│   └── test_settings.py     configuração e não-exposição da chave
└── integration/
    ├── test_pipeline.py     as cinco etapas encadeadas
    └── test_api.py          o contrato HTTP e os códigos de estado
```

## Duas regras que a suite inteira respeita

!!! success "Nenhum teste toca na rede"
    O fornecedor de modelos é sempre um `FakeLLM` que devolve respostas guionadas. É por isso que `LLMClient` é um protocolo — e é o que permite ao portão correr numa máquina sem chave nenhuma.

**Nenhum teste escreve fora de `tmp_path`.** Uma *fixture* automática redireciona `CODEEXPERT_WORKSPACE_ROOT` e `CODEEXPERT_QUESTIONS_DIR` para um diretório temporário em cada teste, e injeta uma chave falsa para que nenhuma chave real seja alguma vez lida.

```python title="tests/conftest.py"
@pytest.fixture(autouse=True)
def isolated_settings(tmp_path, monkeypatch):
    monkeypatch.setenv("CODEEXPERT_WORKSPACE_ROOT", str(tmp_path / "runs"))
    monkeypatch.setenv("CODEEXPERT_LLM_API_KEY", "sk-test-not-a-real-key")
    reset_settings_cache()
```

## Testes que precisam de compilador

Marcados com `@requires_gcc`, ignoram-se sozinhos quando o `gcc` não está presente:

```python
@requires_gcc
def test_expected_outputs_come_from_real_execution(workspace, statement_response):
    """A regra em que todo o produto assenta: as saídas são observadas, não previstas."""
```

São poucos e valem muito — são os únicos que exercitam a etapa que produz verdade, incluindo o ciclo infinito que antes bloqueava o servidor para sempre.

!!! warning "`make check` passa sem `gcc`; a aplicação não"
    Se estiver a trabalhar sem compilador, tenha presente que os testes que mais importam ficaram por correr. O CI corre-os sempre.

## O que é testado, e porquê esses

| Área | Porque é o primeiro alvo |
| --- | --- |
| `parse_statement`, `parse_inputs`, `strip_code_fences` | Falham **em silêncio** quando um prompt muda de forma. Produzem um título errado, uma lista vazia, um ficheiro que não compila — nunca uma exceção |
| `RunWorkspace` | O `run_id` vem do cliente e vira caminho no disco. A travessia de diretórios é testada explicitamente |
| Exportação Moodle XML | Um macro por substituir ou um `<` por escapar só se descobre na importação, já em frente à turma |
| Mapeamento de erros | Os códigos de estado são contrato. Um `500` onde devia estar um `409` manda o cliente investigar o sítio errado |

## Escrever um teste novo

- **Uma correção de bug traz o teste que falhava antes dela.** Sem exceções — a suite existe precisamente porque estes analisadores falhavam calados.
- Teste comportamento, não implementação. Um teste que repete a lógica do código não deteta nada.
- `FakeLLM` recebe a lista de respostas por ordem; `FakeRunner` simula compilação, e sabe simular um programa que não termina.

## Verificação manual {#verificacao-manual}

A suite não substitui uma geração real, porque nenhum teste chama o modelo. Depois de mexer em prompts ou no pipeline:

```bash
make run

curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "muito facil"}, "qty": 3}'
```

`qty: 3` mantém o ciclo curto. Depois inspecione o que ficou:

```bash
ls var/runs/                      # o run_id da execução
cat var/runs/<run_id>/meta.json   # modelo, versões de prompt, restrições
cat var/runs/<run_id>/solution.c
```

Vale confirmar quatro coisas que um `200` não garante:

1. o enunciado tem título e corpo, e respeita as restrições pedidas;
2. `solution.c` não tem cercas de markdown e compila;
3. as entradas correspondem ao que o código lê;
4. o XML importa no Moodle sem erro.

O último passo está descrito em [Importar no Moodle](../guides/import-into-moodle.md#verificacoes-antes-de-usar-com-alunos).

## Cobertura

```bash
make test
```

!!! info "A cobertura é informação, não objetivo"
    Não há limite mínimo imposto, e não vale a pena inventar um. As áreas da tabela acima importam muito mais do que a percentagem global — um número alto com os analisadores por testar não diz nada.

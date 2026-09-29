# Gerar uma questão completa

<p class="lead">Uma chamada, cinco etapas, um ficheiro XML pronto a importar. Este guia acompanha o percurso completo e mostra o que inspecionar no fim.</p>

## Antes de começar

```bash
curl http://127.0.0.1:8000/config
```

Confirme que `api_key_configured` é `true`. Se não for, volte a [Configuração](../getting-started/configuration.md) — falhar aqui custa um segundo; falhar a meio do pipeline custa trinta.

E confirme o compilador:

```bash
gcc --version
```

## O pedido

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{
        "statement_request": {
          "difficulty": "facil",
          "can_has_if": true,
          "can_has_else": true,
          "can_has_repetition": true,
          "can_has_function": false,
          "can_has_matrix": false
        },
        "qty": 5
      }'
```

`qty: 5` mantém a espera curta enquanto se está a experimentar. Para uma questão a sério, 10 a 20 casos dão uma cobertura mais honesta.

!!! tip "Comece por um pedido mínimo"
    ```bash
    curl -X POST http://127.0.0.1:8000/create_question \
      -H "Content-Type: application/json" -d '{"statement_request": {}, "qty": 3}'
    ```
    Todos os campos têm valores por omissão. Serve para confirmar que a cadeia inteira funciona antes de afinar restrições.

## O que acontece durante o pedido

```mermaid
sequenceDiagram
    participant C as curl
    participant A as API
    participant W as var/runs/&lt;run_id&gt;
    participant M as Modelo
    participant G as gcc

    C->>A: POST /create_question
    A->>W: cria o diretório da execução
    A->>M: enunciado
    M-->>A: texto em blocos
    A->>W: statement.json
    A->>M: solução em C
    M-->>A: código
    A->>W: solution.c
    A->>M: entradas de teste
    M-->>A: array JSON
    A->>W: inputs.json
    A->>G: compila e executa cada entrada
    G-->>A: stdout real
    A->>W: testcases.json
    A->>A: renderiza o XML
    A-->>C: 200 com run_id e tudo o resto
```

Três chamadas ao modelo, uma compilação e `qty` execuções. A quarta etapa é a única que não pergunta nada a um modelo.

## A resposta

```json
{
  "run_id": "20260918T221305Z-1a2b3c4d",
  "statement": { "name": "Soma dos numeros pares", "statement": "..." },
  "code": "#include <stdio.h>\n...",
  "inputs": ["5\n1\n2\n3\n4\n5\n"],
  "testcases": [{ "input": "5\n1\n2\n3\n4\n5\n", "output": "6\n" }],
  "export": {
    "file_path": "var/questions/Moodle_Questionnaire.xml",
    "question_count": 1
  }
}
```

Guarde o `run_id`. É por ele que se encontram os artefactos no disco e se retoma o trabalho.

## Quando uma etapa falha

O erro da etapa é devolvido com o seu próprio código de estado, e **o que já foi gerado fica no disco**:

```bash
RUN=20260918T221305Z-1a2b3c4d
ls var/runs/$RUN/            # o que chegou a ser produzido
```

A partir daí, retome pelo endpoint individual correspondente em vez de repetir tudo — ver [Pipeline passo a passo](step-by-step-pipeline.md#retomar-a-meio). Os erros mais comuns estão em [Erros](../api/errors.md).

## Ficheiros no disco

```text
var/runs/20260918T221305Z-1a2b3c4d/
├── meta.json        restrições, modelo e versão de cada prompt
├── statement.json
├── solution.c
├── solution         o binário
├── inputs.json
└── testcases.json

var/questions/
└── Moodle_Questionnaire.xml
```

O XML acumula: cada exportação acrescenta uma questão ao mesmo ficheiro.

## Verificar o resultado

Um `200` não garante uma questão boa. Vale gastar um minuto:

```bash
RUN=20260918T221305Z-1a2b3c4d

# As restrições pedidas, e o prompt que as produziu
cat var/runs/$RUN/meta.json

# A solução respeita mesmo o que foi pedido? (nada no serviço o verifica)
cat var/runs/$RUN/solution.c

# Alguma saída capturada ficou vazia?
python -c "
import json; d=json.load(open('var/runs/'+'$RUN'+'/testcases.json'))
vazias=[i for i,c in enumerate(d['testcases']) if not c['output'].strip()]
print('saidas vazias:', vazias or 'nenhuma')"

# Quantas questões tem o ficheiro?
grep -c '<question type="coderunner"' var/questions/Moodle_Questionnaire.xml
```

!!! danger "A verificação que o serviço não faz por si"
    Se pediu uma questão sem repetição, **leia a solução**. O serviço não confirma que o modelo obedeceu, e o XML sai na mesma. É a lacuna 1 da [análise de lacunas](../product/gap-analysis.md#as-restricoes-nao-sao-verificadas).

## Passo seguinte

Para controlar cada etapa e editar resultados intermédios, ver [Pipeline passo a passo](step-by-step-pipeline.md). Para levar o XML ao Moodle, ver [Importar no Moodle](import-into-moodle.md).

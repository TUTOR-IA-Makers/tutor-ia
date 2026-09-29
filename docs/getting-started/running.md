# Executar o servidor

<p class="lead">Um comando arranca o servidor com recarga automática. <code>GET /health</code> diz se está de pé; <code>GET /config</code> diz se está configurado.</p>

## Arrancar

=== "Desenvolvimento"

    ```bash
    make run
    ```

    Equivale a `uvicorn codeexpert.api.app:app --reload --port 8000`. Reinicia a cada alteração de ficheiro.

=== "Sem recarga"

    ```bash
    .venv/bin/codeexpert
    ```

    O *console script* instalado com o pacote. Também funciona `python -m codeexpert`.

=== "Compatibilidade"

    ```bash
    python main.py
    ```

    Continua a funcionar. `main.py` é hoje um atalho de três linhas para o mesmo ponto de entrada.

!!! tip "`0.0.0.0` não é um endereço navegável"
    O servidor liga-se a `0.0.0.0`, o que significa *todas as interfaces de rede*. O endereço a abrir no browser é `http://127.0.0.1:8000`, e é esse que o arranque regista no log.

!!! danger "Não exponha este serviço"
    Não há autenticação em nenhum endpoint, e o serviço **compila e executa código** na máquina onde corre. Qualquer máquina que alcance esta porta pode consumir a sua chave de API e provocar execuções locais.

    Em rede partilhada, limite ao *loopback*:

    ```bash
    .venv/bin/uvicorn codeexpert.api.app:app --host 127.0.0.1 --port 8000
    ```

    O isolamento da execução é a lacuna 4 da [análise de lacunas](../product/gap-analysis.md#execucao-sem-isolamento) e o motivo da [ADR-0004](../adr/0004-execution-behind-a-runner-protocol.md).

## Rotas de entrada

| Rota | O que faz |
| --- | --- |
| `/` | Redireciona (`307`) para `/docs` |
| `/docs` | Swagger UI — interface interativa para todos os endpoints |
| `/redoc` | ReDoc — referência OpenAPI em formato de leitura |
| `/openapi.json` | Esquema OpenAPI em bruto |
| `/health` | Sonda de vida. Não toca em nada externo |

!!! note "`/docs` é o Swagger, não esta documentação"
    O prefixo `/docs` do FastAPI e o diretório `docs/` deste site MkDocs não têm relação nenhuma.

## Confirmar que está pronto

```bash
curl http://127.0.0.1:8000/health    # está de pé?
curl http://127.0.0.1:8000/config    # está configurado?
```

`/health` não faz chamadas externas e serve como sonda. `/config` mostra a configuração efetiva e, com `?verify=true`, confirma também que a chave é aceite pelo fornecedor.

## Diretórios criados em tempo de execução

Nenhum precisa de ser criado à mão, e nenhum entra no Git — `var/` está inteiro no `.gitignore`.

| Diretório | Conteúdo | Ciclo de vida |
| --- | --- | --- |
| `var/runs/<run_id>/` | `statement.json`, `solution.c`, o binário, `inputs.json`, `testcases.json`, `meta.json` | Um por execução. Nunca é limpo automaticamente |
| `var/questions/` | `Moodle_Questionnaire.xml` | Exportações sucessivas **acumulam** questões no mesmo ficheiro |

`make clean` remove ambos. Ver [Workspace de execução](../architecture/cache-and-state.md).

!!! info "Duas gerações em simultâneo não colidem"
    Cada execução tem o seu diretório, identificado pelo `run_id` que a API devolve. É o que permite a várias pessoas — ou a várias janelas — usarem o mesmo servidor ao mesmo tempo.

## Parar

++ctrl+c++ no terminal. Não há processos em segundo plano. Os diretórios em `var/runs/` ficam para inspeção e podem ser descartados a qualquer momento.

## Passo seguinte

O servidor está de pé. Gere a primeira questão em [Gerar uma questão completa](../guides/generate-a-question.md).

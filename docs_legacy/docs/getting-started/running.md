# Executar o servidor

<p class="lead">O servidor arranca de duas formas equivalentes. Depois de arrancar, uma chamada a <code>GET /config</code> confirma que a ligação ao provedor LLM está funcional antes de gastar tempo numa geração.</p>

## Arrancar

=== "Diretamente"

    ```bash
    python main.py
    ```

    `main.py` invoca `uvicorn.run(app, host="0.0.0.0", port=8000)`. Sem *auto-reload*.

=== "Com uvicorn (desenvolvimento)"

    ```bash
    uvicorn main:app --reload --port 8000
    ```

    `--reload` reinicia o processo a cada alteração de ficheiro. É a forma preferível durante o desenvolvimento.

!!! tip "`0.0.0.0` não é um endereço navegável"
    O servidor liga-se a `0.0.0.0`, o que significa *todas as interfaces de rede*. O endereço a abrir no browser é:

    ```text
    http://127.0.0.1:8000
    ```

    `main.py` regista esse URL no arranque, precisamente para evitar a confusão.

!!! warning "Ligar a `0.0.0.0` expõe o serviço na rede local"
    Como não existe qualquer autenticação nos endpoints, qualquer máquina que alcance esta porta pode consumir a sua chave de API. Em máquinas partilhadas ou redes não confiáveis, force a ligação apenas ao *loopback*:

    ```bash
    uvicorn main:app --host 127.0.0.1 --port 8000
    ```

## Rotas de entrada

| Rota | O que faz |
| --- | --- |
| `/` | Redireciona (`307`) para `/docs`. Excluída do esquema OpenAPI |
| `/docs` | Swagger UI — interface interativa para todos os endpoints |
| `/redoc` | ReDoc — referência OpenAPI em formato de leitura |
| `/openapi.json` | Esquema OpenAPI em bruto |

!!! note "`/docs` é o Swagger, não esta documentação"
    O prefixo `/docs` do FastAPI e o diretório `docs/` deste site MkDocs não têm relação. Um é a referência de esquema gerada em tempo de execução; o outro é o material que está a ler.

## Confirmar a configuração

`GET /config` é o *health check* do serviço. Recarrega o ficheiro de configuração **e** faz um pedido real a `GET /v1/models` no provedor, validando a chave:

```bash
curl http://127.0.0.1:8000/config
```

```json
{
  "model": "gpt-4o-mini",
  "api_base_url": "https://api.openai.com/v1",
  "status": "Configuration loaded successfully and API connection verified"
}
```

Uma resposta `200` significa que ficheiro, chave e conectividade estão todos corretos. Qualquer outra coisa está descrita em [Erros da API](../api/errors.md).

!!! info "Chamar `/config` não é obrigatório"
    As etapas de geração usam `Config.get_instance()`, que carrega o ficheiro na primeira utilização. O serviço funciona sem que `/config` seja alguma vez chamado.

    Chamá-lo primeiro é recomendado por duas razões: falha em menos de um segundo em vez de a meio de um pipeline, e é a única forma de aplicar alterações ao ficheiro sem reiniciar o processo.

## Diretórios criados em tempo de execução

Nenhum destes precisa de ser criado à mão — cada serviço faz `os.makedirs(..., exist_ok=True)` antes de escrever.

| Diretório | Conteúdo | Ciclo de vida |
| --- | --- | --- |
| `cache/` | `statement.json`, `solution.c`, o binário compilado, `inputs.json`, `testcases.json` | Limpo no início de cada `POST /create_question` |
| `Questions/` | `Moodle_Questionnaire.xml` | **Nunca limpo.** Exportações sucessivas acumulam questões |

Ver [Cache e estado](../architecture/cache-and-state.md) para o detalhe de como as etapas comunicam através destes ficheiros.

## Parar

++ctrl+c++ no terminal. Não há processos em segundo plano nem estado a persistir — o conteúdo de `cache/` pode ser descartado a qualquer momento.

## Passo seguinte

O servidor está de pé. Gere a primeira questão em [Gerar uma questão completa](../guides/generate-a-question.md).

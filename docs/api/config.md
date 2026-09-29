# `GET /config` e `GET /health`

<p class="lead">Dois endpoints de diagnóstico. Um diz se o serviço está de pé; o outro diz se está configurado, e opcionalmente se a chave é aceite pelo fornecedor.</p>

## `GET /health`

<span class="ce-badge ce-badge--get">GET</span> `/health`

```bash
curl http://127.0.0.1:8000/health
```

<span class="ce-badge">200</span> `HealthResponse`

```json
{ "status": "ok", "version": "0.2.0" }
```

!!! tip "É a sonda, não o diagnóstico"
    `/health` não lê configuração, não toca no disco e não faz chamadas externas — responde `200` mesmo sem chave nenhuma definida. É isso que o torna seguro como sonda de arranque num contentor ou num *load balancer*, e é por isso que não serve para saber se o serviço consegue gerar alguma coisa.

## `GET /config`

<span class="ce-badge ce-badge--get">GET</span> `/config`

```bash
curl http://127.0.0.1:8000/config
```

<span class="ce-badge">200</span> `ConfigResponse`

```json
{
  "model": "gpt-4o-mini",
  "api_base_url": "https://api.openai.com/v1",
  "api_key_configured": true,
  "workspace_root": "var/runs",
  "provider_reachable": null,
  "status": "Configuration loaded."
}
```

| Campo | Significado |
| --- | --- |
| `model` | O modelo que será enviado em cada pedido |
| `api_base_url` | O fornecedor em uso |
| `api_key_configured` | Se `CODEEXPERT_LLM_API_KEY` tem valor. **Nunca a chave** |
| `workspace_root` | Onde ficam os diretórios de execução |
| `provider_reachable` | `null` sem `?verify=true`; `true`/`false` com |
| `status` | Frase legível a resumir o estado |

### Verificar a ligação

```bash
curl "http://127.0.0.1:8000/config?verify=true"
```

Faz um `GET /models` real no fornecedor, o que custa um ida-e-volta e confirma que a chave é aceita:

```json
{
  "...": "...",
  "provider_reachable": true,
  "status": "Configuration loaded and provider reachable."
}
```

### Recarregar sem reiniciar

Cada chamada a `/config` **invalida a configuração em cache**. A resposta dessa chamada ainda mostra os valores que estavam em uso; a chamada seguinte — e qualquer etapa de geração depois dela — já lê o `.env` novo.

Na prática: edite o `.env`, chame `/config` duas vezes, e a segunda resposta confirma o que ficou em vigor.

!!! warning "A recarga afeta um pipeline em curso"
    As etapas seguintes passam a usar o modelo recarregado. Chamar `/config` a meio de uma geração pode trocar o modelo entre a etapa 2 e a etapa 3 — e o `meta.json` fica a registar dois.

!!! info "Não é obrigatório chamá-lo"
    As etapas de geração leem a configuração quando precisam. Chamar `/config` primeiro é recomendado por duas razões: falha em menos de um segundo em vez de a meio de um pipeline de trinta, e é a forma de aplicar alterações sem reiniciar.

## Quando chamar

<div class="grid cards" markdown>

-   :material-check-circle-outline: **Depois de arrancar o servidor**

    ---

    Confirma configuração e — com `?verify=true` — conectividade em cerca de um segundo, em vez de descobrir o problema a meio de um pipeline de trinta.

-   :material-reload: **Depois de editar o `.env`**

    ---

    Cada chamada relê o ambiente, pelo que é a forma de aplicar a alteração sem reiniciar o processo.

-   :material-bug-outline: **Ao diagnosticar falhas de geração**

    ---

    Separa problemas de configuração e de conectividade de problemas de *prompting* ou de compilação.

</div>

## Quando falta configuração

O servidor arranca sem chave — de propósito, para que a documentação e a sonda funcionem:

```json
{
  "api_key_configured": false,
  "status": "CODEEXPERT_LLM_API_KEY is not set — generation endpoints will fail."
}
```

`/config` continua a devolver `200`: a pergunta "estás configurado?" foi respondida com sucesso, e a resposta é "não". É uma etapa de geração que devolverá `503`.

## Erros

| Situação | Estado |
| --- | --- |
| Chave ausente | `200`, com `api_key_configured: false` |
| `?verify=true` e fornecedor inalcançável | `200`, com `provider_reachable: false` e o motivo em `status` |
| Chave presente mas rejeitada | `200`, com `provider_reachable: false` |

Este endpoint **não** falha por causa da configuração — reporta-a. Os erros de geração estão em [Erros](errors.md).

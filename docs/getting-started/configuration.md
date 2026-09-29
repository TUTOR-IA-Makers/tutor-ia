# Configuração

<p class="lead">Toda a configuração vem de variáveis de ambiente com o prefixo <code>CODEEXPERT_</code>, lidas por um único modelo em <code>src/codeexpert/settings.py</code>. Em desenvolvimento, um ficheiro <code>.env</code> não versionado fornece-as.</p>

## O ficheiro `.env`

`make setup` cria-o a partir de `.env.example`. Preencha a chave:

```bash title=".env"
CODEEXPERT_LLM_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX
CODEEXPERT_LLM_MODEL=gpt-4o-mini
```

!!! danger "`.env` nunca entra no repositório"
    Está no `.gitignore`, e `make check` recusa uma árvore de trabalho que contenha algo com a forma de uma chave de fornecedor. `.env.example` é o que está versionado, e só tem valores fictícios.

    Se uma chave for alguma vez enviada para o repositório: **rode a chave primeiro**, reescreva o histórico depois. Por essa ordem — reescrever histórico demora minutos, e a chave está exposta esse tempo todo.

## Variáveis

| Variável | Omissão | O que controla |
| --- | --- | --- |
| `CODEEXPERT_LLM_API_KEY` | *(nenhuma)* | A chave. Sem ela o servidor arranca, mas as etapas de geração devolvem `503` |
| `CODEEXPERT_LLM_MODEL` | `gpt-4o-mini` | O campo `model` de cada pedido |
| `CODEEXPERT_LLM_BASE_URL` | `https://api.openai.com/v1` | O fornecedor. Qualquer API compatível com *chat completions* serve |
| `CODEEXPERT_LLM_TIMEOUT_SECONDS` | `60` | Tempo limite por chamada ao modelo |
| `CODEEXPERT_LLM_MAX_RETRIES` | `3` | Tentativas em falhas transitórias (429, 5xx, rede) |
| `CODEEXPERT_WORKSPACE_ROOT` | `var/runs` | Onde vivem os artefactos de cada execução |
| `CODEEXPERT_QUESTIONS_DIR` | `var/questions` | Onde é escrito o XML |
| `CODEEXPERT_COMPILE_TIMEOUT_SECONDS` | `20` | Tempo limite da compilação |
| `CODEEXPERT_RUN_TIMEOUT_SECONDS` | `5` | Tempo limite de **cada** execução do binário |
| `CODEEXPERT_RUN_MAX_OUTPUT_BYTES` | `65536` | Limite do `stdout` capturado por caso de teste |

As variáveis do ambiente real têm precedência sobre o `.env`, que é o que permite ao CI e a um contentor configurarem o serviço sem ficheiro nenhum.

!!! warning "Uma variável mal escrita é silenciosamente ignorada"
    O modelo aceita variáveis desconhecidas sem se queixar, para não rebentar com ambientes que tenham outras coisas definidas. A consequência é que `CODEEXPERT_LLM_MODELO=...` não faz nada e não avisa.

    É por isso que `GET /config` devolve os valores efetivamente em uso — é a forma de confirmar que o que escreveu chegou lá.

## Trocar de fornecedor

Qualquer serviço que exponha `/chat/completions` no formato da OpenAI funciona sem alterar código:

```bash title=".env — Ollama local"
CODEEXPERT_LLM_BASE_URL=http://127.0.0.1:11434/v1
CODEEXPERT_LLM_MODEL=qwen2.5-coder
CODEEXPERT_LLM_API_KEY=nao-usada-mas-obrigatoria
```

Ver [Integração com o LLM](../architecture/llm-integration.md#trocar-de-provedor).

## A chave nunca sai

`llm_api_key` é um `SecretStr`. Não aparece em logs, nem no `repr` das definições, nem em nenhuma resposta da API — incluindo `GET /config`, que só diz se está presente. Há um teste que o garante; mantenha-o assim.

## Verificar

```bash
curl http://127.0.0.1:8000/config
```

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

Para confirmar também que a chave funciona — o que custa uma chamada ao fornecedor:

```bash
curl "http://127.0.0.1:8000/config?verify=true"
```

`GET /config` invalida a configuração em cache a cada chamada, pelo que alterar o `.env` e chamá-lo aplica a mudança sem reiniciar o processo. A resposta dessa primeira chamada ainda traz os valores antigos — é a segunda que confirma os novos.

## Erros de configuração

| Situação | Resposta |
| --- | --- |
| Chave ausente, ao chamar uma etapa de geração | `503`, com o nome da variável em falta |
| Chave presente mas rejeitada pelo fornecedor | `502`, com o estado devolvido |
| Fornecedor inalcançável | `502`, após as tentativas configuradas |

Detalhe em [Erros da API](../api/errors.md).

## Migrar de `config/LLM_Config.txt`

O formato antigo — `Modelo:` e `Path KEY:` num ficheiro versionado — foi removido. A conversão é direta:

| Antes | Agora |
| --- | --- |
| `Modelo: gpt-4o-mini` | `CODEEXPERT_LLM_MODEL=gpt-4o-mini` |
| `Path KEY: /caminho/chave.txt` | `CODEEXPERT_LLM_API_KEY=` + o conteúdo desse ficheiro |
| `Fornecedor: OpenAI` | Não tinha efeito nenhum; não tem equivalente |

O porquê está em [ADR-0007](../adr/0007-configuration-from-the-environment.md).

## Passo seguinte

Com a chave no sítio, avance para [Executar o servidor](running.md).

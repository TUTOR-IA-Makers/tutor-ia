# CodeExpert

Serviço FastAPI que gera exercícios de programação em C — enunciado, solução de referência, entradas e casos de teste — e exporta como XML para o Moodle CodeRunner.

As saídas esperadas não são geradas por um modelo de linguagem: a solução é compilada com `gcc` e executada com cada entrada, e o `stdout` real torna-se a saída esperada.

> **Protótipo.** Este repositório implementa o EPIC-017 (geração de questões com IA), que está na Onda 3 e fora do MVP da plataforma. Não tem autenticação, base de dados nem sandbox. Ver a documentação para o enquadramento e as lacunas conhecidas.

## Requisitos

- Python 3.13
- `gcc` no `PATH`
- Uma chave de API OpenAI guardada num ficheiro local

## Arranque rápido

```bash
uv venv
uv pip install fastapi uvicorn requests pydantic
```

Aponte `config/LLM_Config.txt` para o ficheiro da sua chave:

```text
Modelo: gpt-4o-mini
Path KEY: /caminho/para/a/sua/chave.txt
```

```bash
python main.py
```

O servidor fica em `http://127.0.0.1:8000`; a raiz redireciona para o Swagger UI.

```bash
curl -X POST http://127.0.0.1:8000/create_question \
  -H "Content-Type: application/json" \
  -d '{"statement_request": {"difficulty": "facil"}, "input_request": {"qty": 10}}'
```

O resultado fica em `Questions/Moodle_Questionnaire.xml`.

> **Reveja antes de usar com alunos.** O protótipo não verifica se a solução gerada respeitou as restrições pedidas, e o XML declara todas as questões como `Revisado` sem que nenhuma revisão tenha ocorrido.

## Documentação

A documentação completa está em `docs/`, construída com MkDocs Material — arquitetura, referência da API, guias, contexto do produto e análise de lacunas.

```bash
pip install -r requirements-docs.txt
mkdocs serve -a 127.0.0.1:8001
```

## Publicar a documentação

O site usa MkDocs Material e precisa de ser construído antes da publicação.
No GitHub, em **Settings → Pages → Build and deployment → Source**, selecione
**GitHub Actions**. O workflow `.github/workflows/docs.yml` constrói o site
e publica o conteúdo de `.dist/site` a cada push em `main` ou `docs`.
Se usar a branch `docs`, permita também essa branch no ambiente `github-pages`,
em **Settings → Environments**, caso haja restrições de publicação.

Acompanhe a execução **Documentation** na aba **Actions** e abra
<https://hugorosa29.github.io/coderunner_v2/> quando terminar.
Publicar apenas a pasta `docs/` não gera o tema Material.

## Licença

MIT — ver [LICENSE](LICENSE).

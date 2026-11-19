# Importar no Moodle

<p class="lead">O arquivo gerado é um XML de perguntas no formato nativo do Moodle, com questões do tipo CodeRunner <code>c_program</code>. Esta página cobre a importação, o que cada questão contém e o que conferir antes de usar com alunos.</p>

<span class="ce-badge ce-status--done">Implementado</span> Exportação de uma questão por vez: a etapa 5 devolve o XML na resposta, sem gravar arquivo no servidor. Download pela interface, exportação de várias questões num XML só e exportação só de questões aprovadas estão <span class="ce-badge ce-status--planned">Planejados</span> ([Roadmap](../product/roadmap.md#revisao-e-aprovacao)).

## Pré-requisito

O plugin **CodeRunner** precisa estar instalado no Moodle de destino. Sem ele, a importação falha com "tipo de questão desconhecido".

## Obter o XML

A etapa 5 devolve o XML da questão no campo `xml`. Ela pode ser chamada de novo a qualquer momento para uma questão já gerada — inclusive uma gerada por `POST /api/v1/questions` — e devolve o mesmo XML:

```bash
API=http://127.0.0.1:8000
curl -s -X POST $API/export_moodle_xml_question -H "Content-Type: application/json" \
  -d '{"run_id": "<run_id>"}' | jq -r .xml > questao.xml
```

Cada XML contém uma questão só, numerada 1. Para montar uma lista com várias, importe um arquivo por questão; um XML com uma seleção inteira é o G1-6 (<span class="ce-badge ce-status--planned">Planejado</span>).

## Importar

1. No curso: **Banco de questões → Importar**.
2. Formato: **Formato Moodle XML**.
3. Envie `questao.xml`.
4. **Importar**. O Moodle lista os títulos das questões importadas.

Para validar o XML antes de enviar:

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('questao.xml'); print('XML válido')"
grep -c '<question type="coderunner"' questao.xml    # quantas questões
```

## O que cada questão contém

| Campo | Valor | Origem |
| --- | --- | --- |
| `name` | Título do exercício | Primeira linha do enunciado gerado |
| `questiontext` | Enunciado, com `\n` convertido em `<br>` | `statement.json` |
| `coderunnertype` | `c_program` | Fixo no exportador |
| `answer` | Solução de referência | `solution.c` |
| `testcases` | Um por entrada | `testcases.json` |
| `tags` | `Gerado por IA`, a dificuldade pedida, `Nao revisado` | `meta.json` |
| `defaultgrade` `1`, `penalty` `0`, `allornothing` `0`, `answerboxlines` `18`, `validateonsave` `1` | Fixos | `export/templates/question.xml` |

**Casos de teste:** os **três primeiros** são marcados como exemplo (`useasexample="1"`) e aparecem para o aluno; os demais ficam ocultos. A escolha é pela ordem em que o modelo devolveu as entradas, não por critério pedagógico. Para mudar quais aparecem, reordene `var/runs/<run_id>/testcases.json` antes de exportar.

A etiqueta `Nao revisado` é literal: não existe fluxo de aprovação. Ela só vira `Revisado` quando `meta.json` tiver `reviewed: true`, e nada no serviço altera esse campo hoje.

## Antes de usar com alunos

- [ ] O enunciado não é ambíguo e o formato de entrada corresponde ao que a solução lê.
- [ ] A solução respeita as restrições pedidas (ex.: sem `for` numa questão sem repetição).
- [ ] A solução é determinística — sem `rand()`, `srand(time(NULL))`, `clock()` ou endereço de ponteiro impresso.
- [ ] Nenhuma saída esperada está vazia.
- [ ] Os três primeiros casos são bons exemplos.
- [ ] Ao salvar a questão no Moodle, a validação (`validateonsave`) passa.

| Problema no Moodle | Causa |
| --- | --- |
| "Tipo de questão desconhecido" | Plugin CodeRunner ausente |
| XML malformado | Não deveria acontecer (entradas e saídas são escapadas). Guarde o arquivo e abra uma issue |
| Questão sem casos de teste | `testcases.json` estava vazio na exportação |
| Nenhuma submissão passa, nem a resposta de referência | Solução não determinística, ou saídas esperadas vazias |

Detalhe do template e das substituições em [Pipeline § Exportação](../architecture/pipeline.md#5-exportacao-moodle-xml).

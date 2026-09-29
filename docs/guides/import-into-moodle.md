# Importar no Moodle

<p class="lead">O ficheiro gerado é um XML de questões Moodle no formato nativo, com questões do tipo <code>coderunner</code>. Este guia cobre o que o ficheiro contém, como o importar e o que verificar antes de o usar com alunos.</p>

## Pré-requisito no Moodle

O plugin **CodeRunner** tem de estar instalado no Moodle de destino. Sem ele, a importação falha ao encontrar `<question type="coderunner">` — o Moodle não reconhece o tipo.

O tipo de questão usado é `c_program`, o protótipo do CodeRunner para programas C completos que leem de `stdin` e escrevem em `stdout`.

## Importar

1. No curso: **Banco de perguntas → Importar**
2. Formato de ficheiro: **Formato XML do Moodle**
3. Carregue `var/questions/Moodle_Questionnaire.xml`
4. **Importar**

O Moodle mostra os nomes das questões importadas — os títulos gerados na etapa do enunciado.

## O que cada questão contém

| Campo | Valor gerado | Origem |
| --- | --- | --- |
| `name` | Título do exercício | Primeira linha de `statement.json` da execução |
| `questiontext` | Enunciado em HTML | Texto escapado, com `\n` convertido em `<br>` |
| `coderunnertype` | `c_program` | Fixo no exportador |
| `answer` | Solução de referência em C | `solution.c` da execução |
| `testcases` | Um por entrada gerada | `testcases.json` da execução |
| `defaultgrade` | `1` | Fixo no template |
| `penalty` | `0` | Fixo no template |
| `allornothing` | `0` | Fixo — pontuação parcial por caso de teste |
| `answerboxlines` | `18` | Fixo no template |
| `validateonsave` | `1` | O Moodle valida a resposta de referência ao gravar |

### Casos de teste

Cada caso tem `mark="1.0000000"`, `testtype="0"` e `hiderestiffail="0"`.

!!! info "Os três primeiros casos são exemplos visíveis"
    O exportador marca `useasexample="1"` nos **primeiros três** casos de teste e `"0"` em todos os restantes. Os três primeiros aparecem ao aluno como exemplos de entrada/saída; os outros ficam escondidos e servem para avaliação.

    A ordem é a ordem em que o modelo devolveu as entradas — não há qualquer critério de qualidade na escolha. Se os três primeiros forem casos-limite pouco ilustrativos, reordene `var/runs/<run_id>/testcases.json` antes de exportar.

## Verificações antes de usar com alunos

!!! danger "Nenhuma destas questões foi revista por ninguém"
    As questões exportadas chegam ao Moodle com as etiquetas `Gerado por IA`, a dificuldade que foi efetivamente pedida, e `Nao revisado`.

    A última é literal: o portão de aprovação humana que o EPIC-017 exige ainda não existe. A etiqueta só passa a `Revisado` quando o `meta.json` da execução tiver `reviewed: true`, e hoje nada o define. Ver [análise de lacunas](../product/gap-analysis.md#o-portao-humano-nao-existe).

    Até esta versão, o template afirmava o contrário: `Fácil` e `Revisado` estavam fixos no ficheiro, em todas as questões, de qualquer dificuldade.

Uma lista curta do que confirmar em cada questão importada:

- [ ] O **enunciado** descreve o exercício sem ambiguidade e o formato de entrada corresponde ao que a solução lê.
- [ ] A **resposta de referência** compila no sandbox do Moodle. Com `validateonsave=1`, gravar a questão testa isto.
- [ ] Os **três primeiros casos de teste** são exemplos representativos.
- [ ] Nenhuma saída esperada está **vazia** — quase sempre sinal de entrada mal formada.
- [ ] As **etiquetas** refletem a dificuldade real, e ninguém confundiu `Nao revisado` com revisado.
- [ ] O programa é **determinístico**.

!!! warning "Programas não determinísticos produzem questões impossíveis"
    Se a solução gerada usar `rand()`, `srand(time(NULL))`, ponteiros impressos ou qualquer outra fonte de variação, a saída capturada no momento da geração não se repete na execução do aluno. Nenhuma submissão passa, incluindo a própria resposta de referência.

    Isto não é hipotético: um pedido para um "jogo de adivinhação" leva o modelo a gerar exatamente esse padrão. Verifique antes de importar:

    ```bash
    grep -nE "rand\(|srand\(|time\(NULL\)|clock\(" var/runs/<run_id>/solution.c
    ```

    Se houver correspondências, descarte a questão ou reescreva a solução para ser determinística.

## Acumular várias questões

O exportador insere cada nova questão antes de `</quiz>`, pelo que um único ficheiro pode conter um questionário inteiro:

```bash
# Três questões de dificuldade crescente no mesmo ficheiro
for d in "muito facil" "facil" "medio"; do
  curl -s -X POST http://127.0.0.1:8000/create_question \
    -H "Content-Type: application/json" \
    -d "{\"statement_request\": {\"difficulty\": \"$d\"}, \"qty\": 5}" \
    | jq -r '"\(.export.question_count)  \(.statement.name)"'
done
```

Cada resposta traz `question_count`, que é a posição da questão no ficheiro. Para confirmar o total:

```bash
grep -c "<question type=" var/questions/Moodle_Questionnaire.xml   # 3
```

Para começar um ficheiro novo:

```bash
rm var/questions/Moodle_Questionnaire.xml
```

## Passo seguinte

Para perceber como o XML é construído e o que pode ser personalizado nos templates, veja [Templates Moodle XML](../architecture/moodle-xml.md).

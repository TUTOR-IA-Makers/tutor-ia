# Importar no Moodle

<p class="lead">O ficheiro gerado é um XML de questões Moodle no formato nativo, com questões do tipo <code>coderunner</code>. Este guia cobre o que o ficheiro contém, como o importar e o que verificar antes de o usar com alunos.</p>

## Pré-requisito no Moodle

O plugin **CodeRunner** tem de estar instalado no Moodle de destino. Sem ele, a importação falha ao encontrar `<question type="coderunner">` — o Moodle não reconhece o tipo.

O tipo de questão usado é `c_program`, o protótipo do CodeRunner para programas C completos que leem de `stdin` e escrevem em `stdout`.

## Importar

1. No curso: **Banco de perguntas → Importar**
2. Formato de ficheiro: **Formato XML do Moodle**
3. Carregue `Questions/Moodle_Questionnaire.xml`
4. **Importar**

O Moodle mostra os nomes das questões importadas — os títulos gerados na etapa do enunciado.

## O que cada questão contém

| Campo | Valor gerado | Origem |
| --- | --- | --- |
| `name` | Título do exercício | Primeira linha de `cache/statement.json` |
| `questiontext` | Enunciado em HTML | Texto escapado, com `\n` convertido em `<br>` |
| `coderunnertype` | `c_program` | Fixo no exportador |
| `answer` | Solução de referência em C | `cache/solution.c` |
| `testcases` | Um por entrada gerada | `cache/testcases.json` |
| `defaultgrade` | `1` | Fixo no template |
| `penalty` | `0` | Fixo no template |
| `allornothing` | `0` | Fixo — pontuação parcial por caso de teste |
| `answerboxlines` | `18` | Fixo no template |
| `validateonsave` | `1` | O Moodle valida a resposta de referência ao gravar |

### Casos de teste

Cada caso tem `mark="1.0000000"`, `testtype="0"` e `hiderestiffail="0"`.

!!! info "Os três primeiros casos são exemplos visíveis"
    O exportador marca `useasexample="1"` nos **primeiros três** casos de teste e `"0"` em todos os restantes. Os três primeiros aparecem ao aluno como exemplos de entrada/saída; os outros ficam escondidos e servem para avaliação.

    A ordem é a ordem em que o modelo devolveu as entradas — não há qualquer critério de qualidade na escolha. Se os três primeiros forem casos-limite pouco ilustrativos, reordene `cache/testcases.json` antes de exportar.

## Verificações antes de usar com alunos

!!! danger "As tags estão fixas no template"
    Todas as questões exportadas recebem as tags `Fácil` e `Revisado`, **independentemente da dificuldade pedida** em `difficulty` e sem que qualquer revisão humana tenha ocorrido.

    Uma questão gerada com `difficulty: "muito dificil"` chega ao Moodle marcada como `Fácil` e `Revisado`. Corrija as tags após a importação, ou edite `templates/MoodleXML_Question.txt`.

Uma lista curta do que confirmar em cada questão importada:

- [ ] O **enunciado** descreve o exercício sem ambiguidade e o formato de entrada corresponde ao que a solução lê.
- [ ] A **resposta de referência** compila no sandbox do Moodle. Com `validateonsave=1`, gravar a questão testa isto.
- [ ] Os **três primeiros casos de teste** são exemplos representativos.
- [ ] Nenhuma saída esperada está **vazia** — quase sempre sinal de entrada mal formada.
- [ ] As **tags** refletem a dificuldade real.
- [ ] O programa é **determinístico**.

!!! warning "Programas não determinísticos produzem questões impossíveis"
    Se a solução gerada usar `rand()`, `srand(time(NULL))`, ponteiros impressos ou qualquer outra fonte de variação, a saída capturada no momento da geração não se repete na execução do aluno. Nenhuma submissão passa, incluindo a própria resposta de referência.

    Isto não é hipotético: um pedido para um "jogo de adivinhação" leva o modelo a gerar exatamente esse padrão. Verifique antes de importar:

    ```bash
    grep -nE "rand\(|srand\(|time\(NULL\)|clock\(" cache/solution.c
    ```

    Se houver correspondências, descarte a questão ou reescreva a solução para ser determinística.

## Acumular várias questões

O exportador insere cada nova questão antes de `</quiz>`, pelo que um único ficheiro pode conter um questionário inteiro:

```bash
# Três questões de dificuldade crescente no mesmo ficheiro
for d in "muito facil" "facil" "medio"; do
  curl -s -X POST http://127.0.0.1:8000/create_question \
    -H "Content-Type: application/json" \
    -d "{\"statement_request\": {\"difficulty\": \"$d\"}, \"input_request\": {\"qty\": 5}}" \
    > /dev/null
done

grep -c "<question type=" Questions/Moodle_Questionnaire.xml   # 3
```

!!! note "Todas as questões ficam numeradas como `1`"
    O comentário `<!-- question: 1 -->` é escrito com o valor fixo `1` em cada questão. É apenas um comentário XML e não afeta a importação, mas torna o ficheiro confuso de ler. Ver [Templates Moodle XML](../architecture/moodle-xml.md#limitacoes-conhecidas).

Para começar um ficheiro novo:

```bash
rm Questions/Moodle_Questionnaire.xml
```

## Passo seguinte

Para perceber como o XML é construído e o que pode ser personalizado nos templates, veja [Templates Moodle XML](../architecture/moodle-xml.md).

# data/catalog/

Acervo de questões de referência para geração ancorada (G6-2).

## Estrutura de Diretórios

O catálogo é dividido entre os **arquivos-fonte fatiados em JSON** (`index/`) e as **pastas individuais de execução e validação** (`questions/`):

```text
data/catalog/
├── index/                      # Fonte da verdade (edição manual)
│   └── e<N>/
│       └── e<N>_<NIVEL>.json   # Definição das questões por eixo e nível (ex.: e1_MF.json)
└── questions/                  # Pastas desempacotadas (geradas via script)
    └── e<N>/
        └── E<N>-<NIVEL>-<ID>/
            ├── enunciado.md    # Enunciado extraído do JSON
            ├── meta.yaml       # Metadados (eixo, nível, estruturas, origem, direitos_restritos)
            ├── solucao.c       # Solução de referência em C extraída do JSON
            ├── entradas/       # Casos de teste de entrada (*.in)
            └── saidas/         # Saídas esperadas (*.out) geradas e validadas via gcc
```

* **`index/`** é a fonte da verdade: as questões são cadastradas e editadas à mão nesses JSON, um arquivo por eixo × nível.
* **`questions/`** é derivado de `index/` por `scripts/build_catalog.py`, que apaga e recria a pasta inteira. Existe para que cada solução possa ser aberta, compilada e lida isoladamente. **Não edite `questions/` à mão:** o validador falha se a pasta não for exatamente o que o build gera a partir de `index/`.

## Fluxo de edição

1. Edite o JSON em `index/`. Em caso de teste novo, deixe `"saida": ""`.
2. `make catalog-regenerate` compila cada solução, grava em `index/` a saída real de cada caso e reconstrói `questions/`. **Revise o diff**: ele aceita o que a solução imprimir, inclusive um bug.
3. `make catalog` confere sem escrever nada. Ele também roda no `make check` (e, portanto, no CI).

## O que o validador confere

`scripts/validate_catalog.py` falha (código de saída 1) quando:

* um arquivo de `index/` ou uma questão foge do schema abaixo: campo ausente ou com tipo errado, `id` fora do padrão `E<N>-<NIVEL>-NNN`, eixo ou nível diferentes dos do arquivo, `estruturas` fora do vocabulário de `CStructure`, `origem` vazia, `total` errado, `id` duplicado;
* uma solução não compila, termina com erro ou estoura o tempo em algum caso;
* uma `saida` registrada difere do que a solução imprime de fato (regra 4 do AGENTS.md);
* `questions/` não bate byte a byte com o que `build_catalog.py` gera;
* alguma combinação eixo × nível de E1 e E2 tem menos de 8 questões.

As soluções são compiladas com as mesmas flags do `LocalGccRunner` da plataforma (`-std=c11 -Wall -Wextra -O1`), mais `-lm`, porque o CodeRunner do Moodle também linka a biblioteca matemática. Sem `gcc` no PATH, o `make check` local pula esta etapa; no CI, a falta do compilador reprova.

## Regras

* **Direitos restritos:** `direitos_restritos: true` quando a origem não permite redistribuição ou obra derivada, ou quando há dúvida. O campo é obrigatório. Pela G6-2, uma questão restrita não pode ser servida a outra instituição; **essa restrição ainda não é aplicada por código** (planejado para a importação no banco, G6-3).
* **Casos de teste:** os valores de `saida` vêm de compilar e rodar a `solucao_referencia`, nunca de predição de modelo (regra 4 do AGENTS.md).

## Schema dos arquivos e das questões

Cada arquivo segue a estrutura de envelope abaixo:

```json
{
  "eixo": "E1",
  "nivel": "MF",
  "total": 8,
  "questoes": [
    {
      "id": "E1-MF-001",
      "eixo": "E1",
      "nivel": "MF",
      "estruturas": [],
      "origem": "Fonte ou autoria",
      "direitos_restritos": false,
      "path": "questions/e1/E1-MF-001",
      "enunciado": "Enunciado em Markdown...",
      "solucao_referencia": "#include <stdio.h>\n...",
      "casos_teste": [
        {
          "entrada": "2 3\n",
          "saida": "5\n"
        }
      ]
    }
  ]
}
```

### Valores válidos

| Campo | Valores aceitos | 
| ----- | ----- | 
| `eixo` | `E1` (fundamentos), `E2` (controle de fluxo), `E3` (estruturas de dados e ponteiros), `E4` (modularização) | 
| `nivel` | `MF` (muito fácil), `F` (fácil), `M` (médio), `D` (difícil), `MD` (muito difícil) | 
| `estruturas` | `if`, `else`, `ternario`, `switch`, `for`, `while`, `do-while`, `break`, `continue`, `goto`, `vetor`, `matriz`, `string`, `struct`, `typedef`, `enum`, `ponteiro`, `alocacao dinamica`, `funcao`, `passagem por referencia`, `recursao`, `arquivos`, `math.h`, `string.h`, `stdlib.h` | 

Consulte `backend/src/codeexpert/domain.py` para a lista autoritativa.

## Bibliografia

* BEECROWD. **Plataforma de programação competitiva e ensino**. [S. l.]: Beecrowd, [202-]. Disponível em: https://www.beecrowd.com.br. Acesso em: 22 nov. 2026.

* DAMAS, Luís. **Linguagem C**. 10. ed. Rio de Janeiro: LTC, 2007.

* LOPES, Anita; GARCIA, Guto. **Introdução à programação**: 500 algoritmos resolvidos. Rio de Janeiro: Elsevier; Campus, 2002.

* SALES, André Barros de; DEL ESPOSTE, Arthur de Moura. **Linguagem C**: aprendendo com exercícios resolvidos. Organização: Márcia Barros de Sales. Florianópolis: Departamento de Ciências da Administração / UFSC, 2017. v. 2. (Coleção Introdução à Linguagem C). Disponível em: http://repositorio.unb.br/handle/10482/25306. Acesso em: 21 nov. 2026.

* SOFFNER, Renato. **Algoritmos e programação em linguagem C**. São Paulo: Saraiva, 2013.

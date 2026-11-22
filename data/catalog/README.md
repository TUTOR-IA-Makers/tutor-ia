# data/catalog/

Acervo de questões de referência para geração ancorada (G6-2).

## Estrutura de Diretórios

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

* **`index/`**: diretório autoritativo onde as questões são cadastradas e mantidas em arquivos JSON fatiados por eixo e faixa de dificuldade (e<N>_<NIVEL>.json).

* **`questions/`**: estrutura materializada a partir dos JSONs de index/ para permitir a compilação isolada do solucao.c e a execução automatizada dos casos de teste pelo validador. Não edite diretamente — rode python scripts/build_catalog.py para regenerar a partir de index/.

## Regras

* **Organização por eixo e nível:** um objeto JSON por arquivo no padrão `e<N>_<NIVEL>.json` (ex.: `e1_MF.json`, `e1_F.json`, `e2_MF.json`, …).

* **Build e validação obrigatória:** após adicionar ou editar questões em `index/`, execute `cd scripts && python build_catalog.py` para materializar as pastas em `questions/` e, em seguida, `python validate_catalog.py` antes de qualquer commit neste diretório. A validação falha se faltarem arquivos essenciais, se o código C não compilar, se houver dessincronia entre `index/` e `questions/` ou se a cobertura mínima (≥ 8 por eixo × nível) ainda não foi atingida.

* **Direitos restritos:** se `direitos_restritos = true`, a questão não pode ser exportada para outra instituição. O campo é obrigatório; omiti-lo é erro de validação.

* **Casos de teste:** os valores de `saida` devem vir de compilar e rodar a `solucao_referencia`, nunca de predição de modelo (regra 4 do AGENTS.md).

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

Consulte `src/codeexpert/domain.py` para a lista autoritativa.

## Bibliografia

* BEECROWD. **Plataforma de programação competitiva e ensino**. [S. l.]: Beecrowd, [202-]. Disponível em: https://www.beecrowd.com.br. Acesso em: 22 nov. 2026.

* DAMAS, Luís. **Linguagem C**. 10. ed. Rio de Janeiro: LTC, 2007.

* LOPES, Anita; GARCIA, Guto. **Introdução à programação**: 500 algoritmos resolvidos. Rio de Janeiro: Elsevier; Campus, 2002.

* SALES, André Barros de; DEL ESPOSTE, Arthur de Moura. **Linguagem C**: aprendendo com exercícios resolvidos. Organização: Márcia Barros de Sales. Florianópolis: Departamento de Ciências da Administração / UFSC, 2017. v. 2. (Coleção Introdução à Linguagem C). Disponível em: http://repositorio.unb.br/handle/10482/25306. Acesso em: 21 nov. 2026.

* SOFFNER, Renato. **Algoritmos e programação em linguagem C**. São Paulo: Saraiva, 2013.

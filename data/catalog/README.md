# data/catalog/

Acervo de questões de referência para geração ancorada (G6-2).

## Regras

- **Formato único:** uma lista JSON por arquivo (`e1.json`, `e2.json`, …).
- **Validação obrigatória:** execute `python scripts/validate_catalog.py` antes de qualquer commit neste diretório. O script falha se faltar campo obrigatório, se um valor estiver fora do vocabulário fechado ou se a cobertura mínima (≥ 8 por eixo × nível) ainda não foi atingida.
- **Direitos restritos:** se `direitos_restritos = true`, a questão não pode ser exportada para outra instituição. O campo é obrigatório; omiti-lo é erro de validação.
- **Casos de teste:** os valores de `output` devem vir de compilar e rodar a `solucao_referencia`, nunca de predição de modelo (regra 4 do AGENTS.md).

## Schema de cada questão

```json
{
  "id":                   "E1-MF-001",
  "eixo":                 "fundamentos",
  "nivel":                "muito facil",
  "estruturas":           [],
  "enunciado":            "Enunciado em Markdown...",
  "solucao_referencia":   "#include <stdio.h>\n...",
  "casos_teste":          [{"input": "2 3\n", "output": "5\n"}],
  "origem":               "Fonte ou autoria",
  "direitos_restritos":   false
}
```

### Valores válidos

| Campo | Valores aceitos |
|---|---|
| `eixo` | `fundamentos`, `controle de fluxo`, `estruturas de dados e ponteiros`, `modularizacao` |
| `nivel` | `muito facil`, `facil`, `medio`, `dificil`, `muito dificil` |
| `estruturas` | `if`, `else`, `for`, `while`, `do-while`, `switch`, `vetor`, `matriz`, `string`, `struct`, `ponteiro`, `funcao`, `recursao` |

Consulte `src/codeexpert/domain.py` para a lista autoritativa.


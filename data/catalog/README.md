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
| `estruturas` | `if`, `else`, `ternario`, `switch`, `for`, `while`, `do-while`, `break`, `continue`, `goto`, `vetor`, `matriz`, `string`, `struct`, `typedef`, `enum`, `ponteiro`, `alocacao dinamica`, `funcao`, `passagem por referencia`, `recursao`, `arquivos`, `math.h`, `string.h`, `stdlib.h` |
Consulte `src/codeexpert/domain.py` para a lista autoritativa.

## Bibliografia

- LOPES, Anita; GARCIA, Guto. **Introdução à programação**: 500 algoritmos resolvidos. Rio de Janeiro: Elsevier; Campus, 2002.
- SALES, André Barros de; DEL ESPOSTE, Arthur de Moura. **Linguagem C**: aprendendo com exercícios resolvidos. Organização: Márcia Barros de Sales. Florianópolis: Departamento de Ciências da Administração / UFSC, 2017. v. 2. (Coleção Introdução à Linguagem C). Disponível em: http://repositorio.unb.br/handle/10482/25306. Acesso em: 21 nov. 2026.

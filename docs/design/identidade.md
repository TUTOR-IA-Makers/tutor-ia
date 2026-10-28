# Identidade visual e princípios de UX

<p class="lead">Como o CodeExpert se apresenta para o professor: nome, logo, cores, tipografia, espaçamento, movimento e os princípios de experiência que guiam as telas. Os valores oficiais vivem em <code>frontend/src/styles/tokens.css</code>; esta página mostra e justifica esses valores. Se as duas divergirem, o arquivo de tokens vale e esta página é corrigida no mesmo PR.</p>

<span class="ce-badge ce-status--done">Implementado</span> Tokens, fontes, logo vetorizada e as telas da seção 12, com dados simulados. A integração com a API real está <span class="ce-badge ce-status--planned">Planejada</span> ([Roadmap](../product/roadmap.md)).

<div class="ce-id-hero"><div class="ce-id-hero__logo"><img src="../marca/logo.svg" alt="Logo do CodeExpert">CodeExpert</div><div><div class="ce-id-strip"><span style="background:#243C8C;flex:30"></span><span style="background:#1B2F6E;flex:8"></span><span style="background:#E8ECF7;flex:8"></span><span style="background:#1B7A70;flex:24"></span><span style="background:#12635A;flex:8"></span><span style="background:#E3F2EF;flex:8"></span><span style="background:#F5F7FA;flex:6"></span><span style="background:#14161A;flex:8"></span></div><p class="ce-id-hero__caption">Proporção aproximada de uso: azul domina a navegação, verde-azulado marca o que foi concluído, o resto é base neutra.</p></div></div>

## 1. Propósito e público

**O produto em uma frase:** o CodeExpert gera exercícios de programação em C com enunciado, solução e casos de teste verificados por execução real, prontos para importar no Aprender3 (Moodle).

**Público principal:** professores de Algoritmos e Programação de Computadores que já usam o Aprender3 todo semestre e não querem abrir terminal.

<div class="grid cards" markdown>

-   **O que a identidade comunica**

    ---

    - **Confiança:** a questão foi verificada, não apenas gerada.
    - **Familiaridade:** o professor reconhece o ambiente acadêmico que já usa.
    - **Clareza:** cada tela mostra em que ponto a questão está e o que fazer a seguir.

-   **O que a identidade evita**

    ---

    - Produto genérico "feito por IA": gradientes decorativos, vidro fosco, brilhos, ícone de faíscas para gerar, cards idênticos com sombra difusa.
    - Cópia do visual do Aprender3 ou da marca da UnB. As cores são da mesma família, nunca idênticas.
    - Ferramenta de desenvolvedor intimidante: terminal e jargão técnico na interface principal.

</div>

## 2. Nome

| Item | Valor |
|---|---|
| Nome oficial | **CodeExpert** |
| Grafia correta | uma palavra, C e E maiúsculos |
| Grafias proibidas | Code Expert, Codeexpert, codeexpert, CODEEXPERT, Code-Expert |
| Onde aparece | README, este site, `<title>` das páginas, logo, landing, slides de sprint |

**Por que este nome:** já era o nome adotado na documentação e no repositório antes da S0. Trocar agora geraria retrabalho sem ganho para o professor.

!!! warning "Colisão de nome"
    Existe uma plataforma educacional chamada "Code Expert" (ETH Zurich), também voltada a exercícios de programação. Como o CodeExpert é de uso interno, por convite e sem fins comerciais, o risco é baixo. Se o projeto for divulgado fora da UnB, a equipe deve rever o nome.

## 3. Logo

**Conceito:** um livro aberto visto de frente. A página esquerda é azul, a direita é verde-azulada, e um círculo acima forma uma pessoa lendo.

- **Livro aberto:** ensino, material didático, exercício.
- **Pessoa com braços abertos:** o professor, e por extensão o aluno, no centro do produto.
- **Duas cores:** o azul representa estrutura e rigor acadêmico; o verde-azulado representa a verificação e a aprovação. As mesmas duas cores conduzem toda a interface (seção 4).

| Principal | Monocromática | Símbolo |
|:---:|:---:|:---:|
| ![Logo principal](marca/logo.svg){ width="200" style="background:#FFFFFF;padding:16px;border-radius:10px;border:1px solid #E3E5EA" } | ![Logo monocromática sobre azul](marca/logo-mono.svg){ width="200" style="background:#243C8C;padding:16px;border-radius:10px" } | ![Símbolo](marca/simbolo.svg){ width="72" } |
| cabeçalho, sobre fundo branco | impressão e fundos azul ou escuro | aba do navegador e espaços abaixo de 32px |

| Versão | Arquivo de origem |
|---|---|
| Principal (cor) | `frontend/src/assets/brand/logo.svg` |
| Monocromática | `frontend/src/assets/brand/logo-mono.svg` |
| Símbolo | `frontend/public/favicon.svg`: logo dentro de um círculo branco, com o miolo das páginas recortado para mostrar a cor da aba |
| Referência raster | `docs/design/marca/logo-original.png`: a imagem original vetorizada; fica fora de `frontend/public/` para não ir ao build |

A logo foi vetorizada a partir da imagem de referência, com as cores exatas da seção 4.1. As imagens desta página são cópias em `docs/design/marca/`; ao mudar a logo, atualize as duas.

### Regras de uso

| Regra | Valor |
|---|---|
| Composição no cabeçalho | símbolo à esquerda + "CodeExpert" em Source Sans 3, peso 600, cor `--color-text` |
| Área de respiro | no mínimo a altura do círculo em volta do símbolo |
| Tamanho mínimo | 24px de altura na tela; 16px apenas para o favicon |
| Fundos permitidos | branco, `--color-page` e, na versão monocromática branca, `--color-primary` ou `--color-footer` |

!!! danger "Usos incorretos"
    Esticar, inclinar ou distorcer. Trocar as cores das páginas ou inverter azul e verde. Aplicar sombra, contorno, gradiente ou brilho. Colocar a versão em cor sobre foto ou fundo colorido. Separar o círculo do livro.

## 4. Cores

A paleta nasce da logo. O azul e o verde-azulado são da mesma família das cores da UnB e do Aprender3, mas deslocados de propósito: o azul é mais violeta que o institucional e o verde é mais frio que o da UnB. Tema único, claro.

### 4.1 Marca

<div class="ce-id-swatches ce-id-swatches--pair"><div class="ce-id-swatch ce-id-swatch--lg"><div class="ce-id-swatch__chip" style="background:#243C8C;color:#FFFFFF">Gerar questão</div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Azul primário</span><code>--color-primary</code><span class="ce-id-mono">#243C8C</span><span class="ce-id-swatch__role">Navegar e iniciar: navegação ativa, títulos de página, botão principal</span></div></div><div class="ce-id-swatch ce-id-swatch--lg"><div class="ce-id-swatch__chip" style="background:#1B7A70;color:#FFFFFF">Aprovar e salvar</div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Verde-azulado</span><code>--color-accent</code><span class="ce-id-mono">#1B7A70</span><span class="ce-id-swatch__role">Concluir e aprovar: "Aprovar e salvar", "Exportar XML", etapa concluída, card selecionado</span></div></div></div><div class="ce-id-swatches"><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#1B2F6E;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Azul, hover</span><code>--color-primary-hover</code><span class="ce-id-mono">#1B2F6E</span><span class="ce-id-swatch__role">Hover e pressionado do botão principal</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#E8ECF7;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Azul, fundo</span><code>--color-primary-tint</code><span class="ce-id-mono">#E8ECF7</span><span class="ce-id-swatch__role">Painel "Geração em andamento", etapa atual</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#12635A;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Verde, hover</span><code>--color-accent-hover</code><span class="ce-id-mono">#12635A</span><span class="ce-id-swatch__role">Hover e pressionado do botão de conclusão</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#E3F2EF;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Verde, fundo</span><code>--color-accent-tint</code><span class="ce-id-mono">#E3F2EF</span><span class="ce-id-swatch__role">Card selecionado, estrutura obrigatória marcada</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#12635A;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Verde, texto</span><code>--color-accent-text</code><span class="ce-id-mono">#12635A</span><span class="ce-id-swatch__role">Texto sobre o fundo verde</span></div></div></div>

<div class="ce-id-rule">
<div style="background:#243C8C"><strong>Azul = navegar e iniciar</strong>Biblioteca, Gerar questão, Voltar à biblioteca, abas e links.</div>
<div style="background:#1B7A70"><strong>Verde-azulado = concluir e aprovar</strong>Aprovar e salvar, Exportar XML, etapa concluída, card selecionado.</div>
</div>

Um professor que aprende essa regra numa tela reconhece em todas as outras.

### 4.2 Base

<div class="ce-id-swatches"><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#F5F7FA;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Página</span><code>--color-page</code><span class="ce-id-mono">#F5F7FA</span><span class="ce-id-swatch__role">Fundo atrás dos painéis</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#FFFFFF;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Superfície</span><code>--color-surface</code><span class="ce-id-mono">#FFFFFF</span><span class="ce-id-swatch__role">Painéis, cards e campos</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#14161A;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Texto</span><code>--color-text</code><span class="ce-id-mono">#14161A</span><span class="ce-id-swatch__role">Texto principal</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#5B616B;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Texto secundário</span><code>--color-text-muted</code><span class="ce-id-mono">#5B616B</span><span class="ce-id-swatch__role">Descrições e metadados</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#E3E5EA;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Borda</span><code>--color-border</code><span class="ce-id-mono">#E3E5EA</span><span class="ce-id-swatch__role">Divisórias e borda de painéis</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#8A8F98;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Borda de controle</span><code>--color-border-control</code><span class="ce-id-mono">#8A8F98</span><span class="ce-id-swatch__role">Campos, selects e checkboxes</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#1E3557;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Rodapé</span><code>--color-footer</code><span class="ce-id-mono">#1E3557</span><span class="ce-id-swatch__role">Reservado para o rodapé</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#FFFFFF;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Sobre cor</span><code>--color-on-fill</code><span class="ce-id-mono">#FFFFFF</span><span class="ce-id-swatch__role">Texto e ícones sobre azul ou verde</span></div></div></div>

### 4.3 Erro

<div class="ce-id-swatches"><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#B42318;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Erro</span><code>--color-danger</code><span class="ce-id-mono">#B42318</span><span class="ce-id-swatch__role">Botão "Rejeitar", mensagem de erro no campo, estrutura proibida</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#FDECEA;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Erro, fundo</span><code>--color-danger-tint</code><span class="ce-id-mono">#FDECEA</span><span class="ce-id-swatch__role">Fundo de chip proibido e de alerta de erro</span></div></div></div>

### 4.4 Estados da questão

O estado aparece sempre como texto dentro do badge, com um ponto colorido à esquerda. A cor nunca é a única informação.

<div class="ce-id-badges"><span class="ce-id-badge" style="color:#2456A6;background:#E8EFFA">Gerando</span><span class="ce-id-badge" style="color:#8A5A00;background:#FDF3E1">Aguardando revisão</span><span class="ce-id-badge" style="color:#12635A;background:#E3F2EF">Aprovada</span><span class="ce-id-badge" style="color:#B42318;background:#FDECEA">Falhou na verificação</span><span class="ce-id-badge" style="color:#5B616B;background:#EEF0F3">Rejeitada</span></div>

| Estado no sistema | Rótulo na interface | Tokens | Texto | Fundo |
|---|---|---|---|---|
| `GERANDO` | <span class="ce-id-badge" style="color:#2456A6;background:#E8EFFA">Gerando</span> | `--status-info-text`<br>`--status-info-bg` | <span class="ce-id-mono">#2456A6</span> | <span class="ce-id-mono">#E8EFFA</span> |
| `GERADA` | <span class="ce-id-badge" style="color:#8A5A00;background:#FDF3E1">Aguardando revisão</span> | `--status-warning-text`<br>`--status-warning-bg` | <span class="ce-id-mono">#8A5A00</span> | <span class="ce-id-mono">#FDF3E1</span> |
| `APROVADA` | <span class="ce-id-badge" style="color:#12635A;background:#E3F2EF">Aprovada</span> | `--status-success-text`<br>`--status-success-bg` | <span class="ce-id-mono">#12635A</span> | <span class="ce-id-mono">#E3F2EF</span> |
| `FALHOU_VERIFICACAO` | <span class="ce-id-badge" style="color:#B42318;background:#FDECEA">Falhou na verificação</span> | `--status-danger-text`<br>`--status-danger-bg` | <span class="ce-id-mono">#B42318</span> | <span class="ce-id-mono">#FDECEA</span> |
| `REJEITADA` | <span class="ce-id-badge" style="color:#5B616B;background:#EEF0F3">Rejeitada</span> | `--status-neutral-text`<br>`--status-neutral-bg` | <span class="ce-id-mono">#5B616B</span> | <span class="ce-id-mono">#EEF0F3</span> |

`APROVADA` usa o mesmo verde-azulado da ação "Aprovar": a palavra e a cor da ação se repetem no resultado.

### 4.5 Bloco de código

O editor da solução em C é a única área escura da interface. A convenção de editores ajuda o professor a reconhecer o trecho na hora e separa o código do texto do enunciado. Comentários têm cor própria, em itálico.

<div class="ce-id-code"><div class="ce-id-code__bar">solucao.c · C</div><pre class="ce-id-code__body"><span class="ce-id-code__ln">1</span><span style="color:#E3A8E8">#include &lt;stdio.h&gt;</span>
<span class="ce-id-code__ln">2</span>
<span class="ce-id-code__ln">3</span><span style="color:#7FC8BC">int</span> main(<span style="color:#7FC8BC">void</span>) {
<span class="ce-id-code__ln">4</span>    <span style="color:#7FC8BC">int</span> ano;
<span class="ce-id-code__ln">5</span>    scanf(<span style="color:#F2C27B">"%d"</span>, &amp;ano);
<span class="ce-id-code__ln">6</span>    <span style="color:#9AA1AD;font-style:italic">// Divisivel por 400, ou por 4 sem ser por 100</span>
<span class="ce-id-code__ln">7</span>    <span style="color:#7FC8BC">if</span> (ano % <span style="color:#9DB4F5">400</span> == <span style="color:#9DB4F5">0</span> || (ano % <span style="color:#9DB4F5">4</span> == <span style="color:#9DB4F5">0</span> &amp;&amp; ano % <span style="color:#9DB4F5">100</span> != <span style="color:#9DB4F5">0</span>)) {
<span class="ce-id-code__ln">8</span>        printf(<span style="color:#F2C27B">"BISSEXTO\n"</span>);
<span class="ce-id-code__ln">9</span>    }
<span class="ce-id-code__ln">10</span>    <span style="color:#7FC8BC">return</span> <span style="color:#9DB4F5">0</span>;
<span class="ce-id-code__ln">11</span>}</pre><div class="ce-id-code__bar">Terminal</div><pre class="ce-id-code__body"><span style="color:#7FC8BC">$ </span>gcc -std=c11 -Wall -Wextra solucao.c -o solucao
<span style="color:#8FD6A8">Compilação bem-sucedida, sem advertências.</span></pre></div>

<div class="ce-id-swatches"><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#23262E;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Fundo</span><code>--code-bg</code><span class="ce-id-mono">#23262E</span><span class="ce-id-swatch__role">Fundo do editor</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#2C3039;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Barra</span><code>--code-bg-raised</code><span class="ce-id-mono">#2C3039</span><span class="ce-id-swatch__role">Barra de abas e do terminal</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#3A3F4B;color:#FFFFFF"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Borda</span><code>--code-border</code><span class="ce-id-mono">#3A3F4B</span><span class="ce-id-swatch__role">Divisórias do editor</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#E6E8EC;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Texto</span><code>--code-text</code><span class="ce-id-mono">#E6E8EC</span><span class="ce-id-swatch__role">Texto padrão</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#9AA1AD;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Comentário</span><code>--code-comment</code><span class="ce-id-mono">#9AA1AD</span><span class="ce-id-swatch__role">Comentários e números de linha</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#7FC8BC;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Palavra reservada</span><code>--code-keyword</code><span class="ce-id-mono">#7FC8BC</span><span class="ce-id-swatch__role">int, if, return</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#F2C27B;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Texto entre aspas</span><code>--code-string</code><span class="ce-id-mono">#F2C27B</span><span class="ce-id-swatch__role">Strings e caracteres</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#9DB4F5;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Número</span><code>--code-number</code><span class="ce-id-mono">#9DB4F5</span><span class="ce-id-swatch__role">Literais numéricos</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#E3A8E8;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Diretiva</span><code>--code-preprocessor</code><span class="ce-id-mono">#E3A8E8</span><span class="ce-id-swatch__role">#include</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#8FD6A8;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Terminal, sucesso</span><code>--code-success</code><span class="ce-id-mono">#8FD6A8</span><span class="ce-id-swatch__role">Compilação sem erro</span></div></div><div class="ce-id-swatch"><div class="ce-id-swatch__chip" style="background:#F5A3A3;color:#14161A"></div><div class="ce-id-swatch__body"><span class="ce-id-swatch__name">Terminal, falha</span><code>--code-error</code><span class="ce-id-mono">#F5A3A3</span><span class="ce-id-swatch__role">Erro de compilação</span></div></div></div>

Entradas e saídas dos casos de teste continuam em fundo claro, com fonte mono.

### 4.6 Contraste verificado (WCAG 2.2)

Cada amostra abaixo é o texto real sobre o fundo real. O `make check` recalcula 32 pares a partir de `tokens.css` com `npm run contrast` e falha abaixo de 4.5 para texto ou 3 para elementos que não são texto.

| Amostra | Par | Razão | Mínimo | Resultado |
|---|---|---|---|---|
| <span class="ce-id-pair" style="color:#14161A;background:#FFFFFF">Aa 123</span> | Texto / superfície<br><span class="ce-id-mono">#14161A / #FFFFFF</span> | 18.11 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#14161A;background:#F5F7FA">Aa 123</span> | Texto / página<br><span class="ce-id-mono">#14161A / #F5F7FA</span> | 16.88 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#5B616B;background:#FFFFFF">Aa 123</span> | Secundário / superfície<br><span class="ce-id-mono">#5B616B / #FFFFFF</span> | 6.24 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#5B616B;background:#F5F7FA">Aa 123</span> | Secundário / página<br><span class="ce-id-mono">#5B616B / #F5F7FA</span> | 5.81 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#243C8C;background:#FFFFFF">Aa 123</span> | Azul / superfície<br><span class="ce-id-mono">#243C8C / #FFFFFF</span> | 10.00 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#FFFFFF;background:#243C8C">Aa 123</span> | Branco / botão azul<br><span class="ce-id-mono">#FFFFFF / #243C8C</span> | 10.00 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#FFFFFF;background:#1B2F6E">Aa 123</span> | Branco / botão azul, hover<br><span class="ce-id-mono">#FFFFFF / #1B2F6E</span> | 12.51 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#243C8C;background:#E8ECF7">Aa 123</span> | Azul / fundo azul<br><span class="ce-id-mono">#243C8C / #E8ECF7</span> | 8.46 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#1B7A70;background:#FFFFFF">Aa 123</span> | Verde / superfície<br><span class="ce-id-mono">#1B7A70 / #FFFFFF</span> | 5.17 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#FFFFFF;background:#1B7A70">Aa 123</span> | Branco / botão verde<br><span class="ce-id-mono">#FFFFFF / #1B7A70</span> | 5.17 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#FFFFFF;background:#12635A">Aa 123</span> | Branco / botão verde, hover<br><span class="ce-id-mono">#FFFFFF / #12635A</span> | 7.10 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#12635A;background:#E3F2EF">Aa 123</span> | Verde texto / fundo verde<br><span class="ce-id-mono">#12635A / #E3F2EF</span> | 6.16 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#B42318;background:#FFFFFF">Aa 123</span> | Erro / superfície<br><span class="ce-id-mono">#B42318 / #FFFFFF</span> | 6.57 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#B42318;background:#FDECEA">Aa 123</span> | Erro / fundo de erro<br><span class="ce-id-mono">#B42318 / #FDECEA</span> | 5.75 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#FFFFFF;background:#1E3557">Aa 123</span> | Branco / rodapé<br><span class="ce-id-mono">#FFFFFF / #1E3557</span> | 12.34 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#2456A6;background:#E8EFFA">Aa 123</span> | Gerando<br><span class="ce-id-mono">#2456A6 / #E8EFFA</span> | 6.14 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#8A5A00;background:#FDF3E1">Aa 123</span> | Aguardando revisão<br><span class="ce-id-mono">#8A5A00 / #FDF3E1</span> | 5.39 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#12635A;background:#E3F2EF">Aa 123</span> | Aprovada<br><span class="ce-id-mono">#12635A / #E3F2EF</span> | 6.16 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#B42318;background:#FDECEA">Aa 123</span> | Falhou na verificação<br><span class="ce-id-mono">#B42318 / #FDECEA</span> | 5.75 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#5B616B;background:#EEF0F3">Aa 123</span> | Rejeitada<br><span class="ce-id-mono">#5B616B / #EEF0F3</span> | 5.46 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#E6E8EC;background:#23262E">Aa 123</span> | Código: texto<br><span class="ce-id-mono">#E6E8EC / #23262E</span> | 12.33 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#9AA1AD;background:#23262E">Aa 123</span> | Código: comentário<br><span class="ce-id-mono">#9AA1AD / #23262E</span> | 5.82 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#7FC8BC;background:#23262E">Aa 123</span> | Código: palavra reservada<br><span class="ce-id-mono">#7FC8BC / #23262E</span> | 7.85 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#F2C27B;background:#23262E">Aa 123</span> | Código: texto entre aspas<br><span class="ce-id-mono">#F2C27B / #23262E</span> | 9.21 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#9DB4F5;background:#23262E">Aa 123</span> | Código: número<br><span class="ce-id-mono">#9DB4F5 / #23262E</span> | 7.41 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#E3A8E8;background:#23262E">Aa 123</span> | Código: diretiva<br><span class="ce-id-mono">#E3A8E8 / #23262E</span> | 7.95 | 4.5 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#8A8F98;background:#FFFFFF">Aa 123</span> | Borda de controle / superfície (não texto)<br><span class="ce-id-mono">#8A8F98 / #FFFFFF</span> | 3.25 | 3 | <span class="ce-id-pass">AA</span> |
| <span class="ce-id-pair" style="color:#1B7A70;background:#E3F2EF">Aa 123</span> | Verde sobre fundo verde (proibido)<br><span class="ce-id-mono">#1B7A70 / #E3F2EF</span> | 4.48 | 4.5 | <span class="ce-id-fail">Reprovado</span> |

O último par é proibido de propósito: texto `#1B7A70` sobre `#E3F2EF` fica abaixo do mínimo. Por isso existe `--color-accent-text`.

## 5. Tipografia

Duas famílias, com papéis que não se misturam. As amostras abaixo usam os mesmos arquivos woff2 do front-end.

<div class="ce-id-families">
<div class="ce-id-family"><div class="ce-id-family__glyphs ce-id-sans">Aa Çç Ãã</div><div class="ce-id-family__name ce-id-sans">Source Sans 3 · 400 e 600</div><div class="ce-id-family__use ce-id-sans">Toda a interface: títulos, texto, botões, rótulos.</div></div>
<div class="ce-id-family"><div class="ce-id-family__glyphs ce-id-mono">0O 1l {}</div><div class="ce-id-family__name ce-id-mono">IBM Plex Mono · 400 e 500</div><div class="ce-id-family__use ce-id-sans">Código C, entradas, saídas, identificadores (#0142) e estruturas (if / else, for).</div></div>
</div>

<div class="ce-id-type">
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-2xl<br>30px · 600</div><div class="ce-id-type__sample" style="font-size:30px;font-weight:600;color:#243C8C">Biblioteca de questões</div></div>
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-xl<br>24px · 600</div><div class="ce-id-type__sample" style="font-size:24px;font-weight:600;color:#243C8C">Verificando a solução</div></div>
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-lg<br>20px · 600</div><div class="ce-id-type__sample" style="font-size:20px;font-weight:600">Etapas da geração</div></div>
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-md<br>16px · 400</div><div class="ce-id-type__sample" style="font-size:16px;line-height:1.5">Estamos compilando o código e executando os casos de teste.</div></div>
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-sm<br>14px · 400</div><div class="ce-id-type__sample" style="font-size:14px;line-height:1.5;color:#5B616B">Recomendado entre 4 e 8 casos para uma cobertura adequada.</div></div>
<div class="ce-id-type__row"><div class="ce-id-type__meta">--text-xs<br>13px · 600</div><div class="ce-id-type__sample" style="font-size:13px;font-weight:600"><span class="ce-id-badge" style="color:#8A5A00;background:#FDF3E1">Aguardando revisão</span></div></div>
</div>

| Regra | Valor |
|---|---|
| Entrelinha do texto | 1.5 |
| Entrelinha de títulos | 1.2 |
| Largura máxima de linha | cerca de 75 caracteres (`--width-prose`, 47rem) |
| Caixa | frase normal; sem rótulos em caixa alta |
| Carregamento | 4 arquivos woff2, subset latin, servidos pelo próprio projeto, `font-display: swap` |

**Por que estas fontes:** Source Sans 3 é legível em tamanhos pequenos, tem acentuação completa do português e aparência sóbria. IBM Plex Mono diferencia caracteres que confundem em código (`0` e `O`, `1` e `l`), o que importa quando o professor confere entradas e saídas. As duas são livres (SIL Open Font License; licenças em `docs/assets/fonts/`).

## 6. Espaçamento e grid

Escala de 4px. Todo espaçamento da interface usa um destes tokens.

<div class="ce-id-scale">
<div class="ce-id-scale__row"><code>--space-1</code><span>4px</span><div class="ce-id-scale__bar" style="width:4px"></div></div>
<div class="ce-id-scale__row"><code>--space-2</code><span>8px</span><div class="ce-id-scale__bar" style="width:8px"></div></div>
<div class="ce-id-scale__row"><code>--space-3</code><span>12px</span><div class="ce-id-scale__bar" style="width:12px"></div></div>
<div class="ce-id-scale__row"><code>--space-4</code><span>16px</span><div class="ce-id-scale__bar" style="width:16px"></div></div>
<div class="ce-id-scale__row"><code>--space-6</code><span>24px</span><div class="ce-id-scale__bar" style="width:24px"></div></div>
<div class="ce-id-scale__row"><code>--space-8</code><span>32px</span><div class="ce-id-scale__bar" style="width:32px"></div></div>
<div class="ce-id-scale__row"><code>--space-12</code><span>48px</span><div class="ce-id-scale__bar" style="width:48px"></div></div>
</div>

<div class="ce-id-radii">
<div class="ce-id-radius" style="border-radius:6px">6px<br>controles</div>
<div class="ce-id-radius" style="border-radius:10px">10px<br>painéis e cards</div>
<div class="ce-id-radius" style="border-radius:999px">999px<br>badges</div>
</div>

| Item | Valor |
|---|---|
| Largura máxima do conteúdo | 1280px, centralizado |
| Breakpoints | 640px e 1024px |
| Biblioteca | 3 colunas acima de 1024px, 2 entre 640 e 1024px, 1 abaixo de 640px |
| Gerar questão | 2 colunas (conteúdo e dificuldade à esquerda, estruturas em C à direita); empilha abaixo de 1024px |
| Revisão | conteúdo em abas + barra lateral de 280px com a revisão pedagógica; a barra desce para baixo do conteúdo abaixo de 1024px |
| Sombra | nenhuma; apenas 1px de borda |
| Foco | anel `--color-primary` de 2px com afastamento de 2px em todo controle |

## 7. Iconografia

| Item | Valor |
|---|---|
| Família | Lucide |
| Traço | 1.75px |
| Tamanhos | 16px junto a texto, 20px em botões grandes, abas e títulos de seção |
| Cor | herda a cor do texto ao lado |

- Ícone sozinho só quando o significado é universal: fechar, buscar, expandir.
- Nos demais casos, ícone + texto ("Exportar XML", "Copiar").
- Sem ícone de faíscas ou estrelas para "gerar". O botão "Gerar questão" usa `plus` na biblioteca e nenhum ícone no formulário.
- Sem emoji na interface.

## 8. Movimento

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 120ms | hover, foco, troca de chip |
| `--dur-base` | 200ms | abrir e fechar seções, troca de cor do badge |
| `--dur-slow` | 320ms | avanço da barra de progresso |
| `--ease-enter` | `cubic-bezier(.2, 0, 0, 1)` | elementos entrando |
| `--ease-exit` | `cubic-bezier(.4, 0, 1, 1)` | elementos saindo |

- Animar só quando responde a uma ação do professor ou mostra progresso.
- Animar apenas posição, opacidade e cor, nunca tamanho de layout.
- Com "reduzir movimento" ativo no sistema, todas as durações viram zero. Um teste de ponta a ponta confere isso.

| Momento | Animação |
|---|---|
| Progresso da geração | a barra avança a cada etapa; a etapa concluída troca o marcador por um check |
| Etapa atual | indicador giratório discreto ao lado do título, sem pulsar a tela |
| Selecionar card na biblioteca | borda e fundo mudam para o verde-azulado; a barra de exportação desliza de cima |
| Aprovar questão | o badge muda de "Aguardando revisão" para "Aprovada" e um aviso confirma |
| Landing (G5-2) | <span class="ce-badge ce-status--planned">Planejado</span> vídeo controlado pelo scroll |

## 9. Princípios de UX

### 9.1 Referência de usabilidade: Aprender3

O CodeExpert reaproveita a **posição dos elementos e a forma de navegar** do Aprender3, não o visual. Objetivo: curva de aprendizado próxima de zero.

| Padrão do Aprender3 | Equivalente no CodeExpert |
|---|---|
| Navegação no topo: Página inicial, Painel, Meus cursos | Biblioteca, Gerar questão, Ajuda |
| Avatar e nome no canto direito do topo | nome, departamento e avatar do professor, com menu da conta |
| "Meus cursos": busca, filtros e ordenação acima de uma grade de cartões | Biblioteca: busca, conteúdo, dificuldade e status acima da grade de questões |
| Barra de progresso no cartão do curso | badge de estado e ação ("Ver progresso", "Revisar") no card da questão |
| Seções do curso | abas da revisão: "Enunciado e solução" e "Casos de teste e restrições" |
| "Marcar como feito" | "Aprovar e salvar" |
| Breadcrumb | "Voltar à biblioteca" + código `#0142` como metadado |
| Barra secundária azul com as seções do curso | <span class="ce-badge ce-status--planned">Planejado</span> barra secundária na revisão |

Muda em relação ao Aprender3: cores, tipografia, ícones, estilo dos cartões e animações.

### 9.2 As 10 heurísticas de Nielsen

| # | Heurística | Como aplicamos | Onde |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | painel "Geração em andamento" com etapa atual, barra e "Etapa 4 de 5"; badge de estado em todo card | Progresso, Biblioteca |
| 2 | Correspondência com o mundo real | "Conteúdo", "Dificuldade", "Casos de teste", "Aguardando revisão"; o sistema não mostra `GERADA` nem `run_id` fora dos detalhes técnicos | todo o produto |
| 3 | Controle e liberdade do usuário | "Voltar à biblioteca" sempre visível; a geração continua enquanto o professor navega; "Solicitar regeneração" e "Cancelar" na revisão | Progresso, Revisão |
| 4 | Consistência e padrões | azul inicia, verde-azulado conclui; mesma ação com o mesmo nome em todas as telas | todo o produto |
| 5 | Prevenção de erros | estrutura em conflito fica desabilitada antes do erro; exportar só aparece com aprovadas selecionadas; rejeitar pede confirmação | Gerar, Biblioteca, Revisão |
| 6 | Reconhecer em vez de lembrar | estruturas em C como chips clicáveis; dificuldade como intervalo com o nome da faixa ao lado; filtros visíveis | Gerar, Biblioteca |
| 7 | Flexibilidade e eficiência | seleção múltipla e exportação em lote; filtros e aba da revisão guardados no endereço da página | Biblioteca, Revisão |
| 8 | Estética e design minimalista | uma ação principal por área; detalhes técnicos recolhidos em "Ver detalhes técnicos" | Progresso, todas |
| 9 | Reconhecer, diagnosticar e recuperar erros | a falha diz a causa em linguagem simples e oferece "Gerar de novo"; erros da API viram título e ação | Revisão, todas |
| 10 | Ajuda e documentação | dicas junto ao campo ("Recomendado entre 4 e 8 casos"); página de Ajuda; passo a passo de importação junto ao download do XML | Gerar, Exportar, Ajuda |

### 9.3 Outros princípios adotados

| Princípio | Resumo | Aplicação |
|---|---|---|
| Lei de Jakob | usuários preferem sistemas que funcionam como os que já conhecem | navegação e organização inspiradas no Aprender3 |
| Lei de Hick | quanto mais opções, mais lenta a decisão | formulário em dois blocos; campos opcionais marcados; estruturas em três grupos |
| Lei de Fitts | alvos grandes e próximos são mais rápidos | botões principais grandes, no fim da leitura |
| Divulgação progressiva | mostrar o essencial primeiro | detalhes técnicos recolhidos; revisão em duas abas |
| Proximidade (Gestalt) | itens próximos parecem relacionados | resumo "Sua questão" ao lado das etapas; ações agrupadas na barra "Revisão pedagógica" |
| Limiar de Doherty | resposta em menos de 400ms mantém o fluxo | o clique em "Gerar questão" leva na hora à tela de progresso |
| Estados vazios orientam | tela vazia convida à ação | biblioteca vazia mostra "Gerar primeira questão" |
| Mesma palavra, mesma ação | botão e mensagem usam o mesmo verbo | "Aprovar" gera "Questão aprovada"; "Exportar XML" gera "XML exportado" |
| Reconhecimento de seleção | itens escolhidos ficam marcados | card selecionado com borda e fundo verde-azulado e contagem na barra de exportação |

## 10. Voz e escrita

| Regra | Exemplo bom | Exemplo ruim |
|---|---|---|
| Verbo primeiro nos botões | "Gerar questão", "Exportar XML" | "Enviar", "OK" |
| Explicar o que está acontecendo | "Estamos compilando o código e executando os casos de teste." | "Processando..." |
| Erro diz o que houve e o que fazer | "A solução usou repetição, mas o pedido era sem repetição. Gere de novo." | "Erro 422" |
| Sem exclamação no sistema | "Questão aprovada" | "Sucesso!" |
| Frase em caixa normal | "Sua questão" | "SUA QUESTÃO" |
| Tratar o professor por "você" | "Após a geração, você poderá revisar o enunciado." | "O usuário poderá revisar" |

### Glossário

| Termo na interface | Significado | Não usar |
|---|---|---|
| Questão | exercício completo pronto para o Aprender3 | item, prompt, run |
| Conteúdo | assunto de programação (condicionais, vetores...) | eixo, E1 |
| Dificuldade | intervalo de rating de 500 a 3500, lido como Muito fácil a Muito difícil | nível N1, N2 |
| Caso de teste | entrada e saída esperada usadas na correção | test case |
| Estruturas em C | construções da linguagem obrigatórias, permitidas ou proibidas | flags |
| Aguardando revisão | gerada e verificada, falta o professor decidir | gerada, pendente |
| Aprovar | professor aceita a questão para uso | publicar, validar |
| Exportar XML | baixar o arquivo para importar no Aprender3 | download, gerar XML |

Os códigos internos (`#0142`, o rating `1200 a 1400`) aparecem como metadado discreto em fonte mono, nunca como única identificação.

## 11. Acessibilidade

**Meta:** paridade com o Aprender3, que adota a WCAG nível AA. Referência: [Guia rápido WCAG 2.2 (W3C)](https://www.w3.org/WAI/WCAG22/quickref/).

| Item | Critério WCAG | Como é verificado |
|---|---|---|
| Contraste de texto e controles | 1.4.3, 1.4.11 | `npm run contrast` no `make check` (seção 4.6) |
| Navegação por teclado | 2.1.1 | testes de componente e de ponta a ponta por teclado |
| Pular para o conteúdo | 2.4.1 | link no primeiro Tab, testado |
| Foco visível | 2.4.7 | anel `--color-primary` de 2px com afastamento de 2px |
| Idioma da página | 3.1.1 | `<html lang="pt-BR">` |
| Rótulo em todo campo | 3.3.2 | rótulo visível; erro junto ao campo |
| Estado não depende só de cor | 1.4.1 | badges sempre com texto |
| Mensagens de status | 4.1.3 | troca de etapa e avisos anunciados por região `aria-live` |
| Reflow | 1.4.10 | todas as telas testadas em 320px, sem rolagem horizontal |
| Regras automáticas | | axe-core em todas as rotas e no modal de exportação, sem violação séria ou crítica |

Teste com leitor de tela e com professor de fora da equipe continuam <span class="ce-badge ce-status--planned">Planejados</span> para a S4 (G4-10).

## 12. Aplicações

<span class="ce-badge ce-status--done">Implementado</span> Capturas das telas como estão hoje no front-end, com dados simulados, em 1280px. Os protótipos do Stitch serviram de guia de layout; os ajustes da seção 12.6 prevalecem sobre eles.

### 12.1 Biblioteca de questões

<figure class="ce-id-screen" markdown>
![Biblioteca de questões](telas/biblioteca.png)
<figcaption>Busca e filtros no topo, guardados no endereço. Grade de cards com título, descrição, conteúdo, dificuldade e estado. Só questões aprovadas têm caixa de seleção.</figcaption>
</figure>

<figure class="ce-id-screen" markdown>
![Exportar questões](telas/exportar.png)
<figcaption>Seleção de aprovadas abre a barra "Exportar XML" e o modal de exportação, com o passo a passo de importação no Moodle.</figcaption>
</figure>

### 12.2 Configurar nova questão

<figure class="ce-id-screen" markdown>
![Configurar nova questão](telas/gerar.png)
<figcaption>Conteúdo, dificuldade em intervalo, quantidade de casos, casos de teste específicos e contexto à esquerda. Estruturas em C à direita, em três grupos, com a regra de consistência visível.</figcaption>
</figure>

### 12.3 Acompanhar geração

<figure class="ce-id-screen" markdown>
![Acompanhar geração](telas/progresso.png)
<figcaption>Painel de destaque com a etapa atual, lista das cinco etapas e resumo da questão. O professor pode voltar à biblioteca sem interromper a geração.</figcaption>
</figure>

### 12.4 Revisão: enunciado e solução

<figure class="ce-id-screen" markdown>
![Revisão, aba de enunciado e solução](telas/revisao-enunciado.png)
<figcaption>Enunciado com entrada, saída e exemplo; logo abaixo, a solução no editor escuro com terminal. À direita, a revisão pedagógica com "Aprovar e salvar", "Rejeitar" e "Solicitar regeneração".</figcaption>
</figure>

### 12.5 Revisão: casos de teste e restrições

<figure class="ce-id-screen" markdown>
![Revisão, aba de casos de teste e restrições](telas/revisao-testes.png)
<figcaption>Comparação entrada, saída esperada e saída obtida, seguida da verificação de cada estrutura obrigatória, permitida e proibida.</figcaption>
</figure>

### 12.6 Ajustes em relação aos protótipos

| Protótipo mostra | Implementado assim | Motivo |
|---|---|---|
| Rótulos em caixa alta ("GERAÇÃO EM ANDAMENTO") | frase normal, peso 600, `--text-sm` | seções 5 e 10 |
| Ícone de faíscas no botão "Gerar questão" | `plus` na biblioteca, nenhum ícone no formulário | seção 7 |
| Barra de progresso em azul-ciano | `--color-accent` | paleta fechada |
| Dificuldade em cinco botões | intervalo de rating de 500 a 3500, passo 50, com o nome da faixa ao lado | decisão D6 |
| Só quantidade de casos de teste | campo opcional "Casos de teste específicos" abaixo da quantidade | professor pede situações que precisam aparecer |
| Revisão em quatro abas (Enunciado, Solução, Casos, Restrições) | duas abas: enunciado com solução abaixo; casos com restrições | decisão D7 |
| Badges "E1", "N2" em destaque | metadado discreto em mono; "Condicionais", "Médio" em destaque | glossário, seção 10 |
| "Parâmetros UnB / CIC" e "Tempo estimado" | omitidos até existir dado real no backend | não mostrar informação inventada |
| Nome de professor fixo | vem do serviço de sessão; hoje um nome fictício nos dados simulados | protótipo |

## 13. Registro de decisões

??? note "D1: Manter o nome CodeExpert"
    | Campo | Valor |
    |---|---|
    | Contexto | o critério de G5-1 exige um nome usado em todo lugar; o repositório chama `tutor-ia` e a documentação já usa CodeExpert |
    | Alternativas | Tutor IA; novo nome |
    | Decisão | CodeExpert |
    | Consequências | nenhum retrabalho de documentação; risco baixo de colisão com "Code Expert" (ETH Zurich), a rever se o produto sair da UnB |

??? note "D2: Paleta derivada da logo, próxima da UnB e do Aprender3"
    | Campo | Valor |
    |---|---|
    | Contexto | o professor usa o Aprender3 diariamente; a identidade precisa parecer do mesmo ambiente sem copiar a marca institucional |
    | Alternativas | cinco paletas avaliadas (Sinal, Cobalto, Floresta, Âmbar, Petróleo) |
    | Decisão | azul `#243C8C` e verde-azulado `#1B7A70`, extraídos da logo |
    | Consequências | as duas cores ganham papéis fixos (iniciar e concluir); o verde-azulado não vira "sucesso" genérico porque "Aprovar" e "Aprovada" usam a mesma cor |

??? note "D3: Layout baseado na usabilidade do Aprender3"
    | Campo | Valor |
    |---|---|
    | Contexto | o público já domina o Moodle; o prazo não permite testes extensos de navegação |
    | Alternativas | layout próprio de painel com menu lateral fixo |
    | Decisão | navegação no topo, filtros acima da grade, volta à biblioteca sempre visível |
    | Consequências | curva de aprendizado mínima; o visual precisa ser claramente distinto para não parecer uma página do Moodle |

??? note "D4: Source Sans 3 e IBM Plex Mono"
    | Campo | Valor |
    |---|---|
    | Contexto | no máximo duas fontes; a interface mistura texto em português e código C |
    | Alternativas | IBM Plex Sans; Inter |
    | Decisão | Source Sans 3 para a interface, IBM Plex Mono para código e dados |
    | Consequências | boa leitura de acentos e de código; Inter descartada por ser a fonte padrão de produtos genéricos |

??? note "D5: Bloco de código escuro em interface clara"
    | Campo | Valor |
    |---|---|
    | Contexto | a solução em C precisa ser lida rapidamente e separada do enunciado |
    | Alternativas | código em fundo claro, igual ao restante |
    | Decisão | fundo escuro só no editor de código, com cores de sintaxe verificadas e comentários em cor própria |
    | Consequências | reconhecimento imediato; é a única exceção ao tema claro e não deve ser usada em outros componentes |

??? note "D6: Dificuldade como intervalo de rating"
    | Campo | Valor |
    |---|---|
    | Contexto | cinco níveis fixos não deixam o professor pedir uma faixa estreita nem comparar com bancos de questões conhecidos |
    | Alternativas | botões segmentados de Muito fácil a Muito difícil |
    | Decisão | intervalo de rating no estilo Codeforces, de 500 a 3500 em passos de 50, com o nome da faixa ao lado (Muito fácil até 950, Fácil até 1350, Médio até 1850, Difícil até 2350, Muito difícil acima) |
    | Consequências | pedido mais preciso; o professor continua lendo a dificuldade em palavras; os cortes entre faixas podem ser ajustados em `frontend/src/domain/difficulty.ts` |

??? note "D7: Revisão em duas abas"
    | Campo | Valor |
    |---|---|
    | Contexto | quatro subtelas separavam o que o professor confere junto: o enunciado e a solução; os casos e as restrições |
    | Alternativas | quatro abas; índice lateral com seções numeradas |
    | Decisão | "Enunciado e solução" (solução logo abaixo, no editor) e "Casos de teste e restrições" |
    | Consequências | menos troca de contexto; a aba fica no endereço (`?aba=testes`) |

## 14. Como mudar a identidade

1. Abrir issue explicando o motivo da mudança.
2. Alterar `frontend/src/styles/tokens.css` e esta página (`docs/design/identidade.md`) no mesmo PR.
3. Rodar `make check`, que inclui a verificação de contraste.
4. Registrar a decisão na seção 13.
5. Se a mudança for visível, atualizar as capturas da seção 12 com `SCREENSHOTS=1 npx playwright test tests/e2e/screens.spec.ts` em `frontend/`, e as cópias da logo em `docs/design/marca/`.

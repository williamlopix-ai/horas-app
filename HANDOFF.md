# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **30/08/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 🚨 COMECE POR AQUI NA PRÓXIMA SESSÃO

A sessão de 30/08 foi longa (25 levas) e fechou: as duas pendências da
varredura de 28/08 (🔴 ALTO e 🟡 MÉDIO), a migração completa de gap e de
espaçamento de controle no Bloco 3.5, e as Frentes 1 e 2 do item 3.5g
(foco e acessibilidade) — incluindo um conflito real de z-index
descoberto e corrigido.

**Primeira tarefa da próxima sessão: 3.5g Frente 3 — foco em modais**
(focus trap ao abrir, restauração de foco ao fechar). Nenhum modal do
app faz isso hoje. É candidata a ser feita junto com o 3.5j (camada de
padrões), por ser mais arquitetural que as frentes já concluídas.

Duas pendências menores registradas nesta sessão, não bloqueantes:
- Timesheet no celular não seleciona linha por teclado ainda (decisão
  consciente, ver seção da sessão 30/08 abaixo)
- Remover a seção 9 "Teste — conflito de camada (temporário)" do
  `/ui-kit`, que já cumpriu o propósito

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%
BLOCO 3 — Responsivo                 ████████████ 100%

CORREÇÕES DE MOBILE (fora de bloco)  ████████████ 100%
  ✅ Cabeçalho de fase empilha no mobile        (ProjetoDetalhe, 28/08)
  ✅ Linha de subcategoria empilha no mobile    (ProjetoDetalhe, 28/08)
  ✅ 🔴 BreakdownSubcategorias — mesmo defeito   (30/08)
  ✅ 🟡 Resumo, cards de Rotina — min-w-0        (30/08)

BLOCO 3.5 — Fundações de design      █████████████░  ~85%
  ✅ 3.5a  Inventário de valores no disco
  ✅ 3.5b  Camada primitiva + convenção de nome
      ✅ 3.5b-1  Raio de borda
      ✅ 3.5b-2  Duração de transição (consolidada + CALIBRADA)
  ✅ 3.5c  Dimensão — tamanho de ícone (icon-xs a icon-xl)
  ✅ 3.5c  Dimensão — gap entre elementos (tokens + migração completa)
  ✅ 3.5c  Dimensão — espaçamento de controle (tokens + aplicação completa)
  ✅ 3.5f  Borda, opacidade, z-index, container (revisados; conflito
           real de z-index encontrado e corrigido)
  🟡 3.5g  Foco e acessibilidade
      ✅ Frente 1 — anel de foco global (token accent-bg)
      ✅ Frente 2 — 7 elementos inacessíveis por teclado, corrigidos
      ⬜ Frente 3 — foco em modais (focus trap + restauração)  ← PRÓXIMA
  ⬜ 3.5h  Movimento — pode já estar coberto por 3.5b-2 (checar antes)
  ⬜ 3.5i  Densidade (multiplicador global)
           ⚠️ decisão de design nova, não é só arrumação — ver visual antes
  ⬜ 3.5j  Camada de padrões (Secao, PageHeader, EmptyState)
  ⬜ 3.5k  Prancheta no /ui-kit
  ⬜ 3.5l  Guarda contra regressão + varredura final

BLOCO 4 — Estética                   ░░░░░░░░░░░░   0%   ← O ÚLTIMO
  ⬜ 4.1  Primitiva Secao
  ⬜ 4.2  Hierarquia de elevação (todo Surface está em elevacao={1})
  ⬜ 4.3  Cor do projeto como identidade
  ⬜ 4.4  Movimento — zero animação de entrada/saída existe hoje
  ⬜ 4.5  Bordas de estado suaves

AVULSAS — fora de bloco
  ⬜ Seletor de tema em Ajustes
  ⬜ Esc não fecha o ModalLembrete
  ⬜ Arquivados invisíveis + exclusão real de projeto
  ⬜ Contagem de lembretes na sidebar não atualiza
  ⬜ Lançar horas em um toque no celular  (não bloqueante)
  ⬜ Correção do Billable (getFooterClass usa 8.5 literal) — adiada
  ⬜ Timesheet mobile: seleção de linha por teclado (nova, 30/08)
  ⬜ Nome de exibição configurável no rodapé da Sidebar (nova, 30/08)
  ⬜ Dashboard.tsx: código morto, confirmar e excluir
  ⬜ 5 candidatos a usar a primitiva Dica em vez do title nativo (novo,
     30/08): 4 etiquetas de projeto em Registros.tsx, 1 em
     BreakdownSubcategorias.tsx:55
  ⬜ Billable.tsx:841/1158 e Timesheet.tsx:351 — 3 <Link> que copiam
     manualmente as classes do Button em vez de usar a primitiva,
     com px-4 em vez do px-3.5 real (novo, 30/08)
```

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## ✅ O que foi feito na sessão de 30/08/2026

Sessão longa (25 levas), começou reativa — um print do usuário mostrando
observação cortada no mobile em Registros — e virou uma sequência longa
dentro do Bloco 3.5, sempre voltando ao plano depois de cada desvio.

### Fora da fila, motivado por print do usuário

- **Registros.tsx**: a etiqueta de categoria tinha `shrink-0` e podia
  quebrar em várias linhas; a observação ao lado, com `truncate min-w-0`,
  ficava espremida a quase nada ("S..."). Terceiro modo de falha que a
  varredura de 28/08 não cobria: não é sobreposição nem empurrão, é o
  irmão sendo **esmagado até sumir**. Corrigido empilhando etiqueta e
  observação no celular (`flex-col` → `md:flex-row`).
- **Leva A**: em aparelho de toque, a observação sai da linha; vira um
  ícone de balão ao lado da duração (só quando há observação) que abre
  um `Sheet` com o texto completo. Em aparelho com mouse, nada mudou —
  observação continua em linha, cortada, com dica ao passar o mouse.
- **Leva B**: criada a primitiva `Dica` (`src/components/ui/Dica.tsx`) —
  balão estilizado com `createPortal`, substituindo o `title` nativo do
  navegador na observação de Registros. Aparece por mouse (400ms de
  atraso) ou foco de teclado (sem atraso), soma com Esc. Amostra
  completa em `/ui-kit`, seção 8.

### Varredura de 28/08, finalmente fechada

- **🔴 ALTO** — `BreakdownSubcategorias.tsx:55`: nome de subcategoria
  sem `min-w-0`/`overflow-hidden` vazava sobre os números. Corrigido com
  Padrão A (quebra dentro da própria caixa, sem empilhar) — diferente do
  Padrão B2 usado em ProjetoDetalhe. Ver "Dois padrões coexistindo"
  abaixo.
- **🟡 MÉDIO** — `Resumo.tsx:1196/1200`: cards de Rotina sem `min-w-0`
  no bloco esquerdo e sem `shrink-0` no bloco direito; nome de rotina
  longo empurrava o contador de registros. Corrigido com as duas
  classes.

### Bloco 3.5c — Gap entre elementos (CONCLUÍDO)

- Inventário: 273 ocorrências, 12 valores distintos, em 28 arquivos.
- Escala criada (6 níveis, não os 4 hipotéticos do handoff anterior —
  os dados reais pediam mais granularidade): `gap-2xs`(4px)
  `gap-xs`(6px) `gap-sm`(8px) `gap-md`(12px) `gap-lg`(16px)
  `gap-xl`(24px). Tokens em `src/index.css` (bloco neutro `:root`) +
  `tailwind.config.js` (`theme.extend.gap`, chave própria — **não**
  estende `theme.spacing`, para não gerar classes de padding/margin
  indesejadas).
- Fusões aprovadas pelo usuário: `gap-2.5`(10px)→8px, `gap-5`(20px)→24px.
- Migração completa em 5 levas, sem nenhuma ocorrência perdida:
  1. Primitivas e componentes pequenos (Button, Chip, DataRow, Sheet,
     Stat, Toast, ModalConfirmacao, ProtectedRoute, Skeleton,
     PaletaComandos)
  2. Sidebar, MenuAcoes, os 4 modais grandes (ModalRegistro,
     ModalProjeto, ModalLembrete, ModalHorarioDia)
  3. Páginas médias (Lembretes, Billable, Projetos, Timesheet, UIKit,
     Cadastro, Dashboard, Login)
  4. Registros.tsx + Ajustes.tsx
  5. Resumo.tsx + ProjetoDetalhe.tsx (os dois maiores, ~98 ocorrências)

### Bloco 3.5c — Espaçamento de controle (CONCLUÍDO)

- Inventário: 403 ocorrências de padding, 48 valores nominais — mas o
  achado real foi que o app já usa, de forma consistente, **3 famílias
  coerentes** nunca nomeadas: botão (primitiva Button), aba/toggle
  (`<button>` nativo, nunca a primitiva), campo de formulário (Field).
  Sem fusão de valor nenhuma — só dar nome ao que já existia certo.
- Tokens criados: `ctl-sm-x/y`(10px/4px), `ctl-md-x/y`(14px/6px),
  `ctl-aba-x/y`(12px/8px), em `theme.extend.padding`.
- Aplicados em `Button.tsx`, `Field.tsx` (usa `ctl-aba-x/y` — mesmo
  valor de aba, sem token próprio de campo por enquanto) e nas 13
  abas/toggles do app (Ajustes: seletor de semana e formato; Resumo:
  3 abas + 3 modos de visualização; Registros: alternador Lista/Projeto).
  Billable (usa estilo sublinhado `pb-3`) e Timesheet (já usa a
  primitiva Button de verdade) não têm esse padrão — confirmado por
  inventário, não é omissão.

### Bloco 3.5f — Borda, opacidade, z-index, container (CONCLUÍDO)

- Bordas, opacidade e largura de container: já corretos/tokenizados na
  maior parte. Hex legado concentrado nos arquivos já conhecidos como
  atrasados (Login, Cadastro, Dashboard, ModalHorarioDia). Nada migrado
  nesta leva — os 3 patamares de `max-w` (3xl/5xl/6xl) são intencionais,
  cada um serve um tipo de página diferente.
- **z-index: conflito real encontrado e corrigido.** `MenuAcoes.tsx` e
  `Dica.tsx` dividiam `z-40`. Testado isolado: adicionada seção
  temporária no `/ui-kit` (seção 9) com os dois lado a lado, forçando
  abrir os dois ao mesmo tempo. Confirmado visualmente por print: o
  elemento montado por último cobria o outro por acaso de ordem de
  renderização, não por design. `Dica.tsx` desceu para `z-30`.
  `MenuAcoes.tsx` e o overlay mobile da `Sidebar.tsx` permanecem em
  `z-40`. `Sheet.tsx` continua `z-50`, a camada mais alta de todas.

### Bloco 3.5g — Foco e acessibilidade (Frentes 1 e 2 CONCLUÍDAS)

Diagnóstico revelou defeitos reais, não só falta de organização:
- Regra global de foco em `index.css` usava hex antigo `#03A9F4`.
- 7 elementos com `onClick` em `<div>`/`<tr>`/`<td>`/`<label>` sem
  nenhum acesso por teclado (Tab não focava, Enter/Espaço não ativava).
- Nenhum modal move foco para dentro ao abrir nem restaura ao fechar
  (isso é a Frente 3, não feita).

**Frente 1 (concluída)** — anel de foco global trocado de
`ring-[#03A9F4]/50` para `ring-accent-bg`, alinhado ao token do design
system.

**Frente 2 (concluída)** — os 7 elementos corrigidos, cada um com a
técnica certa para o caso, não um padrão único forçado:
- `DataRow.tsx` e `Surface.tsx`: correção na primitiva (`tabIndex`,
  `role="button"`, `onKeyDown` para Enter/Espaço, tudo condicional).
  `Surface` ganhou prop nova **`interativo?: boolean`** — só ativa a
  acessibilidade quando o chamador passa `interativo` explicitamente,
  porque existem 2 usos de `Surface onClick` que são só
  `stopPropagation()` dentro de modais (`Projetos.tsx:602`,
  `ProjetoDetalhe.tsx:2179`) e não deveriam virar botão fantasma. As 3
  ocorrências de navegação em `Resumo.tsx` (cards de projeto ativo/
  encerrado/arquivado) ganharam `interativo`.
- `ModalProjeto.tsx` (switch Billable): era `<label onClick>` sem input
  real por trás. Virou `<input type="checkbox" className="sr-only
  peer">` de verdade, com `id`/`htmlFor` conectando, e
  `peer-focus-visible` estilizando o visual do switch — o HTML nativo
  resolve foco, Espaço e leitor de tela de graça.
- `ProjetoDetalhe.tsx` (card de registro, ~linha 2064): mesmo padrão do
  `DataRow`, aplicado direto no JSX da página porque é uso único.
- `Projetos.tsx` (linha de projeto, sortable/drag-and-drop): **não**
  virou a `<tr>` inteira focável — colidiria com o handle de arrastar já
  presente na linha (que usa `attributes`/`listeners` do dnd-kit) e com
  os outros 4+ controles próprios (MenuAcoes, Editar, Encerrar/Reativar,
  Excluir, Arquivar). Em vez disso, o **nome do projeto virou
  `<button>` real**, e o `onClick`/`cursor-pointer` saiu da `<tr>`.
  Efeito colateral aceito conscientemente: clicar numa área vazia da
  linha não abre mais o projeto, só clicar no nome. Testado e confirmado
  que o drag continua funcionando sem nenhuma interferência.
- `Timesheet.tsx` (duas `<td>` fazendo a mesma coisa — uma visível só no
  mobile via layout, outra com `hidden md:table-cell`): a primeira `<td>`
  (código) **não tem `hidden`**, continua presente em toda largura de
  tela. Corrigir as duas criaria dois alvos de Tab redundantes lado a
  lado no desktop. Decisão consciente: só a segunda `<td>` (nome,
  visível a partir de `md`) ganhou `role`/`tabIndex`/`onKeyDown`/anel de
  foco (`ring-inset`, porque a célula fica dentro de tabela com scroll
  horizontal e sticky). **Pendência conhecida**: seleção de linha por
  teclado não funciona no mobile ainda, só toque/clique.

**Frente 3 (não feita)** — focus trap ao abrir modal, restauração de
foco ao fechar. Nenhum modal (`ModalRegistro`, `ModalProjeto`,
`ModalConfirmacao`, `ModalLembrete`, `ModalHorarioDia`) move o foco para
dentro ao abrir ou devolve ao elemento que abriu, ao fechar. `Sheet.tsx`
move foco parcialmente (`painelRef.current?.focus()`) mas também não tem
focus-trap nem restauração — o Tab escapa para o fundo da página.
Candidata a fazer junto com o 3.5j, por ser mais arquitetural que as
frentes 1 e 2.

---

## 🔍 Varredura de layout mobile — HISTÓRICO (fechada em 30/08)

> Seção mantida como registro histórico. Os dois itens abaixo (🔴 ALTO e
> 🟡 MÉDIO) foram corrigidos na sessão de 30/08 — ver seção anterior.

Feita ao fim da sessão de 28/08, procurando o mesmo par (`break-words`
ao lado de um irmão `shrink-0` com texto longo) em todas as páginas e
componentes.

**Método: varredura dupla e independente.** O assistente varreu os arquivos
anexados ao chat; em seguida o agente varreu **o disco**, sem ver a lista do
assistente. Os dois resultados bateram nos pontos de risco.

**22 ocorrências no disco** (21 com `whitespace-normal break-words` e 1 com
as classes em ordem invertida). Classificadas:

### 🔴 ALTO — ✅ corrigido em 30/08

`src/components/BreakdownSubcategorias.tsx`, linha 55 (bloco ~50-67).
Confirmado no disco pelo agente como `RISCO-SOBREPOSICAO`.

Estrutura era idêntica à que tinha sido corrigida em `ProjetoDetalhe`
em 28/08:

```
<div className="flex justify-between items-center text-xs gap-2">
  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">   ← nome, break-words, SEM overflow-hidden
  <div className="flex items-center gap-2 sm:gap-4 shrink-0">     ← "31,00h / 50,00h" + percentual
```

Correção aplicada: `min-w-0 overflow-hidden` no span do nome, e
`items-center` → `items-start` na linha externa (para o alinhamento
vertical não ficar estranho quando o nome quebra em 2-3 linhas).
**Diferente** do Padrão B2 de ProjetoDetalhe — aqui não há `MenuAcoes`
no bloco da direita, então o mais simples (nome quebra dentro da própria
caixa, sem empilhar) resolveu sem precisar reestruturar o JSX.

### 🟡 MÉDIO — ✅ corrigido em 30/08

`src/pages/Resumo.tsx`, linha 1198 (bloco ~1194-1205, cards de Rotina).
Confirmado no disco pelo agente como `RISCO-EMPURRAO`.

Correção aplicada: `min-w-0` no bloco esquerdo (linha 1196) e
`shrink-0` no bloco direito (linha 1200). Duas classes, sem mudança
estrutural.

### 🟢 BAIXO ou seguro em 28/08 — reavaliar com o critério novo

| Local (linhas do disco em 28/08) | Por que estava marcado como seguro |
|---|---|
| `ProjetoDetalhe.tsx` 685 (balde "sem subcategoria") | Bloco direito curto (duração + %), sem "de X reservadas". Cabe. **Vigiar** se algum dia ganhar texto. |
| `ProjetoDetalhe.tsx` 1142 (nome do projeto) | Container superior com `flex-wrap` — bloco irmão desce sozinho. |
| `ProjetoDetalhe.tsx` 2069 | Chip com `max-w-[150px] sm:max-w-[200px]` e pai com `flex-wrap`. |
| `Registros.tsx` 746, 761 | Chips com `max-w-full md:max-w-[240px]` + `overflow-hidden`. |
| `Registros.tsx` 794, 798, 940, 944 | **Marcado como seguro em 28/08, mas era o defeito que apareceu no print de 30/08.** Ver "Ponto cego do critério de varredura" abaixo — a justificativa original ("irmão com `truncate min-w-0`") ignorava que o chip tinha `shrink-0` e podia esmagar o irmão até sumir. |
| `Resumo.tsx` 952, 1120 | Sem irmão competindo por espaço no container flex. |
| `Resumo.tsx` 1033 | Irmão é um `<Chip>` curto ("Encerrado"/"Excluído"); esquerda com `min-w-0`. |
| `Lembretes.tsx` 317, 419 | Pai com `min-w-0` + `overflow-hidden`; irmão só tem botões de ícone, sem texto. |
| `Timesheet.tsx` 414 / `Billable.tsx` 884, 1199 | Células `<td>` com `block`, não `flex` — sem competição por espaço. Padrão A, resolvido no Bloco 3.2. |
| `Projetos.tsx` 119 | Classes em ordem invertida (`break-words whitespace-normal`); tem `overflow-hidden` e `max-w-[200px] sm:max-w-xs md:max-w-none`. |

### ⚠️ Ponto cego do critério de varredura — descoberto em 30/08

A varredura de 28/08 procurava só **dois** modos de falha: sobreposição
(texto vaza por cima do vizinho) e empurrão (texto rígido empurra o
vizinho para fora). Faltava o **terceiro**: um irmão com `shrink-0` que
**esmaga** o vizinho de texto flexível até sobrar quase nada visível,
sem sobrepor nem ser empurrado — os dois "cabem" tecnicamente, só que um
deles vira "S...".

Foi exatamente esse terceiro modo que apareceu no print do usuário em
Registros.tsx (linhas 794, 798, 940, 944), num lugar que a varredura
tinha marcado como 🟢 seguro. A justificativa antiga — "o irmão é a
observação, com `truncate min-w-0`" — estava tecnicamente certa mas
incompleta: não considerava que o chip do outro lado tinha `shrink-0` e
podia crescer até sobrar quase nada para a observação.

**Se algum dia repetir a varredura**, incluir esse terceiro critério
explicitamente no prompt, e considerar reavaliar os itens 🟢 da tabela
acima com ele.

### ⚠️ Falso positivo registrado em 28/08 — não se assustar

O agente classificou **`ProjetoDetalhe.tsx` linha 851** como
`RISCO-SOBREPOSICAO`. Essa era a linha corrigida em 28/08. Não era
leitura errada: o irmão de fato tinha `shrink-0` com texto longo e o
nome não tinha `overflow-hidden`. O que protegia a linha estava um nível
**acima** — o wrapper novo empilha no mobile (`flex-col`) e só vira
linha em `md`, então os dois blocos nunca dividem a mesma linha no
celular.

**Lição para o próximo prompt de auditoria**: o critério precisa incluir
"verifique se algum ancestral empilha no mobile (`flex-col` +
`md:flex-row`) antes de classificar como risco". Sem isso, toda linha já
corrigida volta a aparecer como defeito.

### Ponto cego da busca por texto

O assistente encontrou 19 ocorrências buscando a sequência exata
`whitespace-normal break-words`; o agente encontrou 22, porque
`Projetos.tsx:119` escreve as duas classes **em ordem invertida**. Ao
buscar padrões de classe Tailwind, procurar cada classe separadamente e
cruzar os resultados, nunca a sequência literal.

### Lições a guardar

1. Quando uma leva troca `truncate` por `break-words` em massa (como o
   Bloco 3.3 fez), **ela não cria o defeito — ela revela defeitos de
   layout que já existiam escondidos**. Vale rodar uma varredura logo
   depois de uma leva desse tipo, em vez de esperar o usuário achar por
   acaso no celular.
2. **Varredura é tarefa do agente, não do assistente.** O agente lê o
   disco; o assistente lê cópias que podem estar atrasadas. O assistente
   pode fazer uma primeira passada como hipótese, mas a lista que vale é
   a do disco.
3. **Varredura dupla e independente vale o custo.** Rodar as duas sem o
   agente ver a lista do assistente serviu de duas coisas ao mesmo
   tempo: confirmou os riscos e provou que o pacote de arquivos do chat
   está atual.
4. **Mesmo uma varredura dupla e cuidadosa pode ter ponto cego.** O
   critério em si — não a execução — estava incompleto. Vale revisar o
   critério periodicamente, não só confiar que "já foi varrido".

---

## 🧠 Lições e padrões consolidados

### Sobre layout responsivo
- **`break-words` sem `overflow-hidden` vaza da caixa.** Quando o
  container fica mais estreito que a palavra mais longa, o texto
  transborda e sobrepõe o vizinho — flexbox não empurra nesse caso.
- **`shrink-0` num texto longo é uma bomba-relógio no mobile.** Serve
  para ícones e botões; para frases, o container precisa poder empilhar
  ou o `shrink-0` precisa estar em outro elemento.
- **`shrink-0` num irmão pode esmagar o outro até sumir, sem sobrepor
  nem ser empurrado** (novo, 30/08). É o terceiro modo de falha, além de
  sobreposição e empurrão — ver "Ponto cego do critério de varredura".
- **Padrão B (empilhar) é a resposta padrão** para cabeçalho com nome +
  métrica quando há menu de ações na linha (ele fica **fora** do bloco
  que empilha, fixo à direita). Quando não há menu de ações e a linha é
  só leitura, **Padrão A (quebrar dentro da própria caixa) é mais
  simples e mais compacto** — não empilhar por reflexo, escolher pelo
  contexto (novo, 30/08: BreakdownSubcategorias usa A, ProjetoDetalhe
  usa B2, e os dois padrões coexistem por decisão consciente).
- Ao empilhar, o bloco de baixo precisa de padding à esquerda para
  alinhar com o **texto**, não com o chevron (`pl-7` quando o chevron é
  um ícone solto de 16px + `gap-3`; `pl-3.5` quando é só um ponto de 6px
  + `gap-2`).

### Sobre entregar blocos grandes ao agente
- **Texto longo colado no chat pode truncar na passagem.** Para blocos
  de substituição total (50+ linhas), entregar como **arquivo para
  download** e instruir: "se este bloco chegar truncado, PARE e me
  avise, não complete por conta própria".
- Sempre validar a integridade do bloco antes de entregar: contar
  `<div>`/`</div>`, `<button>`/`</button>`, e conferir que a primeira e
  a última linha são as esperadas.
- **Para levas grandes (5+ arquivos ou 50+ ocorrências), pedir relatório
  E diff em PARTES NUMERADAS por arquivo** (novo, 30/08). Aplicado com
  sucesso nas 5 levas da migração de gap e nas levas de inventário de
  padding/foco — nenhuma parte truncou.

### Sobre confiar em diffs e resumos
- **Nunca aprovar em cima de resumo "antes/depois" com exemplos
  escolhidos pelo agente.** Exigir o diff completo real, dividido em
  partes se for leva grande.
- **Se o agente tenta reescrever um bloco além do pedido uma vez, não
  remendar — substituir o bloco inteiro por texto congelado.**
- Depois de qualquer incidente desse tipo, reforçar o próximo prompt com
  um aviso explícito citando o que já deu errado.
- **Um agente pode aplicar sem esperar a confirmação do Passo 3, mesmo
  quando o prompt pede para parar** (novo, 30/08, leva do Timesheet).
  Não é motivo para desconfiar automaticamente do resultado, mas exige
  conferir o diff aplicado com o mesmo rigor de sempre depois do fato.

### Sobre tokens de motion/dimensão novos
- **Testar visualmente ANTES de aplicar em massa.** HTML interativo com
  sliders é mais eficiente que descrever em texto.
- Elementos com percurso visual longo (barra de progresso) precisam de
  duração bem maior que micro-interações (chevron, switch).
- **Inventário por IA erra ao juntar prefixo de breakpoint com valor**
  quando duas classes da mesma família aparecem na mesma linha (novo,
  30/08). Ex.: `className="gap-2 sm:gap-3"` já foi lido incorretamente
  como contendo `sm:gap-2`. Sempre pedir para o agente confirmar
  prefixo+valor isoladamente quando isso aparecer, e desconfiar de
  totais que não batem entre dois inventários do mesmo arquivo.
- **Um inventário pode estar certo na contagem total e ainda errar na
  atribuição por linha** (novo, 30/08). Vale pedir uma segunda
  contagem por valor (não só por arquivo) quando a decisão de token
  depender de precisão fina — a soma bater com o total não garante que
  cada linha individual está certa.

### Sobre decisões visuais
- **Sempre entregar HTML para download** quando houver decisão de
  layout, cor ou espaçamento — o renderizador de widget do chat falha
  com frequência. HTML estático para tamanho/espaço/cor; HTML
  interativo com sliders para animação.
- Mostrar as opções **na largura real do alvo** (360px para celular) e
  com os dados reais do usuário, não com texto de exemplo.
- **Para decidir entre dois COMPORTAMENTOS de teclado/foco (não só
  visual), montar o teste dentro do próprio `/ui-kit` em vez de só
  descrever** (novo, 30/08). Foi assim que o conflito de z-index entre
  MenuAcoes e Dica foi confirmado — nenhum dos dois estava em uso lado a
  lado em tela real, então uma seção temporária isolada no `/ui-kit`
  serviu de laboratório sem arriscar nenhuma tela do app.

### Sobre criar vs. mexer em arquivo protegido
- `src/index.css` e `tailwind.config.js` são protegidos por padrão, mas
  o Bloco 3.5 precisa mexer neles com frequência — sempre dar
  **autorização excepcional explícita** no prompt, escopada ao ponto
  exato (nunca "pode editar o arquivo", sempre "pode adicionar estas N
  variáveis neste bloco específico").

### Sobre acessibilidade e foco (novo, 30/08)
- **`onClick` numa `<div>`/`<span>`/`<tr>`/`<td>`/`<label>` sem
  `tabIndex`+`role`+`onKeyDown` é invisível para quem navega só com
  teclado.** Não é estético, é funcional — a ação simplesmente não
  existe para essa pessoa.
- **A correção certa depende do papel semântico do elemento, não é um
  padrão único.** `<div>`/card genérico → `tabIndex`+`role="button"`+
  `onKeyDown`. Switch visual sem input real → trocar por
  `<input type="checkbox" className="sr-only peer">` de verdade, nunca
  simular com `onClick` manual. `<tr>`/`<td>` dentro de tabela → cuidado
  redobrado, porque forçar `role="button"` pode confundir a semântica de
  tabela para leitor de tela; às vezes a solução certa é mover o alvo
  para um elemento específico dentro da linha (o nome, por exemplo) em
  vez da linha inteira.
- **Antes de tornar um elemento clicável focável, verificar se ele já
  contém outros controles interativos próprios** (drag-and-drop, menu,
  botões de ação com `stopPropagation`). Se contiver, tornar o elemento
  pai inteiro focável cria redundância ou conflito — melhor mover o novo
  foco para um alvo específico e menor dentro dele.
- **Quando dois elementos fazem a mesma coisa em breakpoints diferentes
  (uma versão mobile, uma desktop), verificar se as duas coexistem no
  DOM ao mesmo tempo** antes de tornar as duas focáveis — senão o Tab no
  desktop passa duas vezes pela mesma ação.
- **Uma primitiva que aceita `onClick` via `...rest` (spread de props
  HTML) pode estar sendo usada para navegação em um lugar e para
  `stopPropagation()` de contenção em outro** — os dois têm a mesma
  assinatura de props e são impossíveis de distinguir automaticamente.
  A solução é uma prop explícita (`interativo`, no caso de `Surface`)
  que o chamador declara, em vez de a primitiva adivinhar pela presença
  de `onClick`.

---

## 🎯 Próximos passos dentro do Bloco 3.5

**3.5g Frente 3** — foco em modais. Nenhum modal (`ModalRegistro`,
`ModalProjeto`, `ModalConfirmacao`, `ModalLembrete`, `ModalHorarioDia`)
move o foco para dentro ao abrir; `Sheet.tsx` faz isso parcialmente
(`painelRef.current?.focus()`) mas sem focus-trap (Tab escapa para o
fundo da página) e sem restaurar o foco ao fechar. Candidata a fazer
junto com o 3.5j.

**3.5h — Movimento.** Checar primeiro se já está coberto pelo 3.5b-2
(duração de transição, já feito e calibrado) antes de assumir que
precisa de trabalho novo.

**3.5i — Densidade (multiplicador global).** Marcado desde a sessão de
28/08 como "decisão de design nova, não só arrumação" — mostrar visual
antes de qualquer prompt de implementação.

**3.5j — Camada de padrões** (`Secao`, `PageHeader`, `EmptyState`).
Boa candidata para juntar com a Frente 3 do 3.5g, já que ambas mexem em
estrutura de componente, não só em classe CSS.

---

## 🏗️ Stack e ambiente

React 19 + TypeScript + Tailwind CSS 3.4.19 + Vite + Supabase.
Deploy na Vercel, automático a cada push. Repositório
`github.com/williamlopix-ai/horas-app`. Produção em `horas-app-nine.vercel.app`.
Local: Windows + PowerShell.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Tema por atributo `data-theme`, **nunca** pelo modificador `dark:`.

### Testar no celular

```powershell
npm run dev -- --host
```
Usar a linha **Network**. É `http`, então o PWA não instala e o service
worker não registra — bom para testar layout sem cache velho.

**Testar com dados reais e compridos.** Nomes curtos escondem defeitos
de layout — os exemplos desta sessão e da anterior só apareceram com
nome de projeto/categoria/rotina comprido.

### Mexeu em tailwind.config.js ou index.css?

**Reiniciar `npm run dev`** (Ctrl+C e rodar de novo) — o Tailwind só lê a
config na subida, sem erro nem aviso se a classe simplesmente não existir.
Depois, `Ctrl+Shift+R` (ou `Ctrl+F5`) no navegador para limpar cache de CSS.

Exceção: se a leva só usa classes que **já existem** desde uma leva
anterior (ex.: aplicar `gap-md` numa tela nova, quando o token `gap-md`
já foi criado em leva passada), não precisa reiniciar — só limpar cache
do navegador.

---

## 🔄 Protocolo de sessão

### Início
1. Colar o conteúdo deste `HANDOFF.md`.
2. Rodar o script de empacotamento e anexar os arquivos gerados.
3. Confirmar a branch: `git status`.

### Fim
1. Rodar o script de empacotamento de novo (os arquivos mudaram).
2. Pedir o `HANDOFF.md` reescrito, **com o painel atualizado**.
3. Substituir na raiz do repositório e commitar.

### Script de empacotamento (PowerShell)

```powershell
$origem  = "C:\Users\Mattos\Documents\HORAS-APP"
$destino = "$env:USERPROFILE\Desktop\HORAS-CONTEXTO"

Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $destino | Out-Null

Get-ChildItem "$origem\src" -Recurse -File -Include *.ts,*.tsx,*.css |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $rel  = $_.FullName.Substring("$origem\src\".Length)
    $nome = $rel -replace "\\", "_"
    Copy-Item $_.FullName -Destination (Join-Path $destino $nome)
  }

"HANDOFF.md","AGENTS.md","RESPONSIVO.md","tailwind.config.js" | ForEach-Object {
  $caminho = Join-Path $origem $_
  if (Test-Path $caminho) {
    Copy-Item $caminho -Destination (Join-Path $destino ($_ -replace "\.config\.", "_config."))
  }
}

Write-Host "Pronto:" (Get-ChildItem $destino).Count "arquivos em $destino"
explorer $destino
```

> Os arquivos anexados ao projeto do chat podem estar **vários commits
> atrasados**. Rodar o script antes de cada sessão.

---

## 🤖 Trabalhando com o Antigravity (Gemini)

Modelos disponíveis: Gemini 3.7/3.6/3.5 Flash (Low/Medium/High) e Gemini
3.1 Pro (Low/High). Preferir sempre o Flash mais novo (hoje 3.7).

| Complexidade | Modelo |
|---|---|
| Baixa — CSS pontual, renomeação, correção TS single-file | 3.7 Flash (Low) |
| Média — multi-arquivo, ou single-file com mudança estrutural | 3.7 Flash (Medium) |
| Alta — telas novas, UI complexa | 3.7 Flash (High) |
| Arquitetura leve | 3.1 Pro (Low) |
| Arquitetura — banco, migrations, triggers | 3.1 Pro (High) |

**Conversa nova** sempre que criar arquivo novo, virar de contexto
arquitetural, ou depois de um incidente de reescrita não autorizada.
Confirmado de novo em 30/08: usar conversa nova por leva, mesmo quando
consecutivas, mantém os relatórios precisos.

### Estrutura de prompt que funciona

```
## Contexto            (stack, branch, arquivo alvo, regra de negócio)
## Passo 1 — LER ANTES DE EDITAR
## Passo 2 — RELATÓRIO (perguntas que forcem citar o disco)
## Passo 3 — Edição (só após confirmação)
## O que NÃO pode mudar
## Restrições
## Critério de aceite
```

Para **substituição total de bloco**, o Passo 2 deve incluir a pergunta:
"o bloco do disco é idêntico, caractere por caractere, ao bloco ANTES
transcrito abaixo? Se houver qualquer diferença, transcreva a linha
divergente e PARE." Funcionou nas correções de 28/08.

Para **levas grandes** (5+ arquivos, 50+ ocorrências), pedir relatório e
diff em **partes numeradas por arquivo**, com um resumo consolidado
(total, contagem por valor) ao final do relatório. Usado com sucesso em
todas as 5 levas de migração de gap desta sessão.

### O agente nunca
- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
  (inclusive leitura: `git diff`, `git status`, `ls`, `cat`, `grep`) — se
  tentar, recusar pela opção "No, tell the agent what to do instead" e
  reafirmar a regra. Já tentou algumas vezes em sessões anteriores.
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado
- cria arquivo auxiliar/script para fazer contagem (aconteceu uma vez em
  30/08, num inventário de gap — o agente criou um `.js` de análise numa
  pasta de scratch própria dele, fora do repositório; não teve
  consequência, mas o prompt deveria proibir isso explicitamente, o que
  passou a ser feito nas levas seguintes)

### Lições de validação
- **Nunca aprovar em cima do resumo do agente.** Exigir o diff completo.
- **A tela é o juiz.** Testar visualmente sempre, mesmo com diff limpo e
  `tsc` sem erro.
- **Duas correções sem efeito = parar e substituir o bloco inteiro.**
- **Comparar o aplicado com o especificado**, não só ler o diff
  procurando erro.
- **Um agente pode reportar um número (contagem, total) que não bate
  com um inventário anterior do mesmo arquivo.** Antes de assumir que um
  dos dois está errado, pedir para o agente reler a linha específica
  divergente e explicar a diferença — na maioria dos casos de 30/08 foi
  erro de atribuição de prefixo, não de contagem.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- Um commit por leva. Nesta sessão (30/08), na ordem:
  - `fix: observacao em painel no toque e conserto da largura da etiqueta de categoria`
  - `UI: primitiva Dica com portal e amostra no ui-kit`
  - `Registros: dica estilizada na observacao no lugar do title nativo`
  - `fix: nome de subcategoria quebra dentro da caixa no mobile`
  - `fix: nome de rotina nao empurra o bloco de numeros no mobile`
  - `tokens: escala de gap em seis niveis`
  - `tokens: migra gap para escala nomeada nas primitivas e componentes pequenos`
  - `tokens: migra gap na navegacao e nos modais`
  - `tokens: migra gap nas paginas medias`
  - `tokens: migra gap em Registros e Ajustes`
  - `tokens: migra gap em Resumo e ProjetoDetalhe`
  - `tokens: cria escala de espacamento de controle (ctl-sm, ctl-md, ctl-aba)`
  - `tokens: aplica escala de padding de controle em Button e Field`
  - `tokens: aplica escala de padding de controle nas abas e toggles`
  - `fix: anel de foco global usa token accent-bg em vez do hex ciano legado`
  - `fix: DataRow com onClick agora e acessivel por teclado`
  - `fix: Surface interativo permite foco e ativacao por teclado nos cards de projeto`
  - `fix: switch Billable usa checkbox real, acessivel por teclado e leitor de tela`
  - `fix: card de registro em ProjetoDetalhe acessivel por teclado`
  - `fix: Dica sobe camada abaixo de MenuAcoes para evitar conflito de z-index`
  - `fix: nome do projeto vira botao real, acessivel por teclado, sem afetar arrastar`
  - `fix: coluna Nome do Timesheet acessivel por teclado no desktop`

Para localizar um ponto de retorno: `git log --oneline`.

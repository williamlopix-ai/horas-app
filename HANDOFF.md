# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **28/08/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 🚨 COMECE POR AQUI NA PRÓXIMA SESSÃO

A sessão de 28/08 fechou duas correções de mobile em `ProjetoDetalhe.tsx` e
terminou com uma **varredura do mesmo defeito no resto do app**. O resultado
da varredura está na seção "Varredura de layout mobile" mais abaixo.

**Primeira tarefa da próxima sessão: atacar o item 🔴 ALTO da varredura**
(`components/BreakdownSubcategorias.tsx`). Depois o 🟡 MÉDIO
(`Resumo.tsx`, cards de Rotina). Só então voltar ao Bloco 3.5.

✅ A varredura foi feita **duas vezes**: pelo assistente sobre os arquivos
anexados ao chat, e depois pelo agente **lendo o disco**, de forma
independente. Os dois resultados bateram. Números de linha abaixo são os
do disco, pós-correções de 28/08.

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%
BLOCO 3 — Responsivo                 ████████████ 100%

CORREÇÕES DE MOBILE (fora de bloco)  ████████░░░░  66%  ← ATUAL
  ✅ Cabeçalho de fase empilha no mobile        (ProjetoDetalhe)
  ✅ Linha de subcategoria empilha no mobile    (ProjetoDetalhe)
  ⬜ 🔴 BreakdownSubcategorias — mesmo defeito   ← PRÓXIMA
  ⬜ 🟡 Resumo, cards de Rotina — falta min-w-0

BLOCO 3.5 — Fundações de design      ███░░░░░░░░░  25%
  ✅ 3.5a  Inventário de valores no disco
  ✅ 3.5b  Camada primitiva + convenção de nome
      ✅ 3.5b-1  Raio de borda
      ✅ 3.5b-2  Duração de transição (consolidada + CALIBRADA)
  ✅ 3.5c  Dimensão — tamanho de ícone (icon-xs a icon-xl)
  ⬜ 3.5c  Dimensão — gap entre elementos
  ⬜ 3.5c  Dimensão — espaçamento de controle (py/px)
           ⚠️ decisão de design nova, não é só arrumação — ver visual antes
  ⬜ 3.5f  Borda, opacidade, z-index, container
  ⬜ 3.5g  Foco e acessibilidade
  ⬜ 3.5h  Movimento — pode já estar coberto por 3.5b-2
  ⬜ 3.5i  Densidade (multiplicador global)
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
```

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## ✅ O que foi feito nesta sessão (28/08/2026)

Sessão curta e reativa: o usuário abriu o app no celular (um Android e um
iPhone) e trouxe fotos de dois defeitos de layout. Os dois tinham a mesma
causa raiz.

### O defeito, em uma frase

**Texto longo marcado como "não pode encolher" (`shrink-0`) ao lado de um
nome que pode quebrar linha (`whitespace-normal break-words`), dentro de
uma linha `flex` estreita.** O bloco fixo toma quase toda a largura, o nome
é comprimido a quase zero e — sem `overflow-hidden` — o texto vaza da caixa
e passa por cima do vizinho.

A causa é anterior ao Bloco 3.3. O que o 3.3 fez foi trocar `truncate` por
`break-words`: antes o nome era cortado com reticências e o defeito ficava
**escondido** (o nome simplesmente sumia); depois ele passou a quebrar e o
problema virou visível.

### Correção 1 — Cabeçalho de fase (ProjetoDetalhe.tsx ~1438)

Sintoma: o nome da fase quebrava **uma letra por linha** ("F / a / s / e"),
com "31,00h de 50h previstas" ocupando a linha inteira ao lado.

Diferença entre Android e iPhone era só largura de tela: no iPhone quebrava
em pedaços de 4-5 letras, no Android letra a letra. Mesmo defeito.

Solução (Padrão B do `RESPONSIVO.md`): no mobile o cabeçalho empilha — nome
em cima ocupando a largura toda, horas embaixo com `pl-7` para alinhar com o
texto e não com o chevron. A partir de `md`, volta ao lado a lado com
`text-ellipsis`. **5 classes de layout, zero mudança estrutural.**

O menu de três pontinhos já estava fora do bloco empilhado, então não se
moveu.

### Correção 2 — Linha de subcategoria (ProjetoDetalhe.tsx 834-920)

Sintoma: "Análise Documental Apoio Sarah" **sobrepondo** o texto
"31,00h de 50h reservadas". Só aparecia numa fase — é a única com nome de
categoria comprido **e** horas reservadas (o que faz o texto da direita
crescer).

Aqui o menu de três pontinhos estava **dentro** do bloco da direita, então
empilhar levaria ele junto. Duas saídas foram desenhadas em HTML e
apresentadas ao usuário:

- **B1** — dados e menu descem juntos. Mudança pequena (3 classes), mas cria
  dois comportamentos diferentes para o mesmo problema na mesma tela.
- **B2** — igual ao cartão da fase: menu fixo à direita. Mudança maior
  (o `MenuAcoes` sai de dentro do ternário `isEditingReserva`).

**Escolhida a B2**, por consistência com a correção 1.

Como envolvia mover JSX entre níveis, foi feita por **substituição total de
bloco com JSX literal congelado** (protocolo pós-incidente 3.5b-1), não por
edição incremental. Estrutura final:

```
linha (flex, items-start md:items-center)
├── chevron (ou span vazio)          ← saiu do bloco esquerdo
├── wrapper novo (empilha no mobile, vira linha em md)
│   ├── ponto + nome + badge "sem reserva"
│   └── dados (horas + % OU input de edição de reserva)
└── MenuAcoes                        ← saiu do ternário isEditingReserva
```

O menu ficou guardado por `{!isEditingReserva && !isBaldeSemSub && (...)}`,
que é a mesma condição efetiva de antes.

**Resultado: o bloco aplicado bateu caractere por caractere com o
especificado.** Zero desvio.

### Dois comportamentos do agente que valem registro

1. **O bloco DEPOIS chegou truncado** ao agente na primeira tentativa. Ele
   **parou e avisou** em vez de completar por conta própria — exatamente o
   comportamento que os prompts vêm tentando forçar desde a 3.5b-1.
   A solução foi entregar o bloco como **arquivo para download** em vez de
   texto colado no chat.
2. **O agente tentou rodar `npx tsc -b` de novo** (segunda vez, depois da
   3.5c). Recusado pela opção "No, tell the agent what to do instead".
   A regra segue absoluta.

---

## 🔍 Varredura de layout mobile — RESULTADO

Feita ao fim da sessão, procurando o mesmo par (`break-words` ao lado de um
irmão `shrink-0` com texto longo) em todas as páginas e componentes.

**Método: varredura dupla e independente.** O assistente varreu os arquivos
anexados ao chat; em seguida o agente varreu **o disco**, sem ver a lista do
assistente. Os dois resultados bateram nos pontos de risco.

**22 ocorrências no disco** (21 com `whitespace-normal break-words` e 1 com
as classes em ordem invertida). Classificadas:

### 🔴 ALTO — atacar primeiro

**`src/components/BreakdownSubcategorias.tsx`, linha 55** (bloco ~50-67).
Confirmado no disco pelo agente como `RISCO-SOBREPOSICAO`.

Estrutura **idêntica** à que acabou de ser corrigida em `ProjetoDetalhe`:

```
<div className="flex justify-between items-center text-xs gap-2">
  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">   ← nome, break-words, SEM overflow-hidden
  <div className="flex items-center gap-2 sm:gap-4 shrink-0">     ← "31,00h / 50,00h" + percentual
```

O texto da direita é `${duracaoFormatada} / ${alocadoFormatado}` quando há
alocação — mesmo tamanho do caso já corrigido. **Praticamente certo que
reproduz a mesma sobreposição.**

Agravante: o componente é usado em **duas telas** — `Resumo.tsx` e
`ProjetoDetalhe.tsx`. Uma correção resolve os dois lugares.

Solução recomendada: mesmo Padrão B2 já aplicado, adaptado — aqui **não há
`MenuAcoes`** no bloco da direita, o que torna a mudança bem mais simples
que a Correção 2. Provavelmente basta envolver os dois blocos num wrapper
que empilha no mobile.

### 🟡 MÉDIO — atacar depois

**`src/pages/Resumo.tsx`, linha 1198** (bloco ~1194-1205, cards de Rotina).
Confirmado no disco pelo agente como `RISCO-EMPURRAO`.

```
<div className="flex items-center justify-between ...">
  <div className="flex items-center gap-4">            ← FALTA min-w-0
  <div className="flex items-center gap-4 text-right"> ← horas + "N registros" (w-[70px]) + chevron
```

Falha diferente: sem `min-w-0` o nome não encolhe e **empurra** o bloco da
direita, em vez de ser sobreposto por ele. O bloco direito mede ~150px e não
tem `shrink-0`, então parte dele encolhe — mas o `w-[70px]` do contador de
registros é rígido. Sintoma esperado: aperto ou estouro lateral com nome de
rotina longo.

Correção provável: adicionar `min-w-0` ao bloco esquerdo. Verificar
visualmente com uma rotina de nome comprido antes de decidir se precisa
empilhar.

### 🟢 BAIXO ou seguro — não mexer agora

| Local (linhas do disco) | Por que está seguro |
|---|---|
| `ProjetoDetalhe.tsx` 685 (balde "sem subcategoria") | Mesma estrutura do defeito, mas o bloco direito é curto (duração + %), sem "de X reservadas". Cabe. **Vigiar** se algum dia ganhar texto. |
| `ProjetoDetalhe.tsx` 1142 (nome do projeto) | O container superior tem `flex-wrap` — o bloco irmão desce sozinho. |
| `ProjetoDetalhe.tsx` 2069 | Chip com `max-w-[150px] sm:max-w-[200px]` e pai com `flex-wrap`. |
| `Registros.tsx` 746, 761 | Chips com `max-w-full md:max-w-[240px]` + `overflow-hidden`. |
| `Registros.tsx` 794, 798, 940, 944 | Chips com `max-w-full`; o irmão é a observação, com `truncate min-w-0`. |
| `Resumo.tsx` 952, 1120 | Sem irmão competindo por espaço no container flex. |
| `Resumo.tsx` 1033 | Irmão é um `<Chip>` curto ("Encerrado"/"Excluído"); esquerda com `min-w-0`. |
| `Lembretes.tsx` 317, 419 | Pai com `min-w-0` + `overflow-hidden`; o irmão só tem botões de ícone, sem texto. |
| `Timesheet.tsx` 414 / `Billable.tsx` 884, 1199 | Células `<td>` com `block`, não `flex` — não há competição por espaço. Padrão A, resolvido no Bloco 3.2. |
| `Projetos.tsx` 119 | Classes em **ordem invertida** (`break-words whitespace-normal`); tem `overflow-hidden` e `max-w-[200px] sm:max-w-xs md:max-w-none`. |

### ⚠️ Falso positivo registrado — não se assustar

O agente classificou **`ProjetoDetalhe.tsx` linha 851** como
`RISCO-SOBREPOSICAO`. **Essa é a linha corrigida em 28/08.** Não é leitura
errada: o irmão de fato tem `shrink-0` com texto longo e o nome não tem
`overflow-hidden`. O que protege a linha está um nível **acima** — o wrapper
novo empilha no mobile (`flex-col`) e só vira linha em `md`, então os dois
blocos nunca dividem a mesma linha no celular.

**Lição para o próximo prompt de auditoria**: o critério precisa incluir
"verifique se algum ancestral empilha no mobile (`flex-col` + `md:flex-row`)
antes de classificar como risco". Sem isso, toda linha já corrigida volta a
aparecer como defeito.

### Ponto cego da busca por texto

O assistente encontrou 19 ocorrências buscando a sequência exata
`whitespace-normal break-words`; o agente encontrou 22, porque
`Projetos.tsx:119` escreve as duas classes **em ordem invertida**. Ao buscar
padrões de classe Tailwind, procurar cada classe separadamente e cruzar os
resultados, nunca a sequência literal.

### Lições a guardar

1. Quando uma leva troca `truncate` por `break-words` em massa (como o Bloco
   3.3 fez), **ela não cria o defeito — ela revela defeitos de layout que já
   existiam escondidos**. Vale rodar uma varredura logo depois de uma leva
   desse tipo, em vez de esperar o usuário achar por acaso no celular.
2. **Varredura é tarefa do agente, não do assistente.** O agente lê o disco;
   o assistente lê cópias que podem estar atrasadas. O assistente pode fazer
   uma primeira passada como hipótese, mas a lista que vale é a do disco.
3. **Varredura dupla e independente vale o custo.** Rodar as duas sem o
   agente ver a lista do assistente serviu de duas coisas ao mesmo tempo:
   confirmou os riscos e provou que o pacote de arquivos do chat está atual
   (os números de linha divergiram exatamente no delta das correções do dia,
   e em nada mais).

---

## 🧠 Lições e padrões consolidados

### Sobre layout responsivo (novo nesta sessão)
- **`break-words` sem `overflow-hidden` vaza da caixa.** Quando o container
  fica mais estreito que a palavra mais longa, o texto transborda e sobrepõe
  o vizinho — flexbox não empurra nesse caso.
- **`shrink-0` num texto longo é uma bomba-relógio no mobile.** Serve para
  ícones e botões; para frases, o container precisa poder empilhar.
- **Padrão B (empilhar) é a resposta padrão** para cabeçalho com nome +
  métrica. Se houver menu de ações na linha, ele fica **fora** do bloco que
  empilha, fixo à direita.
- Ao empilhar, o bloco de baixo precisa de padding à esquerda para alinhar
  com o **texto**, não com o chevron (`pl-7` quando o chevron é um ícone
  solto de 16px + `gap-3`; `pl-3.5` quando é só um ponto de 6px + `gap-2`).

### Sobre entregar blocos grandes ao agente
- **Texto longo colado no chat pode truncar na passagem.** Para blocos de
  substituição total (50+ linhas), entregar como **arquivo para download** e
  instruir: "se este bloco chegar truncado, PARE e me avise, não complete
  por conta própria".
- Sempre validar a integridade do bloco antes de entregar: contar
  `<div>`/`</div>`, `<button>`/`</button>`, e conferir que a primeira e a
  última linha são as esperadas.

### Sobre confiar em diffs e resumos
- **Nunca aprovar em cima de resumo "antes/depois" com exemplos escolhidos
  pelo agente.** Exigir o diff completo real, dividido em partes se for
  leva grande.
- **Se o agente tenta reescrever um bloco além do pedido uma vez, não
  remendar — substituir o bloco inteiro por texto congelado.**
- Depois de qualquer incidente desse tipo, reforçar o próximo prompt com um
  aviso explícito citando o que já deu errado.

### Sobre tokens de motion/dimensão novos
- **Testar visualmente ANTES de aplicar em massa.** HTML interativo com
  sliders é mais eficiente que descrever em texto.
- Elementos com percurso visual longo (barra de progresso) precisam de
  duração bem maior que micro-interações (chevron, switch).

### Sobre decisões visuais
- **Sempre entregar HTML para download** quando houver decisão de layout,
  cor ou espaçamento — o renderizador de widget do chat falha com
  frequência. HTML estático para tamanho/espaço/cor; HTML interativo com
  sliders para animação.
- Mostrar as opções **na largura real do alvo** (360px para celular) e com
  os dados reais do usuário, não com texto de exemplo.

### Sobre criar vs. mexer em arquivo protegido
- `src/index.css` e `tailwind.config.js` são protegidos por padrão, mas o
  Bloco 3.5 precisa mexer neles — sempre dar **autorização excepcional
  explícita** no prompt, escopada ao ponto exato.

---

## 🎯 Depois da varredura: 3.5c — Gap entre elementos

Ainda dentro da categoria "Dimensão" do Bloco 3.5. Pelo inventário 3.5a, os
valores observados (`gap-1` a `gap-8`) sugerem 4 níveis semânticos:

- `gap-inline` (~gap-1.5) — ícone + texto
- `gap-group` (~gap-2/3) — botões agrupados, ações em linha
- `gap-form` (~gap-4) — campos de formulário lado a lado
- `gap-grid` (~gap-6) — cards e seções maiores

**Antes de aplicar em massa**: gerar inventário específico (arquivo por
arquivo, contagem por valor) e decidir os 4 valores com calma. Gap não
deveria precisar de recalibração visual como duração — é espaçamento
estático, não sensação de movimento.

Depois de gap vem **espaçamento de controle** (padding de botões/inputs),
a categoria mais delicada do Bloco 3.5 — decisão de design nova, não só
arrumação de token existente. Merece mockup visual antes de qualquer
aplicação.

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

**Testar com dados reais e compridos.** Os dois defeitos desta sessão só
apareceram em uma fase específica, a única com nome longo e horas
reservadas. Nome curto esconde o problema.

### Mexeu em tailwind.config.js ou index.css?

**Reiniciar `npm run dev`** (Ctrl+C e rodar de novo) — o Tailwind só lê a
config na subida, sem erro nem aviso se a classe simplesmente não existir.
Depois, `Ctrl+Shift+R` no navegador para limpar cache de CSS.

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
divergente e PARE." Funcionou nas duas correções desta sessão.

### O agente nunca
- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
  (inclusive leitura: `git diff`, `git status`, `ls`, `cat`, `grep`) — se
  tentar, recusar pela opção "No, tell the agent what to do instead" e
  reafirmar a regra. **Já tentou duas vezes** (3.5c e 28/08).
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado

### Lições de validação
- **Nunca aprovar em cima do resumo do agente.** Exigir o diff completo.
- **A tela é o juiz.** Testar visualmente sempre, mesmo com diff limpo e
  `tsc` sem erro.
- **Duas correções sem efeito = parar e substituir o bloco inteiro.**
- **Comparar o aplicado com o especificado**, não só ler o diff procurando
  erro. Nesta sessão a comparação foi literal (arquivo contra arquivo) e
  deu diferença zero.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- Um commit por correção:
  - `fix: cabecalho de fase empilha no mobile em ProjetoDetalhe`
  - `fix: linha de subcategoria empilha no mobile em ProjetoDetalhe`

Para localizar um ponto de retorno: `git log --oneline`.

# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **27/08/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%
BLOCO 3 — Responsivo                 ████████████ 100%  ✅ FECHADO HOJE

BLOCO 3.5 — Fundações de design      ███░░░░░░░░░  25%   ← ATUAL
  ✅ 3.5a  Inventário de valores no disco
  ✅ 3.5b  Camada primitiva + convenção de nome
      ✅ 3.5b-1  Raio de borda (rounded-lg/xl/2xl/md → tokens do DS)
      ✅ 3.5b-2  Duração de transição (consolidada + CALIBRADA visualmente)
  ✅ 3.5c  Dimensão — tamanho de ícone (icon-xs a icon-xl, 5 níveis)
  ⬜ 3.5c  Dimensão — gap entre elementos                 ← PRÓXIMA
  ⬜ 3.5c  Dimensão — espaçamento de controle (py/px)
           ⚠️ decisão de design nova, não é só arrumação — ver visual antes
  ⬜ 3.5f  Borda, opacidade, z-index, container
  ⬜ 3.5g  Foco e acessibilidade
  ⬜ 3.5h  Movimento (espacial x efeito) — pode já estar coberto por 3.5b-2
  ⬜ 3.5i  Densidade (multiplicador global)
  ⬜ 3.5j  Camada de padrões (Secao, PageHeader, EmptyState)
  ⬜ 3.5k  Prancheta no /ui-kit
  ⬜ 3.5l  Guarda contra regressão + varredura final

BLOCO 4 — Estética                   ░░░░░░░░░░░░   0%   ← O ÚLTIMO
  ⬜ 4.1  Primitiva Secao (h2 soltos: Fases, Plano semanal, Lançamentos)
  ⬜ 4.2  Hierarquia de elevação (todo Surface está em elevacao={1})
  ⬜ 4.3  Cor do projeto como identidade (--proj-* além da bolinha 8px)
  ⬜ 4.4  Movimento — zero animação de entrada/saída existe hoje
  ⬜ 4.5  Bordas de estado suaves

AVULSAS — fora de bloco
  ⬜ Seletor de tema em Ajustes
  ✅ Três pontinhos na linha de Projetos        (resolvido em 3.4c)
  ⬜ Esc não fecha o ModalLembrete
  ⬜ Arquivados invisíveis + exclusão real de projeto
  ⬜ Contagem de lembretes na sidebar não atualiza
  ✅ Toast cobre o botão do canto superior direito  (resolvido em 3.4g)
  ⬜ Lançar horas em um toque no celular  (não bloqueante)
  ⬜ Correção do Billable (getFooterClass usa 8.5 literal) — adiada
```

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## ✅ O que foi feito nesta sessão (27/08/2026)

Sessão longa: fechou o Bloco 3 inteiro e abriu + avançou o Bloco 3.5.

### Executor: voltou a ser Antigravity/Gemini
A cota do Gemini no Antigravity voltou. Claude Code fica em reserva só
para quando a cota esgotar de novo. Prompts voltaram ao formato padrão
(mapa de modelos Gemini, estrutura de três passos), não mais o formato
enxuto de Claude Code.

### 3.3c — ProjetoDetalhe + Lembretes (fechou a 3.3)
5 pontos de `truncate` → `whitespace-normal break-words overflow-hidden
md:whitespace-nowrap md:text-ellipsis`. Limpo, sem retrabalho.

### Bloco 3.4 inteiro — Alvos de 44px e safe area (7 levas)
- **3.4a** — Inventário: 8 alvos ALTA, 12 MÉDIA, 3 BAIXA, 2 gaps de safe
  area. Relatório completo na conversa de 27/08.
- **3.4c** — `MenuAcoes` (gatilho de 3 pontinhos) subiu de 32px para 44px
  — efeito em 5 lugares do app de uma vez (Sidebar, ProjetoDetalhe×4).
  Em Projetos.tsx no mobile, os 3 botões (Editar/Encerrar/Excluir) viram
  um `MenuAcoes` abaixo de 768px; desktop continua com os 3 botões.
  **Bug pós-leva**: o menu abriu cortado à esquerda e o gatilho sumia no
  primeiro card — causa era o `MenuAcoes` posicionado numa célula
  `col-span-2` separada em vez de ao lado do status. Corrigido movendo
  para o lugar certo.
- **3.4d** — 6 itens ALTA restantes: Lembretes (3 botões), drag handle
  de Projetos, paleta de 12 cores em ModalProjeto, switch Billable,
  botão Voltar, chevron de subcategoria (incluindo o `<span>` vazio do
  "sem lançamento", para preservar alinhamento entre linhas).
- **3.4e** — 7 itens MÉDIA: hambúrguer da Sidebar, X do Toast, X de 5
  modais — mesmo padrão repetido, sem incidente.
- **3.4f** — 9 itens MÉDIA: Tipo/Status em ModalProjeto, abas
  Projetos/Rotina, botões de texto em ProjetoDetalhe, cabeçalhos
  colapsáveis, itens de lançamento, X de limpar filtro no Timesheet
  (resolvido posicionamento absoluto sem sobrepor o input), toggle
  Resolvidos, switches do Resumo.
- **3.4g** — 2 itens BAIXA (Ajustes) + os 2 gaps de safe area: Toast com
  `style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}` e rodapé
  dos 4 modais com `paddingBottom` equivalente — sintaxe CSS puro via
  style inline, igual ao padrão já usado no `body`/`aside` do
  `index.css` (não classe Tailwind arbitrária).

**Bloco 3 fechado.** Ver painel acima.

### 3.5a — Inventário de valores no disco (Bloco 3.5, novo)
Relatório completo com contagem de uso por valor (padding, gap, raio de
borda, duração, tamanho de ícone) e recomendação de níveis para cada
categoria. Confirmou que raio de borda e duração já tinham tokens
prontos (`rounded-ctl`, `duration-d1/d2/d3`) — só faltava consolidar os
residuais. Tamanho de ícone e gap ainda não tinham token nenhum.

### 3.5b-1 — Raio de borda (60 ocorrências, 17 arquivos)
`rounded-lg/xl/2xl/md` → `rounded-ctl/card/sheet`, sem tocar em
`rounded-full`. **Incidente**: o Gemini reescreveu o bloco
`ProjetoRowItem` em `Projetos.tsx` por conta própria (trocou `<span>`
por `<Chip>` sem importar, removeu a prop `rotulo` do `MenuAcoes`) —
quebrou o `tsc`, e o diff apresentado não mostrava essa mudança. A
primeira tentativa de correção (pedir para "adicionar de volta" o que
faltava) **também falhou** — o agente regenerou o bloco de novo, com
`Chip tom="aviso"` (valor inválido) e o `MenuAcoes` mal posicionado.
**O que resolveu**: abandonar a edição incremental e mandar substituição
total do bloco, colando o JSX exato já validado nas levas 3.4c/3.4d,
com instrução "não invente, não ajuste, substitua exatamente por isto".
Ver lição completa na memória do projeto.

### 3.5b-2 — Duração de transição (consolidada + recalibrada)
Primeira rodada: `duration-200/300/500` → `duration-d1/d2/d3`
(120/180/260ms). **Ficou rápido demais** — barras de progresso
"disparavam como foguete", chevrons pareciam sem animação. Segunda
rodada: recalibrado visualmente com o usuário via HTML interativo
(sliders ao vivo, fora do chat). Valores finais em produção:

| Token | Valor | Uso |
|---|---|---|
| `--d1` | 300ms | switches (Billable, Resumo×2) |
| `--d2` | 550ms | accordions (Registros, ProjetoDetalhe, Resumo) |
| `--d3` | 260ms | painéis/gavetas/modais (inalterado) |
| `--d4` | 800ms | **novo** — barras de progresso |
| `--d5` | 380ms | **novo** — chevrons de seção colapsável |

Também ajustado fora do sistema de tokens: `AnimatedNumber` em
`Billable.tsx` (contagem numérica dos cards, `requestAnimationFrame` +
`easeOutQuad`) — `duration` default de 400ms para 800ms, sincronizado
com a barra de progresso ao lado.

**Lição**: ao criar/ajustar tokens de motion, testar visualmente ANTES
de aplicar em massa — os valores "teoricamente corretos" por categoria
não bateram com a sensação real desejada.

### 3.5c — Tamanho de ícone (18 arquivos, maior leva do dia)
Tokens novos em `tailwind.config.js` (`extend.width`/`extend.height`,
NÃO usar `size-*` do Tailwind 3.4+ para evitar risco de incompatibilidade):

```js
'icon-xs': '12px', 'icon-sm': '16px', 'icon-md': '20px',
'icon-lg': '24px', 'icon-xl': '32px',
```

5 níveis (não 4) — decisão deliberada para não forçar o ícone de 32px
(empty states, logo de login) a encolher para 24px só para caber num
token "lg" único. Migração cobriu ícones Lucide (`className`) e SVGs
manuais; o gatilho de `MenuAcoes.tsx` (`width="18" height="18"`, HTML
puro) ficou **fora do escopo** de propósito — não mexer nele de novo
tão cedo, já passou por duas correções na 3.4c.

Diff pedido em 3 partes (componentes, depois páginas em dois blocos) e
revisado linha por linha em cada parte antes de aprovar — sem incidente
desta vez, provavelmente porque o aviso explícito contra "reescrita
espontânea" já estava no prompt desde a lição da 3.5b-1.

---

## 🎯 Próxima leva: 3.5c — Gap entre elementos

Ainda dentro da categoria "Dimensão" do Bloco 3.5. Pelo inventário 3.5a,
os valores observados hoje (`gap-1` a `gap-8`) sugerem 4 níveis
semânticos:

- `gap-inline` (~gap-1.5) — ícone + texto
- `gap-group` (~gap-2/3) — botões agrupados, ações em linha
- `gap-form` (~gap-4) — campos de formulário lado a lado
- `gap-grid` (~gap-6) — cards e seções maiores

**Antes de aplicar em massa**: como aconteceu com duração, vale gerar um
inventário específico (arquivo por arquivo, contagem por valor) e
decidir os 4 valores com calma — mas gap não deveria precisar de
recalibração visual como duração, já que não envolve "sensação de
movimento", é só espaçamento estático.

Depois de gap, a categoria mais delicada do Bloco 3.5 é **espaçamento de
controle** (padding de botões/inputs) — essa sim é decisão de design
nova (não é só arrumação de token já existente), então merece mockup
visual antes de qualquer aplicação.

---

## 🧠 Lições e padrões consolidados nesta sessão

### Sobre confiar em diffs e resumos
- **Nunca aprovar em cima de resumo "antes/depois" com exemplos
  escolhidos pelo agente.** Em levas grandes (3.5c teve 18 arquivos),
  pedir o **diff completo real**, dividido em partes se necessário, e
  ler cada parte antes de aprovar a próxima.
- **Se o agente tenta reescrever um bloco além do pedido uma vez, não
  tentar remendar em cima — substituir o bloco inteiro por texto
  congelado** de uma versão anterior já validada.
- Depois de qualquer incidente desse tipo, reforçar o próximo prompt com
  um aviso explícito citando o que já deu errado antes — isso
  visivelmente reduziu a recorrência (3.5c, com 18 arquivos, não teve
  nenhum desvio).

### Sobre tokens de motion/dimensão novos
- **Testar visualmente ANTES de aplicar em massa**, especialmente
  duração de transição — "teoricamente correto por categoria" não é o
  mesmo que "sensação certa no app real". Gerar HTML interativo com
  sliders ao vivo é mais eficiente que descrever em texto ou tentar
  adivinhar valores em rodadas sucessivas.
- Elementos com "percurso visual longo" (barra de progresso enchendo)
  precisam de duração bem mais alta que micro-interações (chevron,
  switch) — não force os dois no mesmo token só porque a categoria do
  inventário os agrupou.

### Sobre criar vs. mexer em arquivo protegido
- `src/index.css` e `tailwind.config.js` são protegidos por padrão, mas
  o Bloco 3.5 precisa mexer neles para criar tokens novos — sempre dar
  **autorização excepcional explícita** no prompt, escopada ao ponto
  exato (não "pode editar o arquivo", e sim "pode editar só esta
  variável/linha").

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
> atrasados**. Rodar o script antes de cada sessão. `RESPONSIVO.md` — o
> documento de critério de aceite criado no Bloco 3 — já está incluído na
> lista de arquivos avulsos copiados; qualquer arquivo novo dentro de
> `src/` (páginas, componentes, hooks do Bloco 3 e 3.5) já é pego
> automaticamente pelo `Get-ChildItem` recursivo, sem precisar editar o
> script.

---

## 🤖 Trabalhando com o Antigravity (Gemini)

Modelos disponíveis: Gemini 3.7/3.6/3.5 Flash (Low/Medium/High) e Gemini
3.1 Pro (Low/High). Preferir sempre o Flash mais novo (hoje 3.7).

| Complexidade | Modelo |
|---|---|
| Baixa — CSS pontual, renomeação, correção TS single-file | 3.7 Flash (Low) |
| Média — multi-arquivo, decisão técnica de implementação | 3.7 Flash (Medium) |
| Alta — telas novas, UI complexa | 3.7 Flash (High) |
| Arquitetura leve | 3.1 Pro (Low) |
| Arquitetura — banco, migrations, triggers | 3.1 Pro (High) |

**Conversa nova** sempre que criar arquivo novo, virar de contexto
arquitetural, ou depois de um incidente de reescrita não autorizada
(evita o modelo "lembrar" de comportamento errado).

### Estrutura de prompt que funciona

```
## Contexto            (stack, branch, arquivo alvo, regra de negócio)
## Passo 1 — LER ANTES DE EDITAR
## Passo 2 — RELATÓRIO (perguntas que forcem citar o disco)
## Passo 3 — Edição (só após confirmação)
## O que NÃO pode mudar
## Restrições
## Critério de aceite
## ENTREGA — ÚLTIMO BLOCO, LEIA POR ÚLTIMO
```

Em levas de tokenização/arrumação ampla, adicionar um bloco **⚠️ AVISO**
logo após o Contexto, citando explicitamente qualquer incidente
recente do mesmo tipo — reduz reincidência.

### O agente nunca
- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de
  terminal (inclusive leitura: `git diff`, `git status`, `ls`, `cat`,
  `grep`) — se tentar, recusar e reafirmar a regra
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado (a menos que autorizado
  explicitamente e por escopo restrito, como nas edições de
  `index.css`/`tailwind.config.js` desta sessão)

### Bloco de entrega (colar no fim, texto exato)

```
## ENTREGA - ULTIMO BLOCO, LEIA POR ULTIMO

Este bloco vale para a resposta em que voce entrega a EDICAO (Passo 3).
A resposta do Passo 2 e o relatorio em texto, e continua sendo texto.

Na resposta da edicao, sua resposta tem que COMECAR com esta linha,
exatamente:
DIFF DA LEVA X

E logo abaixo, so codigo, no formato:
- linha removida
+ linha acrescentada

Inclua 3 linhas de contexto acima e 3 abaixo, sem sinal nenhum.

Nada de prosa antes. Nada de "Contexto", "Escopo", "Mapeamento".
Nada depois do diff tambem: sem resumo, sem "aceite cumprido".

Checagem final antes de enviar: procure na sua resposta as palavras
"vira", "passa a ser", "sera substituido". Se alguma aparecer, voce
escreveu plano. Apague e escreva o codigo.
```

Para levas grandes (mais de ~8 arquivos), pedir explicitamente para
dividir o diff em partes numeradas, e revisar cada parte antes de
autorizar a próxima.

### Lições de validação
- **Nunca aprovar em cima do resumo do agente.** Exigir o diff completo,
  sempre — em levas grandes, dividido em partes.
- **Se o agente tenta rodar um comando de terminal** (viu isso
  acontecer com `npx tsc -b`), recusar explicitamente pela opção "No,
  tell the agent what to do instead" e reafirmar a regra.
- **A tela é o juiz.** Testar visualmente sempre, mesmo com diff limpo e
  `tsc` sem erro — principalmente em mudanças de motion/dimensão.
- **Duas correções sem efeito = parar e substituir o bloco inteiro**, não
  insistir em remendo incremental.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- Cada leva foi commitada separadamente; correções encadeadas (3.4c,
  3.5b-1, 3.5b-2) foram commitadas junto com a leva original.

Para localizar um ponto de retorno: `git log --oneline`.

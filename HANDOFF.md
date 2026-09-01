# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **01/09/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 🚨 COMECE POR AQUI NA PRÓXIMA SESSÃO

A sessão de 01/09 foi longa e fechou **o Bloco 3.5 inteiro (100%)** e
**o Bloco 4 quase inteiro**. Restam, do Bloco 4, só duas pendências
adiadas conscientemente (ver abaixo) — o resto do roadmap antigo já
foi cumprido.

**Primeira tarefa da próxima sessão: não há bloco "seguinte" definido.**
O plano de blocos de 24/08 termina aqui. Escolher entre:
1. Retomar a pendência 4.3b (reestruturação de tabela-para-blocos em
   Projetos.tsx, ver "Pendências" abaixo — precisa de mockup fiel
   antes de qualquer prompt);
2. Continuar a varredura de hierarquia de elevação (4.2) nos outros
   pontos já identificados em prints mas não tratados ainda: Ajustes
   (Configurações Billable, bloco de confirmação de meta), Registros
   (dia expandido → lançamentos individuais), Timesheet;
3. Tratar a pendência de acessibilidade dos 2 modais à mão;
4. Abrir uma frente nova (ex.: trocar a biblioteca de ícones —
   mencionado de passagem pelo usuário, nunca formalizado).

Pergunte ao usuário antes de escolher.

**LIÇÕES CRÍTICAS desta sessão, leia antes de qualquer decisão visual:**
1. Toda decisão de design ou estrutura = **HTML real** (cores/fontes do
   projeto, aberto no navegador), nunca SVG nem botão de escolha em
   texto. Ver seção "Lições" abaixo — falhou 3x antes de virar regra.
2. Depois de aprovar qualquer "borda"/"realce" visual em elemento
   dentro de lista/tabela, **verificar se as linhas já têm separação
   visual entre si** (gap ou fundo distinto). Sem isso, bordas laterais
   se fundem numa linha contínua — aconteceu com a tentativa de borda
   de cor de projeto em Projetos.tsx, revertida no mesmo dia.
3. Toda leva que cria arquivo novo termina com prova física
   (`Get-ChildItem`) — um arquivo (`Secao.tsx`) foi "aprovado, testado,
   commitado" sem nunca ter sido escrito no disco, só descoberto 2
   frentes depois.

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%
BLOCO 3 — Responsivo                 ████████████ 100%

BLOCO 3.5 — Fundações de design      ████████████ 100%  ✅ CONCLUÍDO
  ✅ 3.5a  Inventário de valores no disco
  ✅ 3.5b  Raio de borda + duração de transição (calibrada)
  ✅ 3.5c  Ícone, gap, espaçamento de controle
  ✅ 3.5f  Borda, opacidade, z-index, container
  ✅ 3.5g  Foco e acessibilidade (5 modais + Sheet, hook useModal)
  ✅ 3.5h  Movimento — 99 ocorrências em 18 arquivos migradas para
           tokens calibrados + regra global de <button> no index.css
           corrigida + 1 achado tardio em Registros.tsx (varredura 3.5l)
  ✅ 3.5i  Densidade — escala de gap/ctl reduzida um degrau (decidida
           via HTML comparativo)
  ✅ 3.5j  Camada de padrões — 4 primitivas novas: PageHeader, Secao,
           EmptyState, SecaoColapsavel
  ✅ 3.5k  Prancheta no /ui-kit — 12 primitivas documentadas
  ✅ 3.5l  Guarda contra regressão — varredura de integridade +
           varredura de transition-all/duration-N remanescente

BLOCO 4 — Estética                   ██████████░░  ~85%
  ✅ 4.1  Primitiva Secao — coberto pela SecaoColapsavel (3.5j Frente 4)
  ✅ 4.2  Hierarquia de elevação
      ✅ Surface corrigida: cada elevacao (0-3) agora usa a sombra
         correspondente (shadow-e1/e2/e3), antes fixo em e1 sempre
      ✅ Aplicada em 3 pontos do ProjetoDetalhe.tsx: lista de
         subcategorias (bg-surface-1→2), mensagem vazia do Plano
         Semanal (ganhou wrapper bg-surface-2), lançamento individual
         dentro de semana expandida (bg-surface-0→2, hover 2→3 —
         estava INVERTIDO, filho mais escuro que o pai)
      🟡 Mapeados mas NÃO tratados ainda (usuário mandou prints,
         confirmou que quer varredura completa, mas sessão fechou
         antes): Ajustes.tsx (Configurações Billable, bloco de
         confirmação de meta em Meta Semanal), Registros.tsx (dia
         expandido → lançamentos), possivelmente Timesheet
  🟡 4.3  Cor do projeto como identidade
      ✅ 4.3a — consolidação mecânica: 2 tokens novos no index.css
         (--proj-encerrado:#9CA3AF, --proj-excluido:#6B7280,
         substituindo 5 hex inconsistentes entre Resumo/Registros) +
         8 pontos de shadow-sm (cru) trocados por shadow-e1 (token) em
         5 arquivos
      ⬜ 4.3b — REVERTIDA no mesmo dia. Ver "Pendências" abaixo.
  ✅ 4.4  Movimento — coberto pelo 3.5h/3.5i (transições calibradas,
         tailwindcss-animate segue não instalado por decisão)

AVULSAS — fora de bloco
  ⬜ Seletor de tema em Ajustes
  ⬜ Arquivados invisíveis + exclusão real de projeto
  ⬜ Contagem de lembretes na sidebar não atualiza
  ⬜ Lançar horas em um toque no celular (não bloqueante)
  ⬜ Correção do Billable (getFooterClass usa 8.5 literal) — adiada
  ⬜ Timesheet mobile: seleção de linha por teclado
  ⬜ Nome de exibição configurável no rodapé da Sidebar
  ⬜ Dashboard.tsx: código morto, confirmar e excluir
  ⬜ 5 candidatos a usar a primitiva Dica em vez do title nativo: 4
     etiquetas de projeto em Registros.tsx, 1 em
     BreakdownSubcategorias.tsx:55
  ⬜ Billable.tsx:841/1158 e Timesheet.tsx:351 — 3 <Link> que copiam
     manualmente as classes do Button em vez de usar a primitiva
  ⬜ ModalHorarioDia.tsx: hex legado (#161B22, #03A9F4, gray-800 etc.)
     ainda não migrado para tokens — decisão consciente, fica para
     quando o Bloco 4 tratar cor de verdade
  ⬜ NOVA (01/09): 2 modais desenhados à mão sem acessibilidade —
     ProjetoDetalhe.tsx (~2146, excluir fase com subcategorias) e
     Resumo.tsx (~1248, exclusão permanente). Não passam por useModal:
     sem focus trap, Tab preso, Escape coordenado, restauração de foco.
     Ver "Pendências" abaixo para detalhe.
  ⬜ NOVA (01/09): 4.3b — cor do projeto como identidade além da
     bolinha, especificamente reestruturação de Projetos.tsx de tabela
     para blocos separados. Ver "Pendências" abaixo.
  ⬜ NOVA (01/09): trocar a biblioteca de ícones (lucide-react) por
     algo "mais premium" — mencionado de passagem pelo usuário, nunca
     formalizado em proposta. Se retomar, pesquisar e comparar opções
     reais (Phosphor, Heroicons, Tabler, Radix Icons) antes de propor.
```

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## 🧩 Pendências detalhadas (não tratar sem reler isto)

### Pendência 1 — 4.3b: cor do projeto como identidade (Projetos.tsx)

Aprovado em conceito: trocar a bolinha de cor por borda lateral
colorida (3px) nas linhas da lista de Projetos.tsx. Mas o usuário
também quer separação real tipo card entre as linhas (espaço visível,
não só a linha fina `divide-y` que já existe), nos dois formatos:
desktop (hoje é uma `<table>` HTML real com `border-collapse`,
`<tbody className="divide-y divide-hair">`) e mobile (hoje já é
`<div grid>` empilhado via `md:table-row`, mas ainda colado).

**TENTATIVA PARCIAL JÁ FEITA E REVERTIDA** (01/09, mesmo dia): aplicar
só a borda lateral (via `style` inline `border-left` na primeira
`<td>`), sem a separação entre linhas. Resultado: como as linhas ficam
coladas, as bordas de cada `<td>` se uniram numa **única linha vertical
contínua** ao longo de toda a tabela, em vez de segmentos de cor por
projeto — nada a ver com a proposta aprovada em HTML (que mostrava
cards com `border-radius` e gap, cada um com sua própria borda).
Revertido via `git revert` (nunca chegou a ser commitado de fato —
houve confusão de HEAD no meio da reversão, resolvida com um segundo
`revert` + `git checkout` do arquivo; ver histórico de commits).

**Lição:** borda lateral e separação entre linhas **não são
independentes** — a borda só funciona como identidade visual por linha
se as linhas já estiverem segmentadas. Não tentar a borda de novo
isoladamente. Quando retomar: as duas mudanças juntas na mesma leva
(reestruturação de tabela-para-blocos + borda), com **mockup HTML
fiel** ao resultado esperado partindo da estrutura real (`border-collapse`
atual), não um mockup com cards já espaçados artificialmente.

Vale a pena, antes de reestruturar, olhar `Select-String -Path
src\pages\Projetos.tsx -Pattern "th className|Nome|Status|Ações"` para
mapear as 3 colunas reais (Nome/Status/Ações) antes de montar o
mockup — isso não chegou a ser feito.

### Pendência 2 — 2 modais sem acessibilidade

`ProjetoDetalhe.tsx` (~linha 2146, confirmação de excluir fase com
subcategorias) e `Resumo.tsx` (~linha 1248, confirmação de exclusão
permanente) replicam manualmente o padrão de modal (`div fixed
inset-0` + scrim + `Surface elevacao={2} comSombra={false}`) mas **não
passam pelo hook `useModal`** criado na Frente 3 do 3.5g. Sem focus
trap, Tab preso, Escape coordenado por pilha, nem restauração de foco
— diferente dos outros 5 modais oficiais.

Ao retomar: avaliar se algum dos dois pode simplesmente reaproveitar o
componente `ModalConfirmacao` em vez de duplicar JSX à mão (mais
simples que aplicar `useModal` avulso).

### Pendência 3 — 4.2, pontos ainda não tratados

O usuário mandou prints de 5 telas (Plano semanal vazio ✅ tratado,
Lançamentos por semana ✅ tratado, dia expandido em Registros ⬜,
Configurações/Ajustes ⬜, Horário padrão em Ajustes — sem aninhamento,
não precisa) pedindo varredura completa de hierarquia "harmoniosa".
Só dois pontos foram tratados antes da sessão fechar. Ao retomar,
seguir o mesmo formato: ver a estrutura real (`Select-String`) antes
de montar HTML, uma proposta por vez, aprovação antes de prompt.

---

## 🧠 Lições da sessão de 01/09/2026

### Sobre decisão visual (a mais repetida e mais cara desta sessão)
- **Falhou 3 vezes até virar regra crítica**: 1) mostrar comparação de
  densidade via `visualize:show_widget` (SVG) em vez de HTML real; 2)
  mesma coisa para PageHeader vs. ProjetoDetalhe; 3) mesma coisa de
  novo, ainda com SVG, na segunda tentativa do mesmo caso. O usuário
  precisa literalmente abrir um arquivo `.html` no navegador, com as
  cores e fontes reais do projeto, para conseguir avaliar — ele disse
  isso explicitamente e por escrito. **Nunca mais usar
  `visualize:show_widget` para decisão de design deste projeto.**
- **Proposta HTML "bonita" pode enganar sobre o resultado real.** A
  proposta de borda lateral em Projetos.tsx foi aprovada olhando um
  HTML onde cada linha já tinha espaço/gap entre si — mas o app real
  usa `divide-y` sem gap. O mockup deveria ter usado a estrutura real
  (tabela colada) para não prometer um efeito que o CSS não entregaria
  sem mudança estrutural adicional.
- **Uma proposta de cada vez, não um leque.** Depois de ficar confuso
  com 4 opções simultâneas (A/B/C/D) na primeira tentativa da 4.3b, o
  usuário pediu explicitamente "uma proposta por vez, eu digo sim/não/
  ajusta". Isso funcionou bem no resto da sessão (barra de fase → não;
  lista de Projetos → sim, com problema depois; hierarquia em
  subcategorias/plano/lançamentos → sim, sem problema).
- **Perguntar sem mostrar o objeto real é o mesmo erro, mesmo em
  texto.** Perguntar "incluir X também?" sem antes ter mostrado X
  (código real, imagem real) é a mesma falha da regra de HTML, só
  disfarçada — aconteceu ao perguntar se `ProjetoDetalhe` deveria
  entrar no `PageHeader` sem antes mostrar a estrutura real dele.

### Sobre arquivo perdido / verificação de disco
- Ver regra crítica já registrada em memória: toda leva que cria
  arquivo novo termina com `Get-ChildItem` provando existência física,
  e usa `npx tsc -b --force` (não só `tsc -b`) por causa do cache
  incremental `.tsbuildinfo`.
- **`git add` de caminho inexistente não gera erro** — o commit passa
  normalmente sem o arquivo. Isso permitiu que `Secao.tsx` "sumisse"
  por duas frentes inteiras sem ninguém notar, incluindo o próprio
  Claude aprovando testes que na real testavam o código ANTIGO
  (`Resumo.tsx` sem `Secao` nenhuma, só que visualmente idêntico).
- Quando descoberto, também faltava o export no barrel (`index.ts`) —
  ou seja, a leva inteira (arquivo + barrel + aplicação em Resumo.tsx)
  não tinha sido persistida, não só o arquivo isolado.

### Sobre troca de executor no meio de uma leva
- Antigravity ficou sem cota **no meio** da aplicação da Parte 3 de
  uma migração de 12 partes. `git diff` do arquivo em questão veio
  vazio (nada tinha sido escrito), então a troca para Claude Code foi
  limpa — mas o novo agente não tinha visto nenhuma decisão tomada
  antes da troca (ex.: convenção de `transition-opacity` em vez de
  `transition-colors` para elementos condicionais sem transição real).
  Cada prompt para o novo executor precisou reincluir essas decisões
  explicitamente no "Contexto", porque "combinamos isso antes" não
  significa nada para um agente que não viu a conversa anterior.

### Sobre `git revert` e HEAD
- `git revert HEAD` reverte o **último commit**, não "a última coisa
  que eu fiz na conversa". Se uma mudança foi feita mas nunca
  commitada (ficou só no working directory), `HEAD` ainda aponta para
  o commit anterior a ela — reverter ali desfaz outra coisa. Antes de
  reverter, sempre confirmar com `git status` e `git log --oneline -3`
  o que realmente está em qual estado.

### Sobre hierarquia de elevação (achado técnico)
- A primitiva `Surface` tinha a sombra **fixa em `shadow-e1`**
  independente do valor de `elevacao` escolhido — corrigido com um
  mapa `{0:'', 1:'shadow-e1', 2:'shadow-e2', 3:'shadow-e3'}`, mesmo
  padrão já usado para as cores de fundo (`elevacaoClasses`).
- No app real, hoje quase não existe "card dentro de card" com
  `Surface` aninhada — a maioria das seções pousa direto no fundo da
  página. O aninhamento real está em conteúdo **solto** (`<div>` com
  `bg-surface-N` direto) dentro de uma `Surface`, não `Surface` dentro
  de `Surface`. A correção, portanto, é trocar a classe de fundo do
  filho solto, não mexer na prop `elevacao`.
- Um caso (lançamento individual dentro de semana expandida) estava
  **invertido**: `bg-surface-0` (mais escuro que o pai) em repouso,
  clareando só no hover. Corrigido para `bg-surface-2`/`hover:bg-surface-3`.

---

## 📁 Arquivos e componentes criados nesta sessão (3.5j)

| Arquivo | Props | Onde é usado |
|---|---|---|
| `src/components/ui/PageHeader.tsx` | `titulo`, `subtitulo?`, `acao?`, `className?` | Lembretes.tsx, Projetos.tsx |
| `src/components/ui/Secao.tsx` | `titulo`, `className?` | Resumo.tsx (títulos "Projetos"/"Rotina") |
| `src/components/ui/EmptyState.tsx` | `icone`, `corIcone`, `corFundoIcone`, `titulo`, `descricao` (ReactNode), `variante?: 'padrao'\|'display'`, `acao?` | 6 telas: Lembretes, Resumo, Registros, Projetos, Timesheet (x2) |
| `src/components/ui/SecaoColapsavel.tsx` | `titulo`, `aberto`, `onToggle`, `contador?`, `descricao?`, `acao?`, `className?` | ProjetoDetalhe.tsx (Fases, Plano semanal, Lançamentos) |
| `src/hooks/useModal.ts` | `useModal(aberto, containerRef, aoFechar)` | 5 modais + (parcialmente) Sheet.tsx |

Barrel (`src/components/ui/index.ts`) exporta as 12 primitivas.
`/ui-kit` documenta todas com exemplo funcional (seções 1-12).

---

## 🔤 Tokens novos criados nesta sessão

**`src/index.css`** (bloco `:root`, junto de `--proj-1..12`):
```css
--proj-encerrado: #9CA3AF;
--proj-excluido: #6B7280;
```
Fixos, não variam por tema (diferente de `--proj-1..12`, que variam).

**Escala de gap/ctl reduzida (3.5i, densidade):**
```css
--gap-2xs:4px; --gap-xs:4px; --gap-sm:6px; --gap-md:8px; --gap-lg:12px; --gap-xl:16px;
--ctl-sm-x:8px; --ctl-sm-y:4px; --ctl-md-x:10px; --ctl-md-y:5px; --ctl-aba-x:10px; --ctl-aba-y:6px;
```

**Regra global corrigida (`@layer base { button {...} }`):**
```css
/* antes: @apply transition-all duration-200; */
@apply transition-colors duration-d1 ease-ez;
```

---

## 🛠️ Ambiente & convenções fixas

Stack: React + TypeScript + Tailwind + Vite + Supabase. Deploy Vercel.
Local: Windows + PowerShell.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Tema por atributo `data-theme`, **nunca** pelo modificador `dark:`.
- Escala de duração calibrada: `--d1:300ms` (hover simples) `--d2:550ms`
  (percurso longo/painel/barra) `--d3:260ms` (entrada/saída modal)
  `--d4:800ms` (barras de progresso específicas, preservadas) `--d5:380ms`.
  Sempre acompanhadas de `ease-ez`, exceto o toast que usa `ease-out`
  de propósito (desacelera na saída).

### Testar no celular

```powershell
npm run dev -- --host
```
Usar a linha **Network**. É `http`, então o PWA não instala e o service
worker não registra — bom para testar layout sem cache velho.

### Mexeu em tailwind.config.js ou index.css?

**Reiniciar `npm run dev`** (Ctrl+C e rodar de novo) — o Tailwind só lê a
config na subida, sem erro nem aviso se a classe simplesmente não existir.
Depois, `Ctrl+Shift+R` (ou `Ctrl+F5`) no navegador para limpar cache de CSS.

### Depois de criar arquivo novo, SEMPRE

```powershell
Get-ChildItem <caminho-do-arquivo>     # prova física de existência
npx tsc -b --force                     # ignora cache incremental
```

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

## 🤖 Trabalhando com Antigravity (Gemini) e Claude Code

**Executor principal: Antigravity/Gemini.** Claude Code fica em
reserva para quando a cota do Gemini esgotar (aconteceu no meio desta
sessão — troca foi limpa, ver "Lições" acima sobre o que refazer ao
trocar).

Modelos Antigravity disponíveis: Gemini 3.7/3.6/3.5 Flash
(Low/Medium/High) e Gemini 3.1 Pro (Low/High). Preferir sempre o Flash
mais novo (hoje 3.7).

| Complexidade | Modelo |
|---|---|
| Baixa — CSS pontual, renomeação, correção TS single-file | 3.7 Flash (Low) |
| Média — multi-arquivo, ou single-file com mudança estrutural | 3.7 Flash (Medium) |
| Alta — telas novas, UI complexa, arquivo grande e complexo | 3.7 Flash (High) |
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
divergente e PARE."

Para **levas grandes** (5+ arquivos, 50+ ocorrências), pedir relatório e
diff em **partes numeradas por arquivo**, com um resumo consolidado
(total, contagem por valor) ao final do relatório.

Para **levas que criam arquivo novo**, sempre incluir no critério de
aceite: "Get-ChildItem confirma o arquivo existe fisicamente" e usar
`npx tsc -b --force`, não `tsc -b`.

### O agente nunca
- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
  (inclusive leitura: `git diff`, `git status`, `ls`, `cat`, `grep`) — se
  tentar, recusar pela opção "No, tell the agent what to do instead" e
  reafirmar a regra.
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado
- cria arquivo auxiliar/script para fazer contagem

### Lições de validação
- **Nunca aprovar em cima do resumo do agente.** Exigir o diff completo.
- **A tela é o juiz.** Testar visualmente sempre, mesmo com diff limpo e
  `tsc` sem erro.
- **Duas correções sem efeito = parar e substituir o bloco inteiro.**
- **Comparar o aplicado com o especificado**, não só ler o diff
  procurando erro.
- **Diff "limpo" pode esconder ausência de escrita real** — ver lição
  do `Secao.tsx` acima. Terminar toda leva de arquivo novo com prova
  física de disco.
- **Um agente pode investigar além do pedido e encontrar problema
  real** (ex.: o `bg-surface-0` invertido) — quando isso acontecer,
  tratar como achado válido, decidir separadamente, não ignorar.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- Commits da sessão de 01/09/2026, em ordem aproximada (lista longa,
  ver `git log --oneline` para a sequência exata e hashes):
  - tokens: aplica duration-d1/d2/d3 e propriedades especificas de transicao (ProjetoDetalhe, Resumo)
  - tokens: aplica duration-d1 e propriedades especificas de transicao (Projetos)
  - tokens: aplica duration-d1/d4 e propriedades especificas de transicao (Billable)
  - tokens: aplica duration-d1 na linha da tabela (Timesheet)
  - tokens: aplica transicoes especificas (Login)
  - tokens: aplica duration-d1/d3 e propriedades especificas de transicao (Cadastro)
  - tokens: corrige ease-ez ausente na linha 35 (Login)
  - tokens: aplica duration-d1 nas transicoes de cor (Dashboard)
  - tokens: aplica duration-d1 nas transicoes de cor (ModalHorarioDia)
  - tokens: aplica duration-d1 e propriedades especificas de transicao (4 modais restantes)
  - tokens: aplica duration-d1/d2 e propriedades especificas de transicao (MenuAcoes, Toast, BreakdownSubcategorias, DataRow)
  - design: reduz escala de gap e padding de controle + corrige transition-all global de button (3.5i + follow-up 3.5h)
  - design: extrai primitiva PageHeader, aplica em Lembretes e Projetos
  - design: extrai primitiva EmptyState, aplica nos 6 cards de estado vazio
  - design: extrai primitiva SecaoColapsavel, aplica em Fases, Plano semanal e Lancamentos
  - fix: recupera Secao.tsx que nunca foi persistido no disco
  - design: completa Frente 2 (Secao aplicada no Resumo) e adiciona as 4 primitivas novas ao /ui-kit
  - tokens: corrige transition-all remanescente encontrado na varredura final (3.5l)
  - design: consolida cor de status (encerrado/excluido) em tokens e shadow-sm em shadow-e1 (4.3a)
  - fix: Surface aplica sombra correspondente ao nivel de elevacao (e1/e2/e3), antes fixo em e1 (4.2)
  - design: substitui bolinha de cor por borda lateral colorida (REVERTIDO no mesmo dia, ver commits seguintes)
  - Revert "fix: Surface..." (revert acidental, causado por confusão de HEAD)
  - Reapply "fix: Surface..." (correção do revert acidental)
  - design: aplica hierarquia de elevacao em subcategorias, plano semanal vazio e lancamentos individuais (4.2)

Para localizar um ponto de retorno: `git log --oneline`.

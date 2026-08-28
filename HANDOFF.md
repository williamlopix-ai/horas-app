# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **25/08/2026** (segunda sessão do dia).
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%

BLOCO 3 — Responsivo                 ███████████░  85%   ← ATUAL
  ✅ 3.0  Tokenizar  (a → f, COMPLETO)
  ✅ 3.1  Contrato responsivo por faixa    → RESPONSIVO.md
  ✅ 3.2  Tabelas em mobile
      ✅ 3.2a  Timesheet · coluna presa
      ✅ 3.2b  Billable · duas abas
      ✅ 3.2c  Resumo/tabela · cartão empilhado
  🔄 3.3  Varredura dos truncate
      ✅ 3.3a  Registros  (6 pontos)
      ✅ 3.3b  Resumo     (4 pontos)
      ⬜ 3.3c  ProjetoDetalhe + Lembretes  (5 pontos)   ← PRÓXIMA
  ⬜ 3.4  Alvos de 44px e safe area
  ⬜ 3.5  Pulso não aparece no celular + acabamentos

BLOCO 3.5 — Fundações de design      ░░░░░░░░░░░░   0%
  ⬜ 3.5a  Inventário de valores no disco
  ⬜ 3.5b  Camada primitiva + convenção de nome
  ⬜ 3.5c  Espaçamento e layout
  ⬜ 3.5d  Tipografia
  ⬜ 3.5e  Dimensão (controle, ícone, alvo de toque)
  ⬜ 3.5f  Borda, opacidade, z-index, container
  ⬜ 3.5g  Foco e acessibilidade
  ⬜ 3.5h  Movimento (espacial x efeito)
  ⬜ 3.5i  Densidade (multiplicador global)
  ⬜ 3.5j  Camada de padrões (Secao, PageHeader, EmptyState)
  ⬜ 3.5k  Prancheta no /ui-kit
  ⬜ 3.5l  Guarda contra regressão + varredura final

BLOCO 4 — Estética                   ░░░░░░░░░░░░   0%   ← O ÚLTIMO
  ⬜ 4.2  Hierarquia de elevação
  ⬜ 4.3  Cor do projeto como identidade
  ⬜ 4.5  Bordas de estado suaves

AVULSAS — fora de bloco
  ⬜ Seletor de tema em Ajustes
  ⬜ Três pontinhos na linha de Projetos
  ⬜ Esc não fecha o ModalLembrete
  ⬜ Arquivados invisíveis + exclusão real de projeto
  ⬜ Contagem de lembretes na sidebar não atualiza
  ⬜ Toast cobre o botão do canto superior direito
  ⬜ Lançar horas em um toque no celular  (não bloqueante)
```

**30 de 53 levas.** Três blocos fechados, o quarto em 85%.

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## ✅ O que foi feito nesta sessão

Sete levas mais cinco correções. O Bloco 3 saiu de 33% para 85%.

### 3.0e — ModalLembrete
15 linhas de legado. Receita de modal aplicada sem atrito.
**O Passo 2 pegou quatro divergências** entre o texto da receita e o
`ModalProjeto.tsx` real. Decisão que virou regra: **o arquivo já migrado vence
o texto da receita**. Em concreto: X usa `ink-700` (não `ink-500`), X sem
`focus:outline-none`, botão Salvar **mantém** o ternário `'Salvando...'`
(a prop `carregando` desenha só o ícone, não troca o texto), bloco de erro
mantém `rounded-xl`.

### 3.0f — Lembretes
37 linhas. **Fechou o Bloco 3.0: não existe mais hex fixo em nenhuma tela.**
O que a Fase 4 começou meses atrás está quitado.

### 3.1 — Contrato responsivo
Documento novo na raiz: **`RESPONSIVO.md`**. É o critério de aceite das levas
3.2 a 3.4 — nenhuma delas pode inventar limiar novo.

Auditoria que motivou: existiam **três limiares diferentes** para decisões
parecidas (Projetos em `md:`, Billable em `lg:`, Resumo misturando os três).
Mesmo padrão que gerou os dois azuis na Fase 4.

### 3.2a — Timesheet, coluna presa
Abaixo de 768px, `Código` e `Nome` viram **uma célula presa** com código em cima
e nome embaixo. Acima, nada muda.
**Levou quatro tentativas.** Ver "Como o Timesheet foi resolvido" abaixo.

### 3.2b — Billable, duas abas
Mesma receita, **de primeira**, porque as armadilhas já estavam escritas no
prompt. Diferença tratada: o Billable tem zebrado, então a célula presa usa a
variável `rowBg` da linha em vez de fundo fixo, e a cor de seleção mistura com
`rowBgVar` (`var(--bg-1)` / `var(--bg-0)`).

### 3.2c — Resumo, cartão empilhado
Padrão B, receita **diferente** das duas anteriores. Cada `<td>` ganhou um
rótulo visível só no celular; `<tr>` e `<td>` mudam de display por breakpoint.
Sem duplicar o `.map`, sem JavaScript.

### 3.3a — Registros, 6 truncate
Nome de projeto, de fase e de categoria passam a quebrar linha no celular.
Precisou de **quatro correções** — ver "Novela da etiqueta" abaixo.

### 3.3b — Resumo, 4 truncate
Nome de projeto (três seções) e nome de rotina. Limpo, de primeira.

---

## 🎯 Próxima leva: 3.3c — ProjetoDetalhe + Lembretes

Fecha a 3.3. São **5 pontos**, todos nome que identifica algo.

**`src/pages/ProjetoDetalhe.tsx`** — 3 pontos:
- o `<h1>` com `{projeto.nome}`
- o `<span>` com `{fase.nome}`
- a etiqueta de categoria com `max-w-[150px] sm:max-w-[200px]`

**`src/pages/Lembretes.tsx`** — 2 pontos:
- os dois `<span>` com `title={proj.nome}` no rodapé dos cards
  (um em pendente, um em resolvido)

**Não tocar** nas ocorrências de observação (`title={r.observacao}`) nem no
rótulo de semana (`formatarSemanaLabel`), que já cabem.

**Usar a forma explícita**, nunca `md:truncate`:
```
whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis
```

Conferir o total antes de planejar:
```powershell
Select-String -Path src\pages\ProjetoDetalhe.tsx,src\pages\Lembretes.tsx -Pattern "truncate" | Measure-Object -Line
```

---

## 🧰 Receitas validadas nesta sessão

### Padrão A — coluna presa (Timesheet, Billable)

```jsx
// tabela
className="w-full text-left border-separate border-spacing-0 whitespace-nowrap min-w-[640px] md:min-w-[800px]"

// th da primeira coluna (canto preso nos dois eixos)
className="sticky top-0 left-0 z-30 bg-surface-0 ... min-w-[130px] md:min-w-[100px]"

// th da segunda coluna (escondida no celular)
className="hidden md:table-cell sticky top-0 z-20 bg-surface-0 ..."

// td presa
className={`sticky left-0 z-10 md:static md:z-auto ${rowBg} md:bg-transparent ... min-w-[130px] md:min-w-[100px]`}
style={selectedRow === id ? { backgroundColor: `color-mix(in srgb, var(--accent) 20%, ${rowBgVar})` } : undefined}
  <span className="block text-xs md:text-sm">{codigo}</span>
  <span className="block md:hidden whitespace-normal break-words leading-tight" title={nome}>{nome}</span>

// linha de total: DUAS células, nunca colSpan dinâmico
<td className="md:hidden sticky left-0 z-10 bg-surface-2 ... min-w-[130px]">Texto</td>
<td colSpan={2} className="hidden md:table-cell ...">Texto</td>
```

Camadas de `z-index`: célula presa `10`, cabeçalho `20`, canto superior
esquerdo `30`.

### Padrão B — cartão empilhado (Resumo)

```jsx
<div className="overflow-visible md:overflow-x-auto">
<table className="... block md:table">
<thead className="hidden md:table-header-group">
<tbody className="block md:table-row-group divide-y divide-hair text-sm">
<tr className="block md:table-row p-4 md:p-0 hover:bg-surface-2 transition-colors">

// primeira td = título do cartão, sem rótulo
<td className="block md:table-cell pb-2 md:py-4 md:px-6 text-base md:text-sm font-bold md:font-semibold text-ink-900">

// demais td
<td className="flex justify-between items-center py-1 md:py-4 md:px-6 md:table-cell md:text-right [classes originais de cor/fonte]">
  <span className="md:hidden text-xs font-bold text-ink-500 uppercase tracking-wider">Rótulo</span>
  <span>{valor}</span>
</td>
```

`style` inline de cor permanece na `<td>`, não no `<span>`.

### Quebra de texto que identifica algo

```
truncate  →  whitespace-normal break-words overflow-hidden md:whitespace-nowrap md:text-ellipsis
```

---

## ⚠️ Armadilhas descobertas nesta sessão

### `border-collapse` quebra coluna presa
Com `border-collapse`, o navegador altera a ordem de pintura e o fundo de uma
célula `sticky` **não cobre** o conteúdo que passa por baixo. Tem que ser
`border-separate border-spacing-0`.

### `var(--surface-N)` NÃO EXISTE
As variáveis CSS se chamam `--bg-0`, `--bg-1`, `--bg-2`, `--bg-3`. `surface` é
apenas apelido criado no `tailwind.config.js`. Escrever `var(--surface-1)` dentro
de `color-mix` **invalida a declaração inteira** e o navegador a descarta em
silêncio — a célula fica sem fundo nenhum. Mesma família de erro já conhecida:
`var(--ink-500)` não existe, o certo é `--fg-500`.

### Esconder coluna quebra o `colSpan`
Quando **todas** as células de uma coluna ficam `display:none`, a coluna some da
tabela e o `colSpan={2}` passa a abranger a coluna errada. Solução é **duas
células**, uma por faixa. Nunca mexer no `colSpan` com JavaScript.

### `md:truncate` conflita com `whitespace-normal`
As duas disputam a propriedade `white-space` e o resultado é imprevisível.
Usar sempre a forma explícita (ver receita acima).

### Célula presa precisa repetir a cor de seleção
O fundo opaco da célula presa cobre a cor pintada no `<tr>`. A célula tem que
repetir essa cor no `style` inline. O ternário devolve `undefined` quando não
selecionada — **nunca objeto vazio**, senão mata o hover.

---

## 🔍 Como o Timesheet foi resolvido — método, não sorte

A leva 3.2a levou **quatro correções**. As duas primeiras foram diagnóstico no
escuro e não moveram o problema.

O que destravou: **abrir o inspetor do Chrome** e olhar o CSS aplicado no `<td>`.
Ali ficou visível que o `background-color` estava sendo descartado por causa do
`var(--surface-1)` inexistente.

> **Regra que fica:** quando duas correções seguidas não movem o problema,
> **parar de propor** e ir ver o CSS aplicado. Continuar chutando queima cota e
> desgasta a confiança no processo.

Como pedir ao usuário (ele não é desenvolvedor):
1. Botão direito no elemento → **Inspecionar**
2. Subir com a seta ↑ até a linha `<td>` certa
3. Print da linha destacada **e** do painel de estilos da direita
4. Procurar declaração **riscada** = foi sobrescrita

---

## 🔍 Novela da etiqueta de projeto (Registros) — encerrada sem fechar

A 3.3a precisou de 3.3b, 3.3c, 3.3d e 3.3e. O que cada uma fez:

| Leva | O que mudou | Resultado |
|---|---|---|
| 3.3b | `max-w-[160px]` → `max-w-full md:max-w-[160px]` | ajudou no celular |
| 3.3c | `md:truncate` → forma explícita | resolveu a Por Projeto |
| 3.3d | `md:max-w-[160px]` → `md:max-w-[240px]` | resolveu a Por Projeto |
| 3.3e | acrescentou `shrink-0` | sem efeito |

**Estado final aceito:** na visualização **Lista em tela larga**, dois nomes
específicos ainda quebram em duas linhas ou cortam — `Vale agendamento Demandas`
(25 caracteres) e `Gerenciamento da Pratica`. Os outros (`klabin`,
`TotalEnergies`, `VALE DH`, `ALMOÇO`) cabem inteiros.

No **celular** e na **Por Projeto**, todos aparecem completos. O nome completo
está no `title`.

**Decisão:** parar ali. Não é bug, é limitação de espaço, e o Bloco 3 é sobre
celular. Se voltar a incomodar, **começar pelo inspetor**, não por tentativa.

**Saída alternativa que não exige código:** encurtar o nome do projeto no próprio
app (`Vale agendamento Demandas` → `Vale Agendamento`). Resolve também no
Timesheet e no Billable.

---

## 📐 Contrato responsivo — resumo

Documento completo em **`RESPONSIVO.md`** na raiz.

| Faixa | Largura | Sidebar | Colunas | Alvo de toque |
|---|---|---|---|---|
| Compacta | até 639px | gaveta | 1 | 44px |
| Média | 640–1023px | gaveta | 2 | 44px |
| Ampla | 1024px+ | fixa | 3 | livre |

**Limiar único de tabela: 768px (`md:`).**

- **Padrão A** (rolagem lateral, coluna presa): Timesheet, Billable.
  Existem para **comparar valores entre colunas**.
- **Padrão B** (cartão empilhado): Projetos, Resumo/tabela.
  Existem para **listar itens independentes**.

**Uso declarado:** o app inteiro no celular, sem tela secundária. Lançar horas,
Timesheet, Resumo e Billable, todos em pé de igualdade.

---

## ⛔ Regras de negócio imutáveis

- **Notação centesimal:** `duração = horas + (minutos / 60)`. 1h30 → 1.50.
  Em `calcularDuracaoCentesimal` — **arquivo protegido**.
- **Semana: sábado a sexta.** Todo cálculo passa por `src/utils/semana.ts` —
  **arquivo protegido**. Nunca associar dia da semana por índice de array;
  sempre `getDay()` da data real.
- **Meta diária = meta semanal ÷ 5.** O divisor é 5 mesmo com a semana indo de
  sábado a sexta. Não "corrigir" para 7.
- **Meta diária vale para Timesheet e Resumo, nunca para Billable.**
- **O padrão do Resumo é somar TODOS os lançamentos.** O interruptor "Apenas com
  código" é opcional, nasce desligado e não é lembrado.
- **Nenhum limiar de cor contra número literal.** Todo verde/vermelho compara com
  valor derivado da configuração vigente.
- **A meta semanal canônica é "Horas Base Semanal"**, com histórico de vigência.
  Ler sempre via `buscarHorasBaseSemanal`.
- **Ordenação de metas:** por `semana_inicio`/`mes_inicio DESC`, com `criado_em
  DESC` apenas como desempate.
- **RLS do Supabase: nunca desativar.**
- **`fase_id` nunca entra em `registros`.** A fase vem por join via `subcategoria`.
- **`.is('campo', null)`, nunca `.eq('campo', null)`.**
- **`step="any"` em todo campo numérico.**
- **Contratadas vêm sempre de `projetos.horas_contratadas`**, nunca da soma das
  fases (leva 1.1a).
- **A ordem das colunas do Timesheet espelha o ERM.** `Código | Nome | Sáb…Sex |
  Total`. Não reordenar, não remover coluna de dia.
- **`getFooterClass` do Billable tem pendência conhecida** (compara contra `8.5`
  literal). Não corrigir de passagem — é leva própria.

### Glossário da interface

| Nível | Termo |
|---|---|
| Projeto | **contratadas** |
| Fase | **previstas** |
| Categoria | **reservadas** |
| Realizado | **lançadas** |

O verbo é **reservar**, nunca "alocar". **"Planejado" é palavra proibida** fora
de `plano_semanal`. **"categoria" na interface = `subcategoria` no código.**

---

## 📁 Arquivos protegidos

Não modificar sem aprovação explícita, e só em leva dedicada:

- `src/lib/supabase.ts`
- `src/services/registros.ts` → `calcularDuracaoCentesimal`
- `src/utils/semana.ts`
- `vite.config.ts`
- `src/contexts/AuthContext.tsx`
- `src/index.css` e `tailwind.config.js`

---

## 🎨 Mapa de cores da migração

> **O Bloco 3.0 fechou: não há mais hex fixo em nenhuma tela.** Esta tabela fica
> como referência caso apareça código antigo.

| Hex antigo | Token |
|---|---|
| `#0B0E14` | `surface-0` |
| `#161B22` | `surface-1` |
| `#1E2A38` | `surface-2` |
| `#FFFFFF` | `ink-900` |
| `gray-400` | `ink-700` — **não** `ink-500` |
| `gray-300` | `ink-900` |
| `gray-500` / `gray-600` | `ink-500` / `ink-300` |
| `#8B949E` | `ink-500` |
| `#03A9F4` | `accent` (era ciano, agora índigo `#5C87F7`) |
| `emerald-*` / `#4CAF50` | `ok` / `ok-bg` |
| `orange-*` / `#FF9800` | `warn` / `warn-bg` — **dourado, não laranja** |
| `red-*` / `#F44336` | `bad` / `bad-bg` |
| `gray-800/50` | `hair` |
| `gray-800` / `gray-700` | `hair-strong` |
| `bg-black/75` | `bg-[var(--scrim)]` |
| `shadow-sm` / `shadow-lg` / `shadow-2xl` | `shadow-e1` / `e2` / `e3` |

**Variáveis CSS reais:** `--bg-0` a `--bg-3` (tema escuro: `#0F1216`, `#141920`,
`#1A202A`, `#222936`). `surface` e `ink` são apelidos do Tailwind.

### Armadilhas de estilo

- Tailwind 3 **não** aplica opacidade em cor vinda de `var()`. `bg-accent/10`
  não funciona. Usar token `-bg` pronto ou
  `color-mix(in srgb, var(--x) 15%, transparent)` inline.
- `ink` mapeia para variáveis `--fg`, não `--ink`. `var(--ink-500)` não existe.
- **`var(--surface-N)` também não existe.** Usar `var(--bg-N)`.
- `Surface` não aceita `padding` junto com classes `p-`.
- `<form>` nunca vira `<Surface>` (perde o `onSubmit`); submit continua
  `type="submit"`.
- Cabeçalho de tabela fixo precisa de fundo opaco no `<tr>` **e** em cada `<th>`.
- `accentColor` de radio exige `style={{ accentColor: 'var(--accent)' }}`.
- `BarChart3` não existe no lucide-react v1 — usar `ChartNoAxesColumn`.
- Primitivas sempre pelo barril. De `src/pages/` é `'../components/ui'`;
  de `src/components/` é `'./ui'`.
- **12 tokens `--proj-1..12`** nos dois temas.
- `<option>` e `<optgroup>` precisam de `style` inline no Windows. Usar `var()`
  no inline, nunca remover o inline.
- `tailwindcss-animate` **não está instalado**: toda classe `animate-in`,
  `fade-in`, `zoom-in` é inerte. `animate-pulse` e `animate-spin` funcionam.
- **`truncate` em filho de flex exige `min-w-0` no pai**, senão empurra o irmão
  para fora do container.

---

## 🗄️ Banco

Tabelas: `configuracoes`, `projetos`, `fases`, `subcategorias`, `registros`,
`plano_semanal`, `horas_base_semanal`, `horas_base_mensal`, `lembretes`,
`horarios_dia`, `horarios_semana`. **RLS ativo em todas.**

`projetos.ordem_resumo` (integer, anulável) — ordem dos cards do Resumo,
separada de `projetos.ordem`. Nulo = fim da lista.

### Regras aprendidas

- `SET NULL`, nunca `CASCADE`, em `fase_id` e `subcategoria_id`.
- `.upsert()` não funciona com índice parcial (erro `42P10`). Para coluna
  anulável, usar dois índices parciais + select-then-update-or-insert.
- `CREATE TABLE AS SELECT` dispara aviso de RLS — escolher "Run and enable RLS".
- Múltiplos `SELECT` numa query só mostram o último resultado.
- **Backup de verdade é CSV pelo Table Editor**, tabela por tabela. O SQL Editor
  corta em 100 linhas por padrão.
- **Rodar backup antes de qualquer operação estrutural.**

### Limpeza pendente no banco

Projetos de teste com status `excluido`: `NOVO TESTE JUL`, `PROJETO TESTE` e os
`AGO TESTE`. Limpar quando conveniente.

---

## 🕳️ Buraco conhecido: arquivar e excluir projeto

Diagnosticado em 25/08, **ainda não priorizado**.

**Arquivar torna o projeto invisível para sempre.** `arquivarProjeto`
(`services/projetos.ts:143`) só grava `arquivado: true` — o projeto continua
íntegro no banco com todas as horas. Mas `Projetos.tsx:209` filtra `!p.arquivado`
em **todas** as abas, e **não existe nenhuma tela para ver arquivados**.
`desarquivarProjeto` já existe e está **órfã**, sem botão que a chame.

**Não é possível excluir de verdade pela interface.** O botão "Excluir mesmo
assim" chama `excluirProjetoComRegistros`, que é **soft-delete**: grava
`status:'excluido'` + `nome_original` e mantém tudo no banco.
`excluirPermanentemente` existe no service e também está **órfã**.

Falta: tela ou aba de arquivados com botão desarquivar, e ligar
`excluirPermanentemente` a algum lugar com confirmação forte.

---

## 🏗️ Stack e ambiente

React 19 + TypeScript + Tailwind CSS 3 + Vite + Supabase.
Deploy na Vercel, automático a cada push. Repositório
`github.com/williamlopix-ai/horas-app`. Produção em `horas-app-nine.vercel.app`.
Local: Windows + PowerShell, em `C:\Users\Mattos\Documents\HORAS-APP`.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Tema por atributo `data-theme`, **nunca** pelo modificador `dark:`.

### Testar em janela estreita

`Win` + `seta esquerda` encaixa a janela em metade da tela (~680px), abaixo do
breakpoint `lg` de 1024px. `Win` + `seta cima` desfaz.

Para ver a largura exata: `F12` mostra o número no canto da página ao arrastar
a borda. **Útil quando o comportamento parecer errado** — pode ser só a faixa
que você não esperava.

### Testar no celular

```powershell
npm run dev -- --host
```
Usar a linha **Network**. É `http`, então o PWA não instala e o service worker
não registra — bom para testar layout sem cache velho.

### Cache do PWA no PC do trabalho

No Edge, sem instalar como PWA, o service worker velho gruda:
`F12` → Application → Service Workers → **Unregister** + **Clear site data**.

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
> Nesta sessão isso causou números de linha errados em três prompts — a partir
> daí os prompts passaram a mandar o agente **localizar pelo conteúdo**, não
> pela linha. Manter essa prática.

---

## 🤖 Trabalhando com o Claude Code

O executor é o **Claude Code**, na barra lateral do Antigravity. O usuário **não
é desenvolvedor** — toda instrução precisa ser passo a passo, em linguagem
simples: qual botão clicar, o que aparece na tela.

### Controle remoto pelo celular

Funciona e foi usado nesta sessão. O Claude Code mostra
`Remote Control is active` e a sessão aparece no app do Claude, aba **Code**, ou
em `claude.ai/code`. O PC precisa continuar ligado com o Antigravity aberto.

**No celular não existe `Shift+Tab`**, então não dá para entrar em plan mode pelo
teclado. O Passo 2 do prompt segura o agente do mesmo jeito.

### Ritual de cada leva

1. `/clear`
2. `Shift+Tab` até aparecer **plan mode** (no PC)
3. Colar o prompt inteiro
4. Ler o plano e trazer ao arquiteto **antes** de aprovar
5. Escolher a **opção 2** ("Yes, and manually approve edits") — nunca a 1
6. Se pedir comando de terminal, **opção 3** e recusar
7. Trazer o diff ao arquiteto **antes** de aplicar

### O agente nunca

- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado

### Texto endurecido de terminal

```
NAO rodar NENHUM comando de terminal. Isso inclui comandos que apenas leem,
como npx tsc --noEmit, git diff, git status, ls, cat, grep, findstr.
A proibicao nao e sobre o comando alterar arquivos, e sobre nao executar nada.
Se voce achar que precisa de um comando, PARE, escreva qual e por que, e
espere. Verificar o resultado do seu proprio trabalho e tarefa do usuario.
```

> Ainda assim ele rodou `git diff` uma vez nesta sessão (3.3a). Não é grave —
> é leitura — mas vale reforçar.

### Estrutura de prompt que funciona

```
## Contexto            (stack, branch, arquivo alvo, regra de negócio)
## Passo 1 — LER ANTES DE EDITAR
## Passo 2 — RELATÓRIO (perguntas que forcem citar o disco, com linha)
## Passo 3 — Edição (só após confirmação)
## O que NÃO pode mudar
## Restrições
## Critério de aceite
## ENTREGA — ÚLTIMO BLOCO, LEIA POR ÚLTIMO
```

**O Passo 2 continua sendo o que mais rende.** Nesta sessão pegou:
- quatro divergências entre a receita e o `ModalProjeto.tsx` real (3.0e)
- um erro de escopo do arquiteto: o bloco Lista de `Registros.tsx` já usava
  `line-clamp-2`, então eram 6 trocas e não 8 (3.3a)

**Quando o agente encontrar divergência, ele deve PARAR e perguntar.** Está
funcionando — aconteceu três vezes e evitou retrabalho nas três.

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

### Lições de validação

- **Nunca aprovar em cima do resumo do agente.** Na 3.0e ele entregou "migração
  concluída" sem o diff. Exigir o código.
- **Colagem embaralhada no chat não é código corrompido.** Se o `npx tsc -b`
  passa, o disco está bom. Ir para a tela.
- **A tela é o juiz.** Tag sem fechar não compila; o que compila e some da tela
  só aparece em print.
- **Print de cada estado é obrigatório.**
- **`npx tsc --noEmit` antes de testar na tela, nunca depois.**
- **Mexeu em `tailwind.config.js`? Reiniciar o `npm run dev`.**
- **Mexeu no `index.css`? `Ctrl+Shift+R` no navegador.**
- **Nunca autorizar `awk`, `sed`, `mv` ou `cat`** reescrevendo arquivo.
- **Duas correções sem efeito = parar e abrir o inspetor.** Ver seção do
  Timesheet acima.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- **`redesign`** — mergeada em `main` em 23/08. Se voltar a ser usada: `main`
  sempre flui para `redesign` via `git merge main`, **nunca o inverso**.

Cada leva desta sessão foi commitada separadamente. As correções encadeadas
(3.2a→e e 3.3a→e) foram commitadas **junto com a leva original**, porque
preservar o caminho errado no histórico não ajuda ninguém.

Para localizar um ponto de retorno: `git log --oneline`.

# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **01/09/2026** (mesma sessão que
> fechou os Blocos 5, 6 e 7, e produziu o protótipo visual do Bloco 8).
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 🚨 COMECE POR AQUI NA PRÓXIMA SESSÃO

Esta sessão fechou **Bloco 5** (correções rápidas de UI), **Bloco 6**
(performance/queries, + aba Anual do Billable) e **Bloco 7 inteiro**
(navegação: botão "Voltar para X" + ordenação persistente do Timesheet).
Tudo commitado e em produção (`main`).

Também foi produzido, na mesma sessão, um **protótipo HTML interativo**
com a direção visual que o usuário quer para o Bloco 8 — e possivelmente
para o resto do app no futuro. Ver seção "Direção visual premium" abaixo
antes de codificar qualquer coisa do Bloco 8.

**Próxima tarefa, em ordem de prioridade sugerida:**
1. **Bloco 8 — Aba Ferramentas**: retomar a partir do protótipo já
   aprovado (ver seção dedicada abaixo). Falta decidir a responsividade
   do calendário semanal (8.4) antes de codificar.
2. **Pendências herdadas do redesign** (não retomadas ainda): 4.3b
   (borda lateral + reestruturação de Projetos.tsx), 2 modais sem
   `useModal`, resto do 4.2. Ver seção própria.
3. Item pendente do usuário, ainda sem decisão: **filtro mensal do
   Billable não traz todas as horas** — ele pediu para deixar pendente
   até entender melhor a demanda. Não iniciar sem ele trazer o caso
   concreto (mês, número esperado vs. mostrado, resultado de
   `select count(*) from registros where semana_inicio is null`).

Pergunte ao usuário qual ordem prefere antes de escolher.

---

## 🎨 Direção visual "premium" — base do Bloco 8 (e possível redesign futuro)

O usuário rejeitou o primeiro mockup do Bloco 8 (diagramático, "monte de
cards") e pediu nível luxuoso/intuitivo, citando implicitamente
Linear/Raycast/Notion Calendar. Um **protótipo HTML interativo** foi
entregue e testado (21 testes automatizados simulando cliques/digitação
reais, 0 falhas) — o usuário vai reter esse arquivo como base de ideia,
inclusive como possível referência de redesign do app inteiro no futuro.
**Se ele mencionar "aquele HTML" numa sessão futura, é este.**

Elementos que definiram a direção (aplicar como padrão em telas futuras,
mediante confirmação do usuário a cada uso):
- Abas com "pílula" deslizante animada (não sublinhado)
- Fundo com brilho radial sutil no topo via `::before`, não mais preto chapado
- Números como elemento dominante (mono, tabular-nums, 35-42px, letter-spacing negativo)
- "Display" estilo calculadora com gradiente diagonal + reflexo de luz via `::after`
- Teclado numérico real (grid 4 colunas) — usuário pediu "formato de calculadora mesmo"
- Anel de progresso SVG animado (`stroke-dashoffset`) pro placar do Fechamento
- Checklist com item expansível mostrando detalhe dos registros afetados
- Calendário com blocos em gradiente diagonal por projeto, linha vermelha do "agora", buracos tracejados com dica ao hover
- Heatmap do mês com tooltip seguindo o cursor
- Cards "quanto falta" com barra de progresso animada e borda superior colorida por contexto
- Paleta: só tokens já existentes do projeto (`--bg-*`, `--accent`, `--ok/--warn/--bad`, `--proj-N`) — nada de cor nova inventada

**Decisão de responsivo do calendário (8.4) AINDA EM ABERTO** — o
protótipo permite alternar Desktop / Celular·1dia / Celular·rolagem de
verdade, mas o usuário não escolheu qual vai pra produção. Decidir ao
retomar o Bloco 8.

**Lição de processo registrada:** mockup de decisão visual deste projeto
deve ser **interativo (JS funcional)**, não só estático/diagramático,
sempre que envolver componente com estado (calculadora, toggle de
visualização, formulário). A versão estática foi insuficiente para o
usuário avaliar "ficou bonito" ou testar de verdade.

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%
BLOCO 3 — Responsivo                 ████████████ 100%
BLOCO 3.5 — Fundações de design      ████████████ 100%
BLOCO 4 — Estética                   ██████████░░  ~85% (pausado, ver pendências herdadas)
BLOCO 5 — Correções rápidas de UI    ████████████ 100%  ✅
BLOCO 6 — Performance (queries)      ████████████ 100%  ✅ (+ aba Anual do Billable)
BLOCO 7 — Navegação                  ████████████ 100%  ✅ CONCLUÍDO (hoje)
  ✅ 7.1  Botão "Voltar para X" — Timesheet, Billable, ProjetoDetalhe
          (lista de dias + "Ver no dia") → Registros
  ✅ 7.2  Botão "Voltar para X" — Resumo, Projetos → ProjetoDetalhe
          (reaproveita o botão "Voltar" já existente, trocando texto e
          destino só quando location.state.origem existe; fallback
          genérico navigate(-1) intocado quando não há origem)
  ✅ 7.3  Ordenação manual do Timesheet — evoluiu de "efêmera na sessão"
          (pedido original) para PERSISTENTE por semana no banco, por
          decisão do usuário durante a leva. Tabela nova
          `timesheet_ordem_manual` (usuario_id, semana_inicio,
          projeto_id, posicao, RLS, on delete cascade). Bug colateral
          encontrado e corrigido: flash de ordem errada ao entrar na
          tela, causado por currentDate nascendo hardcoded em 'segunda'
          em vez de config.inicio_semana (double-fetch concorrente).

BLOCO 8 — Aba Ferramentas            ░░░░░░░░░░░░  0% (protótipo visual
                                       pronto e aprovado, código não
                                       iniciado — ver seção dedicada)
```

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## 🧩 Pendências técnicas abertas

### Bug de ordenação de margem (`metas_billable.ts`) — não corrigido de propósito

`buscarMargemMinimaVigente` e `buscarMargemMinimaVigenteMensal`
(`services/metas_billable.ts`, ~linhas 150-151 e 217-218) ordenam a
vigência **só por `criado_em` DESC**, ignorando `semana_inicio`/`mes_inicio`.
Mesmo padrão de bug já corrigido em `horas_base_semanal`/`mensal` (que
corretamente ordena por `semana_inicio`/`mes_inicio DESC`, com `criado_em`
só como desempate) — a correção nunca foi replicada nas tabelas de margem.

**Risco:** um lançamento retroativo de vigência de margem com `criado_em`
mais recente pode sobrescrever silenciosamente uma vigência com data de
início mais próxima do período de referência.

**Por que não foi corrigido:** a leva 6.1 (performance) precisava
reproduzir o comportamento atual EXATO para bater com o gabarito
capturado antes da refatoração — misturar correção de bug com mudança de
performance na mesma leva impede saber se uma divergência é erro de
tradução ou efeito do fix.

**Ao retomar:** leva separada. Antes de corrigir, avaliar se há alguma
vigência de margem inserida fora de ordem no histórico real (pode ser
que o bug seja só teórico até agora). A função `resolverMargemVigente`
em `Billable.tsx` (dentro de `calcularSaldoAcumulado`/`Mensal` e
`buscarDadosAnuais`) replica esse mesmo comportamento e precisaria ser
corrigida junto.

### Falta de CHECK de validade no banco (achado, não é bug confirmado)

Não existe migration SQL confirmando `CHECK (horas_base > 0)` ou similar
para `horas_base_semanal`/`mensal` e `metas_billable_margem`/`_mensal` —
validação só client-side (`Ajustes.tsx`), inconsistente entre si:
- `handleSalvarHorasBaseSemanal`/`Mensal` bloqueiam `<= 0`
- `handleSalvarMargemMensal` bloqueia `< 1`
- `handleSalvarMargem` (versão **semanal**) só tem `min="0"` no HTML —
  não impede negativo via edição ou script
- `config.meta_semanal` (fallback final) também sem guarda visível

Risco teórico, não confirmado em dados reais. Não é leva agendada — fica
como conhecimento para se um dia aparecer bug estranho de meta zerada.

### Conflito de horário no ModalRegistro para data fora do range carregado

Desde a leva 6.4 (Registros.tsx filtra por semana/dia na query), o array
que alimenta `registrosExistentes` do `ModalRegistro` é só a fatia
carregada (semana/dia visível), não mais o histórico inteiro. O campo de
data do modal (sem min/max) permite escolher qualquer data — se o
usuário digitar manualmente uma data de outra semana, a detecção de
conflito não vai enxergar registros já existentes naquele dia.

Aceito conscientemente como regressão de caso raro. **Ao retomar:**
avaliar busca sob demanda dentro do próprio `ModalRegistro` quando o
campo de data mudar (padrão B1 já esboçado), como leva separada — o
componente é compartilhado por Registros, ProjetoDetalhe e possivelmente
outras telas. Em ProjetoDetalhe (leva 6.3) esse problema NÃO existe,
porque lá foi preservada uma segunda query sem filtro (`todosRegistros`)
específica para essa validação.

---

## 📁 Novas funções de service (Blocos 6 e 7)

| Arquivo | Função | Uso |
|---|---|---|
| `horas_base.ts` | `listarTodasHorasBaseSemanalDoUsuario(usuarioId)` | Todas vigências semanais, sem filtro de data |
| `horas_base.ts` | `listarTodasHorasBaseMensalDoUsuario(usuarioId)` | Todas vigências mensais, sem filtro de data |
| `metas_billable.ts` | `listarTodasMargensSemanal()` | Todas vigências de margem semanal |
| `metas_billable.ts` | `listarTodasMargensMensal()` | Todas vigências de margem mensal |
| `billable.ts` | `buscarRegistrosBillableNoIntervalo(dataInicio, dataFim)` | Registros billable brutos num intervalo arbitrário |
| `timesheet_ordem.ts` (novo) | `buscarOrdemManual(usuarioId, semanaInicio)` | Ordem salva de uma semana (uma query) |
| `timesheet_ordem.ts` (novo) | `salvarOrdemManual(usuarioId, semanaInicio, projetoIds[])` | Upsert em lote (uma chamada) |

Em `Billable.tsx` (não exportadas, uso interno): `resolverHorasBaseVigente`,
`resolverMargemVigente` (bug de ordenação preservado intencionalmente,
ver "Pendências técnicas"), `buscarDadosAnuais`.

Nova tabela Supabase: `timesheet_ordem_manual` (usuario_id, semana_inicio,
projeto_id, posicao, criado_em, atualizado_em; unique nos 3 primeiros
campos; RLS com 4 policies `auth.uid() = usuario_id`; `on delete cascade`
em ambas as FKs).

---

## 🎯 Bloco 8 — Aba Ferramentas (próxima frente grande, 2+ sessões)

Protótipo visual já aprovado (ver seção "Direção visual premium" acima).
Ordem sugerida de implementação:

**8.1** rota/casca da aba (sidebar + abas internas) →
**8.2** Calculadora (3 modos: intervalo→centesimal, hh:mm↔centesimal
bidirecional, somador — todos já validados no protótipo, inclusive
teclado numérico funcional e histórico) →
**8.3** Fechamento da semana (checklist: dias sem lançamento, dias
abaixo da meta, gaps grandes, lançamentos sem categoria, projetos
billable sem `codigo_externo`, sobreposições nunca validadas) →
**8.4** Calendário semanal (grade de horas, blocos por lançamento,
buracos visíveis clicáveis, linha do "agora" — **decisão de responsivo
pendente**, ver acima) →
**8.5** Calendário mensal (heatmap por distância da meta diária) →
**8.6** "Quanto falta" (horas restantes pra bater a meta da
semana/billable/dia).

---

## 🗂️ Pendências herdadas (redesign, ainda não retomadas)

- **4.3b** — borda lateral colorida em Projetos.tsx + reestruturação de
  tabela para blocos. Tentativa parcial revertida em 01/09 (borda e
  separação de linha não são independentes — a borda só funciona como
  identidade visual se as linhas já estiverem segmentadas com gap ou
  fundo próprio). Precisa mockup HTML fiel à estrutura real
  (`border-collapse`) mostrando as duas mudanças JUNTAS antes de
  qualquer prompt.
- **2 modais sem `useModal`** — ProjetoDetalhe.tsx (~2146, confirmação
  de excluir fase com subcategorias) e Resumo.tsx (~1248, confirmação
  de exclusão permanente). Sem focus trap/Tab/Escape coordenado/
  restauração de foco. Avaliar reaproveitar `ModalConfirmacao` em vez de
  aplicar o hook avulso.
- **Resto do 4.2** (hierarquia de elevação) — Ajustes.tsx (Configurações
  Billable), Registros.tsx (dia expandido), possivelmente Timesheet.
- **Troca de biblioteca de ícones** (lucide-react → Phosphor/Heroicons/
  Tabler/Radix Icons) — mencionado de passagem, nunca formalizado.
- **Buraco de arquivar/excluir projeto** (achado em 25/08): projeto
  arquivado fica invisível para sempre (nenhuma tela/aba mostra
  arquivados); `desarquivarProjeto` e `excluirPermanentemente` existem
  no service mas estão órfãos, sem botão algum na UI. Falta: tela de
  arquivados + ligar exclusão permanente a algum lugar com confirmação
  forte.

---

## 🛠️ Ambiente & convenções fixas

Stack: React 19 + TypeScript + Tailwind CSS 3 + Vite + Supabase. Deploy
Vercel (`horas-app-nine.vercel.app`). Local: Windows + PowerShell
(`C:\Users\Mattos\Documents\HORAS-APP`). Executor: **Claude Code**.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Semana: **sábado a sexta**. Meta diária = meta semanal ÷ 5 (Timesheet e
  Resumo, NUNCA Billable).
- `.upsert()` funciona normalmente quando a chave única não envolve
  coluna anulável (ex: `timesheet_ordem_manual`). Quando envolve coluna
  anulável com índice parcial, usar `.is()` (nunca `.eq()` para nulls) +
  padrão select-antes-de-decidir (ver `plano_semanal.ts`).
- PowerShell do usuário **não aceita `&&`** — sempre usar `;` para encadear.

### Testar no celular
```powershell
npm run dev -- --host
```
Usar a linha **Network**. É `http`, então o PWA não instala e o service
worker não registra — bom para testar layout sem cache velho.

### PWA com cache preso (Edge/Chrome)
F12 → Application → Service Workers → Unregister + Clear site data.

### Mexeu em tailwind.config.js ou index.css?
**Reiniciar `npm run dev`** — o Tailwind só lê a config na subida.

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
4. **Confirmar com `git log --oneline -3` e `git status` que o commit
   realmente aconteceu antes de encerrar** — nunca assumir que "testei,
   ok" implica "já commitado" sem checar.

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

## 🤖 Trabalhando com Claude Code

Estrutura de prompt usada (funcionou bem em todas as levas, inclusive as
grandes com múltiplas partes e as que envolveram migration SQL):

```
## Contexto            (stack, branch, arquivo alvo, regra de negócio)
## Passo 1 — LER ANTES DE EDITAR
## Passo 2 — RELATÓRIO (perguntas que forcem citar o disco com linhas)
## Passo 3 — Proposta de plano (levas grandes: sem código, aguarda aprovação)
## Passo 4 — Edição (só após confirmação, dividida em partes numeradas
   se grande — uma parte por arquivo ou por bloco lógico coeso)
## Restrições
## Critério de aceite
```

**Para refatoração de cálculo/fórmula:** capturar gabarito de valores
reais ANTES de qualquer edição, validar número a número depois.

**Para leva que mexe em fonte de dados compartilhada:** exigir relatório
completo de TODOS os consumidores do estado antes de propor o filtro —
um agente já descobriu assim que `todosRegistros` em ProjetoDetalhe
alimentava a validação de conflito de horário cross-project, dependência
que não estava no prompt original.

**Para leva que cria tabela nova no Supabase:** pedir o SQL como entrega
isolada (Passo 4a), rodar manualmente e confirmar ANTES do agente seguir
para o código TypeScript. Nunca o agente executa SQL.

**Estatísticas agregadas — média vs. consolidado:** não são a mesma
coisa e podem divergir bastante quando os denominadores (metas) variam
de tamanho entre períodos. Média = "nota de cada período pesa igual";
consolidado = "soma tudo, divide no final, período com mais peso conta
mais". Vale reusar essa explicação se o padrão aparecer de novo.

### O agente nunca
- roda `npx tsc -b`, `npm run build`, `git`, SQL ou qualquer comando de terminal
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado

### Lições de validação (gerais, continuam valendo)
- **Nunca aprovar em cima do resumo do agente.** Exigir o diff/código
  real colado no chat, com contexto de vizinhança — "Edit... Added N
  lines" do editor não é prova de nada.
- **A tela é o juiz.** Testar visualmente sempre, mesmo com diff limpo e
  `tsc` sem erro.
- **Confirmar commit com `git log`/`git status`, não assumir pelo
  "testei, ok".**
- **Um agente pode investigar além do pedido e encontrar problema
  real** — tratar como achado válido, decidir separadamente, nunca
  ignorar.
- **Uma leva, uma mudança de categoria.** Não misturar correção de bug
  com refatoração de performance (ou qualquer troca de tipo de mudança)
  na mesma leva — dificulta saber se uma divergência é erro novo ou
  efeito esperado do fix.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção. Sem uso de
  `redesign` nesta sessão.
- Commits desta sessão, em ordem:
  1. `fix: remove chip BILLABLE redundante (todas as linhas ja sao billable)`
  2. (5.2) card de lançamento — ver `git log` para a mensagem exata
  3. `fix: menu de acoes nao corta mais a esquerda em telas estreitas`
  4. `feat: paleta de comandos guarda e exibe ultimos destinos navegados`
  5. `perf: Timesheet filtra registros por semana na query, em vez de baixar tudo e filtrar em memoria`
  6. `perf: substitui loop de ate 52/60 requisicoes por agregacao unica no calculo de saldo acumulado do Billable`
  7. `perf: ProjetoDetalhe filtra registros por projeto na query, mantendo busca ampla so para deteccao de conflito de horario`
  8. `perf: Registros filtra por semana/dia visivel na query, com re-fetch automatico via useEffect`
  9. `perf: Resumo pagina Semanal e Diario de 60 em 60 dias, mantendo Por Projetos com historico completo, e ordena do mais recente para o mais antigo`
  10. `feat: adiciona aba Anual ao Billable com media mensal e consolidado do ano`
  11. `fix: aba Anual do Billable oculta meses sem nenhum registro billable`
  12. `feat: adiciona botao Voltar para tela de origem (Timesheet, Billable e ProjetoDetalhe -> Registros)`
  13. `feat: botao Voltar mostra origem (Resumo/Projetos) ao entrar em ProjetoDetalhe, mantendo fallback generico sem origem`
  14. `feat: ordenacao manual do Timesheet vira persistente por semana (tabela timesheet_ordem_manual), corrige flash de ordem errada causado por fetch duplicado ao entrar na tela`

Para localizar um ponto de retorno: `git log --oneline`.

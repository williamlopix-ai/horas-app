# HANDOFF — Projeto HORAS

> Documento de estado da sessão. Ler no início de cada nova sessão.
> Última atualização: 22/08/2026 — **segunda sessão do dia, 14 etapas**

---

## ⚠️ Pendências imediatas (ler primeiro)

### 1. Limpeza no Supabase — adiada por decisão, ainda aberta
As 5 tabelas temporárias da migração de sábado continuam no banco. O gatilho
combinado era **duas semanas fechadas** com a semana em sábado e os números do
Resumo e do Billable batendo com o timesheet corporativo. A migração foi em
11/08; a segunda semana fechou em 22/08.

**Falta a conferência Resumo × Billable × timesheet corporativo.** As tabelas
não atrapalham nada, só ocupam espaço — mas enquanto existirem, existe o risco
de alguém consultá-las achando que são dados vivos.

```sql
DROP TABLE _bkp_semana_registros;
DROP TABLE _bkp_semana_horas_base;
DROP TABLE _bkp_semana_margem;
DROP TABLE _bkp_semana_billable;
DROP TABLE _bkp_semana_config;
```

### 2. Coluna `configuracoes.meta_semanal` órfã
Não é mais editável pelo formulário de Ajustes, mas continua no banco porque
ainda serve de fallback dentro de `buscarHorasBaseSemanal`. **Não dropar** sem
antes confirmar que o Resumo está correto por algumas semanas.

### 3. VALE DH — reconstrução parcial pendente
Ver "Incidente de 20/08". O projeto hoje tem `Fase 1` (400h previstas, com todas
as categorias) e `Fase 2` (vazia). A estrutura original tinha cerca de 5 fases,
cujos nomes e horas se perderam. Redistribuir quando houver clareza sobre a
divisão real.

### 4. Três lançamentos sem subcategoria no VALE DH
Somam 9h e mantêm o bloco "Sem fase" visível. Dois parecem lixo de teste.

| data | horário | duração | observação |
|---|---|---|---|
| 02/06/2026 | 13:30–14:00 | 0,5h | teste survey |
| 26/07/2026 | 04:00–12:00 | 8,0h | — |
| 29/07/2026 | 13:30–14:00 | 0,5h | — |

O de 26/07 começa às 4h da manhã — conferir se é deslocamento de campo real ou
lançamento com hora errada. O bloco "Sem fase" some sozinho quando os 9h zerarem.

### 5. `src/pages/Dashboard.tsx` — provável código morto
Não está em nenhuma rota do `App.tsx` nem na sidebar. Confirmar e excluir em
commit próprio **na `main`** (é limpeza, não redesign):

```powershell
Select-String -Path src\*.tsx,src\pages\*.tsx,src\components\*.tsx -Pattern "Dashboard"
```

---

## 🔄 Protocolo de arquivos do projeto Claude — NOVO, estabelecido em 22/08

**O problema que isso resolve:** os arquivos anexados ao projeto do Claude
envelhecem em silêncio. Na sessão de 22/08 o `ProjetoDetalhe.tsx` anexado tinha
**1551 linhas contra 2046 no disco**, e não continha a seção Plano Semanal —
a leva 4.2c quase foi planejada sobre um arquivo que não existia mais. É a
mesma classe de erro que cancelou a Fase 3.0.

**Ritual, no início de cada sessão:** `git pull` → rodar o script → apagar
TUDO do projeto no Claude → subir a pasta inteira.

O script achata o caminho no nome do arquivo (`types_index.ts` vs
`components_ui_index.ts`), o que evita colisão entre os dois `index.ts`.

```powershell
$dest = "$HOME\Desktop\horas-claude"
Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $dest | Out-Null

$arquivos = @(
  "HANDOFF.md",
  "AGENTS.md",
  "tailwind.config.js",
  "src\index.css",
  "src\App.tsx",
  "src\types\index.ts",
  "src\utils\semana.ts",
  "src\components\Sidebar.tsx",
  "src\components\MenuAcoes.tsx",
  "src\components\ui\index.ts",
  "src\components\ui\Button.tsx",
  "src\components\ui\Chip.tsx",
  "src\components\ui\Surface.tsx",
  "src\components\ui\Field.tsx",
  "src\components\ui\Stat.tsx",
  "src\components\ui\DataRow.tsx",
  "src\components\ui\Sheet.tsx",

  "src\pages\Resumo.tsx",
  "src\components\BreakdownSubcategorias.tsx",
  "src\services\horas_base.ts"
)

foreach ($f in $arquivos) {
  if (Test-Path $f) {
    $nome = ($f -replace "^src\\", "") -replace "\\", "_"
    Copy-Item $f (Join-Path $dest $nome)
    Write-Host "ok    $nome"
  } else {
    Write-Host "FALTOU $f" -ForegroundColor Red
  }
}
explorer $dest
```

**Núcleo fixo (as 17 primeiras entradas):** ficam sempre. O bloco `ui/` é o mais
importante — metade dos bugs da Fase 4 veio de não enxergar a assinatura real
das primitivas.

**Kit da sessão (da linha em branco para baixo):** trocar conforme a fase.

| Fase | Sobe junto |
|---|---|
| **4.3 Resumo (atual)** | `pages/Resumo.tsx`, `components/BreakdownSubcategorias.tsx`, `services/horas_base.ts` |
| 4.4 Timesheet | `pages/Timesheet.tsx` |
| 4.5 Billable | `pages/Billable.tsx`, `services/billable.ts` |
| 4.6 Ajustes | `pages/Ajustes.tsx`, `services/configuracoes.ts`, `services/horarios.ts` |

**Sempre conferir a branch antes de rodar:** `git branch --show-current`.

---

## O que foi feito nesta sessão (22/08, segunda sessão)

**14 etapas, 5 commits, nenhuma migração de banco.**

| Etapa | Branch | Entrega |
|---|---|---|
| Protocolo de arquivos | — | Script de pacote, 21 arquivos, nomes achatados |
| 4.2c | redesign | Plano Semanal migrado + cabeçalho alinhado |
| 4.2d | redesign | Lançamentos migrado + cabeçalho alinhado |
| 4.2e | redesign | Modal de exclusão de fase migrado |
| Billable | **main** → merge redesign | Cor semântica indevida removida |
| 4.3a | redesign | Casca do Resumo migrada |

**`src/pages/ProjetoDetalhe.tsx` está MIGRADO POR INTEIRO** — 2053 linhas, cinco
levas, cinco commits, zero regressão.

**RETOMAR EM: leva 4.3b — aba Semanal do Resumo.**

---

## Correção do Billable — CONCLUÍDA (branch main)

Pendência aberta desde a auditoria de 22/08. **Correção exclusivamente de cor,
nenhum cálculo mudou.**

O Billable soma APENAS projetos com `billable = true`. Por isso **não tem meta
diária nem meta por projeto** — um dia com poucas horas faturáveis é normal,
porque o projeto daquele dia pode simplesmente não ser faturável.

O que foi removido:
- `getFooterClass` comparava contra o literal `8.5` e pintava as colunas de dia
  de vermelho. Numa semana com 105% da meta, os cinco dias apareciam vermelhos.
- `getFooterClassMensal` fazia o mesmo contra `horasBase / 4` (a variável local
  `threshold` deixou de existir).
- A coluna TOTAL de cada linha de projeto ficava verde por `row.total > 0` —
  não era comparação, era decoração. Verde significa "meta atingida" no resto
  do app e ali aparecia num número não comparado com nada.

Regra nova nos três casos: `duracao === 0 ? text-[#8B949E] : text-white`.

**O que NÃO mudou, e está correto:**
- TOTAL DA SEMANA comparando `totals.total >= metaReal`
- TOTAL DO MÊS comparando `totalsMensal.total >= metaMensal`
- Cards de saldo (`>= 0`) e barras de progresso (`< 100`) — comparações
  legítimas contra grandezas reais, não réguas inventadas
- `renderCell` e `renderCellMensal` já eram neutras

**⚠️ NÃO trocar o `8.5` por `metaSemanal / 5`.** Isso daria ao Billable uma meta
diária que ele não deve ter. A correção é remover o julgamento, não ajustar o
número.

**Achado colateral, não corrigido:** a conta `horasBase × (margem / 100)`
aparece **quatro vezes** no arquivo (L139, L176, L260, L309), com nome de
variável diferente em cada uma (`metaRealSemana`, `metaReal`, `metaRealVal`,
`metaRealMensalVal`). Se a regra de margem mudar, são quatro lugares e três
chances de esquecer um. Candidato a refatoração, não a correção.

---

## 🔥 Incidente de 20/08 — perda das fases do VALE DH

**O que aconteceu.** O usuário acionou a exclusão de uma fase esperando remover
apenas aquela. Como restava só uma, `handleClicarExcluirFase` desviava para o
fluxo "remover divisão em fases", que apagava **todas** e zerava o `fase_id` de
todas as subcategorias do projeto.

**Causa raiz.** Um atalho redundante: o mesmo gatilho tinha dois alcances
diferentes, e o destrutivo já possuía botão próprio e rotulado.

**O que se perdeu.** Apenas as linhas da tabela `fases` (nome, ordem,
`horas_contratadas`). Cerca de 5 fases. **Não se perdeu** nada de
subcategorias, `horas_alocadas`, registros ou `horas_contratadas` do projeto.

**Por que não houve restore.** `DELETE` é hard delete e os logs do Postgres no
Supabase não registram DML por padrão.

**Corrigido.** A exclusão agora atinge sempre só a fase escolhida. O modal de
destino usa a sentinela `DESTINO_PENDENTE = '__escolher__'`: com outras fases
disponíveis o select abre em "Escolha o destino" (`disabled`) e o botão de
confirmar fica desabilitado; sendo a última fase, "Deixar sem fase" vem
pré-selecionado por ser a única opção.

> **Atenção:** string vazia `''` significa "Deixar sem fase" e continua
> significando isso. **Não confundir com `DESTINO_PENDENTE`.**

> **📌 CORREÇÃO DE DOCUMENTAÇÃO (22/08):** versões anteriores deste arquivo
> falavam no "✕ da fase". **Esse botão não existe mais** — a exclusão virou
> item dentro do `MenuAcoes` (três pontinhos) de cada fase. Descrever o fluxo
> pelo ✕ confunde na hora de testar.

---

## Stack e ambiente

| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript + Tailwind CSS + Vite |
| Banco | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel (auto-deploy via push na `main`) |
| Repositório | `github.com/williamlopix-ai/horas-app` |
| Produção | `horas-app-nine.vercel.app` |
| Agente de código | Antigravity (VS Code) |
| Ambiente local | Windows + PowerShell |

### Branches
- **`main`** — todas as correções
- **`redesign`** — overhaul visual em andamento
- **Regra:** correção vai para `main` primeiro e chega na `redesign` via
  `git merge main`. **Nunca o inverso.**

```powershell
git checkout redesign
git merge main --no-edit
git push
git checkout main
```

O `--no-edit` evita que o git abra o Vim. Alternativa permanente:
`git config --global core.editor "notepad"`.

---

## Redesign visual — FRENTE ATIVA (branch `redesign`)

**Fase 1 — Tokens: CONCLUÍDA.** Variáveis CSS em `src/index.css` (paleta escura
e clara, raio, sombra, movimento, 8 cores de projeto), mapeadas em
`tailwind.config.js`. `data-theme="dark"` no `<html>`. Fontes locais via
`@fontsource`.

**Fase 2 — Primitivas: CONCLUÍDA.** Sete componentes em `src/components/ui/` +
barrel `index.ts`: Button, Chip, Surface, Field (+ `classeCampo()`), Stat,
DataRow, Sheet. Galeria viva em `/ui-kit`.

**Fase 3.0 — NÃO EXISTIU.** Planejada por engano sobre arquivos desatualizados
e cancelada antes de gerar diff. Origem do protocolo de arquivos acima.

**Fase 3.1 — Sidebar nova: CONCLUÍDA.** Zero hex fixo, links por array
`ITENS_NAV`, campo `prefixos` para acender "Projetos" em `/projeto/:id`, ícones
lucide, drawer mobile com fechamento ao navegar / `Esc` / trava de scroll.

**Fase 3.2 — Paleta de comandos `cmdk`: CONCLUÍDA.** Campo visível com lupa e
`<kbd>Ctrl K</kbd>` — atalho sozinho é invisível para quem não sabe que existe
e inútil no PWA. Busca é **fuzzy**, não substring: digitar um dígito traz
projetos pelo código, e "resu" casa com "Treinamento **Re**cebido Sa**u**de".
Aceito como está. Atalhos numéricos 1–4 foram implementados e **removidos** na
mesma sessão, por decisão do usuário.

**Fase 3.3 — Botão "Lançar horas": CONCLUÍDA.** Navega para `/registros?novo=1`
(Opção A). O tratamento do parâmetro entrou **dentro do useEffect que já lia a
querystring** — dois efeitos escutando `searchParams` com um deles chamando
`setSearchParams` é receita de loop. `setIsSidebarOpen(false)` no `onClick` é
necessário porque o efeito que fecha o drawer depende de `location.pathname`,
que não muda quando já se está em `/registros`.

### Fase 4 — migração das telas

Ordem: Registros → ProjetoDetalhe → **Resumo** → Timesheet → Billable → Ajustes.

**Método: quebrar a tela em LEVAS pequenas, uma por commit.** Cada leva tem
escopo declarado por delimitador de comentário, e o prompt proíbe tocar no
resto. Duas telas grandes migradas sem uma regressão.

#### `src/pages/Registros.tsx` — MIGRADA POR INTEIRO ✅
4.1a casca · 4.1b cartões de dia · 4.1c lançamentos.
Aditivos: estado vazio ganhou botão "Lançar horas"; o botão do cabeçalho do dia
trocou `+` por `Clock` (ele **edita** a jornada, não adiciona nada).

#### `src/pages/ProjetoDetalhe.tsx` — MIGRADA POR INTEIRO ✅
- **4.2a** casca, cabeçalho, barra de progresso, cards de métrica
- **4.2b-1** `renderListaSubcategorias` (~316 linhas, sete estados visuais)
- **4.2b-2** seção Fases & Subcategorias
- **4.2c** Plano Semanal — card externo removido, cabeçalho alinhado às irmãs
- **4.2d** Lançamentos — cabeçalho alinhado, `space-y-4 pt-2` → `space-y-6`
- **4.2e** modal de exclusão de fase

**Padrão de seção recolhível estabelecido nas levas 4.2c/4.2d** — replicar nas
próximas telas:

```
<div className="space-y-6">
  <div>                                    ← wrapper OBRIGATÓRIO
    <div className="flex items-center justify-between">
      <button onClick={() => toggleSecao('x')} className="flex items-center gap-2 group focus:outline-none">
        <ChevronDown className="h-4 w-4 text-ink-500 transition-transform duration-d2 ease-ez ..." />
        <h2 className="text-xl font-display font-bold text-ink-900">Título</h2>
        {!expandido && <span className="text-xs text-ink-500 font-ui font-normal">contador</span>}
      </button>
      {/* ações à direita, FORA do button */}
    </div>
    {expandido && <p className="text-xs text-ink-500 mt-1 ml-6">descrição</p>}
  </div>

  {expandido && <Surface elevacao={1} comBorda padding="nenhum" className="p-5 space-y-5">...</Surface>}
</div>
```

Regras do padrão:
- **cabeçalho nunca tem moldura** — recolhidas, todas as seções viram linhas
  idênticas com os chevrons na mesma coluna
- **a moldura pertence ao conteúdo**, e só existe quando ele existe
- o `ml-6` alinha a descrição sob o título (16px do ícone + 8px do gap)

#### `src/pages/Resumo.tsx` — EM ANDAMENTO (1089 linhas)

> A cópia antiga tinha 1197 linhas. Alguma refatoração encolheu o arquivo
> (provavelmente a extração do `BreakdownSubcategorias`).

- **4.3a — casca: CONCLUÍDA.** Container, header, bloco de erro, abas, toggle
  de visualização, estado vazio.

**FALTAM, nesta ordem:**

| Leva | Escopo | Linhas (numeração pré-4.3a) |
|---|---|---|
| **4.3b** | Aba **Semanal** — cards, lista, tabela | 463–598 |
| **4.3c** | Aba **Diário** — cards, lista, tabela | 599–729 |
| **4.3e** | `BreakdownSubcategorias.tsx` (fazer ANTES da aba Projetos) | arquivo próprio |
| **4.3d-1** | Aba Projetos — ativos | 730–835 |
| **4.3d-2** | Aba Projetos — inativos, arquivados, rotina + modal | 836–1089 |

> **As abas Semanal e Diário são praticamente espelhadas** — mesma anatomia de
> cards, lista e tabela, mudando só o que agrupam. A 4.3c herda as decisões da
> 4.3b e tende a ser rápida.

> O Resumo guarda a visualização escolhida em `localStorage`
> (`horas_view_resumo`, L43). Comportamento estranho no teste pode ser estado
> antigo guardado.

**Depois do Resumo:** Timesheet → Billable → Ajustes.

### Fase 5 — acabamento (fila já formada)

- **Sidebar com barra de rolagem** em janela média
- **Mover a busca para o RODAPÉ**, abaixo do email
- **Agrupar navegação por intenção** — "RELATÓRIOS" (Timesheet, Billable) e
  "GESTÃO" (Projetos, Lembretes), com Ajustes isolado. Bastaria um campo
  `grupo` no `ITENS_NAV`
- **Botão flutuante de "Lançar horas" no mobile**
- **Botão primário quase-branco** — `pri` é `#E9ECF1`, correto pela
  especificação (padrão Linear/Vercel), mas no escuro atual parece
  desabilitado. Só dá para julgar com todas as telas migradas
- **Card do lançamento mais escuro que o container** — em ProjetoDetalhe, o
  card usa `surface-0` dentro de um `Surface` `surface-1`, invertendo a
  convenção de "conteúdo aninhado clareia". Preserva o design original;
  reavaliar de conjunto
- **Altura dos botões de aba** em telas ainda não migradas

---

## Cores que são DADO, nunca token

- `projeto.cor` vem do banco. Aparece em `style` inline nas tags de Registros
  (`${projCor}12` e `${projCor}44`, alfa em hex de 8 dígitos) e no círculo do
  cabeçalho de ProjetoDetalhe. **Substituir por token apagaria a identidade
  visual de cada projeto.** A concatenação também impede: `var(--x)12` é CSS
  inválido.
- Os fallbacks `#6B7280` (excluído) e `#9CA3AF` (encerrado) alimentam a mesma
  variável e por isso permanecem hex.
- **Mas `#F44336` e `#4CAF50` em style inline SÃO tema disfarçado de dado** —
  esses viram `var(--bad)` e `var(--ok)`.

---

## Armadilhas da Fase 4 — todas já custaram um diff

### Espaçamento e layout

- **`space-y-*` no container VENCE `mt-*` no filho.** O utilitário gera
  `> :not([hidden]) ~ :not([hidden])` com especificidade 0-3-0, contra 0-1-0 de
  `.mt-1`. Para espaçamento menor que o do container, o elemento tem que estar
  **dentro de um wrapper**, não ser irmão direto. Quebrou a 4.2c.
- **`classeCampo()` já inclui `w-full`.** Combinado com `flex-1` ou `w-24` são
  duas declarações de largura e o `w-full` vence. Solução:
  `${classeCampo()} !flex-1 !w-auto min-w-0` ou `${classeCampo()} !w-24`.
  Quebrou 6 inputs de ProjetoDetalhe. **Vai voltar em Ajustes.**
- **`classeCampo()` traz `font-ui`.** Campo numérico ou de data precisa de
  `!font-mono`.
- **`Surface` não aceita prop `padding` junto com classe `p-`.** Usar
  `padding="nenhum"` quando o padding vier pelo className.
- **`Surface` aplica `shadow-e1` por padrão.** Para `shadow-e3` (modais),
  passar `comSombra={false}` — senão as duas classes conflitam e vence a ordem
  no CSS, não a ordem na string.
- **Duas bordas no mesmo elemento se anulam.** `border-l-[3px] border-l-accent
  border border-hair` → o `border` genérico faz 1px em todos os lados.
- **`truncate` em filho de flex exige `min-w-0`** no mesmo elemento.
- **Alvo de toque mínimo 44px.** É um PWA de celular. Levas anteriores
  encolheram botões de 48 para 40px sem querer.
- **`opacity-0 group-hover:opacity-100` esconde o elemento no celular** —
  touch não tem hover. Padrão correto: `opacity-100 sm:opacity-0
  sm:group-hover:opacity-100`.

### Cor e tokens

- **Tailwind 3 não aplica modificador de opacidade sobre cor vinda de `var()`.**
  `bg-accent/10` NÃO funciona. Usar o token `-bg` pronto, ou
  `color-mix(in srgb, var(--x) 15%, transparent)` inline.
- **Ao remover opacidades, conferir se duas cores colapsaram.** O card do
  lançamento e a tag de categoria eram distintos só pela opacidade (`/60` num,
  sólido no outro). Sem ela viraram o mesmo hex e a tag ficou invisível.
  Quebrou a 4.2d. **Vai reaparecer em toda tela com `bg-x/opacidade`.**
- **Mudou `tailwind.config.js`? Reinicie o `npm run dev`.** O Tailwind lê a
  config só na subida. Sem erro, sem aviso.
- **A escala de raio tem apelido diferente do nome da variável:**
  `rounded-chip`→`--r-xs` 4px · `rounded-ctl`→`--r-sm` 6px ·
  `rounded-card`→`--r-md` 10px · `rounded-sheet`→`--r-lg` 14px.
- **`divide-hair` funciona** — `hair` está em `colors` e `divideColor` herda de
  `borderColor`.
- Nunca sobrescrever chaves padrão do Tailwind (`rounded-sm/md/lg`).

### Bibliotecas

- **lucide-react v1.17: os arquivos são `.mjs`**, não `.js`. Verificar com
  `Test-Path node_modules\lucide-react\dist\esm\icons\eye.mjs`.
- **`BarChart3` NÃO existe na v1.** Usar `ChartNoAxesColumn`. Já confirmados
  como existentes: `Trash2`, `Eye`, `Pencil`, `Table2`, `List`, `LayoutGrid`,
  `ChevronDown`, `X`, `AlertTriangle` (alias de `triangle-alert`),
  `ChartNoAxesColumn`. O sumiço do `BarChart3` foi exceção, não regra — a v1
  mantém alias de vários nomes antigos (`pen-square` e `square-pen` coexistem).
- **`tailwindcss-animate` NUNCA esteve instalado.** As classes `animate-in
  fade-in zoom-in` no modal de exclusão de fase estavam no código sem efeito
  nenhum desde sempre. Foram removidas na 4.2e. Se aparecerem em outra tela,
  são igualmente inertes.
- **`Skeleton` e `SkeletonCard` tinham hex fixo dentro do componente.**
  Corrigidos na origem, o que mudou a cor de carregamento de 7 telas de uma vez.

### Convenções

- **Importar primitivas pelo barrel:** `from '../components/ui'`, nunca
  `from '../components/ui/Surface'`. Import direto cria uma segunda convenção e
  mata o barrel como fonte única.
- **Código já migrado vence mapeamento escrito de fora.** Ao migrar um
  componente que já existe em tela migrada (toggle de visualização, bloco de
  erro), instruir o agente a **copiar do arquivo real** em vez de seguir a
  descrição do prompt. Se o mesmo elemento ficar diferente em duas telas,
  ninguém percebe agora e todo mundo tropeça na Fase 5.

---

## Regras críticas e imutáveis

### Notação centesimal (NUNCA alterar)
```
duração = horas_inteiras + (minutos / 60)
1h30min → 1.50 | 1h45min → 1.75 | 9h00min → 9.00
```
Em `src/services/registros.ts` → `calcularDuracaoCentesimal`, e preview em
`src/components/ModalRegistro.tsx`.

### Regras de negócio
- **Semana: SÁBADO A SEXTA.** Migrado em 11/08/2026. Todo cálculo passa por
  `src/utils/semana.ts`. 304+ registros backfillados.
- **A meta semanal canônica é "Horas Base Semanal"**, editável em Ajustes, com
  histórico de vigência. **NUNCA assumir valor fixo** — ler o vigente da semana
  em questão via `buscarHorasBaseSemanal`.
- **Meta diária = meta semanal ÷ 5.** Confirmado, não é bug. O divisor é 5
  porque a jornada contratada é de 5 dias, **mesmo com a semana indo de sábado
  a sexta**. Horas lançadas no fim de semana contam normalmente no total.
  **Não "corrigir" para 7.**
- **A meta diária vale para Timesheet e Resumo, NUNCA para Billable.**
- Horário padrão do dia: **09:00 às 18:30**, com exceção por dia da semana e
  por data específica.
- **RLS no Supabase: nunca desativar**
- Gaps mínimos para exibir tempo ocioso: 5 minutos, em horas/minutos normais
  (não centesimal)

### Duas metas distintas

| | Timesheet e Resumo | Billable |
|---|---|---|
| O que conta | **todos** os lançamentos | só projetos `billable = true` |
| Meta | diária = semanal ÷ 5 | semanal × percentual de margem |
| Cor por dia | sim, contra a meta diária | **não faz sentido** |

### Ordenação de metas (bug já cometido)
`buscarHorasBaseSemanal` / `buscarHorasBaseMensal` devem ordenar por
`semana_inicio` / `mes_inicio DESC`, com `criado_em DESC` só como desempate.
Ordenar por `criado_em` sozinho faz lançamento retroativo sobrescrever
silenciosamente uma meta posterior.

### Glossário de horas (usar exatamente estas palavras na interface)

| Nível | Termo |
|---|---|
| Projeto | **contratadas** |
| Fase | **previstas** |
| Categoria | **reservadas** |
| Realizado | **lançadas** |

O verbo é **"reservar"**, não "alocar". **"planejado" é palavra proibida** neste
contexto — pertence a `plano_semanal.horas_planejadas`, e os dois conceitos
convivem na mesma tela.

**"categoria" na interface = `subcategoria` no código.** Renomear é só texto
visível; tabela, coluna, tipo e variáveis permanecem.

---

## Banco de dados — regras aprendidas

- **`fase_id` NUNCA entra em `registros`.** A fase é sempre derivada por join:
  `subcategoria:subcategorias(nome, fase:fases(nome))`. É o que faz mudar a
  fase de uma categoria atualizar todos os lançamentos na hora.
- **`SET NULL`, nunca `CASCADE`** em `fase_id` e `subcategoria_id`.
- Use `.is('campo', null)`, **nunca** `.eq('campo', null)`
- `.upsert()` não funciona com índice parcial (erro `42P10`). Índice único
  padrão em coluna anulável duplica em silêncio, porque `NULL != NULL` no
  Postgres. Solução: dois índices parciais + select-then-update-or-insert
- `CREATE TABLE AS SELECT` dispara aviso de RLS — escolher "Run and enable RLS"
- Múltiplos `SELECT` numa query só mostram o último resultado
- **`atualizarSubcategoria(id, nome, horasAlocadas?, faseId?)`** — passar
  `undefined` no parâmetro que **não** se quer alterar. `null` apaga o valor.

### Backup real
O export Excel de Ajustes é **relatório, não backup restaurável**. Backup de
verdade é baixar cada CSV separadamente pelo SQL Editor, conferindo o limite de
linhas (o padrão corta em 100). **Rodar antes de qualquer operação estrutural**
em fases ou subcategorias.

```sql
SELECT * FROM projetos;
SELECT * FROM subcategorias;
SELECT * FROM fases;
SELECT * FROM registros;
SELECT * FROM configuracoes;
SELECT * FROM plano_semanal;
SELECT * FROM horas_base_semanal;
```

---

## Padrões de produto — não reverter

- **Cores semânticas em totais, não em células individuais**
- **Nenhum limiar de cor contra número literal.** Todo verde/vermelho compara
  com valor derivado da configuração vigente
- **Histórico de metas com start-date** — toda meta configurável preserva data
  de vigência
- **Tabs sobre toggles** para visualizações distintas
- **Exceções de horário nunca retroagem**
- **Ação perto do alvo** — botão de salvar no rodapé enquanto se digita no topo
  é falha de projeto. Matou o modo global de reserva
- **Um destrutivo, um gatilho** — mesmo gatilho com dois alcances causou o
  incidente de 20/08
- **Confirmação com destino explícito** — nunca pré-selecionar destino em modal
  destrutivo
- **Nada nasce expandido.** Recolhido por padrão, com contador no cabeçalho
- **Sub-utilização não é alerta.** Amarelo só quando algo está errado; estado
  normal é cinza. Alarme falso treina o usuário a ignorar alarmes
- **Blocos calculados não podem parecer entidades editáveis.** O "Sem fase"
  parecia uma fase e o usuário tentou excluí-lo
- **Container de layout sempre renderizado, conteúdo alternando dentro**
- **Coluna de valor ou percentual sempre renderizada**, vazia quando não se
  aplica — condicional desalinha as linhas
- **Cada grandeza tem sua palavra.** Dois números com formato igual e
  significado diferente na mesma tela é bug de leitura
- **Nunca associar dia da semana por índice de array** — sempre `getDay()` da
  data real
- **Novos recursos devem parecer nativos**

### Armadilhas de código React/TS

- **Não envolver ternário em condição — usar condições irmãs.** Embrulhar
  `a ? (X) : (Y)` numa nova condição faz o ramo `else` se perder sem erro de
  compilação. Preferir `{cond && a && (X)}` e `{cond && !a && (Y)}`
- **`{cond && (` seguido de `{` não compila** — falta o fragmento `<>`
- **`type` explícito em imports de tipo** (`verbatimModuleSyntax`).
  `import React` é obrigatório quando se usa `React.MouseEvent`
- **`noUnusedLocals`** — import ou variável órfã quebra o build
- **`stopPropagation` em botões dentro de cards clicáveis**
- **Recarregamento silencioso** — `carregarDados(true)` evita flash de skeleton
- **Registros.tsx tem 2 blocos de renderização** — alterar sempre os dois
- **Configuração vem do `useConfig()`** — nunca chamar `buscarConfiguracoes`
  direto numa tela

---

## Fluxo de trabalho

1. Claude analisa o problema e gera o prompt estruturado
2. Usuário envia ao Antigravity e traz o **diff completo**
3. Claude valida e sinaliza desvios
4. Usuário aplica e roda `npx tsc -b` manualmente
5. Usuário testa no localhost (reiniciando o dev se mexeu no Tailwind)
6. Usuário commita e faz push (PowerShell, sem acentos na mensagem)

**O usuário nunca delega `npx tsc -b`, git ou comando de terminal ao agente.**

> **O agente pede autorização para rodar comandos de terminal — negar sempre,
> mesmo sendo leitura pura.** Aconteceu duas vezes em 22/08. Um dos comandos
> (`require('lucide-react')`) teria falhado com `ERR_REQUIRE_ESM` e o agente
> concluiria que os ícones não existem. Resposta padrão: *"Não rode comandos de
> terminal. Eu verifico e te informo."*

### Estrutura de três passos do prompt

1. **Passo 1 — Ler antes de editar.** Listar os arquivos reais, avisando que
   cópias em cache podem estar desatualizadas.
2. **Passo 2 — Relatório antes do diff.** Perguntas que obriguem o agente a
   **citar valores reais do disco**. Instruir: em caso de divergência ou
   ausência, **PARAR e perguntar**.
3. **Passo 3 — Edição**, só após confirmação do relatório.

> **O Passo 2 é o que mais rende.** Revelou o `--accent` índigo, a ausência do
> `BarChart3`, a existência do `--accent-bg`, e que o `tailwindcss-animate`
> nunca esteve instalado.

> **Delimitar escopo por CONTEÚDO, não por número de linha.** Cada leva desloca
> a numeração das seguintes. Quando o relatório apontar deslocamento, mandar
> aplicar o offset **e conferir cada alvo pelo conteúdo** — deslocamento
> uniforme é hipótese, não garantia.

### Regras do agente (sempre incluir)
1. Ler os arquivos reais ANTES de qualquer edição
2. **Mostrar o DIFF COMPLETO, sem elisões**, e aguardar confirmação
3. Executar apenas o que foi confirmado
4. **NÃO** rodar `npx tsc -b` nem `npm run build`
5. **NÃO** fazer commit
6. **NÃO** modificar arquivo fora do escopo
7. **NÃO** instalar pacote
8. Lembrar de `verbatimModuleSyntax` e `noUnusedLocals`

### Regras do orientador ao validar
- **Nunca aprovar em cima do resumo do agente** — exigir o diff completo
- **Diff proposto ≠ diff aprovado.** A revisão pegou bugs reais em 5 das 9
  levas da primeira sessão e em 3 das 6 desta. Ler comparando com o pedido, não
  só procurando bug
- **Definir o checklist ANTES de olhar o diff**
- **O diff do Antigravity às vezes sai mal formatado** (linhas sem `+`, recuo
  trocado) sem que o código esteja errado — a representação interna dele está
  íntegra. Validar pela lógica, aplicar, e rodar `npx tsc -b` na hora. JSX
  desbalanceado não passa no TypeScript

### Seleção de modelo no Antigravity

Disponíveis: Gemini **3.7 / 3.6 / 3.5 Flash** (Low/Medium/High) e Gemini
**3.1 Pro** (Low/High). **Preferir sempre o Flash mais novo.**

| Complexidade | Modelo |
|---|---|
| Baixa — CSS pontual, renomeação, correção TS single-file | 3.7 Flash (Low) |
| Média — multi-arquivo, ou single-file com lógica de estado | 3.7 Flash (Medium) |
| Alta — telas novas, UI complexa, remover conceito inteiro | 3.7 Flash (High) |
| Arquitetura leve | 3.1 Pro (Low) |
| Arquitetura — banco, migrations, triggers, tabelas novas | 3.1 Pro (High) |

**Conversa nova** sempre que criar arquivo novo, trocar de branch ou virar de
contexto arquitetural. Contexto velho é a principal fonte de o agente "lembrar"
de coisas que não foram pedidas.

---

## Correções pendentes (auditoria de 22/08)

- ✅ ~~`Billable.tsx:519` — cor semântica contra literal `8.5`~~ **RESOLVIDO**
- 🟡 `src/pages/Ajustes.tsx:58-63` — `getSemanaAtual()` calcula segunda-feira
  com lógica própria, ignorando `config.inicio_semana` e `utils/semana.ts`
- 🟡 Fallbacks `'08:00'`/`'18:00'` em `Registros.tsx:280`, `ModalRegistro.tsx` e
  `Ajustes.tsx`, divergindo do padrão `09:00`–`18:30`
- ⚪ `useState(42.5)` em `Billable.tsx:229`, `useState(170)` em
  `Billable.tsx:235` e `useState(42.5)` em `Ajustes.tsx:72` — flicker antes do
  carregamento assíncrono; cosmético
- ⚪ Duplicação da conta de margem em `Billable.tsx` (L139, L176, L260, L309)

---

## Melhorias funcionais restantes

- **Gap de tempo ocioso clicável** — a linha "Xh disponíveis" vira botão que
  abre o `ModalRegistro` já com `hora_inicio` e `hora_fim` preenchidos
- **Excluir registro com desfazer** — excluir direto + toast "Desfazer" por
  ~6s, padrão Gmail/Linear. Vale **só para registro**; fase, categoria, projeto
  e plano semanal continuam com `ModalConfirmacao`
- **Aviso de dias incompletos** no topo de Registros — comparar a jornada
  esperada com o total lançado, para cada dia já passado da semana corrente.
  Nunca considerar dias futuros. Informativo, dispensável
- **Estados vazios que agem** — já feito em Registros e no Resumo; falta nas
  demais telas

### Horizonte

- Aba Gráficos no Resumo (recharts), drill-down por projeto/subcategoria
- Plano semanal **por fase** — banco já preparado (`plano_semanal.fase_id`),
  UI não construída
- Arraste para mover categorias entre fases (hoje só pelo menu)
- Ordem manual de categorias dentro da fase — exigiria coluna `ordem` nova em
  `subcategorias`, migration e backfill
- **Auditoria por trigger no Postgres — Caminho B decidido**, não iniciado:
  função genérica `SECURITY DEFINER` em `INSERT/UPDATE/DELETE`, gravando
  `auth.uid()`, operação, tabela e `OLD`/`NEW` como `jsonb`. Impossível de
  burlar ou esquecer, e **guarda a linha inteira antes do DELETE** — recuperar
  uma fase apagada vira um `INSERT` a partir do `jsonb`. Decisões em aberto:
  quais tabelas auditar (sugestão: `projetos`, `fases`, `subcategorias`,
  `plano_semanal`, `horas_base_semanal`, `configuracoes`; incluir `registros`
  dobra o volume) e se haverá tela de leitura. **Modelo: 3.1 Pro (High)**, com
  o SQL revisado antes de rodar
- Notificações Push via Supabase Edge Functions (VAPID, sem Firebase)
- Renomear "subcategoria" para "categoria" **só na interface** — cerca de 200
  ocorrências em 5 arquivos. Tabela, coluna, tipo e variáveis permanecem

---

## Arquivos protegidos — nunca modificar sem aprovação explícita

- `src/lib/supabase.ts`
- `src/services/registros.ts` → função `calcularDuracaoCentesimal`
- `src/utils/semana.ts`
- `vite.config.ts`
- `src/contexts/AuthContext.tsx`
- `src/index.css` e `tailwind.config.js` (tokens — só em etapa dedicada)

---

## Mapa de arquivos

| Problema | Arquivo |
|---|---|
| Tela de registros | `src/pages/Registros.tsx` |
| Tela de resumo | `src/pages/Resumo.tsx` |
| Breakdown de subcategorias | `src/components/BreakdownSubcategorias.tsx` |
| Tela de projetos | `src/pages/Projetos.tsx` |
| Detalhe do projeto | `src/pages/ProjetoDetalhe.tsx` |
| Grade timesheet | `src/pages/Timesheet.tsx` |
| Tela billable | `src/pages/Billable.tsx` |
| Lembretes | `src/pages/Lembretes.tsx` |
| Configurações | `src/pages/Ajustes.tsx` |
| Navegação / drawer mobile | `src/components/Sidebar.tsx` |
| Menu de três pontinhos | `src/components/MenuAcoes.tsx` |
| Primitivas de UI | `src/components/ui/` (barrel em `index.ts`) |
| Galeria viva das primitivas | `src/pages/UIKit.tsx` (rota `/ui-kit`) |
| Modal de registro | `src/components/ModalRegistro.tsx` |
| Cálculo de semana | `src/utils/semana.ts` |
| Cálculo centesimal | `src/services/registros.ts` |
| Metas semanais/mensais | `src/services/horas_base.ts` |
| Config global | `src/contexts/ConfigContext.tsx` |
| Tokens de estilo | `src/index.css` + `tailwind.config.js` |

## Tokens disponíveis

`bg-surface-0|1|2|3`, `text-ink-900|700|500|300`, `border-hair` /
`border-hair-strong`, `accent` / `accent-bg` / `accent-fg`, `pri` / `pri-fg` /
`pri-hover`, `ok` / `ok-bg`, `warn` / `warn-bg`, `bad` / `bad-bg`, `proj-1..8`,
`rounded-chip|ctl|card|sheet`, `shadow-e1|e2|e3`, `font-display|ui|mono`,
`duration-d1|d2|d3`, `ease-ez`.

**Valores no tema escuro:** `--bg-0:#0F1216` · `--bg-1:#141920` ·
`--bg-2:#1A202A` · `--bg-3:#222936` · `--accent:#5C87F7` (índigo, não o ciano
antigo `#03A9F4`) · `--ok:#6FBF8E` · `--bad:#E8796B` · `--warn:#E0B457`.

---

## Arquivos de contexto no repositório

| Arquivo | Finalidade |
|---|---|
| `HANDOFF.md` | Estado da sessão — **ler no início de cada sessão** |
| `AGENTS.md` | Guia técnico para agentes IA (⚠️ desatualizado: a estrutura de pastas não tem `ui/`, `ProjetoDetalhe.tsx` nem `ConfigContext.tsx`) |
| `CHANGELOG.md` | Histórico de desenvolvimento |
| `PWA_GUIA_COMPLETO.md` | Referência de PWA e push notifications |

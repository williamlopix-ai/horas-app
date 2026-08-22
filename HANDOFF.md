# HANDOFF — Projeto HORAS

> Documento de estado da sessão. Ler no início de cada nova sessão.
> Última atualização: 22/08/2026 (fim da sessão)

---

## ⚠️ Pendências imediatas (ler primeiro)

### 1. Limpeza no Supabase — prazo vencido, adiado por decisão
As 5 tabelas temporárias criadas na migração de sábado continuam no banco.
O gatilho combinado era **duas semanas fechadas** com a semana em sábado e os
números do Resumo e do Billable batendo com o timesheet corporativo. A migração
foi em 11/08; a segunda semana fechou em **22/08**.

**Em 22/08 o usuário optou por adiar.** Falta a conferência Resumo × Billable ×
timesheet corporativo. As tabelas não atrapalham nada, só ocupam espaço —
mas enquanto existirem, existe o risco de alguém consultá-las achando que são
dados vivos. Retomar quando houver a conferência.

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
Ver "Incidente de 20/08" abaixo. O projeto hoje tem `Fase 1` (400h previstas,
com todas as categorias) e `Fase 2` (vazia). A estrutura original tinha cerca
de 5 fases, cujos nomes e horas se perderam. Redistribuir quando houver
clareza sobre a divisão real.

### 4. Três lançamentos sem subcategoria no VALE DH
Somam 9h e mantêm o bloco "Sem fase" visível. Dois parecem lixo de teste.

| data | horário | duração | observação |
|---|---|---|---|
| 02/06/2026 | 13:30–14:00 | 0,5h | teste survey |
| 26/07/2026 | 04:00–12:00 | 8,0h | — |
| 29/07/2026 | 13:30–14:00 | 0,5h | — |

O de 26/07 começa às 4h da manhã — conferir se é deslocamento de campo real ou
lançamento com hora errada. Atribuir categoria ou excluir; o bloco "Sem fase"
some sozinho quando os 9h zerarem.

### 5. `src/pages/Dashboard.tsx` — provável código morto
O agente leu esse arquivo ao varrer as páginas na Fase 3.1. Ele **não está em
nenhuma rota do `App.tsx` nem na sidebar**. Confirmar e, se for o caso, excluir
em commit próprio **na `main`** (é limpeza, não redesign):

```powershell
Select-String -Path src\*.tsx,src\pages\*.tsx,src\components\*.tsx -Pattern "Dashboard"
```

---

## 🔥 Incidente de 20/08 — perda das fases do VALE DH

**O que aconteceu.** O usuário clicou no `✕` de uma fase esperando remover
apenas aquela fase. Como restava só uma, `handleClicarExcluirFase` desviava
para o fluxo "remover divisão em fases", que apagava **todas** as fases e
zerava o `fase_id` de todas as subcategorias do projeto.

**Causa raiz.** Um atalho redundante: o `✕` da última fase disparava uma ação
destrutiva que já tinha botão próprio e rotulado no rodapé da seção. Mesmo
ícone, dois alcances diferentes.

**O que se perdeu.** Apenas as linhas da tabela `fases` (nome, ordem,
`horas_contratadas`). Cerca de 5 fases.

**O que NÃO se perdeu.** Subcategorias, `horas_alocadas` de cada uma, todos os
registros, e `horas_contratadas` do projeto. `atribuirFaseEmLote` só atualiza
`fase_id` e não toca em mais nada.

**Por que não houve restore.** O `DELETE` é hard delete. Os logs do Postgres no
Supabase não registram DML por padrão, então não há como recuperar a linha
apagada a partir deles.

**Corrigido na Etapa 1** (ver abaixo). O `✕` agora exclui sempre só a fase
clicada.

### Auditoria feita no banco durante o incidente

Query que detecta projetos que perderam a divisão em fases (candidatos, não
prova — é possível reservar horas sem nenhuma fase existir):

```sql
select p.nome as projeto, s.nome as subcategoria, s.horas_alocadas, s.criado_em
from subcategorias s
join projetos p on p.id = s.projeto_id
where s.horas_alocadas is not null
  and not exists (select 1 from fases f where f.projeto_id = p.id)
order by p.nome, s.nome;
```

Retornou VALE DH e **klabin**. O klabin provavelmente nunca teve fases — as
subcategorias já embutem as horas no próprio nome ("Realização das Entrevistas
20h"), sugerindo reserva direta sem fase. Não foi alterado.

**Achado colateral:** `NOVO TESTE JUL` tem fases com `ordem` 2 e 3, sem ordem 1
— uma fase foi excluída ali em algum momento. `handleAddFase` usa
`Math.max(...ordem) + 1`, então o buraco não gera duplicidade. Projeto de
teste, sem ação.

---

## Stack e ambiente

| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript + Tailwind CSS + Vite |
| Banco | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel (auto-deploy via push na branch `main`) |
| Repositório | `github.com/williamlopix-ai/horas-app` |
| Produção | `horas-app-nine.vercel.app` |
| Agente de código | Antigravity (VS Code) |
| Ambiente local | Windows + PowerShell |

---

## O que foi feito nesta sessão (22/08) — Fase 3.1 do redesign

Sessão curta e cirúrgica, inteira na branch `redesign`, num único arquivo:
`src/components/Sidebar.tsx`. Nenhuma migração de banco, nenhuma tela tocada.
O detalhamento está em **Redesign visual → Fase 3.1**, mais abaixo.

Dois aprendizados de processo que valem mais que o código entregue:

1. **A Fase 3.0 foi planejada por engano e cancelada.** Ver abaixo.
2. **O agente encolheu o alvo de toque por conta própria** num app que é PWA de
   celular. Diff proposto ≠ diff aprovado: a revisão pegou três desvios que não
   estavam no pedido.

---

## O que foi feito na sessão de 20/08

Sessão dedicada à tela `ProjetoDetalhe.tsx`. Cinco etapas, um componente novo,
nenhuma migração de banco.

### Etapa 1 — desarmar o `✕` da fase

`handleClicarExcluirFase` perdeu o desvio `if (fases.length <= 1)`. O `✕` agora
exclui sempre apenas a fase clicada, mesmo sendo a última — as subcategorias
caem para `fase_id = null` e o projeto volta ao modo simples naturalmente.

O modal de destino deixou de ter padrão arbitrário. Antes ele vinha
pré-selecionado com `outrasFases[0].id` (a primeira fase por `ordem`, não a
anterior), e o usuário confirmava sem perceber. Agora:

- constante `DESTINO_PENDENTE = '__escolher__'` no escopo do módulo
- havendo outras fases → o select abre em "Escolha o destino" (opção
  `disabled`) e o botão de confirmar fica desabilitado
- sendo a última fase → "Deixar sem fase" vem pré-selecionado, pois é a única
  opção possível
- guarda no início de `handleConfirmarExclusaoFaseComSubs` para o caso de
  chegar `DESTINO_PENDENTE`

**Atenção:** string vazia `''` significa "Deixar sem fase" e continua
significando isso. Não confundir com `DESTINO_PENDENTE`.

O botão do rodapé passou a se chamar **"Remover todas as fases"** (era "Remover
divisão em fases"), e a mensagem do modal ganhou a linha "Para remover apenas
uma fase, use o ✕ da própria fase".

### Etapa 2 — mover categoria entre fases

Novo componente **`src/components/MenuAcoes.tsx`** — menu de três pontinhos
genérico e reutilizável.

```ts
type ItemMenu = {
  label: string
  onClick: () => void
  perigo?: boolean
  separadorAntes?: boolean
  desabilitado?: boolean   // true + onClick vazio = rótulo de seção
}
```

**Armadilha resolvida:** o card da fase usa `rounded-2xl overflow-hidden`, que
cortaria um painel `position: absolute`. O menu usa **`position: fixed`** com
`top`/`left` calculados por `getBoundingClientRect()` na abertura, alinhado à
direita do gatilho, abrindo para cima quando não cabe abaixo. Fecha ao clicar
fora, no `Escape`, ao rolar (listener com `capture: true`) e no resize.
`z-40` — acima dos cards, abaixo dos modais.

Na linha da subcategoria, os dois ícones (lápis e `✕`) viraram um único menu.
Item "Mover para..." lista todas as fases exceto a atual, mais "Sem fase".

`handleMoverSubcategoria` chama
`atualizarSubcategoria(subId, nome, undefined, novaFaseId)`.
**O terceiro parâmetro DEVE ser `undefined`** — passar `null` apagaria as horas
reservadas. Depois de salvar, se a fase de destino ficar acima do previsto,
dispara um segundo toast de alerta.

### Etapa 3a — hierarquia de ações

- Cabeçalho do card da fase: os dois ícones viraram um `MenuAcoes` com "Editar
  fase" e "Excluir fase". A guarda `editandoFaseId !== null` foi preservada —
  sem ela seria possível abrir o menu de uma fase enquanto outra está em edição
  inline, descartando alterações não salvas.
- Ponto de entrada único para criar fase: "+ Dividir em fases" saiu do card de
  progresso. O cabeçalho da seção passou a ter um botão primário azul cujo
  texto depende do estado ("Dividir em fases" quando `fases.length === 0`,
  "+ Nova fase" caso contrário).
- "Remover todas as fases" saiu do rodapé e foi para um `MenuAcoes` no
  cabeçalho da seção.
- O bloco "Sem fase" deixou de parecer uma fase real: borda tracejada, título
  em cinza menor, e a linha explicativa "Lançamentos que não pertencem a
  nenhuma fase. Some quando todos tiverem subcategoria." O usuário tentou
  excluí-lo antes disso — ele é calculado, não existe no banco.

### Etapa 3b — glossário de horas e barra segmentada

O problema: três grandezas diferentes exibidas como `X / Y`, indistinguíveis.

**Glossário aprovado — usar exatamente estas palavras:**

| Nível | Termo | Frase natural |
|---|---|---|
| Projeto | **contratadas** | "o projeto tem 400h contratadas" |
| Fase | **previstas** | "essa fase tem 40h previstas" |
| Categoria | **reservadas** | "reservei 10h para essa categoria" |
| Realizado | **lançadas** | "já lancei 4h" |

O verbo "alocar" virou **"reservar"** em todo texto visível. Nenhuma variável,
state, handler ou coluna foi renomeada — `horas_alocadas`, `alocadoFormatado`,
`temAlocacao` e afins seguem com os nomes atuais.

**"planejado" é palavra proibida neste contexto** — já pertence a
`plano_semanal.horas_planejadas`, e os dois conceitos convivem na mesma tela.

Mudanças concretas:

- Cabeçalho da fase: `80,25h de 400h previstas`, ou `80,25h lançadas` quando
  não há orçamento
- Linha da categoria: `28,75h de 30h reservadas`, ou só `24,00h` sem reserva
- Barra segmentada dentro da fase expandida: verde = lançadas, azul =
  reservadas sem uso, vazio = não reservado; barra inteira vermelha quando as
  lançadas superam o previsto. Ambos os segmentos são clampados ao teto antes
  de virar percentual, então nunca somam mais de 100.
- Sub-reserva deixou de ser alerta amarelo: virou texto discreto "Restam Xh
  para reservar". Só o **excesso** é vermelho ("Xh além das Yh previstas").
- `temPrevisto` exige `> 0`, então fase com 0h previstas não exibe mais a tarja
  verde "Totalmente reservado", que era sem sentido.

**Acabamento aplicado depois do primeiro teste:**

- A legenda da barra repetia o número do cabeçalho ("94h reservadas de 400h") —
  removida, ficaram só os dois rótulos coloridos.
- A coluna de percentual só era renderizada sem reserva, então aparecia e
  sumia, desalinhando os menus. Agora é sempre renderizada com `w-10`, vazia
  quando não se aplica.
- **"sem reserva" estava sendo usado para duas grandezas diferentes.**
  Desambiguado: o rodapé da lista virou "Xh lançadas fora de reserva" (horas
  lançadas em categorias sem reserva) e o aviso da fase virou "Restam Xh para
  reservar" (orçamento não distribuído).
- O botão "+ adicionar subcategoria" ganhou contorno e passou a dividir a linha
  com o aviso de reserva, alinhados nas pontas opostas.
- O container flex desse rodapé é **sempre** renderizado; só o conteúdo da
  esquerda alterna. Amarrá-lo ao estado de "adicionando" fazia o aviso sumir
  quando o formulário estava aberto.

### Etapa 3d — reserva por linha, fim do modo global

O modo global de reserva foi **removido inteiro**. O botão "Concluir" ficava no
rodapé da página, fora da tela, enquanto o usuário digitava no topo.

Removidos: states `modoAlocacao`, `alocacoes`, `salvandoAlocacoes`; handlers
`handleEntrarModoAlocacao`, `handleCancelarAlocacoes`, `handleSalvarAlocacoes`;
o botão "Reservar horas" do cabeçalho; a barra "Cancelar / Concluir"; e todos
os ramos condicionais espalhados pelo arquivo.

No lugar: edição inline por linha, espelhando o par `editandoSubId` /
`nomeSubEditando` que já existia.

- states `editandoReservaId` e `valorReservaEditando`
- item "Reservar horas" no menu da categoria
- a linha vira input com `✓` e `✕` ao lado; Enter salva, Escape cancela; campo
  vazio remove a reserva
- `handleSaveEditReserva` valida **antes** de qualquer efeito colateral —
  validação dentro do `try`, depois de `setSalvandoSub(true)`, deixava o editor
  aberto sem sinal visual de rejeição
- chama `atualizarSubcategoria(subId, nome, valor, undefined)`. **O quarto
  parâmetro DEVE ser `undefined`** — `null` moveria a categoria para fora da
  fase
- renomear e reservar nunca coexistem: cada um cancela o outro
- `MenuAcoes` das linhas ganhou `editandoReservaId !== null` no `desabilitado`

Como o modo sumiu, `reservadoFase` e `somaAlocada` passaram a ler sempre do
banco, sem ramo alternativo.

"Adicionar subcategoria" entrou no topo do menu da fase, **mantendo** também o
botão do rodapé. Decisão consciente: o item de menu é atalho para quando a
lista é longa demais para rolar.

### Etapa 4 — horas digitadas deixam de se perder ao trocar a data

`src/components/ModalRegistro.tsx`

Bug: o `useEffect` que busca o horário padrão pela hierarquia
(`horarios_dia` → `horarios_semana` → padrão global) rodava a cada mudança de
`data` e sobrescrevia `horaInicio` e `horaFim`. Quem digitava as horas e depois
corrigia a data perdia o que tinha digitado.

Correção: novo state `horasEditadasManualmente`, zerado nos dois ramos do efeito
de abertura (edição e criação), ligado nos `onChange` dos dois campos de hora, e
somado à guarda e ao array de dependências do efeito do horário padrão.

O preenchimento automático continua funcionando ao abrir o modal e ao escolher a
data pela primeira vez. A hierarquia de busca não mudou.

### Etapa 5 — tudo nasce recolhido em ProjetoDetalhe

- **Fases** nascem fechadas. Antes, `expandidasMap[f.id] = duracaoFase > 0`
  abria sozinha toda fase com horas lançadas. Agora é sempre `false`, e o
  cálculo de `subIdsPorFase`/`duracaoFase` que só servia para isso foi removido.
- **Semanas de Lançamentos** nascem fechadas. O `isFirst` sumiu de
  `toggleSemana` e do cálculo de `isExpanded`, que virou
  `semanasExpandidas[chave] ?? false`.
- **As três seções viraram recolhíveis**: "Fases & Subcategorias", "Plano
  semanal" e "Lançamentos". State `secoesExpandidas` com as chaves `'fases'`,
  `'plano'` e `'lancamentos'`, todas ausentes (= recolhidas) por padrão. O
  título virou botão com chevron que gira; o parágrafo descritivo de cada seção
  só aparece expandido.
- **Contadores no cabeçalho recolhido** — "3 fases · 9 subcategorias",
  "2 semanas planejadas", "31 lançamentos" — para não precisar abrir só para
  descobrir o que tem dentro.
- As ações da direita (botão azul primário, `MenuAcoes`) continuam visíveis com
  a seção recolhida e ficam **fora** do `<button>` do título, então clicar nelas
  não recolhe a seção.

**Armadilha do refactor:** a seção de fases era um ternário
`fases.length > 0 ? (...) : (/* PROJETO SEM FASES */)`. Envolvê-lo numa
condição de expansão quase perdeu o ramo `else`. A forma final usa **duas
condições irmãs** em vez de ternário aninhado — mais legível e impossível de
quebrar silenciosamente. O único projeto que exercita o segundo bloco é o
**klabin**, o único sem fases; testar sempre nele.

---

## Estado atual do banco

**Nenhuma alteração de schema nesta sessão.** Nenhuma tabela, coluna, migration
ou índice novo. Todo o trabalho foi de interface e lógica de tela.

Tabelas temporárias ainda pendentes de remoção: `_bkp_semana_registros`,
`_bkp_semana_horas_base`, `_bkp_semana_margem`, `_bkp_semana_billable`,
`_bkp_semana_config`.

---

## Próximos passos

### Etapa 3c — renomear subcategoria para categoria (só na interface)

**Decisão tomada:** renomear **apenas o texto visível**. A tabela
`subcategorias`, a coluna `registros.subcategoria_id`, o tipo `Subcategoria`, o
service e os nomes de variáveis **permanecem como estão**.

O termo aparece cerca de 200 vezes no código — 81 em `ProjetoDetalhe.tsx`, 53
em `ModalProjeto.tsx`, 35 em `ModalRegistro.tsx`, mais `Resumo.tsx` e
`Registros.tsx`. Renomear a coluna significaria migration, 8 arquivos tocados,
quebra do export Excel e risco real de regressão, por ganho zero.

**Nota de tradução permanente: "categoria" na tela = `subcategoria` no código.**

Arquivos a varrer: `ProjetoDetalhe.tsx`, `ModalRegistro.tsx`, `ModalProjeto.tsx`,
`Resumo.tsx`, `Registros.tsx`.

### Auditoria por trigger no Postgres — decidida, não iniciada

O usuário quer rastrear cada ação para diagnosticar incidentes futuros. Foram
avaliados dois caminhos e **o Caminho B foi escolhido**:

- **Caminho A (rejeitado)** — log na aplicação, chamando `registrarEvento` em
  cada handler. Captura a intenção, mas exige instrumentar dezenas de pontos,
  é fácil esquecer um, e feature nova nasce sem rastro.
- **Caminho B (escolhido)** — função genérica `SECURITY DEFINER` disparada em
  `INSERT/UPDATE/DELETE`, gravando `auth.uid()`, a operação, a tabela e
  `OLD`/`NEW` como `jsonb`. Impossível de burlar ou esquecer, feature nova já
  nasce auditada, e **guarda a linha inteira antes do DELETE** — recuperar uma
  fase apagada vira um `INSERT` a partir do `jsonb`. Zero mudança no app.

Decisões ainda em aberto:
1. Quais tabelas auditar. Sugestão: `projetos`, `fases`, `subcategorias`,
   `plano_semanal`, `horas_base_semanal`, `configuracoes` (estrutura, onde a
   perda dói). Incluir `registros` dobra o volume.
2. Se haverá tela de leitura ou se basta consultar por SQL.

**Modelo: Gemini 3.1 Pro (High).** O SQL deve ser revisado antes de rodar no
Supabase, não só o diff.

### Acabamentos menores identificados e não feitos

- **Percentuais com denominadores diferentes.** Na linha da categoria, o `96%`
  abaixo da barrinha é "lançadas ÷ reservadas", enquanto o `30%` de uma
  categoria sem reserva é "lançadas ÷ total da fase". Grandezas distintas,
  formatação idêntica — mesmo pecado que a 3b resolveu nos números absolutos.
- **Regra híbrida do total contratado.** Em `ProjetoDetalhe.tsx`,
  `totalContratado` usa a soma das fases quando existe alguma com horas,
  sobrescrevendo `projeto.horas_contratadas`. Dar 100h à Fase 2 do VALE DH faria
  o cabeçalho dizer 500h contratadas, sem aviso de que ultrapassa o contrato
  real de 400h. Cabe um alerta quando a soma das fases exceder o contratado.
- **Mobile.** A linha da categoria ficou bem mais longa com o glossário
  ("28,75h de 30h reservadas" contra "28,75h / 30h"). O nome tem `min-w-0` e
  quebra linha, mas convém verificar em tela estreita com nome comprido.

### Melhorias funcionais restantes (da lista de 8 aprovadas no protótipo)

- **Paleta de comandos ⌘K** — buscar projeto, lançar horas, navegar entre
  telas. Biblioteca sugerida: `cmdk`. É a de maior escopo.
- **Gap de tempo ocioso clicável** — a linha "Xh disponíveis" vira botão que
  abre o `ModalRegistro` já com `hora_inicio` e `hora_fim` preenchidos.
- **Excluir registro com desfazer** — excluir direto + toast "Desfazer" por
  ~6s, padrão Gmail/Linear. Vale **só para registro**; fase, subcategoria,
  projeto e plano semanal continuam com `ModalConfirmacao`.
- **Aviso de dias incompletos** — no topo de Registros, comparar a jornada
  esperada (`horarios_dia` → `horarios_semana` → padrão) com o total lançado,
  para cada dia já passado da semana corrente. Nunca considerar dias futuros.
  Informativo, nunca bloqueia, com botão de dispensar.
- **Estados vazios que agem** — botão de ação direta em vez de só texto.

### Horizonte

- Aba Gráficos no Resumo (recharts): drill-down por projeto/subcategoria
- Plano semanal **por fase** — banco já preparado (`plano_semanal.fase_id`),
  UI não construída
- Arraste para mover categorias entre fases (hoje só pelo menu) — só construir
  se sentir falta em uso real
- Ordem manual de categorias dentro da fase — exigiria coluna `ordem` nova em
  `subcategorias`, migration e backfill. Hoje a ordem é automática: primeiro as
  com horas lançadas (maior para menor), depois as zeradas em ordem alfabética
- Alerta de planejado × realizado fora da página do projeto
- Notificações Push via Supabase Edge Functions (VAPID, sem Firebase)

### Redesign visual — FRENTE ATIVA (branch `redesign`)

**Fase 1 — Tokens: CONCLUÍDA** (commit 78393da)
Variáveis CSS em `src/index.css` (paleta escura + clara, raio, sombra,
movimento, 8 cores de projeto `--proj-1..8`), mapeadas em `tailwind.config.js`.
`data-theme="dark"` no `<html>`. Fontes locais via `@fontsource`
(Instrument Sans, Inter Variable, IBM Plex Mono) importadas em `main.tsx`.
Nenhuma tela foi alterada — os hex antigos seguem no lugar.

**Fase 2 — Primitivas: CONCLUÍDA**
Sete componentes em `src/components/ui/` + barrel `index.ts`:
Button, Chip, Surface, Field (+ `classeCampo()`), Stat, DataRow, Sheet.
Página de validação visual em `/ui-kit` (`src/pages/UIKit.tsx`), rota pública,
com alternador de tema claro/escuro. É a referência viva das primitivas.

**Fase 3.0 — Consolidação da sidebar: NÃO EXISTIU.**
Foi planejada por engano e cancelada antes de gerar diff. O diagnóstico partiu
dos arquivos montados no projeto do Claude, que são de um **commit antigo**, no
qual Resumo, Timesheet e Billable ainda tinham a sidebar copiada inline. No
disco real, as 8 páginas já usavam `<Sidebar />` havia tempo.

> **Lição de processo: conferir o disco antes de planejar refatoração ampla.**
> Custou um prompt inteiro escrito e descartado. Comando de verificação:
> ```powershell
> Select-String -Path src\pages\*.tsx -Pattern "isSidebarOpen|w-\[240px\]|<aside"
> ```
> Sem retorno = consolidado.

**Fase 3.1 — Sidebar nova: CONCLUÍDA**
`src/components/Sidebar.tsx` reescrito inteiro. **Zero hex fixo no arquivo.**
Saiu de ~230 linhas para ~137.

- **Links dirigidos por array.** `ITENS_NAV` no escopo do módulo, renderizado
  por `.map()`. Eram 7 blocos `<Link>` de 15 linhas cada, idênticos — qualquer
  ajuste virava 7 edições. Adicionar tela agora é uma linha.
- **`prefixos`** — campo opcional do item. "Projetos" tem `['/projeto']`, então
  acende em `/projeto/:id`. Antes `isActive` era igualdade exata e a sidebar
  ficava **inteira apagada** dentro de um projeto.
- **Ícones `lucide-react`** no lugar dos SVGs inline:
  `Clock`, `ChartNoAxesColumn`, `Table2`, `CircleDollarSign`, `FolderKanban`,
  `Settings`, `Bell`.
- **Tokens:** `bg-surface-1`, `border-hair`, `text-ink-500`/`text-ink-900`,
  `hover:bg-surface-2`, `bg-accent-bg` + `text-accent-fg` no ativo,
  `rounded-ctl`, `duration-d1 ease-ez`, `font-display` no logo.
- **Três bugs do drawer mobile corrigidos:**
  1. **Fecha ao navegar** — `useEffect` em `location.pathname`. Antes o drawer
     ficava aberto por cima da tela nova depois do clique no link.
  2. **Fecha no `Esc`** — listener registrado só enquanto aberto.
  3. **Trava o scroll do body** enquanto aberto, restaurando o valor original
     na limpeza.
- **Rodapé:** o botão vermelho "Sair" virou email truncado + `MenuAcoes` com um
  único item (`label: 'Sair'`, `perigo: true`, `rotulo="Ações da conta"`).
  Logout é ação rara e não merece botão vermelho permanente na tela.
- **Acessibilidade:** `<nav aria-label="Navegação principal">` e
  `aria-current="page"` no item ativo.
- **Preservado:** largura `w-[240px]`, breakpoint `lg`, e toda a lógica do badge
  de lembretes (`listarLembretes`, filtro `status === 'pendente'`, flag `ativo`
  de cleanup, catch silencioso). As páginas dependem de `lg:ml-[240px]` no
  `<main>` e **não foram tocadas**.

**Testado e aprovado:** `/projeto/:id` acende "Projetos"; drawer navega e fecha
no celular real; `Esc` fecha na janela estreita do desktop; badge conta certo
(validado criando um lembrete — com zero pendentes o badge não aparece, então
não testa nada).

**Três desvios que a revisão do diff pegou** — o agente os introduziu sem que
fossem pedidos:
1. `truncate` no email sem `min-w-0` — estouraria o rodapé com email longo
2. Itens de `py-3`/`h-5` para `py-2.5`/`h-4` — alvo de toque de ~48px para ~40px
3. Logo do `<aside>` encolhido de `h-6` para `h-5`

**Próxima: Fase 3.2 — paleta de comandos.** `cmdk` (ainda não instalada) +
**campo falso de busca no topo da sidebar**: lupa + "Buscar..." + badge do
atalho. O campo é obrigatório — atalho de teclado sozinho é invisível para quem
não sabe que existe e inútil no PWA do celular, que não tem teclado físico.

Decisões pendentes para a 3.2:
- **São 7 links, não 4.** O plano original previa atalhos numéricos 1–4.
  Decidir: vira 1–7, ou só as quatro telas principais ganham atalho?
- O badge deve dizer **`Ctrl K`**, não `⌘K` — o ambiente é Windows. O `⌘` é
  notação de Mac.

Depois: **3.3** (botão fixo "+ Lançar horas"), **Fase 4** (telas na ordem
Registros → ProjetoDetalhe → Resumo → Timesheet → Billable → Ajustes, uma por
sessão) e **Fase 5** (acabamento).

**Tokens disponíveis:** `bg-surface-0|1|2|3`, `text-ink-900|700|500|300`,
`border-hair`/`border-hair-strong`, `accent`/`accent-bg`/`accent-fg`,
`pri`/`pri-fg`/`pri-hover`, `ok`/`ok-bg`, `warn`/`warn-bg`, `bad`/`bad-bg`,
`proj-1..8`, `rounded-chip|ctl|card|sheet`, `shadow-e1|e2|e3`,
`font-display|ui|mono`, `duration-d1|d2|d3`, `ease-ez`.

**Armadilhas novas na Fase 3.1:**
- **`--accent` é `#5C87F7` (índigo), não `#03A9F4` (ciano).** A sidebar nova usa
  o token; as telas ainda usam hex fixo. **Os dois azuis convivem na mesma tela
  até a Fase 4 chegar em cada uma. Isso é esperado, não é bug.** A alternativa
  seria apontar `--accent` para o ciano antigo, o que anularia a Fase 1 e jogaria
  a decisão de paleta para o fim — descartada conscientemente.
- **`truncate` não funciona em filho de flex sem `min-w-0`.** O `min-width: auto`
  padrão impede o encolhimento e o irmão é empurrado para fora do container.
  Pegou o email no rodapé da sidebar. **Vale para todo o resto do redesign.**
- **`lucide-react@1.17.0` não tem `BarChart3`.** No Lucide v1 a família de
  gráficos virou prefixo `Chart*`. O equivalente do SVG antigo é
  **`ChartNoAxesColumn`** (colunas verticais sem eixos). Sempre mandar o agente
  **confirmar o nome do ícone na versão instalada** antes de importar.
- **Alvo de toque: mínimo 44px.** O agente encolheu os itens por conta própria.
  Este app é um PWA usado no celular — `py-3` + ícone `w-5 h-5` é o piso.
- **`--accent-bg` e `--accent-fg` já existem prontos** (`rgba(92,135,247,.15)` e
  `#8FAEFF`). Não usar `color-mix` onde já há token de fundo translúcido.
- **Badge nunca usa `--accent-fg` sobre `--accent`** — `#8FAEFF` sobre `#5C87F7`
  fica ilegível. Fundo sólido `var(--accent)` com texto branco.
- **Testar drawer mobile no desktop**: basta arrastar a borda da janela para
  baixo de 1024px (breakpoint `lg`). Não precisa de DevTools nem de celular —
  e só assim dá para testar o `Esc`.

**Armadilhas aprendidas nas fases 1 e 2:**
- **Mudou `tailwind.config.js`? Reinicie o `npm run dev`.** O Tailwind lê a
  config só na subida. Salvar não basta — as classes novas simplesmente não
  são geradas, sem erro nem aviso. Custou uma rodada inteira de diagnóstico.
- Nunca sobrescrever chaves padrão do Tailwind (`rounded-sm/md/lg`,
  `shadow-sm/md/lg`). Usar nomes semânticos próprios.
- `transitionDuration` deve apontar para `var(--d1)`, não para `'120ms'`
  literal, senão o `@media prefers-reduced-motion` não tem efeito.
- Tailwind 3 não aplica modificador de opacidade em cor vinda de `var()`.
  Para fundo translúcido usar `color-mix(in srgb, var(--x) 15%, transparent)`
  em style inline.
- `noUnusedLocals` está ativo: import não usado quebra o `npx tsc -b`.
- Modal com `aoFechar` no array de dependências do `useEffect` rouba o foco a
  cada render do pai (arrow inline muda de identidade). Guardar numa ref.
- Coluna de valor ou percentual em lista deve ser **sempre renderizada**,
  vazia quando não se aplica. Renderização condicional desalinha as linhas.
- **Não rodar `npm audit fix`** durante o redesign. Fica para depois, na `main`,
  em commit próprio.

---

## Padrões aprendidos — não reverter

### Novos na sessão de 22/08 (processo)

- **Ler o disco antes de planejar refatoração.** Os arquivos montados no projeto
  do Claude podem estar vários commits atrasados. Um `Select-String` de 5
  segundos evita um prompt inteiro escrito à toa.
- **Diff proposto ≠ diff aprovado.** O agente introduz "melhorias" não pedidas
  — encolher padding, trocar tamanho de ícone, uniformizar o que era diferente
  de propósito. **Ler o diff comparando com o pedido, não só procurando bug.**
- **Reescrita de arquivo inteiro exige checklist do que não pode se perder.**
  Aqui era a lógica do badge de lembretes. Definir isso *antes* de olhar o diff,
  senão a leitura vira busca genérica por erro.
- **Exigir do agente um relatório de leitura antes do diff.** Foi ele que
  revelou o `--accent` índigo, a ausência de `BarChart3` e a existência de
  `--accent-bg`. Perguntas que forçam o agente a citar valores reais do disco
  valem mais que qualquer instrução preventiva.

### Novos na sessão de 20/08

- **A fase do registro é lida por join, nunca copiada.** `registros` guarda só
  `subcategoria_id`; a fase chega via
  `subcategoria:subcategorias(nome, fase:fases(nome))`. Por isso mudar a fase
  de uma categoria atualiza **todos** os lançamentos, passados e futuros, na
  hora, sem migração. **Nunca adicionar `fase_id` a `registros`** "por
  performance" — isso mata a garantia.
- **Ação perto do alvo.** Botão de salvar no rodapé enquanto o usuário digita
  no topo é falha de projeto, não detalhe. Foi o que matou o modo global de
  reserva.
- **Um destrutivo, um gatilho.** O mesmo ícone nunca pode ter dois alcances
  diferentes conforme o estado. Foi a causa raiz do incidente.
- **Nunca pré-selecionar destino em ação destrutiva irreversível.** Padrão
  arbitrário vira confirmação automática.
- **Menu em card com `overflow-hidden` exige `position: fixed`** com
  `getBoundingClientRect()`. `absolute` é cortado.
- **`atualizarSubcategoria(id, nome, horasAlocadas?, faseId?)`** — passar
  `undefined` no parâmetro que **não** se quer alterar. `null` apaga o valor.
- **Cada grandeza tem sua palavra.** Dois números com formato igual e
  significado diferente na mesma tela é bug de leitura. Vale também para
  textos: "sem reserva" chegou a significar duas coisas.
- **Sub-utilização não é alerta.** Amarelo só quando algo está errado; estado
  normal é cinza. Alarme falso treina o usuário a ignorar alarmes.
- **Blocos calculados não podem parecer entidades editáveis.** O "Sem fase"
  parecia uma fase e o usuário tentou excluí-lo.
- **Container de layout sempre renderizado, conteúdo alternando dentro.**
  Amarrar o container a um estado faz elementos irmãos sumirem junto.
- **Nada nasce expandido.** Estado inicial aberto engorda a página e esconde o
  que vem depois. Recolhido por padrão, com contador no cabeçalho dizendo o que
  tem dentro.
- **Não envolver ternário em condição — usar condições irmãs.** Embrulhar
  `a ? (X) : (Y)` numa nova condição faz o ramo `else` se perder sem erro de
  compilação. Preferir `{cond && a && (X)}` e `{cond && !a && (Y)}`.
- **Preenchimento automático precisa saber se o usuário já interveio.** Um
  efeito que reage a um campo e sobrescreve outro apaga trabalho. Marcar a
  edição manual com um flag e respeitá-la.
- **`{cond && (` seguido de `{` não compila.** Dentro da expressão vem JSX, não
  outra chave — falta o fragmento `<>`.
- **O diff do Antigravity às vezes sai mal formatado** (linhas sem `+`, tags
  órfãs) sem que o código esteja errado — a representação interna dele está
  íntegra. Validar pela lógica, aplicar, e rodar `npx tsc -b` na hora. JSX
  desbalanceado não passa no TypeScript.

### Anteriores

- **Cores semânticas em totais, não em células individuais**
- **Histórico de metas com start-date** — ordenado por vigência, nunca por data
  de criação
- **Tabs sobre toggles** para visualizações distintas
- **Exceções de horário nunca retroagem**
- **Projetos encerrados preservam horas** — filtrar por `.neq('status','excluido')`
- **Cache do PWA** — loops de login no mobile costumam ser service worker
  desatualizado, não bug de código
- **Um botão, uma função**
- **Componentes compartilhados** — regra de exibição escrita em um lugar só
- **Balde de não atribuídos** — registros sem subcategoria precisam aparecer
- **`stopPropagation` em botões dentro de cards clicáveis**
- **Recarregamento silencioso** — `carregarDados(true)` evita flash de skeleton
- **Cálculo de semana mora em `utils/semana.ts`** — nunca reimplementar local
- **Configuração vem do `useConfig()`** — nunca chamar `buscarConfiguracoes`
  direto numa tela
- **`.is('campo', null)` e nunca `.eq`** para nulos no Supabase
- **Índice parcial não funciona com `.upsert()`** — usar busca-antes-de-decidir
- **Registros.tsx tem 2 blocos de renderização** — alterar sempre os dois
- **`type` explícito em imports de tipo** — o projeto usa `verbatimModuleSyntax`.
  Quebrou duas vezes nesta sessão também: `import React` é obrigatório quando se
  usa `React.MouseEvent`, e `import { type ItemMenu }` precisa da palavra-chave

---

## Arquivos protegidos — nunca modificar sem aprovação explícita

- `src/lib/supabase.ts`
- `src/services/registros.ts` → função `calcularDuracaoCentesimal`
- `vite.config.ts`
- `src/contexts/AuthContext.tsx`

---

## Regras críticas e imutáveis

### Notação centesimal
```
duração = horas_inteiras + (minutos / 60)
1h30min → 1.50 | 1h45min → 1.75 | 9h00min → 9.00
```

### Regras de negócio
- Meta semanal padrão: **42.5h** — configurável em Ajustes → Meta Semanal,
  com vigência por semana
- Semana: **sábado a sexta** (configurável; era segunda a domingo até 11/08/2026)
- Horário padrão do dia: **09:00 às 18:30** (configurável)
- **RLS no Supabase: nunca desativar**
- Gaps mínimos para exibir tempo ocioso: 5 minutos

---

## Design system

| Token | Valor |
|---|---|
| Background primário | `#0B0E14` |
| Superfície / Sidebar | `#161B22` |
| Ação primária | `#03A9F4` |
| Ação primária (hover) | `#0288D1` |
| Sucesso | `#4CAF50` |
| Alerta | `#FFC107` |
| Erro | `#F44336` |
| Texto primário | `#FFFFFF` |
| Texto secundário | `#8B949E` |
| Fonte | Inter |

**Hierarquia de botões estabelecida nesta sessão:**

- **Primário** — `bg-[#03A9F4] text-white font-bold rounded-lg px-3 py-1.5
  text-xs`. No máximo um por seção.
- **Secundário (contorno)** — `border border-gray-700 bg-transparent
  text-[#8B949E] hover:text-white hover:border-gray-600 rounded-lg px-3 py-1.5
  text-xs font-semibold`.
- **Contextual e destrutivo** — dentro do `MenuAcoes` do próprio item.

---

## Fluxo de trabalho

1. Claude analisa o problema e gera o prompt estruturado para o Antigravity
2. Usuário envia ao Antigravity e traz o **diff completo** para validação
3. Claude valida o diff antes da aplicação
4. Usuário aplica e roda `npx tsc -b` manualmente
5. Usuário testa no localhost
6. Usuário commita e faz push (PowerShell, sem caracteres especiais)

> **Nunca aprovar em cima do resumo do agente.** Exigir sempre o diff completo,
> sem elisões.

**Conversa nova no Antigravity** sempre que criar arquivo novo ou virar de
contexto arquitetural. Contexto velho é a principal fonte de o agente "lembrar"
de coisas que não foram pedidas.

### Seleção de modelo no Antigravity

Disponíveis em 20/08/2026: Gemini 3.7 Flash, 3.6 Flash e 3.5 Flash (todos com
Low/Medium/High) e Gemini 3.1 Pro (Low/High). **Preferir sempre a versão mais
nova do tier Flash — hoje 3.7.**

| Complexidade | Modelo |
|---|---|
| Baixa — CSS pontual, renomeação, correção TS single-file | 3.7 Flash (Low) |
| Média — multi-arquivo, ou single-file com lógica de estado | 3.7 Flash (Medium) |
| Alta — novas telas, UI complexa, remover conceito inteiro | 3.7 Flash (High) |
| Arquitetura leve | 3.1 Pro (Low) |
| Arquitetura — banco, migrations, triggers, tabelas novas | 3.1 Pro (High) |

### Regras do prompt para o Antigravity
Todo prompt deve incluir: arquivos a ler antes de editar, arquivos protegidos,
comportamento esperado, critérios de aceite, o lembrete de `verbatimModuleSyntax`
para imports de tipo, e as instruções de **não rodar `npx tsc -b`**, **não
commitar** e **mostrar o diff completo sem elisões**.

---

## Backup

O export Excel da tela de Ajustes é um **relatório**, não um backup restaurável.

Para backup real, rodar no SQL Editor do Supabase e baixar cada CSV
**separadamente** (o editor só mostra o resultado da última query) e
**conferir o limite de linhas**, que por padrão corta em 100:

```sql
SELECT * FROM projetos;
SELECT * FROM subcategorias;
SELECT * FROM fases;
SELECT * FROM registros;
SELECT * FROM configuracoes;
SELECT * FROM plano_semanal;
SELECT * FROM horas_base_semanal;
```

> O incidente de 20/08 mostrou o custo de não ter esses CSVs. Enquanto a
> auditoria por trigger não existir, este é o único mecanismo de recuperação.
> Rodar antes de qualquer operação estrutural em fases ou subcategorias.

---

## Mapa de arquivos

| Problema | Arquivo |
|---|---|
| Tela de registros | `src/pages/Registros.tsx` |
| Tela de resumo | `src/pages/Resumo.tsx` |
| Tela de projetos | `src/pages/Projetos.tsx` |
| Detalhe do projeto (fases, categorias, plano) | `src/pages/ProjetoDetalhe.tsx` |
| Tela de configurações | `src/pages/Ajustes.tsx` |
| Grade timesheet | `src/pages/Timesheet.tsx` |
| Tela billable | `src/pages/Billable.tsx` |
| Menu de três pontinhos | `src/components/MenuAcoes.tsx` |
| Navegação / sidebar / drawer mobile | `src/components/Sidebar.tsx` |
| Primitivas de UI (redesign) | `src/components/ui/` (barrel em `index.ts`) |
| Galeria viva das primitivas | `src/pages/UIKit.tsx` (rota `/ui-kit`) |
| Tokens de cor, raio, sombra, fonte | `src/index.css` + `tailwind.config.js` |
| Modal de registro | `src/components/ModalRegistro.tsx` |
| Modal de projeto | `src/components/ModalProjeto.tsx` |
| Cálculo de semana | `src/utils/semana.ts` |
| Configuração global | `src/contexts/ConfigContext.tsx` |
| Cálculo centesimal | `src/services/registros.ts` |
| Fases | `src/services/fases.ts` |
| Subcategorias | `src/services/subcategorias.ts` |
| Metas semanais/mensais | `src/services/horas_base.ts` |
| Plano semanal | `src/services/plano_semanal.ts` |

# HANDOFF — HORAS

> Cole este arquivo no início de cada sessão nova. Só estado atual +
> regras não-negociáveis + próximo passo.
> **Atualizado em 19/09/2026.** Substitui integralmente a versão anterior.

---

## Regras não-negociáveis (nunca mudam)

- Centesimal: `duração = horas + minutos/60` — `registros.ts:calcularDuracaoCentesimal`.
- Semana: **sábado a sexta**. Todo cálculo passa por `utils/semana.ts`.
- Meta diária = meta semanal ÷ 5. Vale Timesheet e Resumo — **Billable nunca tem meta diária**.
- RLS Supabase nunca desativa.
- Protegidos, só com aprovação explícita: `lib/supabase.ts`, `services/registros.ts`
  (a função acima), `utils/semana.ts`, `vite.config.ts`, `contexts/AuthContext.tsx`,
  `index.css`/`tailwind.config.js`.
- **Nenhum arquivo do código do app fica anexado ao projeto por padrão** — só
  este HANDOFF. Se precisar ler um arquivo real, pedir para colar/anexar ou
  mandar o agente ler do disco.
- **`var()` cru dentro de arbitrary value do Tailwind 3** não é confiável —
  sem erro, sem efeito. Usar utility nativa ou `color-mix` em `style` inline.
- **`overflow-y-auto` + `overflow-x-visible` no mesmo elemento não funciona** —
  qualquer eixo diferente de `visible` força o outro para `auto`.
- Decisão visual ou estrutural = mockup HTML real primeiro (tokens do app),
  nunca texto nem botões de opção.
- **Verificação visual de UI é sempre manual (usuário no navegador)**, nunca
  browser task do agente.
- **Toda atualização de horas contratadas ou previstas passa por
  `ModalConfirmacao`** — nunca grava direto. (Existe UMA violação conhecida
  dessa regra hoje: ver pendência 6.)
- **Nome de ícone do Lucide v1 sempre verificado no disco antes de usar.**
- **`useEffect` com `[user]`** → usar `[user?.id]`.
- **Duas classes Tailwind que controlam a mesma propriedade CSS colidem em
  silêncio** — vence a ordem do CSS gerado, não a da string. Visibilidade
  condicional (`hidden sm:flex`) vai em `<span>` wrapper POR FORA do
  componente, nunca misturada às classes dele.
- **Wrapper de visibilidade condicionado à existência do conteúdo**, não só
  o conteúdo: `{cond && <span>...}`. Span vazio continua sendo item flex e
  consome `gap`.
- **Toda dedução de "encerrado/passado/futuro" usa `utils/semana.ts`.** E ao
  ler retorno de função de data, conferir com qual `config.inicio_semana`
  real ela foi chamada — o default da assinatura é `'segunda'` e o valor do
  app é `'sabado'`.
- **NUNCA buscar dados dependentes de `config` antes de `loadingConfig`
  virar `false`**, e sempre com flag `cancelado` no cleanup do `useEffect`.
  Foi a causa raiz de 4 bugs corrigidos em 19/09.

## Executor desta sessão

Confirmar sempre no início: **Claude Code** ou **Antigravity/Gemini**? Nunca
roda terminal — usuário roda tudo (`tsc`, `git`, `npm`).

Modelos no Antigravity: Gemini **3.8 / 3.7 / 3.6 Flash** (Low/Medium/High)
e **3.1 Pro** (Low/High). Preferir o Flash mais novo para tarefas de Flash.
**Em 19/09 o 3.1 Pro ficou indisponível ("high traffic") em várias
tentativas seguidas** — se repetir, 3.8 Flash (High) deu conta das levas de
diagnóstico, com revisão mais rigorosa do diff.

## Protocolo de leva

Contexto → Passo 1 Ler → Passo 2 Relatório (para, aguarda) → Passo 3 Diff
completo (para, aguarda) → Edição → Restrições → Critério de aceite.

**Padrão que se repetiu em TODAS as levas de 18-19/09**: o Passo 2 vem
correto e o Passo 3 vem com pelo menos um problema — mudança não pedida
colada junto, dependência de `useEffect` acrescentada sem motivo,
consequência não percebida. Foi pego todas as vezes comparando o diff linha
a linha com o pedido original. **Nunca aprovar Passo 3 na primeira resposta.**

Outro padrão: **o agente afirma sem provar** ("essa função não é usada em
outro lugar"). Exigir `git grep` colado. Em 19/09 ele chegou a aplicar
edição antes de entregar provas exigidas — cobrar as provas mesmo assim.

---

## Estado atual

Redesign geral (Fases 1-4) em produção desde 23/08. Reversão: commit
`10503d3`. Sidebar recolhível desde 08/09. Infraestrutura (performance,
backup, segurança, ErrorBoundary) resolvida em 17/09.

**18-19/09: seis levas commitadas**, todas testadas em produção.

---

## Concluído na sessão de 18-19/09

Executor: Antigravity (3.8 Flash Medium/High e 3.1 Pro Low).

### Leva 1 — Chip de horas restantes (ProjetoDetalhe)

Função pura `calcularRestante(alocadas, lancadas)`, tolerância 0,01h,
4 estados: `restam Xh` (neutro), `concluída` (verde), `excedeu Xh`
(vermelho), nenhum chip sem reserva/previsão.

- Chip no cabeçalho da fase e em cada categoria.
- Wrapper responsivo: desktop na linha do valor, mobile na linha da barra
  antes do `%`.
- Bloco "Sem categoria" e categoria sem reserva leem "X,XXh lançadas",
  sem chip.

### Leva 2 — Plano Semanal: limpeza

- Removida a linha `<tfoot>` "Total" e a linha "Planejado: Xh de Yh
  contratadas".
- Três variáveis órfãs removidas (`totalPlanejado`, `totalRealizadoPlanos`,
  `totalDiferencaPlanos`).
- **Efeito colateral aceito**: o realizado acumulado do plano não aparece
  mais em lugar nenhum da tela.

### Leva 3 — Coluna Diferença do Plano Semanal

`estadoDiferencaSemana(planejado, realizado, semanaEncerrada)`:
- dentro de ±0,01h → **"concluído"** verde, sem número
- positiva → `+X,XXh` em `text-warn` (não existe laranja no design system)
- negativa e semana encerrada → `-X,XXh` em `text-bad`
- negativa e semana NÃO encerrada → neutro (`text-ink-500`)
- `semanaEncerrada` = `intervaloDaSemana(...).fim < hojeZerado`, memoizado
  fora do loop. Cabeçalho da coluna continua REALIZADO.

### Leva 4 — Bug do filtro de Registros (race condition)

**Sintoma**: clicar num card do Calendário gerava
`/registros?data=...&registro_id=...` e às vezes mostrava "Nenhum
lançamento encontrado" com o registro existindo. Pior no fim de semana.

**Causa**: `filtroSemana` nascia com `'segunda'` hardcoded no `useState`; o
fetch disparava antes de `config.inicio_semana` (`'sabado'`) chegar; sem
cancelamento, a resposta obsoleta (7 dias) chegava depois da correta
(1 dia) e sobrescrevia. Dados no banco estavam íntegros — confirmado por
SQL (`semana_inicio` todos em sábado).

**Correção**: `filtroSemana` nasce vazio; guarda `if (loadingConfig)
return`; flag `cancelado` cobrindo sucesso, catch e finally; efeito de
inicialização com guarda `if (filtroSemana) return` para não jogar o
usuário de volta à semana atual; `[user?.id]`.

### Leva 5 — CONFIG_PADRAO + Ajustes

**Causa**: `CONFIG_PADRAO.inicio_semana` era `'segunda'`, contra a regra do
app. `Ajustes.tsx` não observava `loadingConfig`, e o formulário aparecia
quando o histórico de metas retornava — antes do config central. Salvar
nessa janela gravaria os padrões por cima dos valores reais: **seis campos
em risco**, incluindo `meta_semanal` (voltaria a 42,5) e `inicio_semana`
(voltaria a segunda). Como `criarRegistro` recebe `config.inicio_semana`,
isso corromperia o `semana_inicio` de todo lançamento novo.

**Correção**: `CONFIG_PADRAO.inicio_semana` → `'sabado'`; `loadingConfig`
desestruturado; guarda no `handleSave`; skeleton com
`(loading || loadingConfig)`; botão `disabled={saving || loadingConfig}`.
Testado sob throttling 3G.

### Leva 6 — Billable e Timesheet (mesmo bug)

- **Billable**: não observava `loadingConfig`, `currentDate` nascia com
  `'segunda'` hardcoded, três efeitos de busca sem guarda nem cleanup.
  Corrigido com guarda + flag `cancelado` nas abas semanal e mensal; aba
  anual só com `cancelado` (não usa `inicio_semana`); flag
  `dataInicializada` para não sobrescrever navegação manual; `'sabado'` no
  `useState` inicial; dependências enxutas.
- **Timesheet**: já tinha a guarda desde 02/09, faltava cancelamento.
  Adicionada, **sem tocar no `handleDragEnd`** (a flag ali faria a linha
  arrastada voltar sozinha).
- **Verificados e SEM o bug**: `Resumo.tsx` e `ProjetoDetalhe.tsx` — usam a
  semana só em `useMemo` de agregação, não para buscar.

---

## Itens que o HANDOFF antigo listava como pendentes e JÁ ESTAVAM FEITOS

Varredura no disco em 18/09 porque documento e código divergiam. Não
reabrir:

- Arquivar/Desarquivar/Excluir permanentemente — feito, mas implementado em
  `Resumo.tsx`, não em `Projetos.tsx` (por isso parecia pendente).
- Fonte única de `horas_contratadas` — as 3 telas leem direto do campo.
- Bug Billable do `8.5` literal — não existe mais.
- Bloco 3 responsivo (truncate/min-w-0) — 0 ocorrências problemáticas.
- Bloco 4 — tokens `duration` d1-d5, `icon-xs..xl`, `Surface` com elevação
  em 9 páginas e 7 componentes.
- Drag-and-drop no Resumo, paleta de 12 cores por projeto, criar projeto
  navegando direto — todos feitos.
- `Dashboard.tsx` — excluído do repo no commit `a15127e`.
- Link do Timesheet → Registros — já usa `?data=&registro_id=`.

---

## PENDÊNCIAS — lista completa

### 1. Três funções ordenando por `criado_em` (metas_billable.ts)
**Onde**: `buscarMargemMinimaVigente` (~157), `buscarMargemMinimaVigenteMensal`
(~245) e a meta semanal (~23). `buscarMetaBillableMensal` (~45) **já foi
corrigida** e serve de modelo no mesmo arquivo.
**O que causa**: lançamento retroativo de margem sobrescreve silenciosamente
uma margem posterior e correta, adulterando o número do Billable. Mesmo bug
já corrigido em `horas_base`, nunca replicado aqui.
**Custo**: baixo — um arquivo, 3 queries, com a versão certa ao lado.
**Mais urgente da lista.**

### 2. Drill-down por subcategoria no Resumo — bug de navegação
**Onde**: `BreakdownSubcategorias.tsx:51-87` e `Resumo.tsx:1026-1033`.
**O que causa**: as linhas de categoria não têm `onClick` nem
`stopPropagation`, então o clique borbulha até o `<Surface interativo
onClick={navigate}>` do card e leva o usuário para a página do projeto sem
contexto nenhum da categoria clicada. O botão "Ver detalhes" (~1071) tem
`stopPropagation`; o conteúdo interno não.
**Decisão pendente antes do prompt**: navegar para Registros filtrado pela
categoria, ou apenas parar a navegação acidental?

### 3. Alvo de toque 44px — 169 ocorrências espalhadas
**Onde**: 19 arquivos (Ajustes 38, ProjetoDetalhe 34, Registros 14,
Resumo 14, ModalProjeto 12, ModalRegistro 9…). `Button.tsx` e
`classeCampo()` NÃO têm o mínimo embutido; só `VoltarPara.tsx:20` e
`SecaoColapsavel.tsx:29` trazem hardcoded.
**O que causa**: nenhuma garantia estrutural — todo componente novo depende
de alguém lembrar de escrever a classe.
**Fazer em DUAS levas**: (a) mínimo dentro de `Button` e `classeCampo`;
(b) remover as 169 redundantes, separado, para não misturar com regressão.

### 4. `ProtectedRoute.tsx` — cor legada
**Onde**: linha 20 `text-gray-400`, linha 14 `bg-[#0B0E14]`, linha 16
`text-[#03A9F4]` (ciano pré-redesign). **Única** ocorrência em todo `src/`.
**O que causa**: nada visualmente hoje; quebra se a paleta mudar.
**Custo**: trivial — pode ir junto com a pendência 1.

### 5. Quatro funções de semana duplicadas fora de `utils/semana.ts`
**Onde**: `Registros.tsx:45` (`getWeekRange`) e `:49` (`getWeekKey`),
`Timesheet.tsx:36` (`getInicioSemana`), `Billable.tsx:42`
(`getInicioSemana`), `Resumo.tsx:39` (`getSemanaInicioParaData`).
**O que causa**: viola a regra imutável de que todo cálculo de semana passa
pelo arquivo canônico. É a raiz estrutural dos bugs corrigidos em 19/09 —
enquanto existirem, o padrão pode renascer em tela nova.
**Cuidado**: `CalendarioSemana.tsx` usa `'sabado'` **hardcoded** em 4 linhas
(25, 26, 37, 78) — ignora o config e por isso sempre funcionou. Tratar junto.

### 6. Botão de sincronização de contratadas — viola regra do projeto
**Onde**: `ProjetoDetalhe.tsx:471-484` (`handleAtualizarContratadasParaFases`)
e o banner em `:1370-1390`.
**O que causa**:
- sobrescreve `horas_contratadas` **direto, sem `ModalConfirmacao`** —
  exceção antiga à regra imutável;
- o banner só aparece quando as fases **excedem** o contratado
  (`:1172-1174`); se somam menos, nenhum aviso;
- projeto **sem fases** tem verificação equivalente (`:1890-1916`) com
  textos próprios e **sem botão** — dois comportamentos paralelos
  implementados de formas diferentes no mesmo arquivo;
- se ninguém clicar, Resumo (3 blocos), cabeçalho e card "Restantes" do
  ProjetoDetalhe e o campo desabilitado de `ModalProjeto.tsx:218-221`
  seguem com valor defasado.
**Impacta o desenho da Fase 0 da Conciliação.**

### 7. Performance — chamadas repetidas
**Observado no Network sob 3G em 19/09**:
- `Timesheet.tsx`: `listarProjetos` está dentro do `carregarDados` que roda
  por semana — trocar de semana refaz busca de projetos, que não depende de
  semana. Mesmo problema corrigido no Registros em 17/09 (`carregarMetadados`
  separado de `carregarRegistros`); o Timesheet nunca recebeu o tratamento.
  Cinco chamadas idênticas de `projetos` observadas num print.
- `Ajustes.tsx`: 46 requests ao abrir a tela, com
  `metas_billable_margem_mensal` aparecendo repetido.

### 8. `buscarDadosAnuais` contorna o ConfigContext
**Onde**: `Billable.tsx:261` (função fora do componente).
**O que causa**: chama `buscarConfiguracoes(userId)` direto no banco só para
ler `meta_semanal` como fallback. Segunda fonte de verdade para a mesma
config, mais uma query por render da aba anual. Débito, não bug.

### 9. Fallbacks divergentes de horário
**Onde**: `Ajustes.tsx:334-335` usa `'08:00'`/`'18:00'`; `CONFIG_PADRAO` usa
`'09:00'`/`'18:30'`. Dois padrões para a mesma coisa no mesmo fluxo.

### 10. Seletor de início de semana — remover (decidido, não executado)
Will decidiu remover: o início é sempre sábado e não vai mudar.
**Não executar sem cuidado**: o estado local `inicioSemana` alimenta
`ajustarParaInicioSemana` e `formatarIntervaloSemana` (`Ajustes.tsx:339-357`),
a prévia de vigência de metas (`:682, 686-735`) e o payload de `salvarConfig`
(`:499`). Se sair sem tratar isso, o payload passa a mandar o default.
~35 linhas de JSX (`:600-634`). **Leva separada, por último.**
`CONFIG_PADRAO` já está `'sabado'`, então o fallback está correto
independentemente disso.

### 11. Infraestrutura ainda pendente (de 17/09)
- **Testes das regras imutáveis (Vitest)** — `calcularDuracaoCentesimal`,
  `utils/semana.ts`, meta ÷5. ~15 testes. Única rede de segurança contra o
  agente quebrar regra em refactor. **Maior valor dos pendentes de infra.**
- **Índices no Postgres** — `usuario_id` + `data`. Com 466 registros não
  dói; degrada linearmente.
- **Lighthouse** — rodar e decidir.
- **Sem CI** — nada impede push com `tsc` quebrado chegar em produção.
- **Sentry** — avaliado e adiado (dependência externa + dados saindo).
- **Rota `/cadastro`** — cosmético, signup já desabilitado no servidor.
- **`ProjetoDetalhe.tsx` com 2400+ linhas** — cada leva nele é arriscada só
  pelo tamanho.

---

## Conciliação de Horas (planejada, NADA implementado)

**O que ataca**: hoje não há como saber se as horas reservadas nas
categorias batem com o contratado sem somar na mão. Coloca o cálculo na
tela, com aviso automático nos dois sentidos e nos dois níveis.

### Decisão conceitual (não reabrir)
**"Restantes" e "conciliação" são eixos independentes:**
- **Restantes** (execução) = contratadas − lançadas.
- **Conciliação** (desenho) = contratadas − reservadas/previstas.
Will pediu para juntar os dois; recusado com justificativa aritmética.
**Dois números, dois lugares.**

### Hierarquia (3 níveis)
| Nível | Compara | Fórmula |
|---|---|---|
| Projeto sem fases | contratadas × reservadas nas categorias | Σ categorias |
| Projeto com fases (nível 1) | contratadas × soma das fases | Σ previstas das fases |
| Fase (nível 2) | previstas × reservadas nas categorias dela | Σ categorias da fase |

Bloco "Sem fase" entra no nível 1 como se fosse fase. 3 estados, tolerância
0,01h: **fecha** (verde), **falta** (amarelo, estado NORMAL de montagem, não
é erro), **estoura** (vermelho).

### Variante visual: Variante 1
Segunda barra fina de reserva abaixo da barra de execução, chip de estado à
direita, `Stat` com prop `apoio`, chip agregado no cabeçalho da seção.

**Conflito já resolvido em 18/09**: o chip de restantes (Leva 1) ocupa o
cabeçalho da fase. Decisão: **restantes fica no cabeçalho; o chip de estado
de conciliação desce para o subtexto** ("Todas as Xh previstas estão
reservadas").

### Ações por estado (todas via `ModalConfirmacao`)
- **Estoura**: painel com campo livre + atalhos (`= reservado/previsto`,
  `+10%`, arredondar) e alternativa "Revisar categorias/fases".
- **Falta**: SEM botão primário. Só "Revisar" + link discreto.
- **Sem contratadas**: tom informativo, nunca vermelho. Link "seguir sem
  horas contratadas" sempre visível.
- **Rotina sem contratadas**: nenhum aviso.
- **Lançadas > contratadas sem estouro de reserva** — **Tratamento B**: duas
  causas nomeadas ("Houve aditivo" / "Lançamento no projeto errado"), nunca
  botão primário direto.
- **Ajuste de fase que gera estouro no nível 1**: aviso de cascata dentro do
  modal, permite confirmar, não bloqueia.
- **Subir contratadas com fases**: oferecer distribuir a diferença —
  **UI ainda não desenhada, precisa de mockup próprio**.

### Checklist (nada iniciado)
- [ ] **Fase 0** — unificar os dois avisos (com fase / sem fase) e fazer o
      botão passar por `ModalConfirmacao` (ver pendência 6 — o escopo mudou
      após o diagnóstico: "fonte única de contratadas" já foi feita)
- [ ] **Fase 1** — função pura de estado (3 níveis, 0,01h)
- [ ] **Fase 2** — card de progresso: segunda barra + chip + apoio
- [ ] **Fase 3** — painéis de ação (9 cenários); "distribuir diferença"
      precisa de mockup antes
- [ ] **Fase 4** — limpeza: segmento azul da barra antiga, rodapé,
      `tsc -b` limpo

---

## Resumo semanal para terceiros — em aberto, sem solução aprovada

Will quer apresentar a distribuição de horas de uma semana ao chefe sem
mandar print do Calendário (que é ferramenta de gestão pessoal). Quatro
variantes de relatório foram mostradas e **recusadas**. Uma ideia de
dashboard analítico também foi mostrada e **recusada, e apagada da memória e
deste HANDOFF a pedido de Will** — não ressuscitar como referência.

Última direção discutida: abordagem visual / gráfico de barras, peça de uma
página. Nenhum mockup nessa linha foi feito ou aprovado. **Item parado
aguardando Will retomar.**

Nota: a antiga pendência "paleta de cor por projeto" **já foi feita** — então
qualquer peça visual futura já pode contar com cor estável por projeto.

---

## Próximo passo — fila sugerida

1. **Pendências 1 + 4** (ordenação `criado_em` + `ProtectedRoute`) — baratas,
   isoladas, e a 1 corrige número de faturamento errado.
2. **Pendência 11, testes Vitest** — rede de segurança do núcleo.
3. **Pendência 5** (funções de semana duplicadas) — fecha a raiz dos bugs de
   19/09.
4. **Conciliação de Horas** — Fase 0 redesenhada à luz da pendência 6.
5. **Pendência 3** (44px, em duas levas).
6. **Pendência 2** (drill-down) — precisa de decisão de escopo antes.
7. **Pendência 7** (performance Timesheet/Ajustes).
8. **Pendências 8, 9, 10** (débitos menores; a 10 por último).
9. **Resumo semanal para terceiros** — quando Will trouxer direção.
10. **Dashboard analítico** — se retomado, do zero.

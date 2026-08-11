# HANDOFF — Projeto HORAS

> Documento de estado da sessão. Ler no início de cada nova sessão.
> Última atualização: 11/08/2026

---

## ⚠️ Pendências imediatas (ler primeiro)

### 1. Limpeza no Supabase — a partir de ~18/08/2026
Durante a migração do início da semana foram criadas 5 tabelas temporárias de
backup. Elas estão com RLS ativo e sem policy (inacessíveis pela API), somam
358 linhas e não atrapalham nada — mas devem ser removidas depois de 1 a 2
semanas de uso real validado.

```sql
DROP TABLE _bkp_semana_registros;
DROP TABLE _bkp_semana_horas_base;
DROP TABLE _bkp_semana_margem;
DROP TABLE _bkp_semana_billable;
DROP TABLE _bkp_semana_config;
```

**Gatilho para rodar:** duas semanas fechadas com a semana em sábado, e os
números do Resumo e do Billable batendo com o timesheet corporativo.

### 2. Coluna `configuracoes.meta_semanal` órfã
Não é mais editável pelo formulário de Ajustes, mas continua no banco porque
ainda serve de fallback dentro de `buscarHorasBaseSemanal`. **Não dropar** sem
antes confirmar que o Resumo está correto por algumas semanas.

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

## O que foi feito nesta sessão

Sessão longa, com foco na mudança do início da semana e na unificação da meta
semanal. Sete entregas, uma migração de banco e dois bugs latentes corrigidos.

### 1. Semana agora começa no SÁBADO

A semana do app vai de **sábado a sexta**, não mais de segunda a domingo.
Executado em três etapas separadas, cada uma com commit próprio.

**Etapa 1 — centralização.** Novo `src/utils/semana.ts` reunindo todo cálculo
de início de semana. Antes existiam **6 implementações independentes e
hardcoded** em `registros.ts`, `Registros.tsx`, `Timesheet.tsx`, `Billable.tsx`,
`Resumo.tsx` e `Ajustes.tsx`.

```ts
type InicioSemana = 'segunda' | 'domingo' | 'sabado'

inicioDaSemana(dataStr, inicio)      // → 'YYYY-MM-DD'
inicioDaSemanaDate(data, inicio)     // → Date
intervaloDaSemana(dataStr, inicio)   // → { inicio: Date, fim: Date }
diasDaSemana(dataInput, inicio)      // → Date[7]
formatYYYYMMDD(d)                    // → 'YYYY-MM-DD'
```

Regra: **sempre arredonda para trás**, nunca para a próxima semana. A fórmula é
`(diaSemana - targetDay + 7) % 7` dias subtraídos.

**Etapa 2 — ConfigContext.** Novo `src/contexts/ConfigContext.tsx`, montado
dentro do `AuthProvider` em `App.tsx`. Expõe `config`, `loadingConfig`,
`recarregarConfig` e `salvarConfig` via hook `useConfig()`. Antes, a
configuração era buscada em 6 pontos independentes. Ganho colateral: salvar em
Ajustes agora propaga para o app inteiro sem reload.

Em seguida, o botão **Sábado** foi adicionado em Ajustes e o campo
`inicio_semana` passou a ser realmente lido — antes era letra morta.

**Etapa 3 — backfill.** Recálculo retroativo no Supabase:

```sql
-- registros (304 linhas), recalculado a partir de `data`
UPDATE registros
SET semana_inicio = (data - ((EXTRACT(DOW FROM data)::int + 1) % 7))::date;
```

Mesma fórmula aplicada em `horas_base_semanal`, `metas_billable_margem`,
`metas_billable_semanal` e `configuracoes.saldo_inicio_semana`.

**Decisão registrada:** optou-se por retroatividade **total**, não híbrida.
`semana_inicio` é dado derivado (rótulo de agrupamento), não algo digitado —
manter dois regimes convivendo geraria bug por meses.

**Correção no Timesheet:** as colunas passaram a ser preenchidas por
`getDay()` real de cada data (`porDow`), não pela posição no array `days`.
Sem isso, com a semana no sábado, todas as colunas ficariam trocadas. O
`renderCell` também usa `getFormatDate(dow)` pelo mesmo motivo.

### 2. Meta semanal unificada

**Descoberta:** `configuracoes.meta_semanal` era um **campo fantasma** — existia
no banco e no state, mas não tinha nenhum input na tela. Ficava travado em 42,5
e ainda bloqueava o botão Salvar. Enquanto isso, "Horas Base Semanal", escondida
dentro de "Configurações Billable", já era na prática a meta semanal, com
histórico de vigência funcionando.

Decisão: **são a mesma coisa.**

- Seção movida para o card principal de Configurações, logo abaixo de "Início
  da Semana", renomeada **Meta Semanal**, sempre visível (sem accordion)
- `meta_semanal` removida do formulário (state, useEffect, trava do botão)
- Export Excel passou a usar o valor real
- **Horas Base Mensal permanece** dentro de Billable — é conceito de billable

**Bug corrigido em `horas_base.ts`:** `buscarHorasBaseSemanal` e
`buscarHorasBaseMensal` ordenavam por `criado_em`. Isso significa que cadastrar
uma meta **retroativa** faria dela a mais recente, sobrescrevendo silenciosamente
todas as metas posteriores. Agora ordenam por `semana_inicio` / `mes_inicio`
DESC, com `criado_em` DESC apenas como desempate.

**UI da seção:**

- Histórico agrupado em **faixas** (uma por semana distinta). A vencedora de
  cada semana é a de maior `criado_em`; as demais ficam recolhidas em
  "▾ N alterações anteriores". Isso reduziu 10 linhas cruas a 2 faixas.
- Cada faixa mostra **intervalo fechado**: "de 08/08 a 14/08". A mais recente
  diz "até hoje" com tag verde `vigente`.
- Bloco de confirmação ao vivo antes de salvar:

  > Nova meta: **44h**
  > Vale a partir da semana de sáb 15/08 a sex 21/08
  > A semana anterior (08/08 a 14/08) continua com 42,5h

- Ao inserir uma meta **no meio** do histórico, aparecem dois radios:
  **Manter as metas seguintes** (limita a nova até a próxima) ou
  **Substituir as metas seguintes** (default — apaga as posteriores via
  `excluirHorasBaseSemanalAPartirDe`, com filtro `gt` estrito).

### 3. Subcategoria e fase visíveis em Registros

A query de `listarRegistros` passou a trazer a fase:

```ts
subcategoria:subcategorias(nome, fase:fases(nome))
```

O tipo `Registro` acompanhou. Na linha do lançamento aparece a tag
"Fase / Subcategoria", com a fase em tom mais apagado. Sem subcategoria, nada
é renderizado.

**Atenção para o futuro:** `Registros.tsx` tem **dois blocos de renderização
separados** (modo Lista e modo Por Projeto, ternário por volta da linha 613).
Qualquer alteração na linha do lançamento precisa ser feita nos dois.

### 4. Ordenação manual de projetos

Coluna `ordem` (integer) em `projetos`, preenchida por migration em ordem
alfabética particionada por `usuario_id` + `tipo`.

Drag and drop com `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities`
(o drag nativo do HTML5 não funciona em touch, e o app é PWA mobile).

Regras decididas:
- Drag **só na aba Projetos** — Rotina não tem alça
- **Só itens ativos** são arrastáveis
- Encerrados e excluídos ficam no fim, sem alça, e não recebem drop
- Não se arrasta entre grupos
- Ordenação em **dois níveis**: status primeiro, depois `ordem` (necessário
  porque a migration numerou alfabeticamente sem separar status)

Alça dedicada de 6 pontinhos com `stopPropagation` (a linha inteira é clicável).
Sensores: `PointerSensor` (distance 8) e `TouchSensor` (delay 200, tolerance 6),
para o toque não disparar drag ao rolar a página. Atualização otimista com
rollback em erro, sem toast no sucesso.

A ordem vale **em todo o app** — `listarProjetos` ordena por ela, então os
dropdowns de projeto também respeitam.

### 5. Navegação de semana por setas

O `<select>` de Semana em Registros foi **removido**. No lugar:

```
[‹]  08/08 a 14/08  [›]  [Hoje]
```

- Setas avançam/recuam 7 dias
- "Hoje" volta para a semana corrente e fica desabilitado quando já está nela
- Navegar **limpa o filtro de Dia Específico** (que tem precedência e faria a
  tela parecer travada)
- O valor especial `'todas'` deixou de existir
- Agora é possível navegar para semanas **sem nenhum lançamento** — antes o
  dropdown só listava semanas com registro

### 6. Plano semanal por projeto

Nova tabela `plano_semanal` com RLS e 4 policies:

```
id, usuario_id, projeto_id, fase_id (nullable), semana_inicio,
horas_planejadas, criado_em
```

`projeto_id` usa `ON DELETE CASCADE` (plano sem projeto não significa nada);
`fase_id` usa `SET NULL`, seguindo o padrão das subcategorias.

**Armadilha aprendida — leia antes de mexer:**

O `.upsert()` do Supabase **não funciona** nesta tabela. Índice parcial gera
erro `42P10` ("no unique or exclusion constraint matching the ON CONFLICT
specification"), e índice comum nas três colunas **duplica**, porque no
Postgres `NULL` nunca conflita com `NULL`.

Solução final — dois índices parciais complementares:

```sql
CREATE UNIQUE INDEX plano_semanal_unico_sem_fase
  ON plano_semanal (projeto_id, semana_inicio) WHERE fase_id IS NULL;

CREATE UNIQUE INDEX plano_semanal_unico_com_fase
  ON plano_semanal (projeto_id, fase_id, semana_inicio) WHERE fase_id IS NOT NULL;
```

E o service faz **busca-antes-de-decidir**: `select` com `.is('fase_id', null)`
(nunca `.eq` para nulos), depois `update` ou `insert`.

Diferente do histórico de metas, aqui **não se empilha versão**: editar a
semana atualiza a linha existente. Plano é intenção presente, não histórico.

**UI:** seção "Plano semanal" em `ProjetoDetalhe.tsx`, entre fases e Lançamentos.
Formulário (data + horas, com a data puxada para o início da semana), tabela
Semana / Planejado / Realizado / Diferença com total no rodapé, cores verde e
vermelho na diferença, linha informativa comparando com o total contratado
(some quando o projeto não tem contratado), clique na linha para editar,
exclusão com `ModalConfirmacao`.

O "realizado" é calculado localmente a partir dos registros já carregados, que
já vêm filtrados por projeto. O total contratado reutiliza o `totalContratado`
que a página já calcula pela regra híbrida.

**Decisão:** plano no nível do **projeto**. O `fase_id` existe no banco
reservado, mas a UI por fase não foi construída — se surgir a necessidade, o
banco já está pronto.

### 7. Correção de brinde

O export Excel escrevia "Domingo" quando a configuração era sábado — o ternário
de `inicio_semana` tinha só dois braços e não acompanhou a opção nova.

---

## Estado atual do banco

### Tabelas novas
- `plano_semanal` — com RLS, 4 policies e 2 índices únicos parciais

### Colunas novas
- `projetos.ordem` — integer, nullable

### Alterações de dado
- `registros.semana_inicio` — 304 linhas recalculadas para sábado
- `horas_base_semanal.semana_inicio` — recalculada
- `metas_billable_margem.semana_inicio` — recalculada
- `metas_billable_semanal.semana_inicio` — recalculada
- `configuracoes.saldo_inicio_semana` — recalculada

### Tabelas temporárias (remover — ver Pendências)
`_bkp_semana_registros`, `_bkp_semana_horas_base`, `_bkp_semana_margem`,
`_bkp_semana_billable`, `_bkp_semana_config`

---

## Próximos passos

### Melhorias funcionais restantes
Da lista de 8 aprovadas no protótipo, sobraram 4:

- **Paleta de comandos ⌘K** — buscar projeto, lançar horas, navegar entre
  telas. Biblioteca sugerida: `cmdk`. É a de maior escopo.
- **Gap de tempo ocioso clicável** — a linha "Xh disponíveis" vira botão que
  abre o `ModalRegistro` já com `hora_inicio` e `hora_fim` preenchidos com os
  limites do gap.
- **Excluir registro com desfazer** — excluir direto + toast "Desfazer" por
  ~6s, padrão Gmail/Linear. Vale **só para registro**; fase, subcategoria,
  projeto e plano semanal continuam com `ModalConfirmacao`.
- **Aviso de dias incompletos** — no topo de Registros, comparar a jornada
  esperada (`horarios_dia` → `horarios_semana` → padrão) com o total lançado,
  para cada dia já passado da semana corrente. Nunca considerar dias futuros.
  Informativo, nunca bloqueia, com botão de dispensar.
- **Estados vazios que agem** — botão de ação direta em vez de só texto.

*(O item "campo de data no modal" foi encerrado: já existia e estava claro.)*

### Horizonte
- Aba Gráficos no Resumo (recharts): drill-down por projeto/subcategoria
- Plano semanal **por fase** — banco já preparado, UI não construída
- Alerta de planejado × realizado fora da página do projeto (só construir se
  sentir falta em uso real)
- Notificações Push via Supabase Edge Functions (VAPID, sem Firebase)

### Redesign visual — PAUSADO de propósito
Terminar as melhorias funcionais primeiro. Não sugerir retomar por conta
própria — só quando o usuário sinalizar.

Já definido: tema escuro continua padrão (redesenhado do zero, não o `#0B0E14`
atual); paleta neutra com viés azulado; tipografia em 3 papéis (Instrument
Sans, Inter, IBM Plex Mono com `tabular-nums`); branch `redesign` a partir da
`main`. Referências em `horas-redesign.html` e `horas-prototipo.html`.

---

## Padrões aprendidos — não reverter

- **Cores semânticas em totais, não em células individuais**
- **Histórico de metas com start-date** — e ordenado por vigência, nunca por
  data de criação
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
- **`type` explícito em imports de tipo** — o projeto usa `verbatimModuleSyntax`;
  esquecer isso causou erro em 3 etapas diferentes desta sessão

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
| Sucesso | `#4CAF50` |
| Alerta | `#FFC107` |
| Erro | `#F44336` |
| Texto primário | `#FFFFFF` |
| Texto secundário | `#8B949E` |
| Fonte | Inter |

---

## Fluxo de trabalho

1. Claude analisa o problema e gera o prompt estruturado para o Antigravity
2. Usuário envia ao Antigravity e traz o **diff completo** para validação
3. Claude valida o diff antes da aplicação
4. Usuário aplica e roda `npx tsc -b` manualmente
5. Usuário testa no localhost
6. Usuário commita e faz push (PowerShell, sem caracteres especiais)

> **Nunca aprovar em cima do resumo do agente.** Nesta sessão, o resumo afirmou
> ter alterado "ambos os modos de visualização" quando só um constava no diff.
> Exigir sempre o diff completo, sem elisões.

### Seleção de modelo no Antigravity

| Complexidade | Modelo |
|---|---|
| Baixa (CSS pontual, correção TS, renomeação) | Gemini 3.6 Flash (Low) |
| Média (multi-arquivo, lógica leve) | Gemini 3.6 Flash (Medium) |
| Alta (novas telas, UI complexa) | Gemini 3.6 Flash (High) |
| Arquitetura (banco, migrations, tabelas novas) | Gemini 3.1 Pro (High/Low) |

### Regras do prompt para o Antigravity
Todo prompt deve incluir: arquivos a ler antes de editar, arquivos protegidos,
comportamento esperado, critérios de aceite, e as instruções de **não rodar
`npx tsc -b`**, **não commitar** e **mostrar o diff completo sem elisões**.

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

# HANDOFF — Projeto HORAS

> Documento de estado da sessão. Ler no início de cada nova sessão.
> Última atualização: 23/07/2026

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

Implementada a feature completa de **divisão de horas contratadas por fase e subcategoria**, mais a criação de uma **página dedicada de detalhe do projeto**.

### 1. Subcategorias editáveis
- Renomear subcategoria inline (ícone de lápis)
- `window.confirm` substituído pelo componente `ModalConfirmacao`

### 2. Fases (tranches contratuais)
- Nova tabela `fases` no Supabase com RLS
- Coluna `fase_id` adicionada em `subcategorias`
- Novo serviço `src/services/fases.ts` (`fasesService`)
- Interface `Fase` criada em `src/types/index.ts`
- Fluxo "Dividir em fases": cria Fase 1 (herdando as horas do projeto) + Fase 2, e move as subcategorias existentes para a Fase 1
- "Remover divisão em fases" volta o projeto ao modo simples sem perder subcategorias

### 3. Alocação de horas por subcategoria
- Coluna `horas_alocadas` adicionada em `subcategorias`
- Modo "Alocar horas" em lote: todos os campos editáveis ao mesmo tempo, com aviso de horas restantes atualizando ao vivo
- Aviso por fase quando o projeto tem fases; aviso único quando não tem
- Faixas coloridas: amarelo `#FFC107` (faltam Xh), verde `#4CAF50` (totalmente alocado), vermelho `#F44336` (acima do contratado)

### 4. Resumo — usado vs. alocado
- Componente `BreakdownSubcategorias` extraído para `src/components/BreakdownSubcategorias.tsx` (compartilhado entre Resumo e página de detalhe)
- Mescla subcategorias cadastradas com o consumo dos registros (subcategoria com alocação e 0h lançadas agora aparece)
- Barra de progresso por subcategoria, vermelha quando excede
- Tag "sem alocação" contextual (só aparece quando o projeto usa alocação)
- Rodapé "X,XXh sem alocação"

### 5. Página de detalhe do projeto — `/projeto/:id`
Novo arquivo `src/pages/ProjetoDetalhe.tsx`. Acessível clicando no card do projeto no Resumo ou na linha em Projetos.

Contém:
- Cabeçalho (nome, cor, status, código externo)
- Progresso geral (lançadas / contratadas + barra)
- Cards de métricas: Restantes, Lançamentos, Última atividade
- Fases e subcategorias com CRUD completo e alocação de horas
- Seção "Lançamentos": registros agrupados por semana, recolhíveis, com observações visíveis
  - Clique na linha abre o `ModalRegistro` para edição
  - Ícone de olho leva para `/registros` filtrado por dia e projeto

### 6. ModalProjeto simplificado
- Removidas as seções de fases, subcategorias e alocação (migraram para a página de detalhe)
- Ficou apenas o cadastro: nome, cor, tipo, horas contratadas, código externo, billable, status
- Nova prop `temFases?: boolean` — quando true, desabilita o campo de horas e exibe faixa informativa
- Prop `focarSubcategorias` removida

### 7. Filtro por URL em Registros — **Timesheet Fase 2 concluída**
- `/registros?data=YYYY-MM-DD&projeto_id=xxx` aplica os filtros existentes
- Clique em célula preenchida do Timesheet leva para os registros do dia/projeto
- Células vazias não são clicáveis

### 8. ModalRegistro — subcategorias agrupadas por fase
- Select usa `<optgroup>` com o nome da fase quando o projeto tem fases
- Resolve a ambiguidade de subcategorias com o mesmo nome em fases diferentes
- Projeto sem fases mantém a lista plana

---

## Estado atual do banco

### Tabelas novas nesta sessão

**`fases`** (com RLS)
```
id, projeto_id, usuario_id, nome, ordem, horas_contratadas, criado_em
```

### Colunas adicionadas
- `subcategorias.fase_id` — uuid, nullable, FK para `fases.id` (`on delete set null`)
- `subcategorias.horas_alocadas` — numeric, nullable

### Regra híbrida do total contratado
- Projeto **com** fases → total = soma das `horas_contratadas` das fases
- Projeto **sem** fases → total = `projetos.horas_contratadas`
- O campo `projetos.horas_contratadas` continua sendo alimentado com a soma, para que Resumo, Billable e Timesheet sigam funcionando sem alteração

---

## Próximos passos

### Pendente — única etapa restante do plano original
**Plano semanal (Fase 4):** dividir as horas contratadas por semana (ex.: 20h / 20h / 10h), com comparação entre planejado e realizado.
- Tabela `plano_semanal` (id, projeto_id, usuario_id, semana_inicio, horas_planejadas) com RLS
- Seção na página de detalhe do projeto
- **Decisão pendente:** validar em uso real se essa divisão ajuda antes de implementar

### Horizonte
- Aba Gráficos no Resumo (recharts): drill-down por projeto/subcategoria, barras horas × dia
- Notificações Push via Supabase Edge Functions (VAPID, sem Firebase) — guia em `PWA_GUIA_COMPLETO.md`
- Aplicar padrões PWA no app de finanças pessoais (Next.js 15 + React 19 + Tailwind v4 + Supabase)

---

## Padrões aprendidos — não reverter

- **Cores semânticas em totais, não em células individuais**
- **Histórico de metas com start-date** — metas configuráveis preservam data de início
- **Tabs sobre toggles** para visualizações distintas
- **Exceções de horário nunca retroagem** — afetam apenas sugestões de novos registros
- **Projetos encerrados preservam horas** — filtrar por `.neq('status','excluido')`, nunca por `.eq('status','ativo')`
- **Cache do PWA** — loops de login no mobile em rotas novas costumam ser service worker desatualizado, não bug de código
- **Um botão, uma função** — o lápis renomeia; o modo "Alocar horas" aloca. Não duplicar caminhos para o mesmo campo
- **Componentes compartilhados** — regra de exibição escrita em um lugar só (`BreakdownSubcategorias`)
- **Balde de não atribuídos** — registros sem subcategoria (ou apontando para subcategoria excluída) precisam aparecer em algum lugar, senão a soma das partes não bate com o total
- **`stopPropagation` em botões dentro de cards clicáveis**
- **Recarregamento silencioso** — `carregarDados(true)` evita flash de skeleton em operações inline

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
- Meta semanal padrão: **42.5h** (configurável)
- Semana: **segunda a domingo**
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
2. Usuário envia ao Antigravity e traz o diff proposto
3. Claude valida o diff antes da aplicação
4. Usuário aplica e roda `npx tsc -b` manualmente
5. Usuário testa no localhost
6. Usuário commita e faz push manualmente (PowerShell, sem aspas escapadas)

### Seleção de modelo no Antigravity

| Complexidade | Modelo |
|---|---|
| Baixa (CSS pontual, correção TS, renomeação) | Gemini 3.6 Flash (Low) |
| Média (multi-arquivo, lógica leve) | Gemini 3.6 Flash (Medium) |
| Alta (novas telas, UI complexa) | Gemini 3.6 Flash (High) |
| Arquitetura (banco, migrations, tabelas novas) | Gemini 3.1 Pro (High) |

### Regras do prompt para o Antigravity
Todo prompt deve incluir: arquivos a ler antes de editar, arquivos que não pode tocar, comportamento esperado, critérios de aceite, e as instruções de **não rodar `npx tsc -b`**, **não commitar** e **mostrar o diff completo sem elisões** antes de aplicar.

---

## Backup

O export Excel da tela de Ajustes é um **relatório**, não um backup restaurável — não contém IDs, subcategorias, fases, billable nem metas.

Para backup real, rodar no SQL Editor do Supabase e baixar os CSVs:
```sql
SELECT * FROM projetos;
SELECT * FROM subcategorias;
SELECT * FROM fases;
SELECT * FROM registros;
SELECT * FROM configuracoes;
```

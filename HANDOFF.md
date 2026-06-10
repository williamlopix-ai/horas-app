markdown# Resumo da Sessão — Projeto HORAS

**Data:** 09/06/2026  
**Repo:** github.com/williamlopix-ai/horas-app (branch main)  
**Produção:** horas-app-nine.vercel.app  
**Stack:** React + TypeScript + Tailwind + Vite + Supabase + Vercel

---

## O que foi feito nesta sessão

### 1. Feature Billable — Implementação Completa

#### Campo `billable` nos Projetos
- Toggle booleano no `ModalProjeto.tsx` — aparece só quando `codigo_externo` está preenchido
- Campo salvo no Supabase via INSERT/UPDATE no fluxo padrão (`Projetos.tsx`)

#### Services criados
- `src/services/billable.ts` — busca horas billable semanal/mensal por projeto
- `src/services/metas_billable.ts` — metas e margens com histórico de vigência (semanal e mensal)
- `src/services/horas_base.ts` — horas base semanal/mensal com histórico de vigência e fallback

#### Nova tela `Billable.tsx`
- Aba Semanal: 4 cards (META DA SEMANA, HORAS FEITAS, % DA META, SALDO DA SEMANA) + linha discreta de saldo acumulado + barra de progresso
- Aba Mensal: 5 cards + barra de progresso
- Lógica: `metaReal = horasBase × margem%`
- Saldo acumulado calculado desde `saldo_inicio_semana` configurado em Ajustes
- Animações de entrada, count-up, navegação de semana/mês

#### Ajustes.tsx — novas seções no card "Configurações Billable"
- Horas Base Semanal (com histórico + vigência por semana)
- Horas Base Mensal (com histórico + vigência por mês)
- Meta Billable Mensal
- Margem Mínima Semanal (com histórico + vigência por semana)
- Margem Mínima Mensal (com histórico + vigência por mês)
- Saldo Acumulado — Data de Início (salvo em `configuracoes.saldo_inicio_semana`)
- Removido campo simples "Meta Semanal" do form principal — substituído por "Horas Base Semanal" com histórico

#### Resumo.tsx — atualizado
- Aba Semanal: cada semana usa sua própria base vigente (`horasBasePorSemana`)
- Aba Diário: cada dia usa `horasBase / 5` da semana correspondente
- Fallback para `config.meta_semanal` quando não há registro em `horas_base_semanal`

### 2. Migrations executadas no Supabase
```sql
ALTER TABLE projetos ADD COLUMN billable boolean DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN saldo_inicio_semana date;

CREATE TABLE metas_billable_semanal (...);
CREATE TABLE metas_billable_mensal (...);
CREATE TABLE metas_billable_margem (...);
CREATE TABLE metas_billable_margem_mensal (...);
CREATE TABLE horas_base_semanal (...);
CREATE TABLE horas_base_mensal (...);
```
RLS ativo em todas as tabelas.

### 3. Sidebar atualizada
- Item "Billable" adicionado entre Timesheet e Projetos em todas as telas

---

## Commits desta sessão
feat: campo billable no modal de projeto (toggle + persistência Supabase)
feat: services billable e metas_billable (queries Supabase + lógica de vigência)
feat: tela Billable (aba semanal, cards, grade) + rota e sidebar
fix: card % da meta calcula progresso billable em relação à meta semanal
feat: aba Mensal completa na tela Billable (cards, grade por semana, navegador de mês)
feat: configurações billable em Ajustes (metas semanal/mensal + margem mínima com histórico)
fix: lógica de vigência de meta billable usa criado_em DESC como desempate
feat: horas base semanal/mensal com histórico, saldo acumulado, cards Billable redesenhados

---

## Estado atual das tabelas Supabase

| Tabela | Descrição |
|-|-|
| `configuracoes` | Meta semanal, início semana, formato horas, horário padrão, `saldo_inicio_semana` |
| `projetos` | Nome, cor, tipo, status, horas_contratadas, codigo_externo, `billable` |
| `registros` | Data, hora_inicio, hora_fim, duracao, observacao, semana_inicio, projeto_id |
| `subcategorias` | Nome, projeto_id, usuario_id |
| `horarios_dia` | Exceção por data específica |
| `horarios_semana` | Exceção por dia da semana |
| `metas_billable_semanal` | Meta billable semanal com histórico de vigência |
| `metas_billable_mensal` | Meta billable mensal com histórico de vigência |
| `metas_billable_margem` | Margem mínima semanal com histórico de vigência |
| `metas_billable_margem_mensal` | Margem mínima mensal com histórico de vigência |
| `horas_base_semanal` | Horas base semanal com histórico de vigência ← NOVA |
| `horas_base_mensal` | Horas base mensal com histórico de vigência ← NOVA |

---

## Pendências e próximos passos

### Pendências existentes
- [ ] Fase 2 da Timesheet: clicar numa célula → redirecionar para `/registros?data=YYYY-MM-DD&projeto_id=xxx`
- [ ] Correções mobile (pendentes de prints)
- [ ] Warning de `key` prop na tabela da grade Billable (cosmético, não afeta funcionalidade)

### Identificados nesta sessão — a fazer
- [ ] Aba Mensal do Billable — mesmas mudanças visuais do semanal (saldo acumulado como linha discreta, sublabel base mensal no card META DO MÊS)
- [ ] Revisar se `metas_billable_semanal` ainda tem utilidade ou pode ser removida do fluxo (foi substituída por `horas_base_semanal`)

### Horizonte
- [ ] Notificações Push PWA via Supabase Edge Functions (guia em `PWA_GUIA_COMPLETO.md`)
- [ ] Aplicar padrões PWA no app de finanças pessoais

---

## Regras imutáveis do projeto

* **Notação centesimal:** `duração = horas_inteiras + (minutos / 60)`
* **Meta semanal base:** configurável via `horas_base_semanal` (fallback: `configuracoes.meta_semanal`)
* **Semana:** Segunda a Domingo
* **RLS Supabase:** nunca desativar
* **Commits:** sempre rodar `npx tsc -b` antes; nunca commitar sem aprovação

---

## Arquivos de referência no repositório

* `AGENTS.md` — guia técnico para agentes IA
* `CHANGELOG.md` — histórico completo
* `HANDOFF.md` — estado da última sessão
* `PWA_GUIA_COMPLETO.md` — guia reutilizável de PWA + notificações push
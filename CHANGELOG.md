# CHANGELOG — Projeto HORAS

Histórico de desenvolvimento do app de controle de banco de horas.
Formato: data, o que foi feito e por quê.

---

## [30/05/2026] — Timesheet View + Campo Código Externo

### O que foi feito
- **Campo `codigo_externo` em Projetos:** adicionado campo opcional "Código no Timesheet" no cadastro de projetos. Serve exclusivamente para identificar o projeto pelo número usado no sistema de timesheet da empresa. Não aparece em nenhuma outra tela.
- **Migration no Supabase:** `ALTER TABLE projetos ADD COLUMN codigo_externo text;`
- **Nova tela: Timesheet** (`/timesheet`): grade semanal que replica o layout do timesheet externo da empresa (ERM). Exibe horas lançadas por projeto por dia, agrupadas por semana, para facilitar o preenchimento manual no sistema corporativo.
- **Rota `/timesheet` registrada** no App.tsx com ProtectedRoute.
- **Item Timesheet adicionado na sidebar** de todas as páginas (Registros, Resumo, Projetos, Ajustes).
- **Arquivos de contexto para agentes IA:** criado `AGENTS.md` (substitui o `agent.md` antigo) com toda a estrutura, convenções, design system e regras de negócio do projeto para uso em prompts de desenvolvimento.

### Regras de negócio da Timesheet
- Exibe apenas projetos com `status === 'ativo'` e `codigo_externo` preenchido
- Rotinas nunca aparecem
- Ordem das colunas: Código | Nome | Sáb | Dom | Seg | Ter | Qua | Qui | Sex | Total
- Sáb e Dom: sem cor semântica (reservados para horas extras futuras)
- Seg a Sex no rodapé: verde se ≥ 8,50h, vermelho se > 0 e < 8,50h
- Células de projeto: branco se houver valor, `—` se zero
- Botão "Copiar Grade": copia valores tabulados para colar em planilha
- Seletor de semana com navegação ← →

### Pendências conhecidas (Fase 2)
- Clicar numa célula com valor > 0 redireciona para `/registros?data=YYYY-MM-DD&projeto_id=xxx`
- Código comentado no `Timesheet.tsx` aguardando implementação

---

## [25/05/2026] — Estrutura inicial e funcionalidades base

### O que foi feito
- Setup completo: React + TypeScript + Tailwind CSS + Vite
- Autenticação com Supabase Auth (login, cadastro, logout, ProtectedRoute)
- **Tela Registros:** agrupamento por dia, visualização Lista e Por Projeto, gaps de tempo ocioso em vermelho, filtros por projeto/semana/dia, detecção de conflito de horários no modal, horário de jornada por dia (padrão global + exceção por dia), tags visuais de status de projeto
- **Tela Resumo:** 3 abas (Semanal, Diário, Por Projetos), múltiplas visualizações (Cards, Lista, Tabela), breakdown por subcategoria, barra de progresso vs horas contratadas
- **Tela Projetos:** CRUD completo, tipo Projeto/Rotina, subcategorias, ciclo de vida completo (ativo → encerrado → arquivado → exclusão permanente), cores personalizáveis
- **Tela Ajustes:** meta semanal (padrão 42,5h), início da semana, formato de horas, horário padrão do dia
- Deploy automático na Vercel via push na branch `main`
- Responsividade: mobile, tablet e desktop
- Toasts de feedback, Skeletons de loading, scrollbar customizado

### Banco de dados (Supabase)
Tabelas criadas: `configuracoes`, `projetos`, `registros`, `subcategorias`, `horarios_dia`
RLS ativo em todas as tabelas.

---

## Regras Imutáveis do Projeto

> Estas regras nunca devem ser alteradas sem decisão explícita documentada aqui.

- **Notação centesimal:** `duração = horas_inteiras + (minutos / 60)` — 1h30 = 1,50
- **Meta semanal padrão:** 42,5h
- **Meta diária (dias úteis):** 8,5h
- **Semana:** Segunda a Domingo
- **RLS Supabase:** nunca desativar

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel (auto-deploy via GitHub push) |
| Repositório | github.com/williamlopix-ai/horas-app |
| Produção | horas-app-nine.vercel.app |

# HORAS — Agente de Desenvolvimento

## Stack
- React + TypeScript + Tailwind CSS + Vite
- Supabase (PostgreSQL + Auth + RLS)
- Deploy: Vercel (auto-deploy via GitHub push)
- Repositório: GitHub (branch main)

## Regra CRÍTICA e IMUTÁVEL — Notação Centesimal
duração = horas_inteiras + (minutos / 60)
- 1h30min → 1.50
- 1h45min → 1.75
- 9h00min → 9.00
NUNCA altere essa fórmula. Ela está em:
- src/services/registros.ts (função calcularDuracaoCentesimal)
- src/components/ModalRegistro.tsx (preview em tempo real)

## Regras de Negócio
- Meta semanal padrão: 42.5h (configurável por usuário)
- Semana: Segunda a Domingo
- Início do dia padrão: 08:00, Fim: 18:00 (configurável por dia)
- Gaps mínimos para exibir: 5 minutos

## Banco de Dados (Supabase)
Tabelas: usuarios, configuracoes, projetos, registros, horarios_dia
RLS ativo em todas as tabelas — usuário acessa apenas seus próprios dados.

Campos importantes:
- projetos.tipo: 'projeto' | 'rotina'
- projetos.horas_contratadas: numeric, nullable
- configuracoes.meta_semanal: numeric (default 42.5)
- configuracoes.inicio_dia / fim_dia: text HH:MM
- registros.duracao: numeric centesimal
- registros.semana_inicio: date (segunda-feira da semana)

## Estrutura de Pastas
src/
├── components/     # ModalRegistro, ModalProjeto, ProtectedRoute, Toast, Skeleton
├── contexts/       # AuthContext, ToastContext
├── pages/          # Registros, Resumo, Projetos, Ajustes, Login, Cadastro
├── services/       # registros, projetos, configuracoes, horarios
├── types/          # index.ts com interfaces TypeScript
└── lib/            # supabase.ts

## Estado Atual do App (funcionalidades implementadas)
- Autenticação completa (Supabase Auth)
- Projetos: CRUD, tipo projeto/rotina, horas contratadas, cores
- Registros: agrupamento diário, cálculo centesimal, gaps visuais
- Detecção de conflito de horários no modal
- Resumo: abas Semanal, Diário e Por Projeto
- Configurações: meta, horário do dia, início da semana, formato
- Toasts de feedback em todas as ações
- Skeletons de loading
- Filtros: projeto, semana, dia específico

## Protocolo obrigatório antes de qualquer alteração
1. Leia os arquivos existentes na pasta afetada
2. Mostre o que vai mudar (antes/depois)
3. Aguarde confirmação
4. Execute apenas o que foi confirmado
5. Rode npx tsc -b para verificar erros TypeScript antes do commit
6. Confirme o resultado após executar

Uma tarefa por vez. Sem improvisar. Sem alterar o que não foi pedido.
Responda sempre em português.

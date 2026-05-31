# AGENTS.md — Guia para Agentes de IA no Projeto HORAS

Este arquivo é lido por qualquer agente antes de executar tarefas neste repositório.
Leia inteiro antes de escrever qualquer linha de código.

---

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel (auto-deploy via push na branch `main`)
- **Repositório:** github.com/williamlopix-ai/horas-app
- **URL produção:** horas-app-nine.vercel.app

---

## Estrutura de Pastas

```
src/
├── components/
│   ├── ModalRegistro.tsx      ← modal de novo/editar registro
│   ├── ModalProjeto.tsx       ← modal de novo/editar projeto
│   ├── ProtectedRoute.tsx
│   ├── Toast.tsx
│   └── Skeleton.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── pages/
│   ├── Registros.tsx          ← tela principal
│   ├── Resumo.tsx
│   ├── Projetos.tsx
│   ├── Timesheet.tsx          ← grade semanal para preenchimento externo
│   ├── Ajustes.tsx
│   ├── Login.tsx
│   └── Cadastro.tsx
├── services/
│   ├── registros.ts
│   ├── projetos.ts
│   ├── configuracoes.ts
│   ├── subcategorias.ts
│   └── horarios.ts
├── types/
│   └── index.ts               ← todas as interfaces TypeScript
└── lib/
    └── supabase.ts
```

---

## Regra CRÍTICA e IMUTÁVEL — Notação Centesimal

```
duração = horas_inteiras + (minutos / 60)

1h30min → 1.50
1h45min → 1.75
9h00min → 9.00
```

**NUNCA altere essa fórmula.** Está implementada em:
- `src/services/registros.ts` → função `calcularDuracaoCentesimal`
- `src/components/ModalRegistro.tsx` → preview em tempo real

---

## Regras de Negócio

- Meta semanal padrão: **42.5h** (configurável por usuário em `configuracoes`)
- Meta diária (dias úteis): **8.5h**
- Semana: **Segunda a Domingo**
- Horário padrão: 09:00 às 18:30 (configurável por dia em `horarios_dia`)
- Gaps mínimos para exibir tempo ocioso: 5 minutos
- Gaps exibidos em horas/minutos normais (NÃO centesimal)

---

## Banco de Dados Supabase

### Tabelas principais

| Tabela | Campos principais |
|--------|------------------|
| `configuracoes` | meta_semanal, inicio_semana, formato_horas, inicio_dia, fim_dia |
| `projetos` | nome, cor, tipo ('projeto'\|'rotina'), status ('ativo'\|'encerrado'\|'excluido'), horas_contratadas (nullable), arquivado (boolean), nome_original (nullable), **codigo_externo (nullable)** |
| `registros` | data, hora_inicio, hora_fim, duracao (centesimal), observacao, semana_inicio, projeto_id, subcategoria_id |
| `subcategorias` | nome, projeto_id, usuario_id |
| `horarios_dia` | data, inicio_dia, fim_dia, usuario_id |

**RLS ativo em todas as tabelas.** Nunca sugerir desativar RLS.

### Tipos TypeScript (`src/types/index.ts`)

```ts
interface Projeto {
  id: string
  usuario_id: string
  nome: string
  cor: string
  status: 'ativo' | 'encerrado' | 'excluido'
  tipo: 'projeto' | 'rotina'
  horas_contratadas: number | null
  arquivado: boolean
  nome_original: string | null
  codigo_externo: string | null   // ← código para timesheet externo
  criado_em: string
}

interface Registro {
  id: string
  usuario_id: string
  projeto_id: string | null
  data: string                    // formato: YYYY-MM-DD
  hora_inicio: string             // formato: HH:MM
  hora_fim: string                // formato: HH:MM
  duracao: number                 // centesimal: 1h30 = 1.5
  observacao: string | null
  semana_inicio: string | null
  subcategoria_id: string | null
  subcategoria?: { nome: string } | null
  criado_em: string
}
```

---

## Design System

### Cores (dark mode)
```
Background principal:  #0B0E14
Superfície/Sidebar:    #161B22
Ação primária (azul):  #03A9F4
Sucesso (verde):       #4CAF50
Erro/Alerta (vermelho):#F44336
Texto primário:        #FFFFFF
Texto secundário:      #8B949E
Borda padrão:          border-gray-800
```

### Tipografia
- Fonte: **Inter**
- Títulos de seção: 24px Bold
- Cabeçalhos: 16px Semibold
- Corpo: 14px Regular
- Dados numéricos: `font-mono` ou `tabular-nums`

### Padrões de componente
- Inputs: `bg-[#0B0E14] border border-gray-800 rounded-xl px-4 py-3 focus:border-[#03A9F4]`
- Botão primário: `bg-[#03A9F4] hover:bg-[#0288D1] text-white font-bold rounded-xl`
- Botão secundário: `bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700`
- Cards/superfícies: `bg-[#161B22] border border-gray-800 rounded-2xl`
- Tags de status ativo: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
- Tags de status encerrado: `bg-orange-500/10 text-orange-400 border border-orange-500/20`

### Sidebar
- Largura fixa: 240px (`lg:ml-[240px]` no main)
- Fixa na esquerda (`fixed left-0 top-0 bottom-0`)
- Em mobile: drawer com overlay

---

## Convenções de Código

- **Sempre** usar `useAuth()` para pegar `user.id`
- **Sempre** usar `useToast()` para feedback ao usuário
- **Sempre** tratar erros com `getErrorMessage(err)` de `../utils/errors`
- Scrollbar customizado: classe `custom-scrollbar`
- Animações de entrada: `animate-in fade-in zoom-in duration-200`
- Loading states: usar componente `<SkeletonRow />` de `../components/Skeleton`
- Nunca usar `window.alert` para erros — sempre `showToast`

---

## Protocolo Obrigatório do Agente

1. Leia os arquivos existentes na pasta afetada antes de escrever
2. Mostre o trecho **antes/depois** de cada alteração
3. Aguarde confirmação do usuário antes de passar para o próximo arquivo
4. Execute **apenas** o que foi especificado
5. Rode `npx tsc -b` antes de encerrar
6. Confirme o resultado após executar
7. **Uma tarefa por vez. Sem improvisar. Sem alterar o que não foi pedido.**
8. Não faça commit salvo quando explicitamente solicitado

---

## Funcionalidades Implementadas (não alterar sem instrução)

- Registros agrupados por dia com gaps de tempo ocioso
- Visualização Lista e Por Projeto
- Filtros: Projeto, Semana, Dia Específico
- Detecção de conflito de horários no modal
- Horário de jornada por dia (padrão global + exceção por dia)
- Ciclo de vida de projetos: ativo → encerrado → arquivado → exclusão permanente
- Subcategorias por projeto
- Resumo Semanal, Diário e Por Projetos com múltiplas visualizações
- Configurações: meta semanal, início da semana, formato de horas, horário padrão
- Autenticação Supabase Auth completa
- Toasts de feedback, Skeletons de loading, responsividade mobile/tablet/desktop

---

## Tela Timesheet (`src/pages/Timesheet.tsx`)

Grade semanal que replica o timesheet externo da empresa para facilitar o preenchimento manual.

**Regras:**
- Exibe apenas projetos com `codigo_externo` preenchido e `status === 'ativo'`
- Rotinas **nunca aparecem**
- Colunas na ordem: Código | Nome | Sáb | Dom | Seg | Ter | Qua | Qui | Sex | Total
- Sáb e Dom: sem regra de meta (podem ser horas extras)
- Seg a Sex: célula verde se ≥ 8.5h, vermelha se > 0 e < 8.5h, neutra se 0
- Células zeradas exibem `—` (não `0,00`)
- Rodapé com totais por coluna
- Seletor de semana no topo
- Botão "Copiar grade"
- **Fase 2:** clicar numa célula redireciona para `/registros?data=YYYY-MM-DD&projeto_id=xxx`

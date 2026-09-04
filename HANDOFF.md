# HANDOFF — HORAS

> Cole este arquivo no início de cada sessão nova. Histórico completo
> de "como chegamos aqui" fica na memória do Claude — este arquivo é só
> estado atual + regras não-negociáveis + próximo passo.

---

## ⚠️ Regras não-negociáveis (nunca mudam)

- Notação centesimal: `duração = horas + minutos/60` — função travada em
  `src/services/registros.ts:calcularDuracaoCentesimal`.
- Semana: **sábado a sexta**. Todo cálculo passa por `src/utils/semana.ts`.
- Meta diária = meta semanal ÷ 5 (sempre, mesmo com semana sáb-sex).
  Vale só Timesheet e Resumo — **Billable nunca tem meta diária**.
- RLS Supabase nunca desativa.
- Arquivos protegidos, só editar com aprovação explícita: `lib/supabase.ts`,
  `services/registros.ts` (a função acima), `utils/semana.ts`,
  `vite.config.ts`, `contexts/AuthContext.tsx`, `index.css`/`tailwind.config.js`.

## Executor desta sessão

Confirmar no início: **Claude Code** ou **Antigravity/Gemini**? (a cota
alterna, não assumir com base em sessão anterior). Claude Code nunca roda
terminal — usuário roda tudo (`tsc`, `git`, `npm`).

## Protocolo de leva

Contexto → Passo 1 Ler → Passo 2 Relatório → Passo 3 Plano (sem código,
aguarda aprovação) → Passo 4 Edição → Restrições → Critério de aceite.
**Sempre exigir código/diff real antes de validar** — nunca aceitar
resumo em prosa como prova ("o arquivo está acima" sem estar).

---

## Estado atual do app

**Bloco 8 (aba Ferramentas) CONCLUÍDO no escopo atual, em produção.**
Item "Ferramentas" no menu (`itensNav.ts`, ícone Wrench). 2 abas prontas:
Calculadora e Calendário Semana (desktop + mobile "1 dia"). Direção
visual "Neo-Tátil" (sombras internas) é ilha visual só dessa aba — resto
do app continua clean/flat. Dashboard analítico (era "Fechamento") foi
**deprorizado**, cardápio de referência pronto em
`dashboard_cardapio_revisado.html` para quando for retomado.

Redesign geral do app (Fases 1-4) está em produção desde 23/08. Ponto de
reversão se precisar: commit `10503d3` (antes do merge).

---

## Fila priorizada (decidida em 02/09/2026)

1. **Arquivar/Excluir projeto** — projeto arquivado hoje some sem UI de
   recuperação; exclusão física existe no service mas não tem botão.
   Baixo esforço, resolve perda de dados percebida.
2. **Bloco 1** (correções pequenas):
   - 1.1 Fonte única de horas contratadas (Resumo/ProjetoDetalhe/Projetos
     divergem) — regra: sempre `projetos.horas_contratadas`.
   - 1.2 Timesheet destaca em vez de filtrar Registros (link
     `?destacar=` em vez de `?projeto_id=`).
   - 1.3 Limpar barra de progresso da fase (remover segmento azul
     "reservadas sem uso"; decidir texto substituto).
3. **Bug do Billable** — `getFooterClass` compara com `8.5` literal em
   vez de ficar neutro; só o TOTAL deve ter cor. Não trocar por
   `metaSemanal/5` — Billable não tem meta diária.
4. **Bloco 2** (features): 2.2 ordenação do Resumo → 2.3 paleta de cores
   → 2.1 drill-down (depende do 1.2) → 2.4 criar projeto navega direto
   (depende de decisão em aberto: campo de contratadas editável).
5. **Dashboard** (retomar do cardápio aprovado, greenfield).
6. **Bloco 3** (responsivo) — precisa tokenizar Projetos/Lembretes/
   modais antes de mexer em JSX.
7. **Bloco 4** (estética) — explicitamente por último.

## Próximo passo

Começar pelo item 1 (Arquivar/Excluir) ou pelo Bloco 1 — a definir no
início da próxima sessão.

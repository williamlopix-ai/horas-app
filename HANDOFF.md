# HANDOFF — HORAS

> Cole este arquivo no início de cada sessão nova. Só estado atual +
> regras não-negociáveis + próximo passo. Histórico de "como chegamos
> aqui" vive na memória do Claude, não aqui.

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
  este HANDOFF. Se precisar ler um arquivo real, pedir explicitamente para
  colar/anexar. Nunca assumir ou inventar estrutura de memória antiga.
- **`var()` cru dentro de arbitrary value do Tailwind 3** (`shadow-[...]`,
  `ring-[...]`, `bg-[...]`) não é confiável — sem erro, sem efeito. Usar
  utility nativa (`ring-2 ring-accent`, `shadow-e3`) ou `style` inline com
  `color-mix(in srgb, var(--x) N%, transparent)`. Nunca os dois juntos.
- Decisão visual ou estrutural = mockup HTML real primeiro (cores/tokens do
  app), nunca texto nem botões de opção. Só depois vira prompt de leva.

## Executor desta sessão

Confirmar sempre no início: **Claude Code** ou **Antigravity/Gemini**? Nunca
roda terminal — usuário roda tudo (`tsc`, `git`, `npm`).

## Protocolo de leva

Contexto → Passo 1 Ler → Passo 2 Relatório (para, aguarda) → Passo 3 Diff
completo (para, aguarda) → Edição → Restrições → Critério de aceite. Nunca
aceitar resumo em prosa como prova de que o código foi escrito.

---

## Estado atual

Ferramentas tem **só 2 abas**: Calendário Semana (default) e Calculadora.
Fechamento e Calendário do Mês foram removidos (eram placeholder, virarão
Dashboard futuro).

Redesign geral (Fases 1-4) em produção desde 23/08. Reversão se precisar:
commit `10503d3` (antes do merge).

Sessão de 04/09 fechou, testado e commitado:
- Linha do "agora" com contraste (halo) e pulso radar.
- Card do Calendário Semana clicável → Registros com destaque por
  `?registro_id=`, hover com zoom+anel+sombra.
- Botão "Voltar para Calendário Semana" funciona (aba vive em `?aba=`).
- Ponto pulsante na faixa de fim de semana quando há lançamento.
- Destaque em Registros pulsa e some por completo ao editar/excluir
  aquele registro (os demais continuam).
- Plano Semanal reformulado: olho (lançamentos por dia, clicáveis), lápis
  visível, pill Editando/Novo, formulário **sempre escondido por padrão**
  (só abre por botão/lápis/clique na linha), fecha sozinho após salvar.

## Próximo passo — fila priorizada (revisar ordem no início da sessão)

1. **Arquivar/Excluir projeto** — projeto arquivado some sem UI de
   recuperação; exclusão física existe no service mas sem botão.
2. **Bloco 1 — correções pequenas:**
   - 1.1 Horas contratadas divergem entre Resumo/ProjetoDetalhe/Projetos —
     unificar em `projetos.horas_contratadas`.
   - 1.2 Link do Timesheet filtra Registros em vez de só destacar — revisar
     à luz do `?registro_id=` novo desta sessão, pode já resolver.
   - 1.3 Barra de progresso da fase tem segmento azul "reservadas sem uso"
     confuso — remover/trocar texto.
3. **Bug Billable** — `getFooterClass` compara com `8.5` literal em vez de
   ficar neutro; só o TOTAL da semana deveria ganhar cor por dia.
4. **Bloco 2 — features do Resumo/Projetos:**
   - 2.2 Ordenação manual do Resumo (drag-and-drop, como Projetos já tem).
   - 2.3 Paleta de cores por projeto, editável.
   - 2.1 Drill-down por projeto/subcategoria no Resumo (depende de 1.2).
   - 2.4 Criar projeto navega direto pro detalhe (depende de decisão sobre
     campo de contratadas editável).
5. **Dashboard** — analítico novo (KPIs, evolução mensal, ranking de
   projetos), greenfield, herda o espaço que sobrou em Ferramentas.
   Referência: `dashboard_cardapio_revisado.html`.
6. **Bloco 3 — responsivo** — telas que ainda quebram em mobile
   (Projetos, Lembretes, modais); precisa tokenizar antes de mexer no JSX.
7. **Bloco 4 — estética** — elevação consistente nos `Surface`, motion,
   cor de projeto como identidade visual. Por último, de propósito.

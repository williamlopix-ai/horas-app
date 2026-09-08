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
- **`overflow-y-auto` + `overflow-x-visible` (ou vice-versa) no mesmo elemento
  não funciona** — CSS Overflow Module: qualquer eixo diferente de `visible`
  força o OUTRO eixo especificamente para `auto`, cortando filhos com
  `position: absolute` que extravasem o container (ex: tooltip de hover).
  Se um popover precisa sair do container, o container não pode ter nenhum
  eixo com scroll — usar `overflow-visible` puro nos dois eixos.
- Decisão visual ou estrutural = mockup HTML real primeiro (cores/tokens do
  app), nunca texto nem botões de opção. Só depois vira prompt de leva.
- **Verificação visual de UI é sempre manual (usuário no navegador), nunca
  automatizada via browser task do agente** — já causou loop de permissão
  gastando cota à toa sem produzir resultado (sessão 08/09). O agente lê
  código e mostra diff; quem confirma visualmente é o usuário. Nunca pedir
  ao agente para "testar", "verificar visualmente" ou "confirmar no
  navegador" em nenhum prompt — só ler código e responder com base no
  que está no arquivo.

## Executor desta sessão

Confirmar sempre no início: **Claude Code** ou **Antigravity/Gemini**? Nunca
roda terminal — usuário roda tudo (`tsc`, `git`, `npm`).

## Protocolo de leva

Contexto → Passo 1 Ler → Passo 2 Relatório (para, aguarda) → Passo 3 Diff
completo (para, aguarda) → Edição → Restrições → Critério de aceite. Nunca
aceitar resumo em prosa como prova de que o código foi escrito ou de que
um comportamento visual foi confirmado.

---

## Estado atual

Ferramentas tem **só 2 abas**: Calendário Semana (default) e Calculadora
(sem campo de pausa — removido em 08/09).

Redesign geral (Fases 1-4) em produção desde 23/08. Reversão se precisar:
commit `10503d3` (antes do merge).

**Sidebar agora é recolhível em desktop (>=1024px)**, implementada em
08/09. Estado em `SidebarContext.tsx` (memória, nunca localStorage):
- Botão no topo da Sidebar recolhe para faixa de 64px, só ícones.
- Hover em cada ícone mostra etiqueta com o nome da tela (variação
  escolhida: rail de 64px + etiqueta simples, não "peek" nem flyout).
- Clique no ícone navega direto, barra continua recolhida.
- Estado sobrevive à troca de rota, reseta para expandida em login/logout
  (via transição de `user?.id`, `useRef` guardando o id anterior).
- Abaixo de 1024px, comportamento de drawer/hambúrguer 100% inalterado.
- `App.tsx` foi reindentado no mesmo commit (só espaçamento, sem mudança
  de lógica) por causa do novo wrapper `<SidebarProvider>`.

Sessão de 04/09 (anterior) fechou, testado e commitado:
- Linha do "agora" com contraste (halo) e pulso radar.
- Card do Calendário Semana clicável → Registros com destaque por
  `?registro_id=`, hover com zoom+anel+sombra.
- Botão "Voltar para Calendário Semana" funciona (aba vive em `?aba=`).
- Ponto pulsante na faixa de fim de semana quando há lançamento.
- Destaque em Registros pulsa e some por completo ao editar/excluir
  aquele registro (os demais continuam).
- Plano Semanal reformulado: olho (lançamentos por dia, clicáveis), lápis
  visível, pill Editando/Novo, formulário **sempre escondido por padrão**.

## Concluído na sessão de 08/09

1. **Plano Semanal** — clique na linha do card não abre mais edição (era
   redundante com lápis/olho). Só o lápis abre. Hover mantido incondicional
   para feedback visual mesmo sem ser mais clicável.
2. **Calculadora** — campo "Pausa (min)" removido definitivamente do modo
   Intervalo (ambos sub-modos: Calcular duração e Calcular fim), junto com
   estado `intPausa` e função `parseMinutos`. Grid ajustado de 3 para 2
   colunas. Histórico antigo mantém "(pausa Nmin)" fossilizado nas
   entradas já gravadas — não é bug, é esperado conviver com o formato novo.
3. **Sidebar recolhível** — ver "Estado atual" acima.
4. **Aproveitamento de largura com a barra recolhida** — Timesheet e
   Ferramentas (Calendário da Semana) perdem o teto (`max-w-none`) quando
   recolhida, ocupam largura total. Registros/Projetos/Lembretes sobem de
   `max-w-5xl` para `max-w-6xl`; ProjetoDetalhe/Billable/Resumo sobem de
   `max-w-6xl` para `max-w-7xl`. Ajustes mantém `max-w-3xl` sempre — não
   ganha largura mesmo recolhida. Critério: telas de grade (informação
   espalhada em colunas) ganham com largura total; telas de lista (rótulo
   à esquerda, valor à direita numa linha) só sobem um degrau, porque
   afastar demais rótulo de valor piora a leitura em vez de ajudar.

## Próximo passo — fila priorizada (revisar ordem no início da sessão)

1. **Arquivar/Excluir projeto** — projeto arquivado some sem UI de
   recuperação; exclusão física existe no service mas sem botão.
2. **Bloco 1 — correções pequenas restantes:**
   - 1.1 Horas contratadas divergem entre Resumo/ProjetoDetalhe/Projetos —
     unificar em `projetos.horas_contratadas`.
   - 1.2 Link do Timesheet filtra Registros em vez de só destacar — revisar
     à luz do `?registro_id=` (sessão 04/09), pode já resolver.
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

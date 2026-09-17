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
  `position: absolute` que extravasem o container. Se um popover precisa
  sair do container, o container não pode ter nenhum eixo com scroll.
- Decisão visual ou estrutural = mockup HTML real primeiro (cores/tokens do
  app), nunca texto nem botões de opção. Só depois vira prompt de leva.
- **Verificação visual de UI é sempre manual (usuário no navegador), nunca
  automatizada via browser task do agente** — já causou loop de permissão
  gastando cota à toa (sessão 08/09). O agente lê código e mostra diff;
  quem confirma visualmente é o usuário.
- **Toda atualização de horas contratadas (projeto) ou previstas (fase)
  passa por `ModalConfirmacao`** — nunca grava direto.
- **Nome de ícone do Lucide v1 sempre verificado no disco antes de usar** —
  nomes mudaram na v1 (`AlertTriangle` NÃO existe, é `TriangleAlert`;
  `BarChart3` também não existe). Todo prompt que use ícone novo precisa
  de passo de verificação em `node_modules/lucide-react`.
- **`useEffect` com `[user]` na dependência** — usar `[user?.id]` em telas
  novas. O objeto `user` muda de referência a cada revalidação de token
  (foco de aba), disparando refetch em cascata. Corrigido na raiz em
  `AuthContext.tsx` em 17/09, mas o padrão continua valendo por segurança.

## Executor desta sessão

Confirmar sempre no início: **Claude Code** ou **Antigravity/Gemini**? Nunca
roda terminal — usuário roda tudo (`tsc`, `git`, `npm`).

Modelos disponíveis no Antigravity (atualizado 17/09/2026): Gemini **3.8 /
3.7 / 3.6 Flash** (Low/Medium/High) e **3.1 Pro** (Low/High). Preferir sempre
o Flash mais novo (hoje 3.8) para tarefas de Flash.

## Protocolo de leva

Contexto → Passo 1 Ler → Passo 2 Relatório (para, aguarda) → Passo 3 Diff
completo (para, aguarda) → Edição → Restrições → Critério de aceite. Nunca
aceitar resumo em prosa como prova de que o código foi escrito ou de que
um comportamento visual foi confirmado.

---

## Estado atual

Ferramentas tem **só 2 abas**: Calendário Semana (default) e Calculadora.

Redesign geral (Fases 1-4) em produção desde 23/08. Reversão se precisar:
commit `10503d3` (antes do merge).

**Sidebar recolhível em desktop (>=1024px)**, implementada em 08/09.

**Infraestrutura (performance, backup, segurança) resolvida em 17/09** —
ver seção abaixo. O app está mais rápido, com backup automático testado e
com auditoria de segurança concluída.

## Concluído na sessão de 17/09 — Infraestrutura

Sessão inteira de infraestrutura, sem tocar em funcionalidade. Tudo em
produção e testado.

### Performance (4 correções, todas commitadas)

1. **`vite.config.ts`** — handler de cache dos chunks `.js` trocado de
   `NetworkFirst` para `StaleWhileRevalidate`. Os chunks têm contenthash
   no nome, então não precisavam revalidar contra rede a cada navegação.
   Era a causa de telas com chunk grande (Resumo 45kB, ProjetoDetalhe
   57kB) parecerem mais lentas que telas pequenas.
2. **`Ajustes.tsx`** — `xlsx` (282kB, o maior chunk do build) passou de
   import estático para `await import('xlsx')` dentro de `handleExport`.
   Abrir Ajustes deixou de baixar 94kB gzipped à toa.
3. **`Registros.tsx`** — `carregarDados()` separada em `carregarMetadados()`
   (projetos/horários, roda só em `[user]`) e `carregarRegistros()` (roda em
   `[user, filtroSemana, filtroDiaEspecifico]`). Antes, trocar de semana
   refazia 4 queries, sendo 3 de dados que não dependem da semana.
4. **`AuthContext.tsx` (arquivo protegido, aprovado explicitamente)** —
   `setUser` agora compara `id` antes de trocar a referência:
   ```
   setUser(prev => prev?.id === session?.user?.id ? prev : (session?.user ?? null))
   ```
   **Esta foi a correção de maior impacto.** O supabase-js revalida o token
   quando a aba recupera foco, disparando `onAuthStateChange` com um objeto
   `user` de referência nova (mesmo id). Isso invalidava todo `useEffect`
   com `[user]`, causando refetch em cascata sem cancelamento — requests
   acumulando a cada troca de aba (32 → 38 → 44 → 50, medido no Network).
   Auditado antes: nenhum consumidor de `useAuth` usa `session`, nenhum lê
   campo mutável de `user` além de `.id`.

### Error Boundary

- **`src/components/ErrorBoundary.tsx`** (novo) — class component com
  `getDerivedStateFromError` + `componentDidCatch`. Tela de erro usando
  `Surface`/`Button` e tokens reais do design system, com `<details>`
  recolhido mostrando a mensagem técnica para o usuário copiar.
- **`App.tsx`** — `<ErrorBoundary>` dentro de `<BrowserRouter>`, por fora
  de `<Suspense>` e `<Routes>` (fica dentro dos providers para ter acesso
  ao tema). Testado com `throw` proposital e confirmado visualmente.

### Backup automático (fora do repo, roda no PC pessoal)

Plano free do Supabase **não tem backup nenhum restaurável** — a própria
documentação manda o usuário exportar por conta própria. Montado:

- `pg_dump` 18.6 instalado local (client tools; o CLI do Supabase foi
  descartado porque exige Docker).
- Script `C:\Users\Mattos\scripts\backup-horas.ps1` gera 3 arquivos por dia
  (`schema.sql`, `dados.sql`, `completo.dump`) dos schemas `public` e `auth`.
- Destino: `G:\Meu Drive\backups-horas\<AAAA-MM-DD>\` (Google Drive desktop).
- Conexão via **Session pooler** (`aws-1-us-east-2.pooler.supabase.com:5432`),
  não via host direto — o host direto é IPv6 e não resolve na rede do Will.
- Credencial em variável de ambiente `HORAS_DB_URL` (nunca no script).
- Agendado no Agendador de Tarefas do Windows, diário, com "executar após
  inicialização perdida" marcado e `-WindowStyle Hidden`.
- Retenção: 30 dias completos → depois só segundas → acima de 1 ano só dia 1.
- Tamanho real: **0,41 MB por backup**.
- **Restauração testada e comprovada**: restaurado num Postgres local limpo,
  conferido 466 registros / 26 projetos / 79 subcategorias / 24 fases.
  Único erro no restore é `schema "public" já existe`, inofensivo.
- Manutenção do Will: nenhuma no dia a dia. Uma vez por mês, conferir a
  pasta e procurar `ERRO` em `_backup.log`.

### Segurança

- **RLS**: as 16 tabelas com RLS ativo, todas as policies comparando
  `auth.uid()`. Nenhuma policy frouxa encontrada.
- **Corrigido**: 5 policies tinham `USING` mas não `WITH CHECK`
  (`registros`, `projetos`, `subcategorias`, `configuracoes` e o UPDATE de
  `plano_semanal`) — permitiriam gravar linha atribuída a outro usuário.
  Recriadas com `WITH CHECK (auth.uid() = usuario_id)`. App testado depois.
- **`service_role` key**: verificado que não aparece em `src/`, `.env*` nem
  no build `dist/`.
- **Cadastro público desabilitado** no Supabase (Authentication → Sign In /
  Providers → "Allow new users to sign up" desligado). Testado: retorna
  "Signups not allowed for this instance". A rota `/cadastro` continua
  existindo e mostrando o formulário — só falha ao submeter.
- **`vercel.json`**: headers de segurança adicionados preservando as regras
  de cache do `sw.js`/manifest e os rewrites da SPA. CSP montada com os
  domínios reais (`*.supabase.co` + `wss://*.supabase.co`). Confirmado em
  produção no Response Headers, console sem erro de CSP.
  - Ressalvas conhecidas, aceitas: `script-src` usa `'unsafe-inline'`
    (exigência do Vite/PWA sem nonce), e `connect-src` usa wildcard
    `*.supabase.co` em vez do domínio específico do projeto.

---

## Pendências de infraestrutura (desta frente, ainda não feitas)

1. **Testes das regras imutáveis** — Vitest cobrindo
   `calcularDuracaoCentesimal`, `utils/semana.ts` e meta diária ÷5. São
   funções puras; ~15 testes bastam. Protege contra o próprio agente
   quebrar regra em refactor futuro. **Maior valor dos pendentes.**
2. **Índices no Postgres** — queries filtram por `usuario_id` + `data`;
   confirmar se há índice. Com 466 registros hoje não dói, mas degrada
   linearmente.
3. **Lighthouse** — rodar a aba do DevTools e decidir o que corrigir
   (performance, acessibilidade, PWA, boas práticas).
4. **Higiene de código**:
   - `src/pages/Dashboard.tsx` é código morto confirmado, continua no repo
   - `ProjetoDetalhe.tsx` com **2404 linhas** — cada mudança nele é
     arriscada só pelo tamanho
   - Sem CI: nada impede push com `tsc` quebrado chegar em produção
5. **Sentry ou equivalente** — Error Boundary já mostra o erro na tela, mas
   não há registro do que quebrou quando o Will não está olhando. Avaliado
   e adiado conscientemente (dependência externa + dados saindo).
6. **Rota `/cadastro`** — remover ou redirecionar para login, já que
   signup está desabilitado no servidor. Cosmético.

---

## Conciliação de Horas (planejada, NADA implementado ainda)

Sessão de 09-10/09 foi desenho de solução via mockup HTML interativo.
Nenhuma linha de código do app alterada. Decisões fechadas:

### Decisão conceitual (não óbvia — não reabrir)

**"Restantes" e "conciliação" são dois eixos independentes:**
- **Restantes** (execução) = contratadas − lançadas. Sem mudança de fórmula.
- **Conciliação** (desenho do projeto) = contratadas − reservadas/previstas.
  Dado NOVO, ao lado, nunca substituindo o de execução.

Will pediu inicialmente para juntar os dois — recusado com justificativa
aritmética. **Decisão mantida: dois números, dois lugares.**

### Hierarquia de conciliação (3 níveis)

| Nível | Compara | Fórmula |
|---|---|---|
| Projeto sem fases | contratadas × reservadas nas categorias | Σ categorias |
| Projeto com fases (nível 1) | contratadas × soma das fases | Σ **previstas** das fases |
| Fase (nível 2) | previstas da fase × reservadas nas categorias dela | Σ categorias daquela fase |

Bloco "Sem fase" entra no nível 1 como se fosse mais uma fase.

3 estados por nível, tolerância de **0,01h**:
- **fecha** (verde), **falta** (amarelo, estado NORMAL de montagem, não é
  erro), **estoura** (vermelho, inconsistência real)

### Variante visual escolhida

**Variante 1**: segunda barra fina de "reserva" abaixo da barra de execução
no card de progresso do ProjetoDetalhe, com chip de estado à direita. Card
"Restantes" ganha linha de apoio (prop `apoio` do `Stat`). Seção "Fases &
Categorias" ganha chip agregado no cabeçalho, visível mesmo recolhida.

Descartadas: variante 2 (faixa full-width) e variante 3 (quarto card).

### Ação por estado (todos abrem `ModalConfirmacao`)

- **Estoura**: painel com campo de valor (digitação livre + atalhos
  `= reservado/previsto`, `+10%`, arredondar). Alternativa sempre visível:
  "Revisar categorias/fases".
- **Falta**: SEM botão primário de ajuste. Só "Revisar" + link discreto
  "reduzir para X".
- **Sem horas contratadas**: tom azul/informativo, nunca vermelho. Sugestões
  `= reservadas` (pré-selecionada) e `= lançadas`. Link "seguir sem horas
  contratadas" sempre disponível.
- **Rotina sem contratadas**: NENHUM aviso.
- **Lançadas > contratadas, sem estouro de reserva** — **Tratamento B**:
  mensagem + painel com duas causas nomeadas ("Houve aditivo" / "Tem
  lançamento no projeto errado" → Lançamentos filtrado). NUNCA botão
  primário direto de atualizar contratadas.
- **Ajuste de fase que geraria estouro no nível 1**: aviso de cascata
  DENTRO do `ModalConfirmacao`, permite confirmar, NÃO bloqueia.
- **Subir contratadas do projeto com fases**: oferecer distribuir a
  diferença entre as fases. **UI ainda não desenhada** — precisa de mockup
  próprio antes do prompt da Fase 3.

### Dependência dura

Depende do item "Bloco 1 — fonte única de horas contratadas" (hoje
`projetos.horas_contratadas` é calculado diferente em Resumo/ProjetoDetalhe/
Projetos). Fica como Fase 0, obrigatória.

### Checklist da leva (nenhuma etapa iniciada)

- [ ] **Fase 0** — unificar fonte de `horas_contratadas` nas 3 telas
- [ ] **Fase 1** — função pura de estado de conciliação (3 níveis, 0,01h)
- [ ] **Fase 2** — card de progresso: segunda barra + chip + apoio + chip
      agregado no cabeçalho
- [ ] **Fase 3** — painéis de ação por estado (9 cenários); "distribuir
      diferença entre fases" precisa de mockup antes
- [ ] **Fase 4** — limpeza: remover segmento azul da barra de fase antiga
      (resolve 1.3 do Bloco 1); rodapé perde aviso antigo; `tsc -b` limpo

---

## Próximo passo — fila priorizada (revisar ordem no início da sessão)

1. **Conciliação de Horas** — começando pela Fase 0. Mockup de "distribuir
   diferença entre fases" ainda pendente.
2. **Testes das regras imutáveis** (infra, item 1 acima) — barato e protege
   o núcleo do app.
3. **Arquivar/Excluir projeto** — projeto arquivado some sem UI de
   recuperação; `desarquivarProjeto` e `excluirPermanentemente` existem no
   service mas estão órfãos.
4. **Bloco 1 — correções pequenas restantes**:
   - 1.2 Link do Timesheet filtra Registros em vez de só destacar — revisar
     à luz do `?registro_id=` (sessão 04/09), pode já resolver.
   - 1.3 será resolvido dentro da Fase 4 da Conciliação.
5. **Bug Billable** — `getFooterClass` compara com `8.5` literal; só o TOTAL
   da semana deveria ganhar cor por dia.
6. **`buscarMargemMinimaVigente`** e variante mensal ordenam só por
   `criado_em` — mesmo bug já corrigido em `horas_base`, nunca aplicado às
   tabelas de margem.
7. **Bloco 2 — features do Resumo/Projetos:**
   - 2.2 Ordenação manual do Resumo (drag-and-drop)
   - 2.3 Paleta de cores por projeto, editável
   - 2.1 Drill-down por projeto/subcategoria (depende de 1.2)
   - 2.4 Criar projeto navega direto pro detalhe
8. **Índices no Postgres + Lighthouse + higiene de código** (infra, itens
   2-4 acima)
9. **Dashboard** — analítico novo (KPIs, evolução mensal, ranking),
   greenfield. Referência: `dashboard_cardapio_revisado.html`.
10. **Bloco 3 — responsivo** — telas que ainda quebram em mobile.
11. **Bloco 4 — estética** — elevação nos `Surface`, motion, cor de projeto
    como identidade. Por último, de propósito.

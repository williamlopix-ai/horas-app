# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **25/08/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
BLOCO 1 — Correções                  ████████████ 100%
BLOCO 2 — Funcionalidades            ████████████ 100%

BLOCO 3 — Responsivo                 ████░░░░░░░░  33%   ← ATUAL
  🔄 3.0  Tokenizar Projetos, Lembretes e modais
      ✅ 3.0a  Skeleton, Toast, MenuAcoes, ModalConfirmacao
      ✅ 3.0b  ModalProjeto
      ✅ 3.0c  ModalRegistro
      ✅ 3.0d  Projetos
      ⬜ 3.0e  Lembretes                            ← PRÓXIMA
  ⬜ 3.1  Contrato responsivo por faixa
  ⬜ 3.2  Tabelas em mobile
  ⬜ 3.3  Varredura dos 27 truncate
  ⬜ 3.4  Alvos de 44px e safe area
  ⬜ 3.5  Pulso não aparece no celular

BLOCO 3.5 — Fundações de design      ░░░░░░░░░░░░   0%   ← REVISADO (25/08)
  ⬜ 3.5a  Inventário de valores no disco
  ⬜ 3.5b  Camada primitiva + convenção de nome
  ⬜ 3.5c  Espaçamento e layout
  ⬜ 3.5d  Tipografia
  ⬜ 3.5e  Dimensão (controle, ícone, alvo de toque)
  ⬜ 3.5f  Borda, opacidade, z-index, container
  ⬜ 3.5g  Foco e acessibilidade
  ⬜ 3.5h  Movimento (espacial x efeito)
  ⬜ 3.5i  Densidade (multiplicador global)
  ⬜ 3.5j  Camada de padrões (Secao, PageHeader, EmptyState)
  ⬜ 3.5k  Prancheta no /ui-kit
  ⬜ 3.5l  Guarda contra regressão + varredura final

BLOCO 4 — Estética                   ░░░░░░░░░░░░   0%   ← O ÚLTIMO
  ⬜ 4.1  Primitiva Secao          (absorvida pelo 3.5j)
  ⬜ 4.2  Hierarquia de elevação
  ⬜ 4.3  Cor do projeto como identidade
  ⬜ 4.4  Movimento e transições   (absorvida pelo 3.5h)
  ⬜ 4.5  Bordas de estado suaves   (novo, ver Pendências)

AVULSAS — fora de bloco
  ⬜ Seletor de tema em Ajustes
  ⬜ Trocar os 3 botões da linha de Projetos por menu de três pontinhos
```

**25 de 48 levas.** Três blocos fechados.

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## 🎯 Próxima leva: 3.0e — Lembretes

Última do Bloco 3.0. Fecha a tokenização e libera o responsivo.

**Arquivo:** `src/pages/Lembretes.tsx` — 34 linhas com legado no disco.

Conferir o número atual antes de planejar:

```powershell
Select-String -Path src\pages\Lembretes.tsx -Pattern "gray-|emerald-|orange-|red-[0-9]|#161B22|#0B0E14|#8B949E|#03A9F4|#0288D1|#007cb5|bg-black/|animate-in" | Measure-Object -Line
```

**Provavelmente também tem** (padrão que se repetiu nas quatro levas anteriores):
- botão azul grande `#03A9F4` → primitiva `Button variante="primario"`
- card `#161B22` → `<Surface>`
- badges de status com `emerald-`/`orange-`/`red-` → `ok`/`warn`/`bad`
- possivelmente um modal escrito à mão dentro do próprio arquivo

Existe também `src/components/ModalLembrete.tsx`, que **não foi auditado** nesta
sessão. Conferir se ele tem legado e, se tiver, decidir se entra na 3.0e ou vira
3.0f.

---

## 🧰 Receita de tokenização de modal — usar na 3.0e

Estabelecida e validada em quatro levas. Reaproveitar sem reinventar.

```jsx
// fundo escurecido
<div className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-sm z-50 flex items-center justify-center p-4">

  // container
  <Surface
    elevacao={2}
    padding="lg"                 // = p-6, mesmo espaçamento de antes
    comBorda
    comSombra={false}            // senão vem shadow-e1 junto com o e3
    className="w-full max-w-sm relative shadow-e3 flex flex-col"
    onClick={(e) => e.stopPropagation()}
  >
```

Regras que vieram junto:
- `p-6` **sai** da className (`padding="lg"` já faz). `Surface` não aceita
  `padding` junto com classe `p-`.
- `rounded-2xl` **sai** (`Surface` já aplica `rounded-card`).
- `animate-in fade-in zoom-in duration-*` **saem**: são inertes,
  `tailwindcss-animate` nunca foi instalado.
- A `</div>` correspondente vira `</Surface>` — **é o erro clássico**, conferir
  sempre no diff.
- `max-h-[90dvh]`, `overflow-y-auto`, `overscroll-contain`, `touch-pan-y`
  **permanecem**: são a rolagem no celular.

**Campos de formulário:**
```jsx
className={`${classeCampo()} min-h-[44px] cursor-pointer`}   // select, data, hora
className={`${classeCampo()} min-h-[44px] resize-none`}      // textarea
className={`${classeCampo(!!erro)} min-h-[44px]`}            // com validação
```
`classeCampo(true)` já pinta borda e anel de erro — a condicional escrita à mão
sai inteira.

**Rótulos:**
```
text-xs font-semibold text-ink-500 uppercase tracking-wide
```

**Botões de rodapé:**
```jsx
<Button variante="secundario" larguraTotal className="sm:flex-1 min-h-[44px]" type="button" onClick={onClose}>
<Button variante="primario" type="submit" larguraTotal className="sm:flex-1 min-h-[44px]" carregando={submitting}>
```
`carregando` já desenha o indicador: o SVG com `animate-spin` escrito à mão sai
inteiro. `type="submit"` é obrigatório — se virar `button`, o formulário para de
enviar **em silêncio**.

---

## ✅ O que foi feito nesta sessão

### 3.0a — Skeleton, Toast, MenuAcoes, ModalConfirmacao

16 linhas. `ModalConfirmacao` foi o primeiro a adotar a receita acima, com
cancelar `secundario` e confirmar `destrutivo`. Toast passou a usar `ok-bg`,
`bad-bg` e `accent-bg` com borda sólida (sem `/30`).

### 3.0b — ModalProjeto

25 linhas + `emerald-` e `red-` que o grep inicial não pegou. Campos passaram a
usar `classeCampo()`. Correção aplicada depois do teste: o trilho do interruptor
desligado ficou `bg-surface-0`, porque em `surface-3` ele sumia contra a caixa.

### 3.0c — ModalRegistro

O mais delicado. As listas suspensas mantêm `style` inline — trocou-se hex por
`var()`, **não se removeu o inline**: ele existe porque o Windows desenha
`<option>`/`<optgroup>` com estilo do sistema operacional. Validado em tela, as
duas listas abrem legíveis. Campo de hora fim passou a `classeCampo(!!validacaoErro)`.
`animate-pulse` do número grande foi preservada (é do Tailwind de origem, funciona).

### 3.0d — Projetos

29 linhas + `orange-`. Card da tabela e modal escrito à mão viraram `Surface`.
As **três** badges de status ganharam cada uma seu token: Ativo→`ok`,
Encerrado→`warn`, Excluído→`surface-2`/`ink-500`.

---

## 🔍 Diagnósticos e pendências desta sessão

### Bordas de estado ficaram mais fortes (vira leva 4.5)

As bordas eram `border-red-500/20`, ou seja, 20% de opacidade. Tailwind 3 **não**
aplica opacidade sobre cor vinda de `var()`, então viraram borda **cheia**.
Funciona e é legível, mas está mais marcado do que era — badges e botões
coloridos ficaram com aspecto contornado.

Conserto conhecido, para o Bloco 4:
```jsx
style={{ borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)' }}
```
É o mesmo recurso que o `Button variante="destrutivo"` já usa internamente.
Atinge: `Projetos.tsx` (badges e 3 botões de linha + 2 do modal),
`ModalProjeto.tsx` (Ativo/Encerrado, bloco de erro), `ModalRegistro.tsx`
(bloco de erro), `Toast.tsx` (as três cores).

### Efeitos de mouse simplificados

Os botões coloridos tinham três estágios (normal, hover, clicado) em hex. Sem
token para o terceiro tom, viraram dois estágios com `hover:opacity-80`. Decisão
consciente: não inventar cor nova durante a leva que tira cor fixa.

### O tema claro não está acessível a ninguém

O único ponto do app que troca `data-theme` é a página `/ui-kit`, que roda fora
do layout com barra lateral e não persiste a escolha. **Metade do sistema de
tokens nunca rodou em produção.** Vira leva avulsa: botão em Ajustes + gravar a
escolha + aplicar no boot.

Enquanto isso, testar tema claro exige colar no Console do F12
(`document.documentElement.setAttribute('data-theme','light')`), e o Chrome
bloqueia colagem no Console por padrão. Não vale o tempo por leva — testar tema
claro fica represado até a leva do seletor existir.

### O agente rodou terminal sem autorização

Na 3.0d o Claude Code rodou `npx tsc --noEmit` e `git diff` **depois** do veto
explícito. Avisou por conta própria e os dois só leem. Não houve dano, mas a
regra existe porque um comando que escreve, rodado em silêncio, só é descoberto
tarde. **Endurecer a linha do prompt nas próximas levas** (texto pronto na seção
do Claude Code, abaixo).

### Erros do arquiteto nesta sessão — como foram pegos

Registrado porque mostra o que o Passo 2 rende:
1. Mandei testar o menu de três pontinhos na tela Projetos — ela não usa
   `MenuAcoes`. O componente está na Sidebar e no ProjetoDetalhe.
2. Mandei copiar a className de um `<th>` do `Registros.tsx` — a tela foi
   migrada para cards, não tem tabela. **O agente pegou.**
3. Descrevi a badge do meio de Projetos como "Encerrado" nas linhas da badge
   "Excluído", deixando a Encerrado sem instrução. **O agente pegou.**
4. Deixei a caixa do Billable e o trilho do interruptor no mesmo `surface-3`.
   **Só o print pegou** — nenhuma leitura de código teria mostrado.

**Conclusão prática: print de cada estado é obrigatório no teste.** Descrição em
texto não substitui.

---

## 🧱 BLOCO 3.5 — Fundações de design (revisado em 25/08)

### Diagnóstico

A Fase 1 tokenizou **cor, raio, sombra, fonte e duração**. Não tokenizou
**espaço, tipografia, dimensão, camada, foco, opacidade nem movimento
aplicado**. É por isso que trocar cor é fácil e trocar densidade custou meses:
`px-4 py-3`, `gap-2`, `space-y-5` estão escritos à mão em centenas de lugares.

### O achado principal: o app tem UMA camada de token

A referência da indústria (Design Tokens Community Group, especificação estável
2025.10) organiza tokens em camadas:

```
primitivo   →  o que a cor É            blue-500, space-4
semântico   →  o que ela SIGNIFICA      color.action.primary, sp.blocos
componente  →  onde ela VIVE            button.background.default
```

**O HORAS só tem a camada semântica.** `--accent: #5C87F7` é significado e valor
no mesmo lugar; não existe uma escala de azul, existe *um* azul.

Consequência prática já sentida: na leva 3.0d os botões coloridos tinham três
estágios de cor (normal, hover, clicado) e viraram dois — **não havia tom
intermediário porque a camada que guarda tons não existe**.

**Decisão para o HORAS: duas camadas, nunca três.** A camada de componente serve
a multi-marca e white-label; num app de um produto só, ela multiplica a contagem
de tokens por dez sem resolver nada.

**Regra de sentido único:** semântico aponta para primitivo, componente aponta
para semântico. Nunca pular camada. É assim que temas morrem.

### Taxonomia completa — 15 categorias

| # | Categoria | O que guarda | HORAS hoje | Vale? |
|---|---|---|---|---|
| 1 | Cor | escalas + papéis + estados | semântica só, 1 camada | ✅ falta primitiva e estados |
| 2 | Tipografia | família, tamanho, peso, altura de linha, tracking | só família | ✅ prioridade |
| 3 | Espaçamento | dentro do componente | nada | ✅ prioridade máxima |
| 4 | Layout | entre blocos e seções | nada | ✅ separado do espaçamento |
| 5 | Dimensão | altura de controle, ícone, avatar, alvo de toque | nada | ✅ mata o `min-h-[44px]` repetido |
| 6 | Borda | raio + espessura + cor | raio ✅, cor ✅, espessura ❌ | ✅ parcial |
| 7 | Elevação | sombra + camada | 3 níveis, só 1 usado | ✅ existe, falta usar |
| 8 | Movimento | duração, curva, padrões | duração e curva ✅, nunca usadas | ✅ |
| 9 | Z-index | ordem de empilhamento | `z-40`, `z-50`, `z-[60]`, `z-[9999]` | ✅ barato |
| 10 | Opacidade | desabilitado, sobreposição | 50/60/80 avulsos | ✅ barato |
| 11 | Breakpoints | faixas de largura | implícito no Tailwind | ✅ vira a leva 3.1 |
| 12 | Container | largura máxima de conteúdo | `max-w-sm/2xl/5xl` avulsos | ✅ barato |
| 13 | Foco | cor, espessura e afastamento do anel | espalhado no `classeCampo` | ✅ é acessibilidade |
| 14 | Desfoque / véu | `backdrop-blur`, scrim | scrim ✅, blur fixo | 🟡 pequeno |
| 15 | Densidade | multiplicador global | não existe | ✅ **é o objetivo real** |

Fora de escopo por não existirem no app: gradiente, proporção de imagem, grid de
colunas, cursor. **Token usado uma vez é ruído.**

### Duas descobertas que mudam a execução

**Movimento tem duas famílias.** O Material 3 separa tokens *espaciais* (posição,
escala) de tokens de *efeito* (cor, opacidade), cada um em três velocidades.
Animar posição e opacidade com a mesma duração é o que faz interface parecer
amadora.

**Densidade se resolve com multiplicador, não com escala nova.** Uma variável
global de escala da qual os tokens de tamanho e espaço derivam. "Compacto /
normal / arejado" vira um número. É literalmente o mecanismo de "testar layouts
sem perder tempo".

### Processos, além de tokenizar

1. **Convenção de nome escrita**, no padrão `categoria-propriedade-variante-estado`.
   Sem isso coexistem `--sp-3`, `--space-md` e `--gap-card` em seis meses.
2. **Sentido único de referência** (ver acima).
3. **Guarda automatizada** — script que falha ao achar hex ou `gray-`. A falta
   disso criou o Bloco 3.0 inteiro.
4. **Documento de uso de uma página** — "elevação 2 = flutua sobre a página".
5. **Acessibilidade como token** — contraste, anel de foco, `prefers-reduced-motion`,
   alvo de 44px.
6. **Quatro estados obrigatórios** por tela que busca dados: carregando, vazio,
   erro, cheio.

### O que NÃO fazer neste projeto

Decidido conscientemente, não por desconhecimento:

- **Camada de componente** — serve a multi-marca; multiplica por dez.
- **Arquivo `.tokens.json` + Style Dictionary + pipeline Figma** — existe para
  sincronizar várias plataformas e ferramentas de design. Aqui: uma plataforma,
  sem Figma. CSS puro basta.
- **Versionamento semver de token com deprecação** — é para quem tem consumidores
  externos.
- **Escala de 50 a 900 em todo matiz** — 3 ou 4 tons por papel resolvem.

### Plano — 12 levas

| Leva | O que faz |
|---|---|
| 3.5a | **Inventário no disco** — valores distintos de espaço, texto, ícone, z-index, largura, opacidade |
| 3.5b | **Camada primitiva + convenção de nome** + documento de uma página |
| 3.5c | **Espaçamento e layout** (~6 passos cada) + 2 telas piloto |
| 3.5d | **Tipografia** — tamanho, peso, altura de linha, tracking |
| 3.5e | **Dimensão** — controle, ícone, avatar, alvo de toque |
| 3.5f | **Borda, opacidade, z-index, container** — os quatro baratos juntos |
| 3.5g | **Foco e acessibilidade** — anel único, contraste, `prefers-reduced-motion` |
| 3.5h | **Movimento** — espacial × efeito, três velocidades (absorve a 4.4) |
| 3.5i | **Densidade** — o multiplicador global |
| 3.5j | **Camada de padrões** — `Secao`, `PageHeader`, `EmptyState` (absorve a 4.1) |
| 3.5k | **Prancheta no `/ui-kit`** com controles ao vivo |
| 3.5l | **Guarda contra regressão** + varredura final das telas |

### Armadilhas — não deixar passar

- **Estabilizar primitivos primeiro, atribuir intenção depois.** Começar pelo
  nome de componente parece produtivo e trava decisões antes das escalas
  estarem estáveis.
- **Escala pequena vence escala grande.** Seis passos, não quinze.
- **Nomear por papel, nunca por valor.** `--sp-3`, nunca `--sp-12px`.
- **Não tokenizar o que aparece uma vez.** Regra prática: três ocorrências ou mais.
- **Deixar saída de emergência.** Sempre haverá o caso que não cabe; melhor
  valor solto e marcado do que distorcer a escala.
- **Uma tela piloto antes da varredura.** Escala errada em 12 telas são 12 telas
  para refazer.
- **Ordem: espaço → tipografia → dimensão → resto → estética.** Mudar texto sem
  escala de espaço desmonta o ritmo e leva à conclusão errada.
- **Token não resolve gosto.** Barateia a tentativa, não acerta a direção.

### Posição no roadmap

Depois do Bloco 3 (o responsivo já obriga a mexer em espaçamento) e antes do
Bloco 4, que fica reduzido a 4.2, 4.3 e 4.5 — o resto foi absorvido.

---

## ⛔ Regras de negócio imutáveis

- **Notação centesimal:** `duração = horas + (minutos / 60)`. 1h30 → 1.50.
  Em `calcularDuracaoCentesimal` — **arquivo protegido**.
- **Semana: sábado a sexta.** Todo cálculo passa por `src/utils/semana.ts` —
  **arquivo protegido**. Nunca associar dia da semana por índice de array;
  sempre `getDay()` da data real.
- **Meta diária = meta semanal ÷ 5.** O divisor é 5 mesmo com a semana indo de
  sábado a sexta. Não "corrigir" para 7.
- **Meta diária vale para Timesheet e Resumo, nunca para Billable.**
- **O padrão do Resumo é somar TODOS os lançamentos.** O interruptor "Apenas com
  código" é opcional, nasce desligado e não é lembrado.
- **Nenhum limiar de cor contra número literal.** Todo verde/vermelho compara com
  valor derivado da configuração vigente.
- **A meta semanal canônica é "Horas Base Semanal"**, com histórico de vigência.
  Ler sempre via `buscarHorasBaseSemanal`.
- **Ordenação de metas:** por `semana_inicio`/`mes_inicio DESC`, com `criado_em
  DESC` apenas como desempate.
- **RLS do Supabase: nunca desativar.**
- **`fase_id` nunca entra em `registros`.** A fase vem por join via `subcategoria`.
- **`.is('campo', null)`, nunca `.eq('campo', null)`.**
- **`step="any"` em todo campo numérico.**
- **Contratadas vêm sempre de `projetos.horas_contratadas`**, nunca da soma das
  fases (leva 1.1a).

### Glossário da interface

| Nível | Termo |
|---|---|
| Projeto | **contratadas** |
| Fase | **previstas** |
| Categoria | **reservadas** |
| Realizado | **lançadas** |

O verbo é **reservar**, nunca "alocar". **"Planejado" é palavra proibida** fora
de `plano_semanal`. **"categoria" na interface = `subcategoria` no código.**

---

## 📁 Arquivos protegidos

Não modificar sem aprovação explícita, e só em leva dedicada:

- `src/lib/supabase.ts`
- `src/services/registros.ts` → `calcularDuracaoCentesimal`
- `src/utils/semana.ts`
- `vite.config.ts`
- `src/contexts/AuthContext.tsx`
- `src/index.css` e `tailwind.config.js`

---

## 🎨 Mapa de cores da migração

| Hex antigo | Token |
|---|---|
| `#0B0E14` | `surface-0` |
| `#161B22` | `surface-1` |
| `#1E2A38` | `surface-2` |
| `#FFFFFF` | `ink-900` |
| `gray-400` | `ink-700` — **não** `ink-500` |
| `gray-300` | `ink-900` |
| `gray-500` / `gray-600` | `ink-500` / `ink-300` |
| `#8B949E` | `ink-500` |
| `#03A9F4` | `accent` (era ciano, agora índigo `#5C87F7`) |
| `emerald-*` / `#4CAF50` | `ok` / `ok-bg` |
| `orange-*` / `#FF9800` | `warn` / `warn-bg` — **dourado, não laranja** |
| `red-*` / `#F44336` | `bad` / `bad-bg` |
| `gray-800/50` | `hair` |
| `gray-800` / `gray-700` | `hair-strong` |
| `bg-black/75` | `bg-[var(--scrim)]` |
| `shadow-sm` / `shadow-lg` / `shadow-2xl` | `shadow-e1` / `e2` / `e3` |

### Armadilhas de estilo

- Tailwind 3 **não** aplica opacidade em cor vinda de `var()`. `bg-accent/10`
  não funciona. Usar token `-bg` pronto ou
  `color-mix(in srgb, var(--x) 15%, transparent)` inline.
- `ink` mapeia para variáveis `--fg`, não `--ink`. `var(--ink-500)` não existe.
  **`ink` está em `theme.extend.colors`**, então `border-l-ink-500` e
  `divide-ink-*` existem.
- `Surface` não aceita `padding` junto com classes `p-`.
- `<form>` nunca vira `<Surface>` (perde o `onSubmit`); submit continua
  `type="submit"`.
- Cabeçalho de tabela fixo precisa de fundo opaco no `<tr>` **e** em cada `<th>`.
- `accentColor` de radio exige `style={{ accentColor: 'var(--accent)' }}`.
- `BarChart3` não existe no lucide-react v1 — usar `ChartNoAxesColumn`.
- Primitivas sempre pelo barril. De `src/pages/` é `'../components/ui'`;
  de `src/components/` é `'./ui'`.
- **12 tokens `--proj-1..12`** nos dois temas.
- `<option>` e `<optgroup>` precisam de `style` inline no Windows, senão o
  sistema operacional desenha por conta própria. Usar `var()` no inline, nunca
  remover o inline.
- `tailwindcss-animate` **não está instalado**: toda classe `animate-in`,
  `fade-in`, `zoom-in` é inerte. `animate-pulse` e `animate-spin` são do
  Tailwind de origem e funcionam.

---

## 🗄️ Banco

Tabelas: `configuracoes`, `projetos`, `fases`, `subcategorias`, `registros`,
`plano_semanal`, `horas_base_semanal`, `horas_base_mensal`, `lembretes`,
`horarios_dia`, `horarios_semana`. **RLS ativo em todas.**

`projetos.ordem_resumo` (integer, anulável) — ordem dos cards do Resumo,
separada de `projetos.ordem`. Nulo = fim da lista.

### Regras aprendidas

- `SET NULL`, nunca `CASCADE`, em `fase_id` e `subcategoria_id`.
- `.upsert()` não funciona com índice parcial (erro `42P10`). Para coluna
  anulável, usar dois índices parciais + select-then-update-or-insert.
- `CREATE TABLE AS SELECT` dispara aviso de RLS — escolher "Run and enable RLS".
- Múltiplos `SELECT` numa query só mostram o último resultado.
- **Backup de verdade é CSV pelo Table Editor**, tabela por tabela. O SQL Editor
  corta em 100 linhas por padrão.
- **Rodar backup antes de qualquer operação estrutural.**

### Limpeza pendente no banco

Projetos de teste com status `excluido`: `NOVO TESTE JUL`, `PROJETO TESTE` e os
`AGO TESTE`. Limpar quando conveniente.

---

## 🏗️ Stack e ambiente

React 19 + TypeScript + Tailwind CSS 3 + Vite + Supabase.
Deploy na Vercel, automático a cada push. Repositório
`github.com/williamlopix-ai/horas-app`. Produção em `horas-app-nine.vercel.app`.
Local: Windows + PowerShell, em `C:\Users\Mattos\Documents\HORAS-APP`.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Tema por atributo `data-theme`, **nunca** pelo modificador `dark:`.

### Testar em janela estreita

`Win` + `seta esquerda` encaixa a janela em metade da tela (~680px), abaixo do
breakpoint `lg` de 1024px. `Win` + `seta cima` desfaz. Não precisa arrastar borda.

### Testar no celular

```powershell
npm run dev -- --host
```
Usar a linha **Network**. É `http`, então o PWA não instala e o service worker
não registra — bom para testar layout sem cache velho.

### Cache do PWA no PC do trabalho

No Edge, sem instalar como PWA, o service worker velho gruda:
`F12` → Application → Service Workers → **Unregister** + **Clear site data**.

---

## 🔄 Protocolo de sessão

### Início

1. Colar o conteúdo deste `HANDOFF.md`.
2. Rodar o script de empacotamento e anexar os arquivos gerados.
3. Confirmar a branch: `git status`.

### Fim

1. Rodar o script de empacotamento de novo (os arquivos mudaram).
2. Pedir o `HANDOFF.md` reescrito, **com o painel atualizado**.
3. Substituir na raiz do repositório e commitar.

### Script de empacotamento (PowerShell)

```powershell
$origem  = "C:\Users\Mattos\Documents\HORAS-APP"
$destino = "$env:USERPROFILE\Desktop\HORAS-CONTEXTO"

Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $destino | Out-Null

Get-ChildItem "$origem\src" -Recurse -File -Include *.ts,*.tsx,*.css |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $rel  = $_.FullName.Substring("$origem\src\".Length)
    $nome = $rel -replace "\\", "_"
    Copy-Item $_.FullName -Destination (Join-Path $destino $nome)
  }

"HANDOFF.md","AGENTS.md","tailwind.config.js" | ForEach-Object {
  $caminho = Join-Path $origem $_
  if (Test-Path $caminho) {
    Copy-Item $caminho -Destination (Join-Path $destino ($_ -replace "\.config\.", "_config."))
  }
}

Write-Host "Pronto:" (Get-ChildItem $destino).Count "arquivos em $destino"
explorer $destino
```

> Os arquivos anexados ao projeto do chat podem estar **vários commits
> atrasados**. Rodar o script antes de cada sessão.

---

## 🤖 Trabalhando com o Claude Code

O executor é o **Claude Code**, na barra lateral do Antigravity. O usuário **não
é desenvolvedor** — toda instrução precisa ser passo a passo, em linguagem
simples: qual botão clicar, o que aparece na tela.

### Ritual de cada leva

1. `/clear`
2. `Shift+Tab` até aparecer **plan mode**
3. Colar o prompt inteiro
4. Ler o plano e trazer ao arquiteto **antes** de aprovar
5. Escolher a **opção 2** ("Yes, and manually approve edits") — nunca a 1
6. Se pedir comando de terminal, **opção 3** e recusar
7. Trazer o diff ao arquiteto **antes** de aplicar

### O agente nunca

- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado

### Texto endurecido de terminal — usar nas próximas levas

Aconteceu na 3.0d: rodou `npx tsc --noEmit` e `git diff` após o veto. Substituir
a linha antiga por esta:

```
NAO rodar NENHUM comando de terminal. Isso inclui comandos que apenas leem,
como npx tsc --noEmit, git diff, git status, ls, cat, grep, findstr.
A proibicao nao e sobre o comando alterar arquivos, e sobre nao executar nada.
Se voce achar que precisa de um comando, PARE, escreva qual e por que, e
espere. Verificar o resultado do seu proprio trabalho e tarefa do usuario.
```

### Estrutura de prompt que funciona

```
## Contexto            (stack, branch, arquivo alvo, regra de negócio)
## Passo 1 — LER ANTES DE EDITAR
## Passo 2 — RELATÓRIO (perguntas que forcem citar o disco, com linha)
## Passo 3 — Edição (só após confirmação)
## O que NÃO pode mudar
## Restrições
## Critério de aceite
## ENTREGA — ÚLTIMO BLOCO, LEIA POR ÚLTIMO
```

O **Passo 2 é o que mais rende**. Nesta sessão ele pegou dois erros do
arquiteto: um `<th>` que não existia em `Registros.tsx` e uma badge sem
instrução em `Projetos.tsx`.

### Bloco de entrega (colar no fim, texto exato)

```
## ENTREGA - ULTIMO BLOCO, LEIA POR ULTIMO

Este bloco vale para a resposta em que voce entrega a EDICAO (Passo 3).
A resposta do Passo 2 e o relatorio em texto, e continua sendo texto.

Na resposta da edicao, sua resposta tem que COMECAR com esta linha,
exatamente:
DIFF DA LEVA X

E logo abaixo, so codigo, no formato:
- linha removida
+ linha acrescentada

Inclua 3 linhas de contexto acima e 3 abaixo, sem sinal nenhum.

Nada de prosa antes. Nada de "Contexto", "Escopo", "Mapeamento".
Nada depois do diff tambem: sem resumo, sem "aceite cumprido".

Checagem final antes de enviar: procure na sua resposta as palavras
"vira", "passa a ser", "sera substituido". Se alguma aparecer, voce
escreveu plano. Apague e escreva o codigo.
```

### Lições de validação

- **Colagem embaralhada no chat não é código corrompido.** Aconteceu duas vezes
  nesta sessão (um `</svg>` "sumido", uma linha com um `c` solto). Se o
  `npx tsc -b` passa, o disco está bom. Não gastar rodadas conferindo colagem —
  ir para a tela.
- **A tela é o juiz.** Tag sem fechar não compila; o que compila e some da tela
  só aparece em print.
- **Print de cada estado é obrigatório.** O interruptor invisível desta sessão
  não apareceria em nenhuma leitura de código.
- **`npx tsc -b` antes de testar na tela, nunca depois.**
- **Mexeu em `tailwind.config.js`? Reiniciar o `npm run dev`.**
- **Mexeu no `index.css`? `Ctrl+Shift+R` no navegador.**
- **Nunca autorizar `awk`, `sed`, `mv` ou `cat`** reescrevendo arquivo.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- **`redesign`** — mergeada em `main` em 23/08. Se voltar a ser usada: `main`
  sempre flui para `redesign` via `git merge main`, **nunca o inverso**.

Cada leva desta sessão foi commitada separadamente (3.0a, 3.0b, 3.0c, 3.0d).
Para localizar um ponto de retorno: `git log --oneline`.

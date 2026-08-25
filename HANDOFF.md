# HANDOFF — HORAS

> Estado do projeto ao fim da sessão de **24/08/2026**.
> Substitui integralmente a versão anterior.
> **Leia este arquivo no início de toda sessão, antes de qualquer ação.**

---

## 📊 Onde estamos

```
BLOCO 0 — Limpeza                    ████████████ 100%
  ✅ 0.1  Escape fecha os modais
  ✅ 0.2  Resumo abre em Projetos
  ✅ 0.3  step="any" no Plano Semanal
  ✅ 0.4  Drop das tabelas de backup
  ✅ 0.5  Interruptor "Apenas com código"

BLOCO 1 — Correções                  ████████████ 100%
  ✅ 1.1a Contratadas vem sempre do projeto
  ✅ 1.1b Aviso de estouro das fases + botão
  ✅ 1.2  Timesheet destaca, não filtra
  ✅ 1.3  Barra da fase com um segmento

BLOCO 2 — Funcionalidades            ████████████ 100%
  ✅ 2.1a Registros destaca por categoria
  ✅ 2.1b Drill-down por dia na categoria
  ✅ 2.2a Coluna ordem_resumo no banco
  ✅ 2.2b Tipo e serviço da ordem
  ✅ 2.2c Arrastar e soltar no Resumo
  ✅ 2.3a Doze tokens de cor
  ✅ 2.3b Paleta de doze no modal
  ✅ 2.4a Contratadas editáveis no cabeçalho
  ✅ 2.4a-bis Menu de ações no cabeçalho
  ✅ 2.4b Criar projeto leva para dentro
  ✅ 2.4c Pulso de destaque
  ✅ 2.4c-bis Pulso com anel de luz

BLOCO 3 — Responsivo                 ░░░░░░░░░░░░   0%   ← PRÓXIMO
  ⬜ 3.0  Tokenizar Projetos, Lembretes e modais
  ⬜ 3.1  Contrato responsivo por faixa
  ⬜ 3.2  Tabelas em mobile
  ⬜ 3.3  Varredura dos 27 truncate
  ⬜ 3.4  Alvos de 44px e safe area
  ⬜ 3.5  Pulso não aparece no celular

BLOCO 4 — Estética                   ░░░░░░░░░░░░   0%   ← O ÚLTIMO
  ⬜ 4.1  Primitiva Secao
  ⬜ 4.2  Hierarquia de elevação
  ⬜ 4.3  Cor do projeto como identidade
  ⬜ 4.4  Movimento e transições
```

**21 de 31 levas. Três blocos fechados.**

> **Manter este painel atualizado.** Ao fim de cada leva o assistente deve
> mostrar este mapa na conversa, e reescrevê-lo aqui no fim da sessão.

---

## 🎯 Próxima frente: Bloco 3 — Responsivo

É o maior de todos, estimado em **4 a 6 sessões**. Não começar sem ler o
pré-requisito abaixo.

### 3.0 — Pré-requisito descoberto em 24/08

**`Projetos.tsx`, `Lembretes.tsx` e os modais nunca foram migrados para
tokens na Fase 4.** Confirmado no disco: **132 linhas** com hex legado.

```
39  src/pages/Projetos.tsx
36  src/pages/Lembretes.tsx
39  src/components/ModalRegistro.tsx
31  src/components/ModalProjeto.tsx
 6  src/components/ModalConfirmacao.tsx
 6  src/components/MenuAcoes.tsx
 3  src/components/Toast.tsx
 1  src/components/Skeleton.tsx
```

Tokenizar **antes** de mexer no layout, senão o mesmo JSX é editado duas
vezes. Conferir o número atual no disco antes de planejar:

```powershell
Select-String -Path src\pages\Projetos.tsx,src\pages\Lembretes.tsx,src\components\ModalRegistro.tsx,src\components\ModalProjeto.tsx -Pattern "gray-|#161B22|#0B0E14|#8B949E|#03A9F4|#1E2A38|#4CAF50|#F44336" | Measure-Object -Line
```

### 3.1 — Contrato responsivo escrito

Definir por escrito o que cada tela faz abaixo de **640px**, **768px** e
**1024px**. Sem isso o critério de aceite fica subjetivo e o agente inventa.

### 3.2 — Tabelas em mobile

Timesheet, Billable e Resumo/tabela têm grades largas. Duas saídas possíveis,
provavelmente diferentes por tela:
- cartões empilhados
- rolagem horizontal com a primeira coluna fixa

### 3.3 — Varredura dos 27 `truncate`

```
Registros 8 · Resumo 7 · ProjetoDetalhe 5 · Sidebar 4
Billable 2 · Lembretes 2 · PaletaComandos 2 · DataRow 2 · Timesheet 1
```

É a origem dos "três pontinhos" comendo os nomes. Em muitos casos a correção
é `whitespace-normal break-words`, como já foi feito no balde sem
subcategoria. Lembrar: **`truncate` em filho de flex exige `min-w-0`**.

### 3.4 — Alvos de toque e safe area

Mínimo de 44px. É um PWA de celular.

### 3.5 — Pulso não aparece no celular

Achado em 24/08. O temporizador do pulso só começa a contar após o primeiro
`mousemove`, `keydown` ou `touchstart`. **No celular não existe `mousemove`**,
então ou o `touchstart` disparou junto com a navegação que trouxe o usuário à
tela, ou o pulso rodou antes de ele olhar. Investigar antes de mexer no CSS.

### Como testar no celular

```powershell
npm run dev -- --host
```

Usar a linha **Network** que o Vite imprime. É `http`, então o PWA não instala
e o service worker não registra — bom para testar layout sem cache velho.

---

## ✅ O que foi feito nesta sessão

### Bloco 0 — Limpeza

**0.1** — Escape fecha `ModalRegistro`, `ModalProjeto` e `ModalConfirmacao`.
Criado `src/hooks/useFecharComEsc.ts`, replicando o padrão do `Sheet.tsx`
(`useRef` guardando a função de fechar, para evitar closure velha).
Commit `9af2229`, a partir de `e1e4cdb`.

**0.2** — `Resumo.tsx` abre por padrão na aba **Projetos**.

**0.3** — `step="any"` no campo **Horas planejadas** do Plano Semanal
(`ProjetoDetalhe.tsx:1640`). **Correção de erro do HANDOFF antigo:** aquela
linha é o Plano Semanal, **não** o campo de reservar horas por categoria.
Era o último `step` fixo do app.

**0.4** — As cinco tabelas `_bkp_semana_*` foram **dropadas**, após validação.
CSVs baixados antes pelo Table Editor.

**0.5** — Interruptor **"Apenas com código"** nas abas Semanal e Diário do
Resumo. Um interruptor só para as duas abas, nasce **desligado** e **não é
lembrado** entre visitas. A aba Por Projetos não é afetada.

### Bloco 1 — Correções

**1.1a** — As horas contratadas do projeto passam a vir **sempre** de
`projetos.horas_contratadas`. Antes o `ProjetoDetalhe` somava as previstas das
fases quando existia fase com horas, enquanto o `Resumo` usava o campo do
projeto — daí a divergência (VALE DH: 400 no Resumo, 706 no detalhe).

**1.1b** — Aviso quando a soma das previstas das fases **excede** as
contratadas, com botão "Atualizar para X,XXh" que grava direto. Soma menor
que o contratado é normal e não gera aviso.

**1.2** — O parâmetro `projeto_id` na URL de Registros **destaca** em vez de
filtrar. Causa do bug: os intervalos ociosos eram calculados sobre a lista já
filtrada, mostrando o dia inteiro como vago. O nome do parâmetro foi mantido
para não mexer nos quatro links de origem.

**1.3** — Barra da fase com **um segmento** (lançadas × previstas). Removidos
o segmento azul e a legenda de duas linhas. No lugar, uma linha de texto em
mono, que varia conforme o caso e nunca repete os números do cabeçalho.

### Bloco 2 — Funcionalidades

**2.1a/2.1b** — Drill-down nas categorias com nome: expandem agrupando **por
dia** e o clique navega para Registros naquele dia, destacando aquela
categoria. Novo parâmetro `subcategoria_id`, que vence o `projeto_id`.
O balde "Sem subcategoria" **não mudou**: continua listando lançamento a
lançamento e abrindo o modal, porque ali o objetivo é consertar, não consultar.

**2.2a/2.2b/2.2c** — Ordenação manual dos cards do Resumo, só no grupo Ativos,
persistida em `projetos.ordem_resumo`. Descoberto que a coluna `ordem` tinha
**valores repetidos**, porque `criarProjeto` numera por tipo — renumerado de 1
a 24 sem empate. A aba antes ordenava por horas lançadas, o que fazia os cards
se remexerem sozinhos.

**2.3a/2.3b** — Paleta de **12 cores** com espaçamento máximo de matiz e
luminosidade alternada entre vizinhas, para sobreviverem numa bolinha de 8px.
Gravam `var(--proj-N)` e adaptam ao tema. **Projetos antigos guardam hex e
continuam como estão** — para adotar a paleta nova é preciso reescolher a cor.

**2.4a a 2.4c-bis** — Fluxo de criação de projeto:
- horas contratadas editáveis no cabeçalho, com edição no lugar
- menu de três pontinhos no cabeçalho (o gesto agora é o mesmo em toda a tela)
- o modal de criação **não pede mais horas**; na edição o campo continua
- criar projeto do tipo *projeto* leva direto para `/projeto/:id?novo=1`;
  **rotina continua na lista**
- faixa azul de boas-vindas, que some ao definir as horas e não volta no F5
- pulso de destaque na faixa e no menu, três vezes, parando ao interagir

---

## 🔍 Diagnósticos desta sessão — não reabrir

### Resumo Semanal e Timesheet nunca batem, e está certo

`Timesheet.tsx:74` filtra `status !== 'excluido'` **e** `codigo_externo`
preenchido. O Resumo soma **todos** os lançamentos. Os três projetos sem
código são **ALMOÇO** (61h), **ASO- 43704 401** (4h) e **LICENÇA** (2h) — todos
jornada não reportável ao ERM. **Feriado tem código** (`0043704-0002`) e vai
para o ERM corretamente.

Não existe lançamento órfão (`projeto_id` nulo) nem projeto excluído com horas.

**Validação feita:** Timesheet do app × timesheet corporativo bateram linha a
linha em várias semanas, provando que a migração da semana sábado-sexta está
correta. Foi o que liberou o drop das tabelas de backup.

### O ALMOÇO entra na conta da meta

São ~63 lançamentos de quase 1h, algo como 5h por semana dentro da meta de
41,25h. A jornada é 09:00–18:30 (9,5h) e a meta diária é 8,25h — a diferença
de 1,25h é exatamente o intervalo. **O interruptor "Apenas com código" foi a
solução escolhida**, não uma coluna `conta_na_meta`. Fica registrado que a
opção mais estrutural existe, se um dia incomodar.

### Pendências menores anotadas

- **Estado vazio do Resumo** (~linha 437) lê `registros` completo. Se um dia só
  existirem lançamentos sem código na faixa exibida, a aba fica em branco em
  vez de mostrar mensagem. Acabamento, entra com os outros estados vazios.
- **`Billable.tsx:508`** manda `semana_inicio=` na URL, e `Registros.tsx` não lê
  esse parâmetro. O link cai na semana atual sem filtro de data.
- **Projetos de teste** no banco: `NOVO TESTE JUL` e `PROJETO TESTE`, com status
  `excluido`, mais os `AGO TESTE` criados hoje. Limpar quando conveniente.

---

## 🎨 Bloco 4 — Estética (o último, por decisão do usuário)

Criado em 24/08. **É o último de todos** — "é só estética, todas aquelas
questões que batemos são prioridade".

**4.1 — Primitiva `Secao`.** Os `<h2>` de *Fases & Subcategorias* (1074),
*Plano semanal* (1597) e *Lançamentos* (1788) são texto solto **fora de
qualquer `Surface`**. Por isso parecem não pertencer à tela.

**4.2 — Hierarquia de elevação.** **Todo `Surface` do app está em
`elevacao={1}`.** O sistema tem quatro camadas e usa uma — daí a sensação de
"nada conectado".

**4.3 — Cor do projeto como identidade.** Os `--proj-*` hoje só aparecem como
bolinha de 8px. Poderiam tingir filete do cabeçalho, barra de progresso e
marcadores de fase.

**4.4 — Movimento.** O app tinha **zero animação** até 24/08, porque
`tailwindcss-animate` nunca foi instalado e as classes de animação no código
são inertes. A primeira animação (`pulso-brilho` / `pulso-zoom`) foi feita com
CSS puro e define o padrão: **resolver com transição CSS, sem instalar nada.**

**Sobre o Claude Design:** usar como **prancheta** para explorar direção
visual, **nunca como executor**. Ele não conhece os tokens do projeto nem as
restrições de build, e devolveria hex fixo — criando dívida nova igual à que a
Fase 4 levou meses para quitar.

---

## 🔄 Protocolo de sessão

### Início

1. Colar o conteúdo deste `HANDOFF.md`.
2. Rodar o script de empacotamento abaixo e anexar os arquivos gerados.
3. Confirmar a branch: `git status`.

### Fim

1. Rodar o script de empacotamento de novo (os arquivos mudaram).
2. Pedir ao assistente o `HANDOFF.md` reescrito, **com o painel de evolução
   atualizado**.
3. Substituir o arquivo na raiz do repositório e commitar.

### Script de empacotamento (PowerShell)

Copia os arquivos relevantes para uma pasta na Área de Trabalho, com os nomes
achatados (`src/pages/Resumo.tsx` → `pages_Resumo.tsx`), prontos para anexar
ao chat.

```powershell
$origem  = "C:\Users\Mattos\Documents\HORAS-APP"
$destino = "$env:USERPROFILE\Desktop\HORAS-CONTEXTO"

Remove-Item $destino -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $destino | Out-Null

# Arquivos dentro de src, com o caminho achatado
Get-ChildItem "$origem\src" -Recurse -File -Include *.ts,*.tsx,*.css |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    $rel  = $_.FullName.Substring("$origem\src\".Length)
    $nome = $rel -replace "\\", "_"
    Copy-Item $_.FullName -Destination (Join-Path $destino $nome)
  }

# Arquivos da raiz
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
> atrasados**. Rodar o script antes de cada sessão. Já causou o planejamento e
> descarte de uma fase inteira (Fase 3.0).

---

## 🤖 Trabalhando com o Claude Code

O executor é o **Claude Code**, na barra lateral do Antigravity. O usuário
**não é desenvolvedor** — toda instrução precisa ser passo a passo, em
linguagem simples: qual botão clicar, o que aparece na tela.

### Ritual de cada leva

1. `/clear`
2. `Shift+Tab` até aparecer **plan mode**
3. Colar o prompt inteiro
4. Ler o plano e aprovar
5. Escolher a **opção 2** ("Yes, and manually approve edits") — nunca a 1
6. Se pedir comando de terminal, **opção 3** e recusar
7. Trazer o diff ao arquiteto **antes** de aplicar

### O agente nunca

- roda `npx tsc -b`, `npm run build`, `git` ou qualquer comando de terminal
- faz commit
- instala pacote
- toca arquivo fora do escopo declarado

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

O **Passo 2 é o que mais rende**. Nesta sessão ele revelou: que o `ordem` tinha
empates, que o Resumo ordenava por horas lançadas, que o `--accent-bg` muda de
formato entre os temas, e que o aviso de fases estava aninhado dentro do campo
de horas do modal.

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
Se a sua resposta comecar com "## Contexto", esta errada.

Checagem final antes de enviar: procure na sua resposta as palavras
"vira", "passa a ser", "sera substituido". Se alguma aparecer, voce
escreveu plano. Apague e escreva o codigo.
```

**Sempre exigir 3 linhas de contexto** em volta de cada trecho. Sem elas não dá
para validar *onde* a alteração caiu — só *que* ela existe.

### Lições de validação desta sessão

- **Diff cortado no terminal engana.** Um `git diff` truncado pela largura da
  janela fez o arquiteto acusar corrupção que não existia. Pedir sempre o diff
  inteiro antes de concluir qualquer coisa.
- **Colagem embaralhada no chat não é código corrompido.** Se o `npx tsc -b`
  passa, o disco está bom.
- **`npx tsc -b` antes de testar na tela, nunca depois.**
- **Mexeu em `tailwind.config.js`? Reiniciar o `npm run dev`.** O Tailwind lê a
  config só na subida, sem erro e sem aviso.
- **Mexeu no `index.css`? `Ctrl+Shift+R` no navegador.** Duas vezes nesta
  sessão o CSS novo não chegou e pareceu bug de lógica.
- **Nunca autorizar `awk`, `sed`, `mv` ou `cat`** reescrevendo arquivo. Foi
  oferecido e recusado — corretamente.

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
- **O padrão do Resumo é somar TODOS os lançamentos.** O interruptor "Apenas
  com código" é opcional, nasce desligado e não é lembrado.
- **Nenhum limiar de cor contra número literal.** Todo verde/vermelho compara
  com valor derivado da configuração vigente.
- **A meta semanal canônica é "Horas Base Semanal"**, com histórico de
  vigência. Ler sempre via `buscarHorasBaseSemanal`.
- **Ordenação de metas:** por `semana_inicio`/`mes_inicio DESC`, com
  `criado_em DESC` apenas como desempate.
- **RLS do Supabase: nunca desativar.**
- **`fase_id` nunca entra em `registros`.** A fase vem por join via
  `subcategoria`.
- **`.is('campo', null)`, nunca `.eq('campo', null)`.**
- **`step="any"` em todo campo numérico.** `step` fixo cancela o envio do
  formulário em silêncio quando o valor não bate com o incremento.

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

| Hex antigo | Token | Observação |
|---|---|---|
| `#0B0E14` | `surface-0` | fundo da página |
| `#161B22` | `surface-1` | superfície de card |
| `#1E2A38` | `surface-2` | superfície elevada |
| `#FFFFFF` | `ink-900` | texto principal |
| `gray-400` | `ink-700` | **não** `ink-500` |
| `#8B949E` | `ink-500` | texto secundário |
| `#03A9F4` | `accent` | era ciano, agora índigo `#5C87F7` |
| `#4CAF50` | `ok` | `#6FBF8E` |
| `#F44336` | `bad` | `#E8796B` |
| `#FF9800` | `warn` | `#E0B457`, **dourado, não laranja** |
| `gray-800/50` | `hair` | bordas e divisórias |
| `gray-800` | `hair-strong` | bordas de destaque |

### Armadilhas de estilo

- Tailwind 3 **não** aplica modificador de opacidade em cor vinda de `var()`.
  `bg-accent/10` não funciona. Usar token `-bg` pronto ou
  `color-mix(in srgb, var(--x) 15%, transparent)`.
- `ink` mapeia para variáveis `--fg`, não `--ink`. `var(--ink-500)` não existe.
- `Surface` não aceita `padding` junto com classes `p-`.
- `<form>` nunca vira `<Surface>` (perde o `onSubmit`); submit continua
  `type="submit"`.
- Cabeçalho de tabela fixo precisa de fundo opaco no `<tr>` **e** em cada `<th>`.
- `accentColor` de radio exige `style={{ accentColor: 'var(--accent)' }}`.
- `BarChart3` não existe no lucide-react v1 — usar `ChartNoAxesColumn`.
- Primitivas sempre pelo barril: `from '../components/ui'`.
- **12 tokens `--proj-1..12`** nos dois temas, desde 24/08.

---

## 🗄️ Banco

Tabelas: `configuracoes`, `projetos`, `fases`, `subcategorias`, `registros`,
`plano_semanal`, `horas_base_semanal`, `horas_base_mensal`, `lembretes`,
`horarios_dia`, `horarios_semana`. **RLS ativo em todas.**

Novidade de 24/08: **`projetos.ordem_resumo`** (`integer`, anulável) — ordem
dos cards do Resumo, separada de `projetos.ordem`, que é da tela Projetos.
Nulo significa "vai para o fim da lista".

### Regras aprendidas

- `SET NULL`, nunca `CASCADE`, em `fase_id` e `subcategoria_id`.
- `.upsert()` não funciona com índice parcial (erro `42P10`). Para coluna
  anulável, usar dois índices parciais + select-then-update-or-insert.
- `CREATE TABLE AS SELECT` dispara aviso de RLS — escolher "Run and enable RLS".
- Múltiplos `SELECT` numa query só mostram o último resultado.
- **Backup de verdade é CSV pelo Table Editor**, tabela por tabela. O export
  Excel de Ajustes é relatório, não backup restaurável. O SQL Editor corta em
  100 linhas por padrão.
- **Rodar backup antes de qualquer operação estrutural.**

---

## 🏗️ Stack e ambiente

React 19 + TypeScript + Tailwind CSS 3 + Vite + Supabase.
Deploy na Vercel, automático a cada push. Repositório
`github.com/williamlopix-ai/horas-app`. Produção em `horas-app-nine.vercel.app`.
Local: Windows + PowerShell, em `C:\Users\Mattos\Documents\HORAS-APP`.

- **`verbatimModuleSyntax` ativo** — import de tipo exige a palavra `type`.
- **`noUnusedLocals` ativo** — import ou variável órfã quebra o `npx tsc -b`.
- Tema por atributo `data-theme`, **nunca** pelo modificador `dark:`.

### Cache do PWA no PC do trabalho

No Edge, sem instalar como PWA, o service worker velho gruda. Resolver com:
`F12` → Application → Service Workers → **Unregister** + **Clear site data**.

---

## 🔀 Branches

- **`main`** — tudo desta sessão está aqui, em produção.
- **`redesign`** — foi mergeada em `main` em 23/08 (43 commits, fast-forward).
  Se voltar a ser usada: `main` sempre flui para `redesign` via
  `git merge main`, **nunca o inverso**.

Ponto de retorno anterior à sessão: `e1e4cdb`.
Primeiro commit da sessão: `9af2229`.

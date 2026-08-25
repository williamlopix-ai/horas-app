# Contrato Responsivo — HORAS

> Leva 3.1 do Bloco 3. Decidido em 25/08/2026.
> Este documento é o **critério de aceite** das levas 3.2, 3.3 e 3.4.
> Nenhuma dessas levas pode inventar um limiar novo. Se surgir um caso
> que este contrato não cobre, PARAR e decidir aqui primeiro.

---

## Por que este documento existe

Auditoria de 25/08/2026 no disco encontrou **três limiares diferentes
para decisões parecidas**:

| Tela | Onde quebra hoje | O que faz |
|---|---|---|
| Projetos | `md:` (768) | tabela vira cartão empilhado |
| Timesheet | `md:` (768) | só troca o texto da meta de lugar |
| Billable | `lg:` (1024) | só os cards de métrica |
| Resumo | `sm:` + `md:` + `lg:` | varia por trecho |
| Sidebar | `lg:` (1024) | vira gaveta |

É o mesmo padrão que gerou os dois azuis (`--accent` índigo vs `#03A9F4`
ciano) na Fase 4: decisões paralelas, sem combinar antes.

---

## As três faixas

Usar **apenas** os breakpoints que o Tailwind já traz. Não criar `xl:`
(hoje há zero ocorrências no app — manter assim).

| Faixa | Largura | Contexto real |
|---|---|---|
| **Compacta** | até 639px | celular em pé |
| **Média** | 640px a 1023px | celular deitado, tablet |
| **Ampla** | 1024px ou mais | computador |

### O que vale em cada faixa

| | Compacta | Média | Ampla |
|---|---|---|---|
| Sidebar | gaveta (`☰`) | gaveta (`☰`) | fixa, 240px |
| Colunas de cards | 1 | 2 | 3 |
| Alvo de toque | 44px obrigatório | 44px obrigatório | livre |
| Tabela | ver abaixo | ver abaixo | tabela cheia |
| Texto longo | quebra linha | quebra linha | pode truncar |

**Limiar único de tabela: 768px (`md:`).** Alinha com o que Projetos já
faz e funciona. Timesheet, Billable e Resumo/tabela passam a usar o mesmo.

---

## Decisão: tabela abaixo de 768px

Existem dois padrões, e a escolha depende do que a tela serve.

### Padrão A — rolagem lateral com primeira coluna fixa
**Usar em: Timesheet e Billable.**

A grade continua grade. O usuário arrasta de lado para ver os dias, e a
coluna do nome do projeto fica presa na esquerda, sempre visível.

Motivo: nessas duas telas o ponto é **comparar dias lado a lado**.
Empilhar em cartão destrói exatamente a informação que se quer ler.
O Timesheet ainda espelha a planilha corporativa (ERM) — a ordem
`Código | Nome | Sáb…Sex | Total` é fixa e não pode ser reorganizada.

### Padrão B — cartão empilhado
**Usar em: Projetos (já faz) e Resumo/tabela.**

Cada linha vira um bloco, com rótulo em cima e valor embaixo.

Motivo: são listas de itens independentes. Ninguém compara a linha 3
com a linha 7 — lê-se um de cada vez.

### Regra derivada
Se a tela existe para **comparar valores entre colunas** → Padrão A.
Se existe para **listar itens independentes** → Padrão B.

---

## Uso no celular

Uso declarado pelo dono do app (25/08/2026): **o app inteiro**, sem tela
secundária. Lançar horas, Timesheet, Resumo e Billable (semanal e mensal)
são todos usados no celular, sem hierarquia entre eles.

Consequência para o Bloco 3:

> Nenhuma tela pode ser tratada como "só de computador". Toda tela tem
> que ser utilizável na faixa Compacta.

Isso torna a leva de tabelas (3.3) a mais importante do bloco: são
**quatro grades** em uso real — Timesheet, Billable semanal, Billable
mensal e Resumo/tabela — e é exatamente onde o celular hoje falha.

### Achado paralelo (25/08/2026)

O botão "Lançar horas" existe hoje em dois lugares:
- `Sidebar.tsx:139-151` — dentro da gaveta no celular
- `Registros.tsx:637-644` — **só no estado vazio**, some quando há registros

No celular, com lançamentos na tela, lançar exige dois toques. Como o
uso é do app inteiro (a gaveta é aberta com frequência de qualquer
forma), isto **não é bloqueante** — fica na fila de avulsas, não fura
a fila do Bloco 3.

---

## Texto longo

27 pontos de `truncate` mapeados no app (Registros 8, Resumo 7,
ProjetoDetalhe 5, Sidebar 4, Billable 2, Lembretes 2, PaletaComandos 2,
DataRow 2, Timesheet 1).

Regra: na faixa **Compacta**, texto que identifica algo (nome de projeto,
título de lembrete, nome de categoria) **quebra linha**, não trunca.
`whitespace-normal break-words`, como já foi feito no balde
"Sem subcategoria".

`truncate` continua válido em faixa Ampla e em rótulos secundários.

Lembrete técnico: `truncate` em filho de flex exige `min-w-0` no pai,
senão empurra o irmão para fora do container.

---

## Alvo de toque

Nas faixas **Compacta e Média**, todo elemento clicável tem área mínima
de **44px × 44px**. Vale para a área que responde ao toque, não para o
tamanho do desenho — resolve-se com espaçamento por fora do ícone.

Pontos já conhecidos que provavelmente violam:
- os três ícones no rodapé do card de Lembrete (✓, lápis, lixeira)
- ícone de arrastar em Projetos
- botões de ação nas linhas de Registros

Auditoria completa é a leva 3.4.

---

## Safe area

Em PWA instalado no celular, respeitar `env(safe-area-inset-*)` em
qualquer elemento fixo no topo ou no rodapé — barra de status e barra
de gestos do iPhone cobrem conteúdo colado na borda.

---

## O que este contrato NÃO decide

- Hierarquia de elevação entre camadas → Bloco 4.2
- Padronização de raio (`rounded-xl` vs `rounded-ctl`) → Bloco 3.5
- Anel de foco visível para teclado → Bloco 3.5
- Animação e transição → Bloco 4.4

---

## Como testar

```
npm run dev -- --host
```

Usar a linha **Network** no celular (mesmo Wi-Fi). É `http`, então o PWA
não instala e o service worker não registra — bom para testar layout sem
cache velho.

No computador, arrastar a borda da janela do Chrome para baixo de 1024px
faz o `☰` aparecer.

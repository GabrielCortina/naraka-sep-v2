# Phase 9: Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 09-dashboard
**Areas discussed:** Layout dos blocos, Visualização de dados, Interatividade, Agregação de dados

---

## Layout dos blocos

| Option | Description | Selected |
|--------|-------------|----------|
| Grid 2x3 | 2 colunas, 3 linhas equilibrado | |
| Resumo largo + grid 2x2 | Resumo full-width no topo, 2x2 abaixo | |
| Layout assimétrico | Esquerda 60% + direita 40% | ✓ |

**User's choice:** Layout assimétrico — coluna esquerda maior (60%) com Resumo + Progressão + Por Separador, coluna direita menor (40%) com Rankings + Status Fardos.

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll vertical empilhado | Blocos empilhados verticalmente, full-width | ✓ |
| Abas (tabs) por bloco | Tabs no topo para navegar entre blocos | |
| Resumo fixo + abas | Resumo sempre visível, demais em abas | |

**User's choice:** Scroll vertical empilhado para mobile.

| Option | Description | Selected |
|--------|-------------|----------|
| Aba no AppShell | Dashboard como aba na navegação existente | ✓ |
| Página dedicada com header | Rota separada com header próprio | |
| Página inicial do líder | Dashboard substitui landing page | |

**User's choice:** Aba no AppShell, padrão consistente.

| Option | Description | Selected |
|--------|-------------|----------|
| Stat cards grandes | 4 stat cards lado a lado com número grande | ✓ |
| Lista compacta | Uma linha por métrica | |
| Barra horizontal | Barra de progresso larga | |

**User's choice:** Stat cards grandes para Resumo Geral.

| Option | Description | Selected |
|--------|-------------|----------|
| Barra + timer + badge | Linha por grupo com barra, contagem, badge | ✓ |
| Cards por grupo | Mini-card por grupo de envio | |
| Tabela | Tabela com colunas | |

**User's choice:** Barra + timer + badge para Progressão por Método.

| Option | Description | Selected |
|--------|-------------|----------|
| Lista com barra | Nome + barra + % + peças + cards | ✓ |
| Cards individuais | Mini-card por separador | |
| Tabela | Tabela com colunas | |

**User's choice:** Lista com barra para Por Separador.

---

## Visualização de dados

| Option | Description | Selected |
|--------|-------------|----------|
| Lista numerada simples | Medalhas top 3, nome + valor | ✓ |
| Barras horizontais | Barra proporcional ao valor | |
| Podium style | Top 3 em destaque, demais em lista | |

**User's choice:** Lista numerada simples com emojis de medalha.
**Notes:** Usuário solicitou filtro de período nos rankings com 7 opções (Hoje, Últimos 15d, 30d, Mês atual, Último mês, Últimos 3 meses, Personalizado).

| Option | Description | Selected |
|--------|-------------|----------|
| Incluir nesta fase | Criar tabela histórico + filtro | ✓ |
| Fase futura | Dashboard v1 só mostra rankings do dia | |
| Simplificar filtro | Só "Hoje" por enquanto | |

**User's choice:** Incluir persistência histórica na Phase 9.

| Option | Description | Selected |
|--------|-------------|----------|
| 3 contadores com cores | Pendentes/Encontrados/Baixados empilhados | ✓ |
| Donut/pie chart | Gráfico circular | |
| Barra segmentada | Uma barra dividida em 3 | |

**User's choice:** 3 contadores com cores.
**Notes:** Correção nas definições — Pendentes (amarelo), Encontrados (azul, em trafego_fardos), Baixados (verde, em baixados).

| Option | Description | Selected |
|--------|-------------|----------|
| Coluna dupla | Nome + peças + cards na mesma linha | ✓ |
| Tabs peças/cards | Duas tabs com rankings diferentes | |
| Dois rankings separados | Mini-blocos lado a lado | |

**User's choice:** Coluna dupla para Top Separadores.

---

## Interatividade

| Option | Description | Selected |
|--------|-------------|----------|
| Somente leitura | Dashboard read-only | |
| Clique navega para aba | Clicar navega para Cards/Fardos | |
| Expandir in-place | Clicar expande detalhes | ✓ (parcial) |

**User's choice:** Cards expansíveis (clicar expande detalhes com lista de cards relacionados). Também solicitou layout personalizável com drag-and-drop — separado para Phase 9.1.

| Option | Description | Selected |
|--------|-------------|----------|
| Separar (9 + 9.1) | Expansíveis agora, drag-and-drop depois | ✓ |
| Tudo na Phase 9 | Incluir tudo | |
| Só expansíveis | Sem planejar 9.1 | |

**User's choice:** Separar — Phase 9 com cards expansíveis, Phase 9.1 com layout personalizável.

| Option | Description | Selected |
|--------|-------------|----------|
| Lista de cards relacionados | Ex: expandir Pendentes mostra cards pendentes | ✓ |
| Mini-tabela com dados | Tabela detalhada | |
| Você decide | Claude decide formato | |

**User's choice:** Lista de cards relacionados ao expandir.

| Option | Description | Selected |
|--------|-------------|----------|
| Dentro do bloco de rankings | Select no header do bloco | ✓ |
| Filtro global no topo | Select no header do dashboard | |
| Popover com calendário | Botão com popover | |

**User's choice:** Filtro dentro do header do bloco de rankings.

| Option | Description | Selected |
|--------|-------------|----------|
| Select simples | Dropdown com 7 opções + date picker | ✓ |
| Popover completo | Botões rápidos + calendário inline | |
| Você decide | Claude escolhe | |

**User's choice:** Select simples (shadcn/ui Select).

---

## Agregação de dados

| Option | Description | Selected |
|--------|-------------|----------|
| Queries Supabase no cliente | Client-side queries + realtime re-fetch | ✓ |
| Views no Supabase | Database views para cada bloco | |
| API routes com cache | Next.js API routes com cache curto | |

**User's choice:** Queries Supabase no cliente com re-fetch via subscription.

| Option | Description | Selected |
|--------|-------------|----------|
| Na virada de dia existente | Aproveitar lógica UPLD-08 | ✓ |
| Database trigger | Trigger no Supabase | |
| Cron job | Edge function às 23:59 | |

**User's choice:** Snapshot na virada de dia existente.

| Option | Description | Selected |
|--------|-------------|----------|
| Totais por usuário | Uma linha por user/dia | |
| Totais por usuário + método | Granular por grupo de envio | ✓ |
| Você decide | Claude decide schema | |

**User's choice:** Totais por usuário + método de envio para análise granular.

---

## Claude's Discretion

- Espaçamento e proporções exatas do layout assimétrico
- Animações de expansão dos blocos
- Skeleton loading durante carregamento
- Estados vazios
- Debounce strategy para realtime

## Deferred Ideas

- Layout personalizável com drag-and-drop — Phase 9.1 (react-grid-layout ou @dnd-kit, posição/tamanho por usuário)

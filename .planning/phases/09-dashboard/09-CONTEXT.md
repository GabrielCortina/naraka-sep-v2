# Phase 9: Dashboard - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Painel em tempo real com 6 blocos de métricas para líder e admin acompanharem a operação do dia: Resumo Geral, Progressão por Método de Envio, Top Separadores, Top Fardistas, Status de Fardos e Progresso Por Separador. Inclui persistência histórica diária para rankings com filtro de período. Todos os blocos atualizam via Supabase subscriptions.

</domain>

<decisions>
## Implementation Decisions

### Layout dos blocos (desktop)
- **D-01:** Layout assimétrico com 2 colunas: esquerda maior (60%) com Resumo Geral + Progressão por Método + Por Separador; direita menor (40%) com Top Separadores + Top Fardistas + Status de Fardos
- **D-02:** Dashboard é uma aba no AppShell existente (não página dedicada). Líder e Admin acessam via navegação padrão
- **D-03:** Blocos são cards expansíveis — clicar expande detalhes dentro do próprio dashboard (lista de cards relacionados)

### Layout mobile
- **D-04:** Blocos empilhados verticalmente em scroll: Resumo → Progressão → Por Separador → Rankings → Status Fardos. Full-width, sem colapsar

### Bloco Resumo Geral (DASH-01)
- **D-05:** 4 stat cards lado a lado com número grande + label pequeno: peças separadas | listas pendentes | concluídas | em atraso. Card "em atraso" em vermelho

### Bloco Progressão por Método de Envio (DASH-02)
- **D-06:** Uma linha por grupo de envio: badge com cor do marketplace + nome + barra de progresso + "X/Y peças" + contagem regressiva + badge de urgência. Mesmas cores e padrão de urgência do Phase 5 (verde >2h, amarelo <2h, vermelho atrasado)

### Bloco Top Separadores (DASH-03)
- **D-07:** Lista numerada com medalha (ouro/prata/bronze) para top 3. Cada linha: posição + nome + peças separadas + cards concluídos. Ordenado por peças (métrica principal)
- **D-08:** Filtro de período via Select dropdown dentro do header do bloco. Opções: Hoje, Últimos 15 dias, Últimos 30 dias, Mês atual, Último mês, Últimos 3 meses, Período personalizado (abre date picker). Aplica simultaneamente para Top Separadores e Top Fardistas

### Bloco Top Fardistas (DASH-04)
- **D-09:** Mesmo estilo do Top Separadores: lista numerada com medalhas, nome + fardos confirmados. Compartilha filtro de período com Top Separadores

### Bloco Status de Fardos (DASH-05)
- **D-10:** 3 contadores empilhados com cores:
  - PENDENTES (amarelo): fardos reservados que ainda não foram encontrados
  - ENCONTRADOS (azul): fardos com OK do fardista mas sem baixa — estão em trafego_fardos
  - BAIXADOS (verde): fardos entregues ao separador — estão em baixados

### Bloco Por Separador (DASH-06)
- **D-11:** Lista com barra de progresso por separador: nome + barra + percentual + "X/Y peças" + Nº de cards atribuídos. Ordenado por % conclusão

### Realtime (DASH-07)
- **D-12:** Queries agregadas (COUNT, SUM, GROUP BY) no Supabase client. Realtime subscription dispara re-fetch. Mesmo padrão do use-cards-realtime.ts

### Persistência histórica
- **D-13:** Snapshot diário antes da virada de dia (aproveita lógica existente do UPLD-08). Antes de limpar o banco, salvar dados na tabela historico_diario
- **D-14:** Schema do snapshot: uma linha por usuário por dia com totais por método de envio: user_id, role, grupo_envio, pecas_separadas, cards_concluidos, fardos_confirmados, data
- **D-15:** Tabela historico_diario NÃO é limpa na virada de dia — persiste indefinidamente

### Claude's Discretion
- Espaçamento e proporções exatas do layout assimétrico
- Animações de expansão dos blocos
- Skeleton loading durante carregamento inicial
- Tratamento de estados vazios (sem dados no dia)
- Estratégia de debounce para realtime updates

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — DASH-01 a DASH-07 definem os 6 blocos + realtime

### Padrões existentes
- `src/features/cards/hooks/use-cards-realtime.ts` — Padrão de Supabase realtime subscription multi-table
- `src/features/cards/components/progress-bar.tsx` — Componente de barra de progresso reutilizável
- `src/features/cards/components/order-card.tsx` — Padrão de card com urgência e badges
- `src/components/ui/progress.tsx` — shadcn/ui progress component
- `src/components/ui/collapsible.tsx` — shadcn/ui Collapsible para expansão de blocos
- `src/components/ui/select.tsx` — shadcn/ui Select para filtro de período

### Contexto de urgência e cores
- `.planning/phases/05-cards-e-ui-foundation/05-CONTEXT.md` — Cores por marketplace, badges de urgência, padrão de contagem regressiva

### Upload e virada de dia
- `src/features/upload/` — Lógica de virada de dia (UPLD-08) onde o snapshot histórico será inserido

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProgressBar` (`src/features/cards/components/progress-bar.tsx`): barra de progresso com cor de urgência — reutilizável para Progressão por Método e Por Separador
- `UrgencyBadge` com cores verde/amarelo/vermelho e animação pulse — reutilizável para Progressão
- `useCardsRealtime` hook: padrão de subscription multi-table com single channel — base para useDashboardRealtime
- shadcn/ui `Card`, `Badge`, `Progress`, `Collapsible`, `Select` — todos disponíveis

### Established Patterns
- Realtime: single Supabase channel com múltiplos `.on()` handlers para diferentes tabelas
- State: queries Supabase client-side com re-fetch on subscription event
- UI: design minimalista preto/branco, fonte Inter, cores por marketplace/urgência
- Cards: border-left colorida por urgência, padding confortável, sombra leve

### Integration Points
- AppShell: nova aba "Dashboard" para roles Líder e Admin
- Upload flow: inserir snapshot histórico antes da limpeza na virada de dia
- Tabelas do banco: pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados (leitura) + nova tabela historico_diario

</code_context>

<specifics>
## Specific Ideas

- Emojis de medalha (ouro/prata/bronze) nos rankings — referência visual clara para gamificação leve
- Status de fardos com cores específicas: amarelo (pendentes), azul (encontrados), verde (baixados) — não usar as cores de urgência aqui
- Filtro de período compartilhado entre Top Separadores e Top Fardistas (um Select controla ambos)
- Snapshot histórico aproveita o momento exato da virada de dia — sem cron jobs ou triggers extras

</specifics>

<deferred>
## Deferred Ideas

- **Layout personalizável com drag-and-drop** (Phase 9.1) — Blocos arrastáveis e redimensionáveis usando react-grid-layout ou @dnd-kit. Posição/tamanho salvo por usuário em localStorage ou banco. Handle de arraste no canto superior de cada bloco

</deferred>

---

*Phase: 09-dashboard*
*Context gathered: 2026-04-09*

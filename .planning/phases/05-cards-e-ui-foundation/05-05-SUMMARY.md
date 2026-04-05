---
plan: 05-05
phase: 05-cards-e-ui-foundation
status: completed
started: 2026-04-05T18:30:00Z
completed: 2026-04-05T20:15:00Z
duration: ~105min
tasks_completed: 3
tasks_total: 3
---

# Plan 05-05 Summary: Hooks Realtime e Wiring

## What was built

Hooks de dados (query, realtime, countdown), migration SQL para Realtime publication, e wiring completo nas páginas /prateleira e /fardos com dados reais do Supabase. Inclui ajustes visuais extensivos aprovados pelo usuário durante verificação interativa.

## Key Files

### Created
- `src/features/cards/hooks/use-countdown.ts` — Hook de contagem regressiva com intervalo 60s
- `src/features/cards/hooks/use-cards-realtime.ts` — Subscription Realtime para 4 tabelas
- `src/features/cards/hooks/use-card-data.ts` — Data fetching + filtro por role
- `src/features/cards/hooks/__tests__/use-countdown.test.ts` — 6 testes TDD para countdown
- `supabase/migrations/20260405_realtime_publication.sql` — Realtime publication migration
- `app/(authenticated)/prateleira/page.tsx` — Server component wrapper
- `app/(authenticated)/prateleira/prateleira-client.tsx` — Client component com KanbanBoard
- `app/(authenticated)/fardos/page.tsx` — Server component wrapper
- `app/(authenticated)/fardos/fardos-client.tsx` — Client component com filtro de fardos
- `src/features/cards/components/delete-card-modal.tsx` — Modal exclusão com PIN (visual only)

### Modified
- `src/components/layout/sidebar.tsx` — Sidebar recolhível (60px/240px) com hover/pin/localStorage
- `src/components/layout/app-shell.tsx` — Client component com marginLeft dinâmico
- `src/features/cards/lib/deadline-config.ts` — TYPE_ABBREV uppercase + chaves lowercase
- `src/features/cards/components/item-modal.tsx` — Redesign: borda lateral, PEGAR grande, print icon header, progress bar
- `src/features/cards/components/order-card.tsx` — Layout 5 linhas, botão lixeira admin/líder
- `src/features/cards/components/kanban-board.tsx` — CSS grid responsivo, props userRole/onDelete
- `src/features/cards/components/kanban-column.tsx` — min-w-0 grid, props userRole/onDelete
- `src/features/cards/components/completed-section.tsx` — Props userRole/onDelete
- `src/features/cards/components/marketplace-badge.tsx` — whitespace-nowrap

## Commits
- `b263650` test(05-05): add failing tests for useCountdown hook
- `828a813` feat(05-05): create useCountdown, useCardsRealtime, and useCardData hooks
- `acf70c0` feat(05-05): add realtime migration and wire prateleira/fardos pages
- `20e169e` feat(05-05): sidebar recolhível no desktop com hover/pin e localStorage
- `288fc0c` feat(05-05): ajustes visuais — print icon, uppercase tipos, progress modal, kanban grid
- `5bb5ab5` fix(05-05): print icon inline com título, grid uniforme, badge nowrap
- `af458b5` feat(05-05): layout item modal — SKU e quantidade na mesma linha
- `65dbba7` feat(05-05): redesign item modal — borda lateral, PEGAR grande, botões ícone
- `824ab3e` fix(05-05): ajustes visuais item modal — cores botões, SKU maior, fardo amarelo
- `4626155` fix(05-05): tipo pedido sempre uppercase — KIT, UNITÁRIO, COMBO
- `d9875d8` fix(05-05): card linha superior não corta botão atribuir
- `c362ee6` feat(05-05): reorganizar layout card — 5 linhas com cada elemento separado
- `19658d3` feat(05-05): botão excluir card (visual) + modal confirmação com PIN
- `ab7e5a9` docs(05-05): register deferred task — backend exclusão card para Phase 07
- `5b44728` fix(05-05): lixeira visível — zinc-400 default, red-500 hover, 14px
- `0cbd5b5` fix(05-05): thread userRole e onDelete através do kanban até OrderCard

## Deviations
- Sidebar recolhível adicionada (solicitação do usuário durante verificação)
- Múltiplos ajustes visuais no item modal e order card (iteração com usuário)
- DeleteCardModal (visual only) adicionado — backend deferred para Phase 07
- Kanban mudou de ScrollArea horizontal para CSS grid responsivo

## Deferred
- [Phase 07] Backend exclusão de card: verificação PIN bcrypt, exclusão pedidos/progresso, cancelamento reservas exclusivas de fardos, API route POST /api/cards/delete

## Self-Check: PASSED
- [x] All 3 tasks executed
- [x] Each task committed individually
- [x] Hooks com testes TDD (6 testes useCountdown)
- [x] Migration Realtime criada
- [x] Páginas /prateleira e /fardos wired com dados reais
- [x] Verificação visual aprovada pelo usuário

---
phase: 07-lista-de-prateleira-e-cascata
plan: 03
subsystem: frontend, prateleira-ui, fardos-ui
tags: [cascade-ui, prateleira-header, search, spinner, toast, cascata-badge]

requires:
  - phase: 07-lista-de-prateleira-e-cascata
    plan: 02
    provides: POST /api/prateleira/cascata route, realtime on transformacoes, is_cascata on fardos
provides:
  - Prateleira cascade handlers (Parcial calls /api/prateleira/cascata, NE calls cascade)
  - Full confirm via /api/cards/progress (PRAT-02)
  - PrateleiraHeader with counters and SKU search with 300ms debounce
  - Spinner in item-modal during cascade API call
  - Transformacao item fade-out animation
  - CASCATA orange badge on fardo-item component
  - Leader toast on cascade bale creation
  - Empty state for no prateleira cards
affects: [prateleira-page, fardos-page, item-modal]

tech-stack:
  added: []
  patterns: [debounced-search, loading-set-per-sku, fade-out-animation]

key-files:
  created:
    - src/features/prateleira/components/prateleira-header.tsx
  modified:
    - app/(authenticated)/prateleira/prateleira-client.tsx
    - src/features/cards/components/item-modal.tsx
    - src/features/fardos/components/fardo-item.tsx

key-decisions:
  - "loadingItems tracked as Set<string> of SKUs with cascade in-flight"
  - "Counters computed from all cards before search filtering (D-23)"
  - "filteredCards computed from debouncedSearch to avoid re-renders on each keystroke"
  - "Transformacao items fade out with 300ms CSS transition then removed from visible list"
  - "Leader cascade toast uses separate realtime channel prateleira-cascata-toast"

requirements-completed: [PRAT-01, PRAT-02, PRAT-03, PRAT-04, PRAT-06, PRAT-07, PRAT-08]

duration: 3min
completed: 2026-04-06
---

# Phase 7 Plan 3: Prateleira Cascade UI + Header + CASCATA Badge Summary

**Prateleira client wired with cascade API for Parcial/NE, PrateleiraHeader with counters and debounced SKU search, Loader2 spinner during cascade, transformacao fade-out, CASCATA badge on fardo-item, leader toast notification**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T22:23:53Z
- **Completed:** 2026-04-06T22:27:30Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- Replaced handleConfirmQuantity: full quantity calls /api/cards/progress (PRAT-02), partial quantity calls /api/prateleira/cascata with quantidade_confirmada (PRAT-03)
- Replaced handleNaoTem: calls cascade API with tipo=ne and quantidade_confirmada=0 (PRAT-04)
- Added loadingItems Set tracking SKUs with cascade in-flight, passed as loadingSkus prop to ItemModal
- ItemModal shows Loader2 spinner replacing Check/X buttons during cascade API call
- Items with status=transformacao filtered out with fade-out animation (opacity-0, h-0 over 300ms)
- Toast feedback: "Fardo alternativo reservado -- AGUARDAR FARDISTA" on found_alternative, "Sem fardo disponivel -- enviado para Transformacao" on transformacao
- Leader/admin gets realtime toast "Novo fardo de cascata adicionado -- atribuir fardista" via separate channel
- Created PrateleiraHeader component with sticky top bar, counter chips, and Search input with "Buscar por SKU..." placeholder
- Search debounced at 300ms, filters cards by SKU match
- Counters computed from all cards before filtering (totalPecas, separadas, pendentes, concluidos)
- Empty state with "Nenhum card de prateleira" message when no cards
- CASCATA orange badge added to fardo-item.tsx after existing status badges when is_cascata is true
- Print button (generateChecklist / Imprimir) preserved in item-modal.tsx per PRAT-08

## Task Commits

Each task was committed atomically:

1. **Task 1: Cascade handlers + spinner/fade** - `f446da7` (feat)
2. **Task 2: PrateleiraHeader + search + CASCATA badge** - `cc63ab7` (feat)
3. **Task 3: Visual verification** - PENDING (human-verify checkpoint)

## Files Created/Modified

- `src/features/prateleira/components/prateleira-header.tsx` - New component: sticky header with counters and SKU search input
- `app/(authenticated)/prateleira/prateleira-client.tsx` - Cascade handlers for Parcial/NE, PrateleiraHeader integration, debounced search, counters, empty state, leader toast
- `src/features/cards/components/item-modal.tsx` - Loader2 spinner during cascade, transformacao fade-out, loadingSkus prop
- `src/features/fardos/components/fardo-item.tsx` - CASCATA orange badge when is_cascata is true

## Decisions Made

- loadingItems tracked as Set of SKU strings for O(1) lookup in item-modal
- Counters computed from all cards before search filtering to show global totals (D-23)
- Debounced search uses separate state (searchTerm vs debouncedSearch) with 300ms setTimeout
- Transformacao items fade out via CSS transition-all duration-300 + opacity-0 h-0 overflow-hidden, then removed from visible list
- Leader cascade toast uses separate realtime channel (prateleira-cascata-toast) to avoid conflict with existing cards-realtime

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing tsc error in stock-parser.test.ts (missing posicao property) -- not caused by this plan, not fixed (out of scope)
- Pre-existing test failures in deadline-config.test.ts -- not caused by this plan, not fixed (out of scope)

## Checkpoint: Visual Verification Required

Task 3 is a human-verify checkpoint requiring visual verification of the complete cascade flow, header counters/search, spinner/toast behavior, transformacao fade-out, CASCATA badge on fardos, and print button functionality.

## Self-Check: PENDING

Self-check deferred until Task 3 (visual verification) is completed.

---
*Phase: 07-lista-de-prateleira-e-cascata*
*Completed: 2026-04-06 (Tasks 1-2)*

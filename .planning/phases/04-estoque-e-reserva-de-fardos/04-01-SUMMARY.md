---
phase: 04-estoque-e-reserva-de-fardos
plan: 01
subsystem: database, algorithm
tags: [subset-sum, dynamic-programming, postgresql, migration, typescript]

requires:
  - phase: 01-infraestrutura
    provides: Supabase schema com tabela reservas original
provides:
  - Migration SQL para schema reservas por SKU puro (sem pedido_id)
  - Tipos StockItem, SubsetResult, ReservationResult, StockSummary
  - Funcao pura findOptimalCombination com algoritmo subset sum DP
affects: [04-02, 04-03, 05, 06, 07]

tech-stack:
  added: []
  patterns: [subset-sum-dp, partial-unique-index, pure-function-algorithm]

key-files:
  created:
    - supabase/migrations/00003_alter_reservas_schema.sql
    - src/features/fardos/types.ts
    - src/features/fardos/utils/subset-sum.ts
    - src/features/fardos/utils/__tests__/subset-sum.test.ts
  modified: []

key-decisions:
  - "Algoritmo DP com Map<soma, DpEntry> ao inves de array 2D -- mais eficiente em memoria para somas esparsas"
  - "Cap de maxTarget em 10000 para prevenir tabela DP gigante (T-04-02)"

patterns-established:
  - "Pure function pattern: algoritmos de dominio isolados em utils/ sem side effects"
  - "TDD RED-GREEN-REFACTOR com commits separados para cada fase"

requirements-completed: [STOK-05, STOK-07]

duration: 2min
completed: 2026-04-05
---

# Phase 4 Plan 01: Migration e Subset Sum Summary

**Migration SQL remove pedido_id da tabela reservas (schema por SKU puro) e algoritmo subset sum DP encontra combinacao otima de fardos com margem 20% e desempate por menos fardos**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T14:22:22Z
- **Completed:** 2026-04-05T14:24:40Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Migration 00003 pronta: remove pedido_id FK, adiciona importacao_numero, partial unique index em codigo_in para impedir reserva duplicada
- Tipos do dominio fardos exportados (StockItem, SubsetResult, ReservationResult, StockSummary)
- Algoritmo findOptimalCombination com 13 testes passando: soma exata, por cima dentro de 20%, parcial, desempate por menos fardos, edge cases e threat mitigations

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration SQL e tipos do dominio fardos** - `e9b7c18` (feat)
2. **Task 2: TDD RED - testes do subset sum** - `7a8d470` (test)
3. **Task 2: TDD GREEN - implementacao do subset sum** - `e5aafda` (feat)

## Files Created/Modified
- `supabase/migrations/00003_alter_reservas_schema.sql` - Migration: drop pedido_id, add importacao_numero, partial unique index
- `src/features/fardos/types.ts` - Tipos StockItem, SubsetResult, ReservationResult, StockSummary
- `src/features/fardos/utils/subset-sum.ts` - Funcao pura findOptimalCombination (DP-based)
- `src/features/fardos/utils/__tests__/subset-sum.test.ts` - 13 testes unitarios do algoritmo

## Decisions Made
- Algoritmo DP com Map<soma, DpEntry> ao inves de array 2D -- eficiente para somas esparsas com 20-50 fardos
- Cap de maxTarget em 10000 (T-04-02) para prevenir tabela DP gigante em inputs maliciosos
- Fardos com quantidade <= 0 sao silenciosamente filtrados (T-04-01)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Migration pronta para `supabase db push` (sera executada no plano 04-03)
- Tipos exportados para consumo pelo stock-parser e reservation-engine (plano 04-02)
- findOptimalCombination pronta para ser chamada pelo reservation-engine (plano 04-02)

## Self-Check: PASSED

All 4 files exist. All 3 commits verified.

---
*Phase: 04-estoque-e-reserva-de-fardos*
*Completed: 2026-04-05*

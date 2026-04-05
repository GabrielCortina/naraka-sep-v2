---
phase: 06-lista-de-fardos
plan: 01
subsystem: database, api
tags: [supabase, migration, typescript, realtime, hooks]

# Dependency graph
requires:
  - phase: 04-reserva-de-fardos
    provides: reservas table schema, StockItem type, subset-sum algorithm
  - phase: 05-cards-e-ui-foundation
    provides: useCardsRealtime hook, atribuicoes table, card_key pattern
provides:
  - Migration 00005 with 12 new columns on trafego_fardos + 5 on fardos_nao_encontrados
  - FardoItem, FardoStatus, FardoFilters, FardoCounters type contracts
  - useFardosData hook with flat list, counters, role filter, realtime
affects: [06-02-PLAN (API routes), 06-03-PLAN (UI components), 07-cascata]

# Tech tracking
tech-stack:
  added: []
  patterns: [flat-list-from-joins, role-based-hook-filtering, counters-before-filtering]

key-files:
  created:
    - supabase/migrations/00005_trafego_fardos_campos.sql
    - src/features/fardos/hooks/use-fardos-data.ts
    - src/features/fardos/utils/__tests__/fardo-data.test.ts
  modified:
    - src/features/fardos/types.ts

key-decisions:
  - "Counters calculated from full list before role filtering (fardista sees global counts)"
  - "card_key derived from pedidos via SKU+importacao_numero lookup (not stored on reservas)"
  - "is_cascata defaults to false for all fardos in Phase 06 (cascata logic deferred to Phase 07)"

patterns-established:
  - "Pattern: counters-before-filtering - calculate aggregate counters before applying role/visibility filters"
  - "Pattern: flat-list-from-joins - build flat domain objects from parallel Supabase queries + Map lookups"

requirements-completed: [FARD-01, FARD-04]

# Metrics
duration: 4min
completed: 2026-04-05
---

# Phase 06 Plan 01: Data Foundation Summary

**Migration SQL with 12 trafego_fardos columns + domain types (FardoItem/FardoStatus/FardoFilters/FardoCounters) + useFardosData hook with role-filtered flat list and realtime**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T23:36:40Z
- **Completed:** 2026-04-05T23:40:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Migration 00005 adds 12 columns to trafego_fardos (stock sheet fields + clicked_at) and 5 columns to fardos_nao_encontrados with trafego_id nullable
- Four new type exports (FardoItem, FardoStatus, FardoFilters, FardoCounters) preserving all existing types
- useFardosData hook assembles flat FardoItem[] from 5 parallel Supabase queries with role-based filtering and realtime via useCardsRealtime

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration SQL e tipos do dominio fardos** - `94da612` (test: TDD RED), `c9ca237` (feat: migration + types GREEN)
2. **Task 2: Hook useFardosData com dados reais e realtime** - `fa2198f` (feat)

_Note: Task 1 followed TDD flow with separate RED/GREEN commits_

## Files Created/Modified
- `supabase/migrations/00005_trafego_fardos_campos.sql` - 12 new columns on trafego_fardos, index, 5 columns + nullable fix on fardos_nao_encontrados
- `src/features/fardos/types.ts` - Added FardoItem, FardoStatus, FardoFilters, FardoCounters (preserved existing types)
- `src/features/fardos/utils/__tests__/fardo-data.test.ts` - Type validation tests (4 tests)
- `src/features/fardos/hooks/use-fardos-data.ts` - Hook with flat list assembly, counters, role filter, realtime

## Decisions Made
- Counters calculated from full list before role filtering so fardista sees global progress counts
- card_key derived via pedidos lookup (SKU+importacao_numero) since reservas don't store card_key directly
- is_cascata defaults to false for all fardos (cascata logic is Phase 07 scope)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TS error in `stock-parser.test.ts` (missing `posicao` property) -- out of scope, not introduced by this plan
- Pre-existing test failure in `deadline-config.test.ts` (TYPE_ABBREV) -- out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Types and hook ready for Plan 02 (API routes for OK/N/E actions)
- Migration ready for `supabase db push` (will be applied with next deployment)
- Plan 03 (UI) can import useFardosData and all types directly

---
*Phase: 06-lista-de-fardos*
*Completed: 2026-04-05*

---
phase: 07-lista-de-prateleira-e-cascata
plan: 01
subsystem: database, algorithm
tags: [cascade, transformacao, supabase, vitest, tdd]

requires:
  - phase: 04-reserva-de-fardos
    provides: StockItem type, reserva system
  - phase: 05-cards-e-ui-foundation
    provides: calcProgress, CardItem, aggregateItems
provides:
  - findCascadeBales pure function with 4-priority cascade algorithm
  - transformacoes table migration with RLS and realtime
  - is_cascata column on trafego_fardos
  - calcProgress with transformacaoTotal parameter
  - CardItem status union with 'transformacao'
affects: [07-02-api-route, 07-03-frontend, prateleira]

tech-stack:
  added: []
  patterns: [cascade-4-priority-algorithm, transformacao-denominator-subtraction]

key-files:
  created:
    - supabase/migrations/00006_transformacoes_and_cascata.sql
    - src/features/prateleira/utils/cascade-engine.ts
    - src/features/prateleira/utils/__tests__/cascade-engine.test.ts
  modified:
    - src/features/cards/lib/card-utils.ts
    - src/features/cards/lib/__tests__/card-utils.test.ts
    - src/features/cards/types.ts

key-decisions:
  - "Cascade algorithm uses 4 priorities without 20% rule (D-06): closest single > any single > greedy multi > transformacao"
  - "calcProgress transformacaoTotal parameter defaults to 0 for full backward compatibility"
  - "aggregateItems status priority: nao_encontrado > transformacao > separado > parcial > pendente"

patterns-established:
  - "Cascade 4-priority: closeness sort for single bale, greedy desc for multi-bale, remainder to transformacao"
  - "Optional parameter with default 0 for backward-compatible function extension"

requirements-completed: [PRAT-03, PRAT-04, PRAT-05]

duration: 3min
completed: 2026-04-06
---

# Phase 7 Plan 1: Cascade Engine + Transformacao Migration Summary

**4-priority cascade algorithm (findCascadeBales) with TDD, transformacoes table migration, and calcProgress updated to exclude transformation pieces from denominator**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T22:06:38Z
- **Completed:** 2026-04-06T22:09:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created findCascadeBales pure function implementing 4-priority cascade algorithm with 8 passing tests
- Created database migration for transformacoes table with RLS (read-only for authenticated, full for service_role) and realtime publication
- Added is_cascata boolean column to trafego_fardos table
- Updated calcProgress to subtract transformacao pieces from denominator (D-21), fully backward compatible
- Added 'transformacao' to CardItem status union and aggregateItems status priority chain

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration SQL + cascade engine types** - `35b298e` (feat)
2. **Task 2: Update calcProgress + CardItem transformacao status** - `f652e5e` (feat)

_TDD flow: tests written first (RED), implementation second (GREEN), no refactor needed._

## Files Created/Modified
- `supabase/migrations/00006_transformacoes_and_cascata.sql` - transformacoes table, is_cascata column, RLS, realtime
- `src/features/prateleira/utils/cascade-engine.ts` - findCascadeBales with 4-priority algorithm
- `src/features/prateleira/utils/__tests__/cascade-engine.test.ts` - 8 tests covering all priorities and exclusion sets
- `src/features/cards/lib/card-utils.ts` - calcProgress with transformacaoTotal param, aggregateItems with transformacao status
- `src/features/cards/lib/__tests__/card-utils.test.ts` - 3 new tests for transformacao progress calculation
- `src/features/cards/types.ts` - 'transformacao' added to CardItem status union

## Decisions Made
- Cascade algorithm uses closeness sort for single-bale selection (Priority 1/2), greedy descending for multi-bale (Priority 3)
- No 20% rule in cascade (per D-06) -- distinct from original subset sum reservation algorithm
- transformacaoTotal defaults to 0 so all existing callers work without changes
- aggregateItems sets 'transformacao' status only when ALL statuses are transformacao (not partial)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing tsc error in `stock-parser.test.ts` (missing `posicao` property) -- not caused by this plan, not fixed (out of scope)
- Pre-existing test failures in `deadline-config.test.ts` -- not caused by this plan, not fixed (out of scope)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Cascade engine ready for Plan 02 (API route) to import and use
- Migration SQL ready for schema push
- calcProgress ready for Plan 03 (frontend) to pass transformacaoTotal from API data

## Self-Check: PASSED

- All 6 files exist on disk
- Both commits found in git log (35b298e, f652e5e)
- CREATE TABLE transformacoes present in migration
- is_cascata BOOLEAN present in migration
- findCascadeBales export confirmed
- CascadeResult interface export confirmed
- transformacaoTotal parameter confirmed in calcProgress
- 'transformacao' status confirmed in CardItem types
- No findOptimalCombination function in cascade engine (only doc comment reference)

---
*Phase: 07-lista-de-prateleira-e-cascata*
*Completed: 2026-04-06*

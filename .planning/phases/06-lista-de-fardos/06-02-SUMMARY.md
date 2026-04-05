---
phase: 06-lista-de-fardos
plan: 02
subsystem: api
tags: [google-sheets, supabase, subset-sum, tdd, vitest]

# Dependency graph
requires:
  - phase: 06-lista-de-fardos
    provides: Migration 00005 (trafego_fardos + fardos_nao_encontrados columns), FardoItem/FardoStatus types
  - phase: 04-reserva-de-fardos
    provides: subset-sum algorithm, StockItem type, stock-parser, reservation-engine
provides:
  - POST /api/fardos/ok route with full OK flow (sheet lookup, trafego insert, double verify, clear F+)
  - POST /api/fardos/ne route with alternative search or shelf release
  - findBaleInSheet, mapRowToTrafegoFields, validateRowMatch pure functions
  - findAlternativeBale pure function with cascata parameter for Phase 7
affects: [06-03-PLAN (UI components), 07-cascata, 08-baixa]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-handler-extraction, double-verification-before-delete, insert-before-clear-transactional]

key-files:
  created:
    - src/features/fardos/utils/fardo-ok-handler.ts
    - src/features/fardos/utils/fardo-ne-handler.ts
    - src/features/fardos/utils/__tests__/fardo-ok.test.ts
    - src/features/fardos/utils/__tests__/fardo-ne.test.ts
    - src/app/api/fardos/ok/route.ts
    - src/app/api/fardos/ne/route.ts
  modified: []

key-decisions:
  - "Reserva status not updated to 'encontrado' in OK flow — DB CHECK constraint only allows 'reservado'|'cancelado'; encontrado tracked via trafego_fardos"
  - "Insert data cast as any for trafego_fardos and fardos_nao_encontrados — migration 00005 columns not in generated types yet"
  - "Duplicate OPERADOR header handled via indexOf/lastIndexOf for first (col K) and second (col N) occurrence"

patterns-established:
  - "Pattern: pure-handler-extraction - extract testable pure functions from API routes for unit testing"
  - "Pattern: double-verification-before-delete - re-read row and validate before clearing sheet data (race condition prevention)"
  - "Pattern: insert-before-clear-transactional - always insert to DB first, then clear sheet; never rollback DB on sheet failure (D-18)"

requirements-completed: [FARD-02, FARD-03]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 06 Plan 02: API Routes OK/NE Summary

**API routes for fardo OK (sheet lookup + trafego insert + double verify + clear F+) and N/E (alternative search via subset sum or shelf release) with TDD-tested pure handlers**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-05T23:42:19Z
- **Completed:** 2026-04-05T23:47:33Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Pure handler functions (findBaleInSheet, mapRowToTrafegoFields, validateRowMatch, findAlternativeBale) tested with 11 unit tests
- POST /api/fardos/ok with full transactional flow: duplicate prevention, sheet lookup, trafego insert, double verification, clear columns F+
- POST /api/fardos/ne with alternative bale search via subset sum, shelf release for blocked pedidos, N/E registration

## Task Commits

Each task was committed atomically:

1. **Task 1: Fluxo OK handler + API route** - `e7778de` (feat)
2. **Task 2: Fluxo N/E handler + API route** - `f3e9d12` (feat)

_Both tasks followed TDD flow (RED: module not found, GREEN: implementation passes)_

## Files Created/Modified
- `src/features/fardos/utils/fardo-ok-handler.ts` - Pure functions: findBaleInSheet, mapRowToTrafegoFields, validateRowMatch with NFD normalization
- `src/features/fardos/utils/__tests__/fardo-ok.test.ts` - 7 tests covering sheet search, field mapping, race condition validation
- `src/app/api/fardos/ok/route.ts` - API POST with auth, duplicate check, sheet lookup, trafego insert, double verify, clear F+
- `src/features/fardos/utils/fardo-ne-handler.ts` - Pure function: findAlternativeBale with subset sum and isCascata parameter
- `src/features/fardos/utils/__tests__/fardo-ne.test.ts` - 4 tests covering alternative search, reserved filtering, no-match scenarios
- `src/app/api/fardos/ne/route.ts` - API POST with auth, alternative search, reservation cancel, N/E registration, shelf release

## Decisions Made
- Reserva status not updated to 'encontrado' in OK flow because DB CHECK constraint only allows 'reservado'|'cancelado' -- the encontrado status is tracked via trafego_fardos table instead (Rule 1 auto-fix)
- Insert data cast as `any` for migration 00005 columns not yet in generated Supabase types
- Duplicate OPERADOR header in sheet handled via indexOf (col K) / lastIndexOf (col N)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Skipped reserva status update to 'encontrado' in OK flow**
- **Found during:** Task 1 (API route implementation)
- **Issue:** Plan step 8 called for `reservas.update({ status: 'encontrado' })` but DB CHECK constraint only allows 'reservado' or 'cancelado'
- **Fix:** Removed the reserva status update; 'encontrado' is tracked via trafego_fardos.status instead
- **Files modified:** src/app/api/fardos/ok/route.ts
- **Verification:** tsc --noEmit passes, logic is correct since trafego_fardos already records the encontrado state
- **Committed in:** e7778de

**2. [Rule 1 - Bug] Null-safe importacao_numero in N/E pedidos query**
- **Found during:** Task 2 (API route implementation)
- **Issue:** reserva.importacao_numero can be null (nullable column from migration 00003), but .eq() requires non-null
- **Fix:** Conditional query builder: only add .eq('importacao_numero', ...) when value is not null
- **Files modified:** src/app/api/fardos/ne/route.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** f3e9d12

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness against actual DB schema. No scope creep.

## Issues Encountered

- Pre-existing TS error in `stock-parser.test.ts` (missing `posicao` property) -- out of scope, not introduced by this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- API routes ready for Plan 03 (UI components) to wire fardo OK/NE buttons
- findAlternativeBale prepared for Phase 7 cascata with isCascata parameter
- All handlers pure and testable, no external dependencies in unit tests

---
*Phase: 06-lista-de-fardos*
*Completed: 2026-04-05*

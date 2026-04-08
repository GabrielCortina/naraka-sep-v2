---
phase: 08-baixa-de-fardos
plan: 01
subsystem: api
tags: [supabase, next-api-routes, baixa, trafego, migration]

# Dependency graph
requires:
  - phase: 06-lista-de-fardos
    provides: "trafego_fardos table, reservas, OK/NE flow, auth pattern"
  - phase: 05-cards-e-ui-foundation
    provides: "progresso table, pedidos, atribuicoes, card_key system"
provides:
  - "Migration adding 'baixado' status to trafego_fardos CHECK constraint"
  - "UNIQUE constraint on baixados.codigo_in for duplicate prevention"
  - "GET /api/baixa/buscar endpoint for fardo lookup by codigo_in"
  - "POST /api/baixa/confirmar endpoint for 3-step baixa execution"
  - "GET /api/baixa/hoje endpoint for today's baixados with entregas"
  - "BaixaFardoResult, EntregaInfo, BaixadoItem types"
  - "getMarketplaceColor utility function"
affects: [08-baixa-de-fardos, dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: ["lookup chain: trafego -> reservas -> pedidos -> atribuicoes -> users", "3-step DB mutation with rollback awareness"]

key-files:
  created:
    - supabase/migrations/00009_baixa_status.sql
    - src/features/baixa/lib/baixa-utils.ts
    - src/features/baixa/lib/__tests__/baixa-utils.test.ts
    - app/api/baixa/buscar/route.ts
    - app/api/baixa/confirmar/route.ts
    - app/api/baixa/hoje/route.ts
  modified:
    - src/types/index.ts

key-decisions:
  - "BaixadoItem type added for hoje endpoint (not in plan but needed for type safety)"

patterns-established:
  - "Baixa lookup chain: trafego_fardos -> reservas -> pedidos -> atribuicoes for entregas resolution"
  - "Duplicate guard pattern: check baixados table + DB UNIQUE constraint as double protection"

requirements-completed: [BAIX-04, BAIX-05, BAIX-06]

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 08 Plan 01: Baixa Backend Summary

**Migration adding 'baixado' status, baixa utility module with marketplace colors, and three API routes (buscar/confirmar/hoje) implementing full fardo discharge flow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-08T21:34:07Z
- **Completed:** 2026-04-08T21:37:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Migration 00009 adds 'baixado' to trafego_fardos CHECK constraint and UNIQUE on baixados.codigo_in
- GET /api/baixa/buscar returns full fardo details with separadores lookup chain (trafego -> reservas -> pedidos -> atribuicoes -> users)
- POST /api/baixa/confirmar executes 3-step baixa: insert baixados, update trafego to 'baixado', unlock aguardar_fardista progresso lines
- GET /api/baixa/hoje returns BaixadoItem[] with full entregas data for BAIXADOS HOJE display
- getMarketplaceColor utility with 6 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration, types, and utility module with tests** - `95582ff` (feat)
2. **Task 2: API route handlers for buscar, confirmar, and hoje** - `894e10e` (feat)

## Files Created/Modified
- `supabase/migrations/00009_baixa_status.sql` - ALTER CHECK constraint, UNIQUE on baixados, RLS policies, realtime publication
- `src/types/index.ts` - Added 'baixado' to StatusTrafego union type
- `src/features/baixa/lib/baixa-utils.ts` - BaixaFardoResult, EntregaInfo, BaixadoItem types + getMarketplaceColor
- `src/features/baixa/lib/__tests__/baixa-utils.test.ts` - 6 tests for getMarketplaceColor
- `app/api/baixa/buscar/route.ts` - GET endpoint: fardo lookup with 409/404 responses
- `app/api/baixa/confirmar/route.ts` - POST endpoint: 3-step baixa with duplicate protection
- `app/api/baixa/hoje/route.ts` - GET endpoint: today's baixados with entregas

## Decisions Made
- Added BaixadoItem type to baixa-utils for type safety in hoje endpoint (not explicitly in plan but needed)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing tsc error in stock-parser.test.ts (missing posicao property) -- unrelated to this plan's changes, not fixed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three API routes ready for UI integration in plans 08-02 and 08-03
- Migration ready to be applied to Supabase instance

## Self-Check: PASSED

All 8 files verified present. Both task commits (95582ff, 894e10e) verified in git log.

---
*Phase: 08-baixa-de-fardos*
*Completed: 2026-04-08*

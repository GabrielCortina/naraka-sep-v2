---
phase: 07-lista-de-prateleira-e-cascata
plan: 02
subsystem: api, hooks, realtime
tags: [cascade, api-route, transformacao, realtime, hooks]

requires:
  - phase: 07-lista-de-prateleira-e-cascata
    plan: 01
    provides: findCascadeBales, transformacoes migration, calcProgress with transformacaoTotal
  - phase: 06-lista-de-fardos
    provides: /api/fardos/ne route, use-fardos-data hook
provides:
  - POST /api/prateleira/cascata route for cascade flow orchestration
  - Updated /api/fardos/ne with cascade chain support (D-09/D-10/D-11)
  - Realtime subscription on transformacoes table
  - useCardData with transformacao-adjusted progress
  - use-fardos-data reading is_cascata from DB
affects: [07-03-frontend, prateleira-ui, fardos-ui]

tech-stack:
  added: []
  patterns: [cascade-chain-ne, select-then-insert-update-progresso, as-any-migration-types]

key-files:
  created:
    - app/api/prateleira/cascata/route.ts
  modified:
    - app/api/fardos/ne/route.ts
    - src/features/cards/hooks/use-cards-realtime.ts
    - src/features/cards/hooks/use-card-data.ts
    - src/features/fardos/hooks/use-fardos-data.ts

key-decisions:
  - "N/E registration moved BEFORE alternative search in fardos/ne (ensures D-10 exclusion)"
  - "Cascade chain returns transformacao:true when no bales left (D-11)"
  - "transformacoes table queried with as-any cast since generated types not yet updated"
  - "Progresso status for Parcial with both bales AND transformacao stays 'parcial' (single row per pedido)"

patterns-established:
  - "Cascade chain: detect is_cascata on trafego_fardos -> findCascadeBales -> reserve/transformacao"
  - "as-any cast pattern for migration columns not yet in generated Supabase types"

requirements-completed: [PRAT-05, PRAT-06]

duration: 5min
completed: 2026-04-06
---

# Phase 7 Plan 2: Cascade API Route + NE Cascade Chain + Hook Updates Summary

**POST /api/prateleira/cascata orchestrates full cascade flow; /api/fardos/ne updated with cascade chain support using findCascadeBales; realtime and data hooks wired for transformacoes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T22:12:32Z
- **Completed:** 2026-04-06T22:17:14Z
- **Tasks:** 2 of 3 (Task 3 is human-action checkpoint)
- **Files modified:** 5

## Accomplishments
- Created POST /api/prateleira/cascata route with auth, validation, stock search, bale reservation, trafego_fardos creation with is_cascata=true, and transformacao registration
- Updated /api/fardos/ne to detect cascade bales via is_cascata on trafego_fardos and use findCascadeBales for cascade chain (D-09)
- Each NE in cascade chain registers in fardos_nao_encontrados before searching to prevent loops (D-10)
- When cascade chain exhausts all bales, creates transformacao record (D-11)
- Non-cascade NE flow preserved with existing findAlternativeBale
- Added transformacoes table to realtime subscription channel
- useCardData now fetches transformacoes and passes totals to calcProgress per card_key
- use-fardos-data select now includes is_cascata column and reads from DB instead of hardcoding false

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/prateleira/cascata route + update hooks** - `07ae7d7` (feat)
2. **Task 2: Update /api/fardos/ne for cascade chain** - `484d094` (feat)
3. **Task 3: Schema push** - PENDING (human-action checkpoint)

## Files Created/Modified
- `app/api/prateleira/cascata/route.ts` - Full cascade POST route with auth, validation, stock search, reserve, trafego, transformacao
- `app/api/fardos/ne/route.ts` - Cascade chain detection and findCascadeBales integration, NE registration before search
- `src/features/cards/hooks/use-cards-realtime.ts` - Added transformacoes table to realtime channel
- `src/features/cards/hooks/use-card-data.ts` - Fetch transformacoes, build card_key totals map, pass to calcProgress
- `src/features/fardos/hooks/use-fardos-data.ts` - Select is_cascata from trafego_fardos, read via trafegoMap

## Decisions Made
- N/E registration moved before alternative search in both cascade and non-cascade paths (ensures D-10 exclusion before findCascadeBales runs)
- Cascade chain on NE returns `{ found_alternative: false, transformacao: true }` when no bales left (D-11)
- Used `as any` casts for transformacoes table and is_cascata column queries since generated types not updated until schema push
- Progresso status when both cascade bales AND transformacao occur stays 'parcial' (single progresso row per pedido_id)
- quantidade_confirmada distributed evenly across pedido_ids for Parcial flow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing tsc error in `stock-parser.test.ts` (missing `posicao` property) -- not caused by this plan, not fixed (out of scope)
- Pre-existing test failures in `deadline-config.test.ts` -- not caused by this plan, not fixed (out of scope)
- Supabase generated types do not include transformacoes table or is_cascata column -- worked around with `as any` casts until schema push + type regeneration

## Checkpoint: Schema Push Required

Task 3 is a human-action checkpoint requiring `npx supabase db push` with SUPABASE_ACCESS_TOKEN. This must be done by the user before the plan can be marked fully complete.

## Self-Check: PENDING

Self-check deferred until Task 3 (schema push) is completed.

---
*Phase: 07-lista-de-prateleira-e-cascata*
*Completed: 2026-04-06 (Tasks 1-2)*

---
phase: 05-cards-e-ui-foundation
plan: 06
subsystem: api, database
tags: [supabase, rls, next-api-routes, server-validation]

requires:
  - phase: 01-infraestrutura
    provides: Supabase schema with progresso and atribuicoes tables, RLS enabled
  - phase: 02-autenticacao
    provides: Custom Access Token Hook injects user_role in JWT, getUser() auth pattern
  - phase: 05-cards-e-ui-foundation (plan 01)
    provides: Card types (CardData, CardItem)

provides:
  - RLS INSERT/UPDATE policies on progresso for authenticated users
  - RLS INSERT/UPDATE/DELETE policies on atribuicoes for lider/admin via JWT claim
  - POST /api/cards/progress endpoint with server-side quantity and status validation
  - POST /api/cards/assign endpoint with role verification and target user validation

affects: [05-cards-e-ui-foundation-plan-05, 06-separacao, 07-fardos]

tech-stack:
  added: []
  patterns: [select-then-insert/update for tables without UNIQUE constraint, admin client for write operations bypassing RLS]

key-files:
  created:
    - supabase/migrations/00004_rls_write_policies.sql
    - src/app/api/cards/progress/route.ts
    - src/app/api/cards/assign/route.ts
  modified: []

key-decisions:
  - "Select-then-insert/update pattern for progresso (no UNIQUE on pedido_id) instead of upsert"
  - "supabaseAdmin singleton import instead of createAdminClient() factory (matches existing codebase pattern)"

patterns-established:
  - "API route auth pattern: createClient() -> getUser() -> role check via admin DB lookup"
  - "Write operations use supabaseAdmin (service_role) not browser client"

requirements-completed: [CARD-06, CARD-03]

duration: 2min
completed: 2026-04-05
---

# Phase 5 Plan 6: RLS Write Policies and Card API Routes Summary

**RLS write policies for progresso/atribuicoes and two API route handlers with server-side validation for card progress and assignment operations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T18:10:24Z
- **Completed:** 2026-04-05T18:12:13Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- 5 RLS write policies: INSERT/UPDATE on progresso (authenticated), INSERT/UPDATE/DELETE on atribuicoes (lider/admin via JWT claim)
- POST /api/cards/progress validates quantity bounds (>= 0, <= pedido.quantidade), status whitelist, pedido existence
- POST /api/cards/assign verifies caller role (lider/admin), validates tipo (separador/fardista), checks target user exists and is active with matching role
- All 4 threat mitigations (T-05-09 through T-05-12) applied

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration RLS write policies** - `0d971a0` (feat)
2. **Task 2: API route handlers** - `a647166` (feat)

## Files Created/Modified
- `supabase/migrations/00004_rls_write_policies.sql` - 5 RLS policies for card write operations
- `src/app/api/cards/progress/route.ts` - POST endpoint for confirming quantity and marking N/E status
- `src/app/api/cards/assign/route.ts` - POST endpoint for assigning users to cards with role checks

## Decisions Made
- **Select-then-insert/update for progresso:** Table has no UNIQUE constraint on pedido_id, so upsert with onConflict is not possible. Used select + conditional insert/update pattern instead.
- **supabaseAdmin singleton:** Existing codebase exports `supabaseAdmin` as singleton, not `createAdminClient()` factory. Followed existing pattern.
- **Async createClient():** Server client `createClient()` is async (awaits cookies()), adjusted from plan's synchronous call pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted imports to match actual codebase exports**
- **Found during:** Task 2 (API route handlers)
- **Issue:** Plan referenced `createAdminClient()` and `createServerClient()` which don't exist. Actual exports: `supabaseAdmin` and `createClient()`
- **Fix:** Used correct imports matching the existing codebase
- **Files modified:** src/app/api/cards/progress/route.ts, src/app/api/cards/assign/route.ts
- **Verification:** tsc --noEmit passes (no errors in new files)
- **Committed in:** a647166

**2. [Rule 1 - Bug] Used select+insert/update instead of upsert for progresso**
- **Found during:** Task 2 (API route handlers)
- **Issue:** Plan noted progresso has no UNIQUE on pedido_id; upsert with onConflict would fail
- **Fix:** Select existing row first, then insert or update accordingly
- **Files modified:** src/app/api/cards/progress/route.ts
- **Verification:** Code logic is correct for both insert and update paths
- **Committed in:** a647166

**3. [Rule 2 - Missing Critical] Added JSON parse error handling**
- **Found during:** Task 2 (API route handlers)
- **Issue:** Plan did not include try/catch for request.json() which throws on invalid body
- **Fix:** Wrapped request.json() in try/catch returning 400
- **Files modified:** src/app/api/cards/progress/route.ts, src/app/api/cards/assign/route.ts
- **Committed in:** a647166

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Pre-existing tsc error in stock-parser.test.ts (missing `posicao` property) -- out of scope, not caused by this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 05-05 can now consume /api/cards/progress and /api/cards/assign endpoints
- RLS policies ready for deployment via supabase db push

## Self-Check: PASSED

All 3 created files verified on disk. Both task commits (0d971a0, a647166) found in git log.

---
*Phase: 05-cards-e-ui-foundation*
*Completed: 2026-04-05*

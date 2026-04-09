---
phase: 09-dashboard
plan: 02
subsystem: ui
tags: [react-hooks, supabase-realtime, dashboard, debounce]

requires:
  - phase: 09-dashboard-01
    provides: "DashboardData types, compute* aggregation functions, date-utils, historico_diario table"
provides:
  - "useDashboardData hook for parallel data fetching and aggregation"
  - "useDashboardRealtime hook with 300ms debounced 5-table subscription"
  - "usePeriodFilter hook for period state and date range computation"
affects: [09-dashboard-03, 09-dashboard-04]

tech-stack:
  added: []
  patterns: ["debounced realtime subscription via useRef+setTimeout", "historical vs live data source switching based on period filter"]

key-files:
  created:
    - src/features/dashboard/hooks/use-dashboard-data.ts
    - src/features/dashboard/hooks/use-dashboard-realtime.ts
    - src/features/dashboard/hooks/use-period-filter.ts
  modified: []

key-decisions:
  - "historico_diario accessed via (supabase as any) cast since table not in generated types yet"
  - "Live blocks (resumo, progressao, statusFardos, porSeparador) always from live tables; only rankings switch to historical"
  - "300ms debounce on realtime prevents excessive re-fetches from rapid DB events"

patterns-established:
  - "Dashboard hook pattern: parallel fetch -> compute blocks -> realtime subscription"
  - "Period-aware data source: isHistorical flag switches ranking queries between live tables and historico_diario"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07]

duration: 2min
completed: 2026-04-09
---

# Phase 9 Plan 02: Dashboard Hooks Summary

**Three React hooks for dashboard data: parallel 6-table fetch with aggregation, 5-table realtime subscription with 300ms debounce, and period filter state managing live/historical data source switching**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T18:19:55Z
- **Completed:** 2026-04-09T18:21:35Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- useDashboardRealtime subscribes to 5 tables on single channel with 300ms debounce to prevent DoS from rapid events
- usePeriodFilter manages 7 period options with computed date ranges and isHistorical flag
- useDashboardData fetches all 6 tables in parallel, computes all 6 dashboard blocks, and switches rankings between live/historical based on period filter

## Task Commits

Each task was committed atomically:

1. **Task 1: Realtime subscription hook and period filter hook** - `fa5c562` (feat)
2. **Task 2: Main dashboard data hook with parallel fetching and aggregation** - `b185d65` (feat)

## Files Created/Modified
- `src/features/dashboard/hooks/use-dashboard-realtime.ts` - Supabase realtime subscription with debounce for 5 dashboard tables
- `src/features/dashboard/hooks/use-period-filter.ts` - Period filter state management with date range computation
- `src/features/dashboard/hooks/use-dashboard-data.ts` - Main data hook: parallel fetch, 6-block aggregation, live/historical ranking switch

## Decisions Made
- Used `(supabase as any).from('historico_diario')` pattern because historico_diario table is not yet in generated database types (migration created in Plan 01, types regeneration pending)
- Live data blocks (resumo, progressao, statusFardos, porSeparador) always come from live tables since they reflect today's operation; only rankings (topSeparadores, topFardistas) switch between live and historical
- 300ms debounce chosen for realtime to balance responsiveness vs excessive refetches (per Research Pitfall 2 and threat T-09-05)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cast historico_diario query to bypass missing generated types**
- **Found during:** Task 2
- **Issue:** `supabase.from('historico_diario')` fails tsc because table not in Database type
- **Fix:** Used `(supabase as any).from('historico_diario')` with explicit `HistoricoDiarioRow[]` cast on results, matching existing pattern for `transformacoes`
- **Files modified:** src/features/dashboard/hooks/use-dashboard-data.ts
- **Verification:** tsc --noEmit passes (only pre-existing unrelated error in stock-parser.test.ts)
- **Committed in:** b185d65

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Standard workaround for ungenerated types, consistent with existing codebase pattern. No scope creep.

## Issues Encountered
None beyond the type generation issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three hooks ready for consumption by dashboard UI components (Plan 03)
- useDashboardData exports { data, loading, error, refetch } for UI binding
- usePeriodFilter exports all state setters for period selector component

---
*Phase: 09-dashboard*
*Completed: 2026-04-09*

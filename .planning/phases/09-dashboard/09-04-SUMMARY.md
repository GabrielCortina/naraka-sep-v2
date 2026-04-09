---
phase: 09-dashboard
plan: 04
subsystem: database-migrations, upload-api
tags: [bugfix, migration, snapshot, realtime]
dependency_graph:
  requires: [09-01]
  provides: [safe-migration-00012, snapshot-empty-guard]
  affects: [supabase-schema-push, upload-virada-de-dia]
tech_stack:
  added: []
  patterns: [empty-database-guard, fk-cascade-documentation]
key_files:
  created: []
  modified:
    - supabase/migrations/00012_realtime_baixados_pedidos.sql
    - app/api/upload/route.ts
decisions:
  - "Remove baixados from migration 00012 since already present in 00009"
  - "Use snapProgresso.data.length > 0 as empty-database guard for snapshot"
  - "Use ?? [] for optional snapshot arrays (atribuicoes, baixados) instead of requiring all data"
metrics:
  duration: 1min
  completed: "2026-04-09"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 2
---

# Phase 09 Plan 04: Fix Migration 00012 and Harden Snapshot Guard Summary

Removed duplicate baixados from realtime migration 00012 (already in 00009) and added empty-database guard to snapshot logic in upload route to prevent zero-value historico_diario rows on first-ever use.

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix migration 00012 and harden snapshot guard | 57d3ab8 | supabase/migrations/00012_realtime_baixados_pedidos.sql, app/api/upload/route.ts |

## Changes Made

### Migration 00012 Fix
- Removed `ALTER PUBLICATION supabase_realtime ADD TABLE baixados` which would cause PostgreSQL error since baixados was already added in migration 00009_baixa_status.sql
- Added comment explaining why baixados is excluded (references 00009)
- Kept only `ALTER PUBLICATION supabase_realtime ADD TABLE pedidos`

### Snapshot Empty-Database Guard
- Changed condition from `snapPedidos.data && snapProgresso.data && snapAtrib.data && snapBaixados.data && snapUsers.data` to `snapPedidos.data && snapProgresso.data && snapProgresso.data.length > 0 && snapUsers.data`
- The `length > 0` check prevents snapshot execution when database has no work data (first-ever use or empty day)
- Changed `snapAtrib.data` and `snapBaixados.data` from required to optional with `?? []` fallback (these can be empty on valid work days)
- Added FK cascade warning comment documenting that deleting reservas CASCADE-deletes trafego_fardos and that snapshot must run before deletes

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Optional arrays for snapshot**: Changed atribuicoes and baixados from required (`snapAtrib.data`) to optional (`snapAtrib.data ?? []`) in the snapshot guard condition. This is safer because a day could have progresso data but no atribuicoes or baixados yet.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|-----------|
| T-09-08 | Removed duplicate baixados from 00012; verified against 00009 |

## Self-Check: PASSED

- [x] supabase/migrations/00012_realtime_baixados_pedidos.sql exists
- [x] app/api/upload/route.ts exists
- [x] .planning/phases/09-dashboard/09-04-SUMMARY.md exists
- [x] Commit 57d3ab8 found in git log

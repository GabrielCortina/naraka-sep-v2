---
phase: 9
slug: dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/features/dashboard/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/features/dashboard/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | DASH-01 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "resumo"` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | DASH-02 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "progressao"` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | DASH-03 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "separadores"` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 1 | DASH-04 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "fardistas"` | ❌ W0 | ⬜ pending |
| 09-01-05 | 01 | 1 | DASH-05 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "status fardos"` | ❌ W0 | ⬜ pending |
| 09-01-06 | 01 | 1 | DASH-06 | — | N/A | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "por separador"` | ❌ W0 | ⬜ pending |
| 09-01-07 | 01 | 1 | DASH-07 | — | N/A | manual-only | Manual: verify dashboard updates when another user modifies data | N/A | ⬜ pending |
| 09-01-08 | 01 | 1 | D-13 | — | RLS blocks client writes | unit | `npx vitest run src/features/dashboard/lib/__tests__/snapshot.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-09 | 01 | 1 | D-08 | — | Date range validation | unit | `npx vitest run src/features/dashboard/lib/__tests__/date-utils.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/dashboard/lib/__tests__/dashboard-queries.test.ts` — stubs for DASH-01 through DASH-06
- [ ] `src/features/dashboard/lib/__tests__/snapshot.test.ts` — covers D-13 snapshot aggregation
- [ ] `src/features/dashboard/lib/__tests__/date-utils.test.ts` — covers D-08 period filter date ranges

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Realtime subscription fires re-fetch | DASH-07 | Requires two browser sessions to verify subscription triggers | 1. Open dashboard in browser A. 2. In browser B, modify progresso data. 3. Verify browser A dashboard updates within 2 seconds without page refresh |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

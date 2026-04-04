---
phase: 01
slug: infraestrutura
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-04
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build verification (no unit tests — pure infrastructure phase) |
| **Config file** | N/A |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Build must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 01-01-01 | 01 | 1 | SETUP-01 | — | N/A | build | `npm run build` | ⬜ pending |
| 01-02-01 | 02 | 2 | SETUP-02 | T-01-05 | RLS enabled on all 9 tables | build | `npm run build` | ⬜ pending |
| 01-02-02 | 02 | 2 | SETUP-04 | T-01-04 | Service account key server-only | build | `npm run build` | ⬜ pending |
| 01-03-01 | 03 | 3 | SETUP-02, SETUP-03 | T-01-08 | Env vars in Vercel only | e2e | `curl -s $VERCEL_URL` (manual) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — this is a pure infrastructure phase with no business logic to unit-test. `npm run build` serves as the sole automated verification for all tasks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vercel deploy triggers on push | SETUP-03 | Requires actual GitHub push + Vercel webhook | Push to main, check Vercel dashboard |
| Site opens in browser | SETUP-03 | Visual verification | Open deployed URL in browser |
| Supabase has 9 tables | SETUP-02 | Requires Supabase Dashboard access | Open Table Editor, count tables |
| /api/sheets returns data | SETUP-04 | Requires real Google credentials | Visit {VERCEL_URL}/api/sheets |

---

## Rationale

Phase 01 is pure infrastructure setup (project scaffolding, database schema SQL, client wiring, deploy pipeline). There is no business logic, no data transformations, and no algorithms to unit-test. Build verification (`npm run build`) confirms TypeScript compilation, import resolution, and Next.js page/route validity — which is the meaningful automated check for this phase. Integration verification (Supabase connection, Google Sheets API, Vercel deploy) is inherently manual and covered by Plan 01-03's human checkpoint.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands (`npm run build`)
- [x] Sampling continuity: build runs after every task
- [x] No Wave 0 test stubs needed (infrastructure-only phase)
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved

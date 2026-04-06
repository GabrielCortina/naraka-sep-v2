---
phase: 7
slug: lista-de-prateleira-e-cascata
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PRAT-05 | T-07-01 | Auth + role check on cascade route | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "priority"` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PRAT-03 | — | Parcial triggers cascade for remainder | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "parcial"` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | PRAT-04 | — | NE triggers cascade for full quantity | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "ne"` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | PRAT-05 | — | Transformacao created when no bales | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "transformacao"` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | PRAT-01 | — | Progress excludes transformacao pieces | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "transformacao"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/prateleira/utils/__tests__/cascade-engine.test.ts` — stubs for PRAT-03, PRAT-04, PRAT-05
- [ ] Updated `src/features/cards/lib/__tests__/card-utils.test.ts` — stubs for transformacao exclusion (PRAT-01)

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Realtime updates appear within 2s | PRAT-06 | Requires Supabase subscription + browser | Open 2 browser tabs, trigger cascade in one, verify update in other |
| CASCATA badge visible on fardo line | PRAT-05 | Visual verification | Trigger cascade, check fardos list for orange badge |
| Toast appears for leader on cascade | PRAT-05 | Visual + role verification | Login as leader, trigger cascade from separador, verify toast |
| PDF print per card | PRAT-08 | Visual verification | Open card modal, click print, verify PDF content |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

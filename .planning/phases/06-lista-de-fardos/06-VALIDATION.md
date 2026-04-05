---
phase: 6
slug: lista-de-fardos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | FARD-01 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | FARD-02 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | FARD-03 | T-06-01 | Transactional OK/NE with rollback | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | FARD-04 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | FARD-05 | — | N/A | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 2 | FARD-06 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for FARD-01 to FARD-06 created during plan execution
- [ ] Existing vitest infrastructure covers framework needs

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF layout com codigo IN, SKU, endereco | FARD-06 | Visual verification of PDF output | Generate PDF, open in viewer, verify all fields present |
| Realtime subscription updates | FARD-04 | Requires two browser sessions | Open two tabs, trigger OK in one, verify update in other |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

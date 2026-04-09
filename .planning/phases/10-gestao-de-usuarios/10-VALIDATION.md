---
phase: 10
slug: gestao-de-usuarios
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (jsdom environment) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/features/users/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/features/users/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | USER-01 | T-10-01 | Admin-only API route, supabaseAdmin writes | unit | `npx vitest run src/features/users/lib/__tests__/user-utils.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | USER-02 | T-10-02 | Name change updates Auth email, PIN optional | unit | `npx vitest run src/features/users/lib/__tests__/user-utils.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | USER-03 | T-10-03 | Ativo toggle + login check, confirmation dialog | unit | `npx vitest run src/features/users/lib/__tests__/user-utils.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/users/lib/__tests__/user-utils.test.ts` — stubs for USER-01, USER-02, USER-03 (PIN validation, name validation, email slug generation)
- [ ] Test for duplicate name/email detection logic

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mobile responsive layout | D-03 | Visual layout verification | Resize browser to 375px, verify table adapts to cards/compact format |
| Toast feedback after CRUD operations | D-06 | Visual feedback timing | Create/edit/deactivate user, verify green/red toast appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
phase: 2
slug: autenticacao
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already in devDependencies) |
| **Config file** | vitest.config.ts (or to be created in Wave 0) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | T-02-01 | PIN stored as bcrypt hash, signInWithPassword validates | unit | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | T-02-02 | JWT contains user_role claim from custom_access_token_hook | unit | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-03 | T-02-03 | Middleware verifies JWT signature with jose, rejects tampered tokens | unit | `npx vitest run src/__tests__/middleware` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-04 | — | Role-based redirect: admin→/dashboard, lider→/dashboard, separador→/prateleira, fardista→/fardos | unit | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | AUTH-05 | T-02-04 | Middleware blocks access to unauthorized routes per role | integration | `npx vitest run src/__tests__/middleware` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | AUTH-06 | — | Logout clears session cookies and redirects to /login | unit | `npx vitest run src/__tests__/auth` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/auth/login.test.ts` — stubs for AUTH-01, AUTH-02, AUTH-04, AUTH-06
- [ ] `src/__tests__/middleware/auth-middleware.test.ts` — stubs for AUTH-03, AUTH-05
- [ ] `vitest.config.ts` — if not yet created
- [ ] Test utilities for mocking Supabase client and JWT verification

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Custom Access Token Hook enabled in Supabase Dashboard | AUTH-02 | Requires Supabase Dashboard UI interaction | Navigate to Authentication > Hooks, enable custom_access_token_hook, verify JWT contains user_role claim |
| Visual login page matches UI-SPEC design contract | AUTH-01 | Visual verification | Compare rendered login page against 02-UI-SPEC.md spacing, typography, color specifications |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

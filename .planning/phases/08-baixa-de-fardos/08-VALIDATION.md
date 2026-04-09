---
phase: 8
slug: baixa-de-fardos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-08
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
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
| 08-01-01 | 01 | 1 | BAIX-01 | — | Input sanitization on codigo IN | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | BAIX-02 | — | Lookup returns only active trafego entries | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | BAIX-03 | — | Modal displays correct separator names | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | BAIX-04 | — | Duplicate baixa returns warning, no mutation | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | BAIX-05 | — | Baixa removes from trafego and unlocks AGUARDAR FARDISTA | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | BAIX-06 | — | Realtime update propagates to prateleira | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for BAIX-01 through BAIX-06
- [ ] Shared fixtures for Supabase mocking

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera barcode scanning | BAIX-01 | Requires physical camera device | Open /baixa on mobile, tap camera icon, scan barcode |
| Bluetooth scanner input | BAIX-01 | Requires BT scanner hardware | Pair scanner, scan barcode on /baixa page |
| Realtime prateleira update | BAIX-06 | Requires two browser sessions | Open /baixa + /prateleira side by side, confirm baixa updates prateleira |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

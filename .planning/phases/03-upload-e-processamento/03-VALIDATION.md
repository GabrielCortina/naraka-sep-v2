---
phase: 3
slug: upload-e-processamento
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | — | — | N/A | setup | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | UPLD-02 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | UPLD-03 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | UPLD-04 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | UPLD-05 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/classify.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 1 | UPLD-07 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/classify.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-06 | 02 | 1 | UPLD-10 | — | N/A | unit | `npx vitest run src/features/upload/lib/__tests__/envio-groups.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | UPLD-08 | — | N/A | integration | manual-only (requer Supabase) | — | ⬜ pending |
| 03-03-02 | 03 | 2 | UPLD-06 | — | N/A | integration | manual-only (requer Supabase) | — | ⬜ pending |
| 03-03-03 | 03 | 2 | UPLD-09 | — | N/A | integration | manual-only (requer Supabase) | — | ⬜ pending |
| 03-03-04 | 03 | 2 | UPLD-01 | — | N/A | e2e | manual-only (requer browser + Supabase) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm i -D vitest` — instalar framework de testes
- [ ] `vitest.config.ts` — configuracao basica do vitest
- [ ] `src/features/upload/lib/__tests__/parse-xlsx.test.ts` — stubs para UPLD-02, UPLD-03, UPLD-04
- [ ] `src/features/upload/lib/__tests__/classify.test.ts` — stubs para UPLD-05, UPLD-07
- [ ] `src/features/upload/lib/__tests__/envio-groups.test.ts` — stubs para UPLD-10

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload de arquivo .xlsx via drag-and-drop | UPLD-01 | Requer browser e interacao UI | 1. Abrir /upload 2. Arrastar .xlsx 3. Verificar preview |
| Virada de dia limpa banco | UPLD-08 | Requer Supabase com dados do dia anterior | 1. Inserir pedidos com data anterior 2. Fazer nova importacao 3. Verificar limpeza |
| Deduplicacao entre importacoes | UPLD-06 | Requer Supabase com dados existentes | 1. Importar planilha 2. Importar mesma planilha 3. Verificar que duplicados foram ignorados |
| Numeracao sequencial | UPLD-09 | Requer Supabase para verificar sequencia | 1. Importar 2x no mesmo dia 2. Verificar #1 e #2 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

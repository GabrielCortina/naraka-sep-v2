---
phase: 5
slug: cards-e-ui-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CARD-01 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "agrupamento"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | CARD-03 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "progresso"` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | CARD-04 | — | N/A | unit | `npx vitest run src/features/cards/hooks/__tests__/use-countdown.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | CARD-05 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "urgency"` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | CARD-08 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "completed"` | ❌ W0 | ⬜ pending |
| 05-01-06 | 01 | 1 | UIUX-04 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "marketplace"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | CARD-02 | — | N/A | manual-only | Requer browser, componente React | — | ⬜ pending |
| 05-02-02 | 02 | 2 | CARD-06 | T-05-03 | Verificar role antes de INSERT | manual-only | Requer Supabase + UI | — | ⬜ pending |
| 05-02-03 | 02 | 2 | CARD-07 | — | N/A | manual-only | Interacao UI | — | ⬜ pending |
| 05-02-04 | 02 | 2 | CARD-09 | — | N/A | manual-only | Interacao UI | — | ⬜ pending |
| 05-03-01 | 03 | 3 | UIUX-01 | — | N/A | manual-only | Visual review | — | ⬜ pending |
| 05-03-02 | 03 | 3 | UIUX-02 | — | N/A | manual-only | Responsive testing | — | ⬜ pending |
| 05-03-03 | 03 | 3 | UIUX-03 | — | N/A | manual-only | Visual review | — | ⬜ pending |
| 05-03-04 | 03 | 3 | UIUX-05 | T-05-01 | Filtro por role no server | manual-only | Interacao UI | — | ⬜ pending |
| 05-03-05 | 03 | 3 | UIUX-06 | T-05-02 | Validacao qty 0..max | manual-only | Touch testing | — | ⬜ pending |
| 05-XX-XX | XX | X | D-32/D-33 | — | N/A | unit | `npx vitest run src/features/cards/lib/__tests__/pdf-generator.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/cards/lib/__tests__/card-utils.test.ts` — stubs for CARD-01, CARD-03, CARD-05, CARD-08, UIUX-04
- [ ] `src/features/cards/hooks/__tests__/use-countdown.test.ts` — stubs for CARD-04
- [ ] `src/features/cards/lib/__tests__/pdf-generator.test.ts` — stubs for D-32/D-33

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Modal itens renderiza | CARD-02 | Requer browser e interacao React | Abrir card, verificar lista de itens com SKU e quantidade |
| Atribuicao exibida | CARD-06 | Requer Supabase + UI | Atribuir separador via modal, verificar badge azul no card |
| Collapsible funciona | CARD-07 | Interacao UI | Clicar chevron na coluna, verificar colapso/expansao |
| Secao CONCLUIDOS | CARD-09 | Interacao UI | Completar card, verificar que move para secao colapsavel |
| Design minimalista | UIUX-01 | Visual review | Verificar fundo #f4f4f5, cards brancos, sem cores extras |
| Mobile first | UIUX-02 | Responsive testing | Testar <768px, colunas viram secoes verticais |
| Desktop otimizado | UIUX-03 | Visual review | Testar >768px, kanban horizontal com scroll |
| Modal abre card | UIUX-05 | Interacao UI | Clicar card, verificar modal com lista de itens |
| Numpad mobile | UIUX-06 | Touch testing | Testar numpad com digitos 0-9, backspace, Confirmar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

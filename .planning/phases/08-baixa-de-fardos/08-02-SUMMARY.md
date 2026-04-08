---
phase: 08-baixa-de-fardos
plan: 02
subsystem: baixa-ui
tags: [react-hooks, components, client-side, baixa, realtime]
dependency_graph:
  requires: [08-01]
  provides: [useBaixa-hook, BaixaInput, BaixaModal, BaixadosHoje]
  affects: [baixa-page-assembly]
tech_stack:
  added: []
  patterns: [fetch-based-hook, realtime-subscription, collapsible-section, marketplace-colors]
key_files:
  created:
    - src/features/baixa/hooks/use-baixa.ts
    - src/features/baixa/components/baixa-input.tsx
    - src/features/baixa/components/baixa-modal.tsx
    - src/features/baixa/components/baixados-hoje.tsx
  modified: []
decisions:
  - BaixadoItem type imported from baixa-utils.ts instead of redefined in hook (avoids duplication)
metrics:
  duration: 2min
  completed: 2026-04-08
  tasks: 4
  files: 4
---

# Phase 08 Plan 02: Baixa UI Components Summary

Client-side hook and 3 React components for the baixa (discharge) flow: useBaixa manages search/confirm/cancel lifecycle with toast feedback, BaixaInput provides auto-focused scanner input, BaixaModal shows marketplace-colored confirmation with Entregar Para section, BaixadosHoje renders collapsible discharge history with entregas names.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useBaixa hook | 69f66ef | src/features/baixa/hooks/use-baixa.ts |
| 2 | BaixaInput component | 38445e4 | src/features/baixa/components/baixa-input.tsx |
| 3 | BaixaModal confirmation component | 58e30ec | src/features/baixa/components/baixa-modal.tsx |
| 4 | BaixadosHoje collapsible section | ad0a2bf | src/features/baixa/components/baixados-hoje.tsx |

## What Was Built

### useBaixa Hook (Task 1)
- Full search/confirm/cancel lifecycle managing modal state, loading states, and error states
- `search()` calls GET /api/baixa/buscar with duplicate detection (409 -> yellow toast) and not-found handling (404 -> red toast + error flash)
- `confirm()` calls POST /api/baixa/confirmar with optimistic prepend to baixadosHoje list
- `loadBaixadosHoje()` fetches from GET /api/baixa/hoje for full BaixadoItem data including entregas (D-14 compliance)
- Realtime subscription on `baixa-realtime` channel listening to INSERT events on baixados table

### BaixaInput Component (Task 2)
- Auto-focused input field (D-01) with text-xl h-14 for large touch target
- Enter key triggers search, value clears after submission
- Error state applies border-red-500 for visual feedback (D-04)
- Camera icon button with aria-label for accessibility (D-03)
- Responsive width: 80% mobile, 50% desktop

### BaixaModal Component (Task 3)
- Marketplace-colored 4px top border via inline style (D-06)
- Displays: codigo IN, SKU, endereco with green MapPin icon, CONTEM label + quantidade in 28px (D-05)
- Entregar Para section with per-line 3px left border in marketplace color (D-09)
- Fallback "Nao atribuido" for unassigned separadores (D-11)
- Stacked Confirmar Baixa (green) + Cancelar buttons with Loader2 spinner during confirm (D-07)
- max-h-[200px] overflow-y-auto on entregas list (T-08-08 mitigation)
- DialogDescription with sr-only for accessibility

### BaixadosHoje Component (Task 4)
- Collapsible section with "BAIXADOS HOJE (N)" counter in header
- Auto-expands when items transition from 0 to >= 1 (D-15)
- Responsive: two-line mobile layout, single-row desktop layout
- Displays entregas separador names from loaded data (D-14)
- Timestamps formatted as HH:MM via toLocaleTimeString pt-BR

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Duplication] BaixadoItem type imported instead of redefined**
- **Found during:** Task 1
- **Issue:** Plan instructed to define and export BaixadoItem type in the hook, but it already exists in baixa-utils.ts (created in Plan 01)
- **Fix:** Imported BaixadoItem from '../lib/baixa-utils' and re-exported via `export type` for consumers
- **Files modified:** src/features/baixa/hooks/use-baixa.ts

## Verification

- `npx tsc --noEmit` passes (only pre-existing error in stock-parser.test.ts unrelated to this plan)
- All acceptance criteria verified via grep checks
- All 4 files compile without type errors

## Self-Check: PASSED

All 4 files exist. All 4 commit hashes verified.

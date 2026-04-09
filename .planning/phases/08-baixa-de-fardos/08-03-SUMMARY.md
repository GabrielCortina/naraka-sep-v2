---
phase: 08-baixa-de-fardos
plan: 03
subsystem: ui-integration
tags: [next-page, camera-scanner, baixa, integration]

# Dependency graph
requires:
  - phase: 08-baixa-de-fardos
    plan: 01
    provides: "API routes for buscar, confirmar, hoje"
  - phase: 08-baixa-de-fardos
    plan: 02
    provides: "useBaixa hook, BaixaInput, BaixaModal, BaixadosHoje components"
provides:
  - "Complete baixa page with all components wired"
  - "Camera scanner component with lazy-loaded @yudiel/react-qr-scanner"
  - "BaixaPageClient orchestrating the full baixa flow"
  - "Visual improvements matching fardos page pattern"

# Key files
key-files:
  created:
    - app/(authenticated)/baixa/page.tsx
    - src/features/baixa/components/baixa-page-client.tsx
    - src/features/baixa/components/camera-scanner.tsx
  modified:
    - src/features/baixa/components/baixa-input.tsx
    - src/features/baixa/components/baixados-hoje.tsx
    - src/features/baixa/lib/baixa-utils.ts
    - src/features/baixa/hooks/use-baixa.ts
    - app/api/baixa/hoje/route.ts

commits:
  - hash: "617851e"
    message: "feat(08-03): install camera scanner, wire baixa page"
  - hash: "a2adc2c"
    message: "fix(prateleira): block items with active reservas regardless of progresso status"
  - hash: "0c8f98d"
    message: "fix(baixa): delete trafego_fardos row after baixa instead of status update"
  - hash: "aba3408"
    message: "fix(prateleira): derive baixado status from baixados table, not trafego absence"
  - hash: "8e19bd4"
    message: "style(baixa): improve visual layout matching fardos page pattern"
---

## What was built

Complete baixa page integration with camera scanner, full component wiring, and two critical bug fixes:

1. **Page wiring**: BaixaPageClient orchestrates all components (BaixaInput, BaixaModal, BaixadosHoje, CameraScanner) via useBaixa hook. Page.tsx is a server component delegating to the client wrapper.

2. **Camera scanner**: Lazy-loaded @yudiel/react-qr-scanner in full-screen overlay. Supports code_128, ean_13, ean_8, upc_a formats. Unmounts after scan for performance.

3. **Bug fix — AGUARDAR FARDISTA blocking**: Items with active reservas (status='reservado') now correctly block in the prateleira modal, regardless of progresso status. Blocking derived from baixados table — fardo is only considered delivered when its codigo_in exists in baixados.

4. **Bug fix — Baixa delete flow**: Confirmar route now copies full trafego_fardos data to baixados and DELETES the trafego row. trafego_fardos only contains fardos not yet delivered. Migration 00010 restructures baixados table.

5. **Visual improvements**: Input wrapped in white card with "CÓDIGO DO FARDO" label. BAIXADOS HOJE items use white cards with green left border, MapPin icon, "Entregue para" text, matching fardos page pattern. Background set to zinc-100.

## Deviations

- **D-01**: Two additional bug fixes (blocking logic + delete flow) were done during checkpoint verification, beyond original plan scope.
- **D-02**: Visual improvements added per user request during checkpoint, purely CSS/layout changes.
- **D-03**: Migration 00010 added to restructure baixados table for delete flow.

## Self-Check: PASSED

- [x] Camera scanner installs and renders
- [x] BaixaPageClient wires all components
- [x] Page.tsx delegates to client wrapper
- [x] Items with active reservas blocked in prateleira
- [x] Baixa deletes from trafego_fardos
- [x] Visual matches fardos page pattern
- [x] All tests pass
- [x] tsc --noEmit clean (only pre-existing errors)

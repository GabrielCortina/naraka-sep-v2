---
phase: 05-cards-e-ui-foundation
plan: 04
subsystem: ui
tags: [react, dialog, numpad, pdf, jspdf, modal, shadcn-ui]

requires:
  - phase: 05-cards-e-ui-foundation
    provides: "types.ts (CardData, CardItem), deadline-config.ts (TYPE_ABBREV), shadcn dialog/scroll-area/badge"
provides:
  - "ItemModal component for item list interaction"
  - "NumpadPopup component for quantity confirmation"
  - "AssignModal component for user assignment"
  - "generateChecklist PDF generator function"
affects: [05-cards-e-ui-foundation, 07-separacao-flow, 08-fardista-flow]

tech-stack:
  added: [jspdf-autotable]
  patterns: [TDD for pure functions, shadcn Dialog-based modals]

key-files:
  created:
    - src/features/cards/components/numpad-popup.tsx
    - src/features/cards/components/assign-modal.tsx
    - src/features/cards/components/item-modal.tsx
    - src/features/cards/lib/pdf-generator.ts
    - src/features/cards/lib/__tests__/pdf-generator.test.ts

key-decisions:
  - "Function constructor mock for jsPDF in vitest (vi.fn with this binding)"
  - "Explicit vitest imports in test files for tsc compatibility (project pattern)"

patterns-established:
  - "Modal components: Dialog-based with sr-only DialogDescription for accessibility"
  - "PDF generation: jsPDF + autoTable with function export pattern"

requirements-completed: [CARD-02, CARD-06, UIUX-05, UIUX-06]

duration: 3min
completed: 2026-04-05
---

# Phase 05 Plan 04: Modais de Interacao e PDF Summary

**ItemModal with sorted item list and AGUARDAR FARDISTA blocking, NumpadPopup with 3x4 grid and validation, AssignModal with role-filtered user list, and TDD-tested PDF checklist generator**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T18:05:26Z
- **Completed:** 2026-04-05T18:08:56Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- NumpadPopup with 3x4 digit grid, backspace, green Confirmar button, and client-side validation (0..quantidadeNecessaria)
- AssignModal with user list filtered by role, current selection indicator with check icon
- ItemModal with sorted items (aguardar_fardista at bottom), Confirmar/Nao Tem buttons, blocked item badges, NumpadPopup integration, and Imprimir Checklist footer button
- PDF checklist generator (generateChecklist) with jsPDF + autoTable, tested via TDD (4 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: NumpadPopup e AssignModal** - `310668a` (feat)
2. **Task 2 RED: failing tests for PDF generator** - `cbda245` (test)
3. **Task 2 GREEN: PDF generator + ItemModal** - `daffcc4` (feat)
4. **Task 2 REFACTOR: vitest imports + ItemModal** - `1f49eeb` (feat)

## Files Created/Modified
- `src/features/cards/components/numpad-popup.tsx` - Numpad popup with 3x4 grid, digit input, validation, green confirm
- `src/features/cards/components/assign-modal.tsx` - User assignment modal with role filter and selection state
- `src/features/cards/components/item-modal.tsx` - Item list modal with sort, blocking, NumpadPopup, PDF print
- `src/features/cards/lib/pdf-generator.ts` - PDF checklist generation using jsPDF + autoTable
- `src/features/cards/lib/__tests__/pdf-generator.test.ts` - 4 tests for generateChecklist function

## Decisions Made
- Used function constructor pattern for jsPDF mock in vitest (vi.fn with this binding) to satisfy `new jsPDF()` call
- Added explicit vitest imports (describe, it, expect, vi, beforeEach) to test file for tsc compatibility, matching existing project pattern in card-utils.test.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed jsPDF mock constructor pattern**
- **Found during:** Task 2 (TDD GREEN phase)
- **Issue:** `vi.fn().mockImplementation(() => ({...}))` not recognized as constructor by `new jsPDF()`
- **Fix:** Changed to `vi.fn(function(this) { this.text = mockText; ... })` pattern
- **Files modified:** src/features/cards/lib/__tests__/pdf-generator.test.ts
- **Verification:** All 4 tests pass
- **Committed in:** daffcc4

**2. [Rule 3 - Blocking] Added explicit vitest imports for tsc compatibility**
- **Found during:** Task 2 (verification)
- **Issue:** tsc reported `Cannot find name 'vi'`, `Cannot find name 'describe'` etc. because vitest globals not typed
- **Fix:** Added `import { describe, it, expect, vi, beforeEach } from 'vitest'` matching project convention
- **Files modified:** src/features/cards/lib/__tests__/pdf-generator.test.ts
- **Verification:** tsc --noEmit passes with no errors in plan files
- **Committed in:** 1f49eeb

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for test execution and tsc compliance. No scope creep.

## Issues Encountered
- Pre-existing tsc error in src/features/fardos/utils/__tests__/stock-parser.test.ts (missing `posicao` property) -- out of scope, not touched

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All modal components ready for wiring in Phase 07 (separacao flow) and Phase 08 (fardista flow)
- ItemModal imports NumpadPopup and generateChecklist -- integration tested via tsc
- AssignModal ready for leader assignment workflow

---
*Phase: 05-cards-e-ui-foundation*
*Completed: 2026-04-05*

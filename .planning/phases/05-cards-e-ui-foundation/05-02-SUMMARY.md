---
phase: 05-cards-e-ui-foundation
plan: 02
subsystem: ui
tags: [react, shadcn, tailwind, jspdf, lucide, radix-ui]

requires:
  - phase: 05-cards-e-ui-foundation-01
    provides: "Design tokens, types (CardData, UrgencyTier), deadline-config, card-utils"
provides:
  - "ProgressBar component (4px urgency-colored progress bar)"
  - "UrgencyBadge component (ATRASADO/countdown with urgency color)"
  - "MarketplaceBadge component (colored badge per marketplace)"
  - "OrderCard component (composed card with 4-line layout per D-10)"
  - "shadcn Dialog, Collapsible, ScrollArea, Progress installed"
  - "jspdf and jspdf-autotable installed"
affects: [05-cards-e-ui-foundation-03, 05-cards-e-ui-foundation-04, 05-cards-e-ui-foundation-05]

tech-stack:
  added: [jspdf, jspdf-autotable, "@radix-ui/react-dialog", "@radix-ui/react-collapsible", "@radix-ui/react-scroll-area", "@radix-ui/react-progress"]
  patterns: [atomic-component-composition, urgency-color-mapping, marketplace-color-mapping]

key-files:
  created:
    - src/features/cards/components/progress-bar.tsx
    - src/features/cards/components/urgency-badge.tsx
    - src/features/cards/components/marketplace-badge.tsx
    - src/features/cards/components/order-card.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/collapsible.tsx
    - src/components/ui/scroll-area.tsx
    - src/components/ui/progress.tsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Badge variant='outline' with className override for marketplace colors (avoids custom shadcn variants)"
  - "UrgencyBadge uses key={urgency} for force remount with CSS pulse animation on tier change"
  - "OrderCard calculates countdown at render time from DEADLINES config"

patterns-established:
  - "Urgency color mapping: Record<UrgencyTier, string> for bg/text/border-l classes"
  - "Marketplace color mapping: MARKETPLACE_COLORS[grupoEnvio] with fallback to bg-muted"
  - "Card composition: OrderCard imports atomic ProgressBar + UrgencyBadge + MarketplaceBadge"

requirements-completed: [CARD-03, CARD-05]

duration: 2min
completed: 2026-04-05
---

# Phase 05 Plan 02: Components Summary

**4 atomic/composed React components (ProgressBar, UrgencyBadge, MarketplaceBadge, OrderCard) plus shadcn Dialog/Collapsible/ScrollArea/Progress and jspdf installed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T17:59:30Z
- **Completed:** 2026-04-05T18:01:18Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Installed 4 shadcn UI components (Dialog, Collapsible, ScrollArea, Progress) and jspdf/jspdf-autotable
- Created ProgressBar with 4px urgency-colored fill and smooth transition
- Created UrgencyBadge with ATRASADO/countdown display and pulse animation on tier change
- Created MarketplaceBadge with uppercase colored badge from MARKETPLACE_COLORS config
- Created OrderCard with 4-line layout: badges row, urgency countdown, progress bar, percent/pieces

## Task Commits

Each task was committed atomically:

1. **Task 1: Instalar dependencias shadcn e jspdf** - `53a0f35` (chore)
2. **Task 2: Componentes atomicos ProgressBar, UrgencyBadge, MarketplaceBadge e OrderCard** - `bae7c68` (feat)

## Files Created/Modified
- `src/features/cards/components/progress-bar.tsx` - 4px bar with urgency-colored fill, clamped percent
- `src/features/cards/components/urgency-badge.tsx` - ATRASADO text or countdown with urgency color
- `src/features/cards/components/marketplace-badge.tsx` - Colored badge per marketplace with fallback
- `src/features/cards/components/order-card.tsx` - Composed card with MarketplaceBadge + UrgencyBadge + ProgressBar + pieces count
- `src/components/ui/dialog.tsx` - shadcn Dialog component
- `src/components/ui/collapsible.tsx` - shadcn Collapsible component
- `src/components/ui/scroll-area.tsx` - shadcn ScrollArea component
- `src/components/ui/progress.tsx` - shadcn Progress component
- `package.json` - Added jspdf, jspdf-autotable, Radix UI packages
- `package-lock.json` - Updated lockfile

## Decisions Made
- Used Badge variant="outline" with className override for marketplace colors instead of creating custom shadcn variants
- UrgencyBadge uses key={urgency} prop for force remount to trigger CSS pulse animation on tier change (per D-37)
- OrderCard computes countdown at render time from DEADLINES config (will be replaced by realtime subscription later)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/features/fardos/utils/__tests__/stock-parser.test.ts` (missing `posicao` property) from Phase 04 -- not caused by this plan, not fixed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 atomic components ready for consumption by KanbanBoard and KanbanColumn (Plan 03)
- Dialog component ready for ItemModal, NumpadPopup, AssignModal (Plans 04-05)
- jspdf ready for PDF checklist generation (Plan 05)

---
## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (53a0f35, bae7c68) found in git log.

---
*Phase: 05-cards-e-ui-foundation*
*Completed: 2026-04-05*

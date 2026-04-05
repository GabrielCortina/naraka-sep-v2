---
phase: 05-cards-e-ui-foundation
plan: 01
subsystem: ui
tags: [tailwind, css-variables, typescript-types, vitest, tdd, design-tokens]

# Dependency graph
requires:
  - phase: 03-upload-e-processamento
    provides: envio-groups classification, pedidos table schema
  - phase: 04-reserva-fardos
    provides: reservas table schema, stock integration
provides:
  - CardData, CardItem, UrgencyTier, MarketplaceKey types
  - DEADLINES, COLUMN_ORDER, MARKETPLACE_COLORS, TYPE_ABBREV constants
  - CSS variables for marketplace and urgency colors
  - Tailwind color tokens (bg-shopee, bg-ml, etc.)
  - Inter font configured via next/font/google
  - Pure functions groupByCardKey, getUrgencyTier, calcProgress, isCardComplete, formatCountdown, aggregateItems
affects: [05-02, 05-03, 05-04, 05-05, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [css-hsl-variables-for-theming, pure-functions-with-injectable-now, tdd-red-green-refactor]

key-files:
  created:
    - src/features/cards/types.ts
    - src/features/cards/lib/deadline-config.ts
    - src/features/cards/lib/card-utils.ts
    - src/features/cards/lib/__tests__/card-utils.test.ts
    - src/features/cards/lib/__tests__/deadline-config.test.ts
  modified:
    - app/globals.css
    - app/layout.tsx
    - tailwind.config.ts

key-decisions:
  - "getUrgencyTier aceita now opcional para testabilidade sem mock global de Date"
  - "CSS variables em HSL sem alpha channel (formato Tailwind padrao)"
  - "aggregateItems determina status agregado: nao_encontrado > separado > parcial > pendente"

patterns-established:
  - "Design tokens: CSS variables HSL em :root + Tailwind extend hsl(var(--name))"
  - "Pure functions com injecao de dependencias (now?: Date) para testabilidade"
  - "Array.from(Map) para iteracao de Maps (compat tsconfig target)"

requirements-completed: [CARD-01, CARD-03, CARD-04, CARD-05, CARD-08, UIUX-01, UIUX-04]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 05 Plan 01: Design Tokens, Tipos Cards e Card-Utils Summary

**Design tokens CSS/Tailwind para marketplace e urgencia, tipos TypeScript do dominio cards, e 6 funcoes puras de agrupamento/urgencia/progresso com 45 testes TDD**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T17:55:03Z
- **Completed:** 2026-04-05T17:58:04Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Design tokens (4 cores marketplace + 4 cores urgencia) como CSS variables HSL e Tailwind extend
- Fonte Inter configurada via next/font/google com pesos 400 e 700
- Tipos CardData, CardItem, UrgencyTier, MarketplaceKey exportados
- Constantes DEADLINES (6 grupos), COLUMN_ORDER, MARKETPLACE_COLORS, TYPE_ABBREV
- 6 funcoes puras em card-utils: groupByCardKey, getUrgencyTier, calcProgress, isCardComplete, formatCountdown, aggregateItems
- 45 testes unitarios passando (16 deadline-config + 29 card-utils)

## Task Commits

Each task was committed atomically:

1. **Task 1: Tipos do dominio cards, constantes de prazo, design tokens CSS/Tailwind e fonte Inter** - `40337d0` (feat)
2. **Task 2: Logica pura card-utils com TDD** - `3fbd0ba` (feat)

## Files Created/Modified
- `src/features/cards/types.ts` - CardData, CardItem, UrgencyTier, MarketplaceKey types
- `src/features/cards/lib/deadline-config.ts` - DEADLINES, COLUMN_ORDER, MARKETPLACE_COLORS, TYPE_ABBREV
- `src/features/cards/lib/card-utils.ts` - 6 pure functions for card logic
- `src/features/cards/lib/__tests__/deadline-config.test.ts` - 16 tests for constants
- `src/features/cards/lib/__tests__/card-utils.test.ts` - 29 tests for card-utils functions
- `app/globals.css` - CSS variables for marketplace and urgency colors
- `app/layout.tsx` - Inter font with weights 400/700 via next/font/google
- `tailwind.config.ts` - Marketplace/urgency color tokens + font-sans Inter

## Decisions Made
- getUrgencyTier aceita `now` opcional para testabilidade sem mock global de Date
- CSS variables em HSL sem alpha channel (formato Tailwind padrao)
- aggregateItems determina status agregado com prioridade: nao_encontrado > separado > parcial > pendente
- Deadline exato (diff <= 0) conta como overdue, diff <= 7200000ms (2h) como warning

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tipos, constantes e funcoes puras prontos para consumo em 05-02 (CardColumn component)
- Design tokens prontos para uso em todos os componentes visuais das proximas plans
- 45 testes garantem regressao segura durante implementacao dos componentes

## Self-Check: PASSED

All 8 files verified present. Both task commits (40337d0, 3fbd0ba) found in git log.

---
*Phase: 05-cards-e-ui-foundation*
*Completed: 2026-04-05*

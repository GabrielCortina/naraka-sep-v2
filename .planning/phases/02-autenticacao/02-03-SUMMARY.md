---
phase: 02-autenticacao
plan: 03
subsystem: auth
tags: [app-shell, sidebar, bottom-tabs, navigation, role-based, responsive, placeholder-pages]

# Dependency graph
requires:
  - phase: 02-autenticacao
    plan: 01
    provides: NAV_ITEMS, ROLE_ROUTES, role-config.ts
  - phase: 02-autenticacao
    plan: 02
    provides: Login page, middleware, Supabase clients
provides:
  - AppShell responsivo com sidebar desktop e bottom tabs mobile
  - Layout autenticado com sessao server-side e role lookup
  - 5 paginas placeholder com navegacao funcional
  - Logout funcional via signOut + redirect
affects: [03-upload, 06-fardos, 07-prateleira, 08-baixa, 09-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-group-authenticated, server-component-layout-auth, responsive-nav-shell]

key-files:
  created:
    - src/components/layout/app-shell.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/bottom-tabs.tsx
    - src/components/layout/mobile-header.tsx
    - app/(authenticated)/layout.tsx
    - app/(authenticated)/dashboard/page.tsx
    - app/(authenticated)/upload/page.tsx
    - app/(authenticated)/fardos/page.tsx
    - app/(authenticated)/prateleira/page.tsx
    - app/(authenticated)/baixa/page.tsx
  modified: []

key-decisions:
  - "AppShell e server component que recebe role e filtra NAV_ITEMS"
  - "Layout autenticado usa getUser() + query public.users para role (nao confia em JWT no server component)"
  - "Sidebar exibe userName do usuario logado acima do botao Sair"

patterns-established:
  - "Route group (authenticated) para compartilhar layout com auth check"
  - "Sidebar desktop (hidden md:flex) + bottom tabs mobile (md:hidden) com breakpoint 768px"
  - "Placeholder pages: titulo centralizado + mensagem de fase futura"

requirements-completed: [AUTH-05, AUTH-06]

# Metrics
duration: 3min
completed: 2026-04-04
---

# Phase 2 Plan 03: AppShell e Paginas Placeholder Summary

**AppShell responsivo com sidebar desktop 240px e bottom tabs mobile 56px, navegacao filtrada por role, logout funcional e 5 paginas placeholder para todas as telas do sistema**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-04T22:21:08Z
- **Completed:** 2026-04-04T22:24:27Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- AppShell server component que filtra NAV_ITEMS por role e renderiza sidebar/bottom tabs/mobile header
- Sidebar desktop 240px com logo NARAKA, navegacao com icones Lucide, nome do usuario e botao Sair com signOut
- Bottom tabs mobile 56px fixo no rodape com safe-area padding e labels semibold
- Mobile header 48px fixo no topo com logo NARAKA
- Layout autenticado que busca sessao via getUser() e role via query public.users, com redirect para /login
- 5 paginas placeholder (Dashboard, Upload, Fardos, Prateleira, Baixa) com titulo e mensagem de fase futura
- Navegacao funcional entre todas as paginas via Link components

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar AppShell com sidebar desktop, bottom tabs mobile e logout** - `c18d786` (feat)
2. **Task 2: Criar layout autenticado e 5 paginas placeholder** - `e6b837a` (feat)

## Files Created/Modified
- `src/components/layout/app-shell.tsx` - Server component que filtra NAV_ITEMS por role e renderiza sidebar + bottom tabs
- `src/components/layout/sidebar.tsx` - Client component 240px desktop sidebar com logout via signOut
- `src/components/layout/bottom-tabs.tsx` - Client component 56px bottom tabs mobile com safe-area
- `src/components/layout/mobile-header.tsx` - Client component 48px mobile header com logo NARAKA
- `app/(authenticated)/layout.tsx` - Server layout com getUser() + users table query para role
- `app/(authenticated)/dashboard/page.tsx` - Placeholder "Fase 9"
- `app/(authenticated)/upload/page.tsx` - Placeholder "Fase 3"
- `app/(authenticated)/fardos/page.tsx` - Placeholder "Fase 6"
- `app/(authenticated)/prateleira/page.tsx` - Placeholder "Fase 7"
- `app/(authenticated)/baixa/page.tsx` - Placeholder "Fase 8"

## Decisions Made
- AppShell e server component (nao client) que recebe role e filtra NAV_ITEMS antes de passar para componentes client
- Layout autenticado usa getUser() server-side + query public.users para buscar role e nome (T-02-09: nao confia em role do client)
- Sidebar exibe userName do usuario logado acima do botao Sair para melhor UX

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrigido userName nao utilizado no sidebar**
- **Found during:** Task 1
- **Issue:** ESLint acusou 'userName' is defined but never used no sidebar
- **Fix:** Adicionado exibicao do userName acima do botao Sair
- **Files modified:** src/components/layout/sidebar.tsx
- **Commit:** c18d786

## Issues Encountered
None

## User Setup Required
None - toda infraestrutura ja foi configurada nos Plans 01 e 02.

## Self-Check: PASSED

- FOUND: src/components/layout/app-shell.tsx
- FOUND: src/components/layout/sidebar.tsx
- FOUND: src/components/layout/bottom-tabs.tsx
- FOUND: src/components/layout/mobile-header.tsx
- FOUND: app/(authenticated)/layout.tsx
- FOUND: app/(authenticated)/dashboard/page.tsx
- FOUND: app/(authenticated)/upload/page.tsx
- FOUND: app/(authenticated)/fardos/page.tsx
- FOUND: app/(authenticated)/prateleira/page.tsx
- FOUND: app/(authenticated)/baixa/page.tsx
- FOUND: commit c18d786
- FOUND: commit e6b837a

---
*Phase: 02-autenticacao*
*Completed: 2026-04-04*

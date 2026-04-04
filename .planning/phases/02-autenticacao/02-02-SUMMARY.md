---
phase: 02-autenticacao
plan: 02
subsystem: auth
tags: [login, jwt, middleware, jose, role-based-access, next-middleware, shadcn]

# Dependency graph
requires:
  - phase: 02-autenticacao
    plan: 01
    provides: Custom Access Token Hook, role-config.ts, slugify.ts, seed users
provides:
  - Login page funcional com form nome + PIN
  - Middleware com JWT verification e role-based route protection
  - Componentes shadcn UI (button, input, card, label, sonner)
affects: [02-03 AppShell navigation, 10-gestao-usuarios]

# Tech tracking
tech-stack:
  added: [jose, sonner]
  patterns: [jwt-verification-middleware, edge-runtime-compatible-auth, returnTo-redirect-pattern]

key-files:
  created:
    - src/features/auth/components/login-form.tsx
    - app/login/page.tsx
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/sonner.tsx
  modified:
    - middleware.ts
    - package.json

key-decisions:
  - "ROLE_ROUTES e ROLE_DEFAULTS inlined no middleware (Edge Runtime nao resolve path aliases)"
  - "LoginForm usa useSearchParams com Suspense boundary no server component pai"
  - "returnTo validado contra open redirect (deve comecar com / e nao conter ://)"
  - "JWT decodificado via atob no client apos login (confia no token fresco)"

patterns-established:
  - "Middleware JWT: jwtVerify com jose + TextEncoder (Edge-compatible, sem Buffer)"
  - "Login form: signInWithPassword com email ficticio via nomeToEmail"
  - "Route protection: middleware verifica role antes de permitir acesso"

requirements-completed: [AUTH-01, AUTH-03, AUTH-04]

# Metrics
duration: 4min
completed: 2026-04-04
---

# Phase 2 Plan 02: Login Page e Middleware Summary

**Tela de login com nome + PIN via Supabase Auth e middleware com verificacao JWT jose para protecao de rotas por role**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-04T22:14:55Z
- **Completed:** 2026-04-04T22:18:49Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Login form client component com campos nome e PIN, loading state com spinner, erro generico contra enumeracao de usuarios
- Login page com layout dark centralizado, logo NARAKA, card branco max-w-400px conforme UI-SPEC
- Middleware estendido com jwtVerify (jose) para extrair user_role do JWT e enforcar permissoes por rota
- Redirect automatico para /login com returnTo param para usuarios nao autenticados
- Protecao contra open redirect no parametro returnTo

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar tela de login com form nome + PIN** - `805403d` (feat)
2. **Task 2: Middleware JWT verification e protecao de rotas** - `d0f953f` (feat)

## Files Created/Modified
- `src/features/auth/components/login-form.tsx` - Client component com form nome + PIN, signInWithPassword, loading state, erro generico
- `app/login/page.tsx` - Server component com layout dark, logo NARAKA, Card centralizado, Suspense boundary
- `middleware.ts` - JWT verification com jose, role extraction, route protection, returnTo redirect
- `src/components/ui/button.tsx` - Componente shadcn Button
- `src/components/ui/card.tsx` - Componente shadcn Card
- `src/components/ui/input.tsx` - Componente shadcn Input
- `src/components/ui/label.tsx` - Componente shadcn Label
- `src/components/ui/sonner.tsx` - Componente shadcn Sonner (toast)
- `package.json` - Adicionado jose e dependencias shadcn

## Decisions Made
- ROLE_ROUTES e ROLE_DEFAULTS inlined no middleware em vez de importar de role-config.ts (Edge Runtime pode nao resolver path aliases @/)
- LoginForm usa useSearchParams() que requer Suspense boundary no componente pai (server component)
- Validacao do returnTo: deve comecar com / e nao conter :// (previne open redirect - T-02-06)
- JWT decodificado via atob() no client-side apos login bem-sucedido (token acabou de ser emitido, confiavel)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - infraestrutura de auth ja foi configurada no Plan 01 (hook habilitado, JWT secret configurado, usuarios seed criados).

## Next Phase Readiness
- Login page funcional pronta para teste com usuarios seed
- Middleware protege todas as rotas autenticadas
- Proximo passo: Plan 03 (AppShell com sidebar/bottom tabs e paginas placeholder)
- role-config.ts e NAV_ITEMS disponiveis para a navegacao

## Self-Check: PASSED

- FOUND: src/features/auth/components/login-form.tsx
- FOUND: app/login/page.tsx
- FOUND: middleware.ts
- FOUND: src/components/ui/button.tsx
- FOUND: src/components/ui/card.tsx
- FOUND: .planning/phases/02-autenticacao/02-02-SUMMARY.md
- FOUND: commit 805403d
- FOUND: commit d0f953f

---
*Phase: 02-autenticacao*
*Completed: 2026-04-04*

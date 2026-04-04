---
phase: 02-autenticacao
plan: 01
subsystem: auth
tags: [supabase, jwt, custom-claims, rbac, postgresql, seed]

# Dependency graph
requires:
  - phase: 01-infraestrutura
    provides: Supabase project, initial schema with users table, admin client
provides:
  - Custom Access Token Hook SQL function (injects user_role into JWT)
  - Role-to-routes config (ROLE_ROUTES, ROLE_DEFAULTS, NAV_ITEMS)
  - Nome-to-email slug function (nomeToEmail)
  - Seed script for 4 dev users in auth.users + public.users
affects: [02-02 middleware JWT, 02-03 AppShell navigation, 10-gestao-usuarios]

# Tech tracking
tech-stack:
  added: [tsx, dotenv]
  patterns: [custom-access-token-hook, fictitious-email-auth, role-config-mapping]

key-files:
  created:
    - supabase/migrations/00002_custom_claims_hook.sql
    - src/features/auth/lib/role-config.ts
    - src/features/auth/lib/slugify.ts
    - scripts/seed-auth-users.ts
  modified:
    - package.json

key-decisions:
  - "Custom Access Token Hook injeta user_role no JWT automaticamente a cada token"
  - "Email ficticio @naraka.local gerado via slug deterministic do nome"
  - "pin_hash em public.users marcado como 'supabase-auth-managed' pois auth real e via Supabase Auth"
  - "Seed script usa admin API para sincronizar IDs entre auth.users e public.users"

patterns-established:
  - "Custom Access Token Hook: funcao SQL em public schema chamada pelo Supabase Auth antes de emitir JWT"
  - "nomeToEmail: normalize NFD + remove diacriticals + slug + @naraka.local"
  - "Role config centralizado: ROLE_ROUTES, ROLE_DEFAULTS e NAV_ITEMS em role-config.ts"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 8min
completed: 2026-04-04
---

# Phase 2 Plan 01: Infraestrutura de Auth Summary

**Custom Access Token Hook SQL para injetar role no JWT, config de rotas por role, slugify para email ficticio e seed de 4 usuarios de desenvolvimento**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-04T21:51:22Z
- **Completed:** 2026-04-04T21:59:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Migration SQL do Custom Access Token Hook que injeta user_role no JWT com permissoes restritas (apenas supabase_auth_admin)
- Configuracao centralizada de rotas por role (ROLE_ROUTES, ROLE_DEFAULTS, NAV_ITEMS) pronta para middleware e AppShell
- Funcao nomeToEmail para converter nomes com acentos em emails ficticios deterministic
- Seed script que cria 4 usuarios de teste em auth.users + public.users com IDs sincronizados

## Task Commits

Each task was committed atomically:

1. **Task 1: Custom Access Token Hook + role config + slugify** - `17b4b03` (feat)
2. **Task 2: Seed script para usuarios de desenvolvimento** - `2269c26` (feat)
3. **Task 3: Deploy migration e habilitar hook** - checkpoint:human-action (manual, sem commit)

## Files Created/Modified
- `supabase/migrations/00002_custom_claims_hook.sql` - Funcao PostgreSQL que injeta user_role no JWT claims
- `src/features/auth/lib/role-config.ts` - ROLE_ROUTES, ROLE_DEFAULTS e NAV_ITEMS para 4 roles e 5 rotas
- `src/features/auth/lib/slugify.ts` - nomeToEmail converte nome para email ficticio @naraka.local
- `scripts/seed-auth-users.ts` - Cria 4 usuarios dev (admin, lider, separador, fardista) em auth + public
- `package.json` - Adicionado script seed:auth, tsx (devDep) e dotenv (dep)

## Decisions Made
- Custom Access Token Hook escolhido sobre app_metadata manual: sincroniza automaticamente a cada token refresh
- Email ficticio via slug deterministic: simples e previsivel, colisoes tratadas pela unicidade de nomes (Phase 10)
- pin_hash em public.users marcado como 'supabase-auth-managed': validacao real e pelo Supabase Auth (bcrypt interno)
- Seed script copia funcao nomeToEmail inline em vez de importar via path alias (tsx nao resolve @/ aliases)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

As seguintes acoes manuais foram executadas pelo usuario (Task 3 - checkpoint:human-action):
1. Migration aplicada no Supabase (SQL Editor ou db push)
2. Custom Access Token Hook habilitado no Dashboard (Authentication > Hooks)
3. JWT Secret copiado do Dashboard e configurado no .env.local
4. Seed script executado (npm run seed:auth) - 4 usuarios criados

## Next Phase Readiness
- Custom Access Token Hook ativo: JWTs agora contem claim user_role
- role-config.ts pronto para uso pelo middleware (02-02) e AppShell (02-03)
- slugify.ts pronto para uso pelo login form (02-02)
- 4 usuarios de teste disponveis para testar login
- SUPABASE_JWT_SECRET configurado para verificacao JWT no middleware

## Self-Check: PASSED

- FOUND: supabase/migrations/00002_custom_claims_hook.sql
- FOUND: src/features/auth/lib/role-config.ts
- FOUND: src/features/auth/lib/slugify.ts
- FOUND: scripts/seed-auth-users.ts
- FOUND: .planning/phases/02-autenticacao/02-01-SUMMARY.md
- FOUND: commit 17b4b03
- FOUND: commit 2269c26

---
*Phase: 02-autenticacao*
*Completed: 2026-04-04*

---
phase: 01-infraestrutura
plan: 02
subsystem: database
tags: [supabase, google-sheets, typescript, rls, postgresql, googleapis]

# Dependency graph
requires:
  - "01-01: Next.js 14 project foundation, tsconfig paths, .env.example"
provides:
  - "Supabase migration SQL with 9 tables, RLS, indices, and read policies"
  - "3 Supabase TypeScript clients (browser, server, admin) with Database generic"
  - "Middleware for JWT token refresh on all routes"
  - "Type-safe Database interface matching all 9 tables (Row/Insert/Update)"
  - "Google Sheets API client with read/write/clear functions"
  - "GET /api/sheets Route Handler for stock spreadsheet access"
  - "Domain type aliases (UserRole, TipoPedido, StatusProgresso, StatusTrafego)"
affects: [01-03, 02-autenticacao, 03-upload, 04-fardos, 05-prateleira, 06-baixa, 07-dashboard]

# Tech tracking
tech-stack:
  added: ["@supabase/supabase-js", "@supabase/ssr", "googleapis"]
  patterns: [supabase-ssr-pattern, server-client-separation, route-handler-api, jwt-service-account]

key-files:
  created:
    - supabase/migrations/00001_initial_schema.sql
    - supabase/seed.sql
    - supabase/config.toml
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/admin.ts
    - src/types/database.types.ts
    - src/lib/google-sheets.ts
    - app/api/sheets/route.ts
    - middleware.ts
  modified:
    - package.json
    - src/types/index.ts

key-decisions:
  - "googleapis JWT constructor uses options object pattern (not positional args) for current version compatibility"
  - "Database types handwritten as placeholder until supabase gen types can be run against live project"

patterns-established:
  - "Supabase SSR pattern: browser client (createBrowserClient), server client (createServerClient with cookies), admin (createClient with service role)"
  - "Google Sheets access via Route Handler only (server-side credentials, never exposed to client)"
  - "Domain types re-exported from src/types/index.ts for convenient imports"

requirements-completed: [SETUP-02, SETUP-04]

# Metrics
duration: 4min
completed: 2026-04-04
---

# Phase 01 Plan 02: Supabase + Google Sheets Summary

**Supabase schema with 9 tables/RLS/indices, 3 type-safe TypeScript clients, auth middleware, and Google Sheets API integration via Route Handler with JWT service account**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-04T19:07:21Z
- **Completed:** 2026-04-04T19:11:24Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Complete SQL migration with 9 tables (users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados), 8 indices, RLS on all tables, and authenticated read policies
- Three Supabase TypeScript clients (browser, server with cookie handling, admin with service role) all typed with Database generic
- Middleware intercepting all routes for JWT token refresh via supabase.auth.getUser()
- Google Sheets API with JWT service account auth, three functions (getSheetData, updateSheetData, clearSheetRange), and GET /api/sheets Route Handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Configurar Supabase -- migration SQL, clientes TypeScript e middleware** - `181086d` (feat)
2. **Task 2: Configurar Google Sheets API com Route Handler** - `5211eee` (feat)
3. **supabase .gitignore from init** - `afc1570` (chore)

## Files Created/Modified
- `supabase/migrations/00001_initial_schema.sql` - Complete schema with 9 tables, indices, RLS, policies
- `supabase/seed.sql` - Dev admin user (PIN 1234, SHA-256 hashed)
- `supabase/config.toml` - Supabase CLI configuration
- `src/lib/supabase/client.ts` - Browser Supabase client with Database generic
- `src/lib/supabase/server.ts` - Server Supabase client with cookie handling
- `src/lib/supabase/admin.ts` - Admin Supabase client with service role key
- `src/types/database.types.ts` - Full Database interface with Row/Insert/Update for all 9 tables
- `src/types/index.ts` - Re-exports Database type + domain type aliases
- `src/lib/google-sheets.ts` - Google Sheets API client (read/write/clear)
- `app/api/sheets/route.ts` - GET /api/sheets Route Handler
- `middleware.ts` - Supabase auth middleware for JWT refresh
- `package.json` - Added @supabase/supabase-js, @supabase/ssr, googleapis

## Decisions Made
- Used googleapis JWT options object constructor (`{ email, key, scopes }`) instead of positional arguments -- current googleapis version changed the constructor signature
- Database types are handwritten placeholders matching the SQL schema; will be replaced by `supabase gen types` when connected to a live Supabase project

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed googleapis JWT constructor signature**
- **Found during:** Task 2 (Google Sheets API setup)
- **Issue:** Plan specified positional arguments `new google.auth.JWT(email, undefined, key, scopes)` but current googleapis version expects options object
- **Fix:** Changed to `new google.auth.JWT({ email, key, scopes })` pattern
- **Files modified:** src/lib/google-sheets.ts
- **Verification:** `npm run build` passes successfully
- **Committed in:** 5211eee (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API surface change for library compatibility. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
Before the system can connect to real services, the following environment variables must be configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role secret key
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Google Cloud service account JSON key
- `GOOGLE_SHEET_ID` - Google Sheets spreadsheet ID

## Next Phase Readiness
- Supabase schema and clients ready for authentication implementation (Phase 02)
- Google Sheets integration ready for stock reading in upload/reservation flows
- All type definitions in place for type-safe database operations
- Migration SQL ready to be applied to Supabase project via CLI or dashboard

---
*Phase: 01-infraestrutura*
*Completed: 2026-04-04*

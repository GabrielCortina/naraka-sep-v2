---
phase: 01-infraestrutura
plan: 03
subsystem: infra
tags: [supabase, github, vercel, deploy, git]

# Dependency graph
requires:
  - "01-02: Supabase schema, clients, Google Sheets API"
provides:
  - "Supabase remote database with 9 tables and seed data"
  - "TypeScript types auto-generated from live schema"
  - "GitHub repository with all code pushed"
  - "Vercel deployment connected to GitHub"
affects: [02-autenticacao, all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-db-push, supabase-gen-types, github-vercel-deploy]

key-files:
  created: []
  modified: []

key-decisions:
  - "Plan requires user credentials for all operations -- presented as checkpoint for human action"
  - "gh CLI not installed -- user must create GitHub repo manually or install gh"

patterns-established: []

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-04-04
status: blocked-checkpoint
---

# Phase 01 Plan 03: Git, Schema Push, GitHub, Vercel Deploy Summary

**Plan blocked on user credentials -- all operations require Supabase project ref, access token, and GitHub setup that are not available in the environment**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-04T19:13:28Z
- **Completed:** N/A (blocked on human action)
- **Tasks:** 0/2 (both require user credentials)
- **Files modified:** 0

## Status: CHECKPOINT - Human Action Required

All operations in this plan require external service credentials that are not configured in the environment. The codebase is fully prepared (schema SQL, clients, config) but the remote infrastructure connection requires manual user setup.

## What Is Ready (from Plans 01-01 and 01-02)

- Git repository initialized with 10 commits
- `supabase/migrations/00001_initial_schema.sql` -- complete schema with 9 tables
- `supabase/seed.sql` -- dev admin user
- `supabase/config.toml` -- Supabase CLI config
- `src/types/database.types.ts` -- placeholder types (to be replaced by gen types)
- All Supabase clients (browser, server, admin) configured
- Google Sheets API client and route handler configured
- `.env.example` with all 5 required variables documented

## Task 1: Steps for User to Complete

### 1A. Create Supabase Project (if not done)

1. Go to https://supabase.com/dashboard
2. Create new project (or use existing one)
3. Note the **Project Reference** from the URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`
4. Note the **Project URL**, **anon key**, and **service role key** from Settings > API

### 1B. Create `.env.local` File

```bash
cd /Users/gabrielcortina/Desktop/naraka-sep-v2
cp .env.example .env.local
```

Edit `.env.local` with real values:
```
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_SHEET_ID=1tL5as2Q0QEZCj_6Kc4xGGqPqU4T5uduHmaGmntC8W58
```

### 1C. Login to Supabase CLI

```bash
npx supabase login
```

This opens browser for authentication and stores an access token locally.

### 1D. Link Supabase Project

```bash
cd /Users/gabrielcortina/Desktop/naraka-sep-v2
npx supabase link --project-ref <PROJECT_REF>
```

### 1E. Push Schema to Remote Database

```bash
npx supabase db push
```

Verify tables exist in Supabase Dashboard > Table Editor (9 tables).

### 1F. Apply Seed Data

```bash
npx supabase db execute --file supabase/seed.sql
```

Or paste contents of `supabase/seed.sql` into Supabase Dashboard > SQL Editor and run.

### 1G. Generate TypeScript Types from Live Schema

```bash
npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.types.ts
```

Then verify build still works:
```bash
npm run build
```

If build fails due to type mismatches, the generated types may have different casing or structure. Check the generated file matches what `src/types/index.ts` expects.

### 1H. Commit Generated Types

```bash
git add src/types/database.types.ts
git commit -m "feat(01-03): tipos Supabase auto-gerados do schema remoto"
```

### 1I. Create GitHub Repository and Push

Option A (with gh CLI):
```bash
brew install gh
gh auth login
gh repo create naraka-sep-v2 --private --source=. --remote=origin --push
```

Option B (manual):
1. Go to https://github.com/new
2. Create private repo named `naraka-sep-v2`
3. Do NOT initialize with README
4. Then:
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/naraka-sep-v2.git
git push -u origin main
```

## Task 2: Vercel Deploy Verification Checklist

### Pre-requisite: Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Import the `naraka-sep-v2` repository
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` -- from Supabase project (PRODUCTION)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- from Supabase project (PRODUCTION)
   - `SUPABASE_SERVICE_ROLE_KEY` -- from Supabase project (PRODUCTION)
   - `GOOGLE_SERVICE_ACCOUNT_KEY` -- JSON of Google service account
   - `GOOGLE_SHEET_ID` -- `1tL5as2Q0QEZCj_6Kc4xGGqPqU4T5uduHmaGmntC8W58`
4. Click Deploy

### Verification Checklist (4 Phase 1 criteria)

- [ ] **SETUP-01 -- Next.js roda com Tailwind e shadcn/ui:** Open Vercel URL in browser. Should display "NARAKA | SEP v2" centered with Inter font. "Sistema de Separacao" text in gray (muted-foreground).
- [ ] **SETUP-02 -- Supabase com tabelas:** Open Supabase Dashboard > Table Editor. Confirm 9 tables exist: users, config, pedidos, progresso, reservas, atribuicoes, trafego_fardos, baixados, fardos_nao_encontrados. Confirm users table has 1 record (Admin Dev).
- [ ] **SETUP-03 -- Deploy automatico:** The GitHub push triggering Vercel build confirms this. Site opens at Vercel URL without errors.
- [ ] **SETUP-04 -- Google Sheets API:** Visit `{VERCEL_URL}/api/sheets`. Should return JSON with `{ "success": true, "rows": N, "data": [...] }`. If error 500: check env vars in Vercel and that spreadsheet is shared with service account email.

## Deviations from Plan

### Environment Limitations

**1. [Checkpoint - Human Action] All operations require user credentials**
- **Found during:** Pre-execution environment check
- **Issue:** No `.env.local`, no Supabase project linked, no `SUPABASE_ACCESS_TOKEN`, `gh` CLI not installed, no git remote configured
- **Resolution:** Documented all steps for user to complete manually
- **Impact:** Plan cannot be executed autonomously -- all steps are human-action items

## Issues Encountered

- `gh` CLI not installed on machine (no `brew install gh` or similar)
- No `.env.local` exists -- user has not yet created Supabase project or configured credentials
- Supabase CLI available via `npx` (v2.84.10) but not logged in

## Known Stubs

None -- this plan does not create or modify code files.

---
*Phase: 01-infraestrutura*
*Status: Checkpoint -- awaiting human action*
*Created: 2026-04-04*

## Self-Check: PASSED

- SUMMARY file: FOUND at `.planning/phases/01-infraestrutura/01-03-SUMMARY.md`
- Commit 98a2423: FOUND in git log

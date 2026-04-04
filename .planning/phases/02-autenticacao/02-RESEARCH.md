# Phase 2: Autenticacao - Research

**Researched:** 2026-04-04
**Domain:** Supabase Auth + Next.js 14 middleware + role-based navigation
**Confidence:** HIGH

## Summary

This phase implements PIN-based authentication using Supabase Auth with custom JWT claims for role-based access control. The approach uses Supabase's `signInWithPassword` with fictitious emails (`nome@naraka.local`) and the PIN as the password. A Custom Access Token Hook (database function) injects the user's `role` from the public `users` table into the JWT, enabling the Next.js middleware to extract the role and enforce route protection without additional database calls.

The middleware reads the session, extracts the role from the JWT `app_metadata` (or a custom claim), and redirects users to their role-specific default page. The app shell uses a responsive layout: sidebar on desktop (>=768px) and bottom tabs on mobile (<768px), with navigation items filtered by role.

**Primary recommendation:** Use Supabase Custom Access Token Hook (SQL function in `public` schema) to inject `user_role` into JWT claims. In the middleware, use `getSession()` + `jose` JWT verification to extract the role and enforce route permissions. Never trust `getSession()` alone in middleware without JWT verification.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Supabase Auth com custom claims -- criar usuario no Supabase Auth com email ficticio, armazenar role como custom claim no JWT via database function
- **D-02:** Email ficticio no formato `nome@naraka.local` -- slug do nome do usuario + dominio fixo (ex: 'Joao Silva' -> 'joao-silva@naraka.local')
- **D-03:** PIN e a senha do Supabase Auth (bcrypt interno) -- validacao via signInWithPassword. Campo pin_hash na tabela users fica como referencia/auditoria, validacao real e pelo Supabase Auth
- **D-04:** Dois campos: nome (texto) e PIN (numerico 4-6 digitos) -- usuario digita ambos
- **D-05:** Layout centralizado minimalista -- logo NARAKA no topo, card branco centralizado, fundo escuro/neutro, design preto e branco do projeto
- **D-06:** Mensagem de erro generica 'Nome ou PIN incorreto' -- nao revela se nome existe ou nao (seguranca contra enumeracao)
- **D-07:** Bottom tabs no mobile (barra fixa no rodape com icones), sidebar lateral no desktop -- cada role ve so suas abas permitidas
- **D-08:** Redirect apos login por role: Admin -> Dashboard, Lider -> Dashboard, Separador -> Prateleira, Fardista -> Fardos
- **D-09:** Paginas placeholder para todas as telas (Dashboard, Upload, Fardos, Prateleira, Baixa) -- titulo + indicacao que sera implementada em fase futura. Navegacao funcional desde agora
- **D-10:** Middleware le JWT, extrai role do custom claim, verifica permissao para a rota. Se nao autorizado, redireciona para tela default do role
- **D-11:** Usuario nao autenticado e redirecionado silenciosamente para /login. Apos login, volta para a rota que tentou acessar (ou default do role)

### Claude's Discretion
- Implementacao exata da database function para custom claims
- Escolha de icones para as abas de navegacao
- Design exato do input de PIN (mascara, teclado numerico)
- Animacoes/transicoes de loading durante login
- Estrutura interna dos componentes de layout (sidebar, bottom tabs)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Usuario pode fazer login com nome + PIN numerico (4-6 digitos) | Login via `signInWithPassword` using fictitious email + PIN as password. Nome-to-email slug function. See Architecture Patterns. |
| AUTH-02 | PIN armazenado como hash SHA-256 no banco | Per D-03, Supabase Auth handles bcrypt internally. `pin_hash` in `users` table stays as reference/audit only. SHA-256 in seed.sql is for the public table only. |
| AUTH-03 | Sessao mantida via JWT do Supabase | Standard Supabase SSR cookie-based session. `@supabase/ssr` already configured. Middleware refreshes token on every request (existing pattern). |
| AUTH-04 | Redirecionamento automatico por role apos login | Custom Access Token Hook injects role into JWT. Client reads role after login, redirects per D-08 mapping. |
| AUTH-05 | Cada role ve apenas as abas permitidas | Role-to-routes config map. AppShell component filters navigation items. Middleware enforces server-side. |
| AUTH-06 | Usuario pode fazer logout de qualquer tela | `supabase.auth.signOut()` clears session cookies. Redirect to `/login`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Tailwind + shadcn/ui -- non-negotiable
- **Realtime**: Via Supabase subscriptions (not relevant for this phase but no polling)
- **Comunicacao**: Sempre em portugues brasileiro -- all UI text in pt-BR
- **Hospedagem**: Vercel -- middleware must be Edge-compatible

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.10.0 | Server-side Supabase client with cookie management | Already installed, handles session refresh in middleware [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | Supabase client (auth, db, realtime) | Already installed [VERIFIED: package.json] |
| next | 14.2.35 | App Router, middleware, server components | Already installed [VERIFIED: package.json] |
| lucide-react | 1.7.0 | Icons for navigation tabs/sidebar | Already installed [VERIFIED: package.json] |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose | 6.2.2 | JWT verification in Edge middleware | Verify JWT signature before trusting claims in middleware [VERIFIED: npm registry] |
| sonner | latest | Toast notifications (shadcn Sonner) | Login error feedback (optional, per UI-SPEC) [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose | jwt-decode | jwt-decode does NOT verify signature -- insecure for middleware. jose is Edge-compatible and verifies. |
| Custom Access Token Hook | app_metadata via admin API | Hook is automatic on every token issue. Manual app_metadata requires admin API call and is not auto-synced. |

**Installation:**
```bash
npm install jose
npx shadcn@latest add button input card label sonner
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  login/
    page.tsx                  # Login page (Server Component wrapper)
  (authenticated)/
    layout.tsx                # AppShell with sidebar/bottom tabs
    dashboard/page.tsx        # Placeholder
    upload/page.tsx           # Placeholder
    fardos/page.tsx           # Placeholder
    prateleira/page.tsx       # Placeholder
    baixa/page.tsx            # Placeholder
  api/
    auth/
      login/route.ts          # Server-side login handler (nome lookup + signInWithPassword)
middleware.ts                  # Extended with role-based route protection

src/
  features/auth/
    components/
      login-form.tsx           # Client Component: login form
    hooks/
      use-auth.ts              # Auth context/hook for client-side role access
    lib/
      role-config.ts           # Role-to-routes mapping, redirect defaults
      slugify.ts               # Nome -> email slug conversion
  components/
    layout/
      app-shell.tsx            # Responsive layout (sidebar + bottom tabs)
      sidebar.tsx              # Desktop sidebar navigation
      bottom-tabs.tsx          # Mobile bottom tab navigation

supabase/
  migrations/
    00002_custom_claims_hook.sql  # Custom Access Token Hook function
```

### Pattern 1: Custom Access Token Hook (SQL)
**What:** PostgreSQL function that Supabase Auth calls before issuing every JWT. Injects `user_role` from the `users` table into the token claims.
**When to use:** Every authentication event (login, token refresh).
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Lookup role from public.users table using auth user id
  SELECT role INTO user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid
    AND ativo = true;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    -- Set custom claim for role
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', 'null');
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant permissions to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Auth admin needs to read users table for role lookup
GRANT SELECT ON TABLE public.users TO supabase_auth_admin;
```

**CRITICAL:** After deploying the migration, the hook must be **enabled manually** in the Supabase Dashboard: Authentication > Hooks > Custom Access Token > Enable and select the function. This is a human-action step.

### Pattern 2: Nome-to-Email Slug
**What:** Convert user display name to fictitious email for Supabase Auth.
**When to use:** User creation (Phase 10) and login lookup.
**Example:**
```typescript
// Source: D-02 decision
export function nomeToEmail(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')    // Replace non-alphanumeric with dash
    .replace(/^-|-$/g, '')           // Trim dashes
  return `${slug}@naraka.local`
}
```

### Pattern 3: Middleware JWT Verification with Role Extraction
**What:** Extend existing middleware to verify JWT, extract role, and enforce route permissions.
**When to use:** Every request to protected routes.
**Example:**
```typescript
// Source: https://github.com/supabase/supabase/issues/28000 + jose docs
import { jwtVerify } from 'jose'

// In middleware, after supabase.auth.getUser():
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  // Redirect to /login with returnTo parameter
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('returnTo', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

// Verify JWT and extract role
const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const { payload } = await jwtVerify(session.access_token, secret)
const userRole = payload.user_role as string

// Check route permission
const allowedRoutes = ROLE_ROUTES[userRole]
if (!allowedRoutes?.includes(currentRoute)) {
  // Redirect to role default
  return NextResponse.redirect(new URL(ROLE_DEFAULTS[userRole], request.url))
}
```

### Pattern 4: Login Flow (Client -> API Route -> Supabase Auth)
**What:** Login form submits nome + PIN. An API route (or direct client call) looks up the user by nome to get the email slug, then calls `signInWithPassword`.
**When to use:** Login form submission.
**Example:**
```typescript
// Client-side login (simplified)
const supabase = createClient()

// Option A: Direct client-side (simpler)
// 1. Convert nome to email slug on client
const email = nomeToEmail(nome)
// 2. Sign in with Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password: pin,
})
```

**Important nuance:** The nome-to-email conversion must be deterministic. If two users have the same nome slug, this breaks. The user creation flow (Phase 10) must enforce unique nomes. For this phase, assume unique nomes.

### Pattern 5: Role-to-Routes Configuration
**What:** Centralized config mapping roles to permitted routes and default redirects.
**Example:**
```typescript
// src/features/auth/lib/role-config.ts
import { UserRole } from '@/types'

export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/baixa'],
  lider: ['/dashboard', '/upload', '/fardos', '/prateleira'],
  separador: ['/prateleira'],
  fardista: ['/fardos', '/baixa'],
}

export const ROLE_DEFAULTS: Record<UserRole, string> = {
  admin: '/dashboard',
  lider: '/dashboard',
  separador: '/prateleira',
  fardista: '/fardos',
}
```

### Pattern 6: Route Group for Authenticated Pages
**What:** Use Next.js route group `(authenticated)` to share the AppShell layout across all protected pages.
**When to use:** All pages except `/login`.
**Example:**
```
app/
  login/page.tsx                    # No layout wrapper
  (authenticated)/
    layout.tsx                      # AppShell with sidebar/bottom tabs + auth check
    dashboard/page.tsx
    upload/page.tsx
    ...
```

The `(authenticated)/layout.tsx` fetches the user session server-side, extracts the role, and passes it to the AppShell component which renders the appropriate navigation items.

### Anti-Patterns to Avoid
- **Trusting getSession() without JWT verification in middleware:** `getSession()` reads from cookies which can be tampered. Always verify JWT with `jose` before trusting claims. [CITED: https://github.com/supabase/supabase/issues/28000]
- **Storing role only in app_metadata via admin API:** This requires a manual API call to update. The Custom Access Token Hook automatically syncs from the `users` table on every token issue.
- **Client-side only route protection:** Must be enforced in middleware. Client-side checks are UX convenience only.
- **Using getUser() in middleware to check role:** `getUser()` makes a network call to Supabase Auth server on every request -- too slow for middleware. JWT verification with `jose` is local and fast.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT verification | Manual base64 decode + JSON parse | `jose` library (`jwtVerify`) | Cryptographic verification, Edge-compatible, handles all JWT edge cases |
| Session management | Custom cookie/token system | Supabase Auth + `@supabase/ssr` | Handles refresh tokens, cookie rotation, CSRF automatically |
| Password hashing | SHA-256 or custom bcrypt | Supabase Auth `signInWithPassword` | Supabase uses bcrypt internally with proper salt rounds |
| Responsive navigation | Media query listeners in JS | Tailwind `md:hidden` / `md:block` | CSS-based, no JS hydration needed, matches breakpoint system |
| Slug generation | Simple string replace | Proper normalize + NFD + regex | Must handle accents (Joao -> joao, not jo\u00e3o), special chars |

**Key insight:** Supabase Auth already handles the hard crypto (bcrypt, JWT signing, token refresh). The custom work is limited to: (1) the hook function that reads `users.role`, (2) the middleware that verifies and routes, and (3) the UI components.

## Common Pitfalls

### Pitfall 1: Custom Access Token Hook Not Enabled in Dashboard
**What goes wrong:** Migration deploys the SQL function but tokens don't contain `user_role` claim.
**Why it happens:** The hook must be manually enabled in Supabase Dashboard (Authentication > Hooks). SQL migration alone is not enough.
**How to avoid:** Include a human-action checkpoint in the plan. Test by decoding a JWT after login to verify `user_role` is present.
**Warning signs:** `user_role` is `undefined` when decoding the JWT after login.

### Pitfall 2: Missing SUPABASE_JWT_SECRET Environment Variable
**What goes wrong:** `jose` `jwtVerify` fails in middleware, all requests error.
**Why it happens:** The JWT secret is separate from `SUPABASE_ANON_KEY`. It must be copied from Supabase Dashboard (Settings > API > JWT Secret).
**How to avoid:** Add `SUPABASE_JWT_SECRET` to `.env.local` and Vercel environment variables.
**Warning signs:** "JWSSignatureVerificationFailed" errors in middleware.

### Pitfall 3: Users Table Not Synced with Supabase Auth
**What goes wrong:** User exists in `auth.users` but not in `public.users`, or vice versa.
**Why it happens:** Creating a user in Supabase Auth does not auto-create a row in `public.users`. The hook function looks up `public.users` by `auth.users.id`.
**How to avoid:** When creating users (Phase 10), create in both `auth.users` (via admin API) and `public.users` in a transaction. For this phase, seed data must exist in both places.
**Warning signs:** Login succeeds but `user_role` is `null` in JWT.

### Pitfall 4: Middleware Running on Static Assets
**What goes wrong:** Middleware processes requests for `_next/static`, images, etc., causing performance issues.
**Why it happens:** Matcher config too broad.
**How to avoid:** The existing matcher already excludes `_next/static`, `_next/image`, `favicon.ico`. Extend to also exclude `/api/` if needed, or explicitly match only app routes.
**Warning signs:** Slow page loads, unnecessary redirects.

### Pitfall 5: Nome Slug Collisions
**What goes wrong:** Two users with same name generate identical email slugs, breaking authentication.
**Why it happens:** `nomeToEmail("Joao Silva")` always returns `joao-silva@naraka.local`.
**How to avoid:** Phase 10 (user management) must enforce unique nomes. For this phase, seed data should use distinct names. Consider appending a numeric suffix if collision detected.
**Warning signs:** Login authenticates as wrong user.

### Pitfall 6: Edge Runtime Compatibility
**What goes wrong:** Middleware fails because it uses Node.js-only APIs.
**Why it happens:** Next.js middleware runs in Edge Runtime, which doesn't support all Node.js APIs.
**How to avoid:** `jose` is Edge-compatible. Do NOT use `jsonwebtoken` (Node.js only). Do NOT use `Buffer` -- use `TextEncoder` instead. `@supabase/ssr` is already Edge-compatible.
**Warning signs:** "Dynamic code evaluation" or "Module not found" errors in middleware.

### Pitfall 7: Seed User Not in auth.users
**What goes wrong:** Current seed.sql creates a user in `public.users` but not in `auth.users`. Login will fail because `signInWithPassword` authenticates against `auth.users`.
**Why it happens:** The initial schema seed was created before the auth strategy was decided.
**How to avoid:** Create a seed script or API endpoint that creates the user in both `auth.users` (via admin client) and `public.users`. The IDs must match (use the same UUID).
**Warning signs:** "Invalid login credentials" error even with correct PIN.

## Code Examples

### Verified: Supabase signInWithPassword
```typescript
// Source: @supabase/supabase-js docs
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'joao-silva@naraka.local',
  password: '1234', // The PIN
})
// data.session contains access_token with custom claims
// data.user contains user metadata
```

### Verified: Supabase signOut
```typescript
// Source: @supabase/supabase-js docs
const { error } = await supabase.auth.signOut()
// Clears session cookies, invalidates refresh token
```

### Verified: jose JWT Verification (Edge-compatible)
```typescript
// Source: https://github.com/panva/jose
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const { payload } = await jwtVerify(accessToken, secret)
// payload.user_role = 'admin' | 'lider' | 'separador' | 'fardista'
```

### Verified: Supabase Admin Create User
```typescript
// Source: @supabase/supabase-js admin API
import { supabaseAdmin } from '@/lib/supabase/admin'

const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'joao-silva@naraka.local',
  password: '1234',
  email_confirm: true, // Skip email verification
  user_metadata: { nome: 'Joao Silva' },
})
// data.user.id must be used as id in public.users table
```

### Verified: Next.js Middleware Route Matching
```typescript
// Source: Next.js 14 docs
export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | New SSR package is framework-agnostic, already installed |
| `getSession()` trusted in middleware | `getSession()` + JWT verification via `jose` | 2024 | Security fix -- cookies can be tampered, JWT verification is mandatory |
| Manual app_metadata via admin API | Custom Access Token Hook | 2024 | Hook auto-syncs role from DB on every token issue |
| `jsonwebtoken` in middleware | `jose` | Ongoing | `jsonwebtoken` is Node.js only, not Edge-compatible |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install.
- `getSession()` without verification: Insecure in server contexts. Always verify JWT.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase project has Custom Access Token Hook feature enabled (requires Pro plan or newer free tier) | Architecture Patterns | Hook won't work; fallback would be manual app_metadata via admin API on user creation |
| A2 | `SUPABASE_JWT_SECRET` is available in the Supabase Dashboard under Settings > API | Common Pitfalls | Middleware JWT verification won't work without it |
| A3 | Nome uniqueness is enforced (no two users share the same slug) | Common Pitfalls | Login could authenticate as wrong user |
| A4 | sonner (toast) is the correct shadcn component name for the toast library | Standard Stack | May need to check shadcn registry for exact name |

## Open Questions

1. **Is Custom Access Token Hook available on the project's Supabase plan?**
   - What we know: Hooks are available on Pro plan and newer Free tier projects
   - What's unclear: Whether this specific project's Supabase instance supports it
   - Recommendation: Check Dashboard > Authentication > Hooks. If not available, fallback to setting `app_metadata` via admin API during user creation (less automatic but functional)

2. **Seed user synchronization strategy**
   - What we know: Current `seed.sql` creates a user in `public.users` only. For login to work, the user must also exist in `auth.users` with matching ID.
   - What's unclear: Whether to use a seed migration, a setup script, or an API endpoint
   - Recommendation: Create a TypeScript seed script that uses the admin client to create users in both `auth.users` and `public.users`. Run once during setup.

3. **Return-to-URL after forced login redirect**
   - What we know: D-11 says user should return to the route they tried to access after login
   - What's unclear: Best storage mechanism (URL param vs sessionStorage)
   - Recommendation: Use URL search param `?returnTo=/prateleira` -- simplest, works with server redirect. Validate that returnTo is a local path (prevent open redirect).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase project | Auth, DB | Assumed | - | None -- required |
| SUPABASE_JWT_SECRET | Middleware JWT verify | Not checked | - | Cannot skip -- must obtain from Dashboard |
| jose (npm) | JWT verification | Not installed | 6.2.2 (registry) | None -- must install |
| shadcn CLI | Component installation | Available via npx | - | Manual copy |

**Missing dependencies with no fallback:**
- `jose` must be installed (`npm install jose`)
- `SUPABASE_JWT_SECRET` must be added to `.env.local`

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not yet configured (no test framework detected in project) |
| Config file | None -- see Wave 0 |
| Quick run command | TBD after framework setup |
| Full suite command | TBD after framework setup |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with nome + PIN returns session | integration | Manual test via browser | N/A |
| AUTH-02 | PIN stored as hash | unit (seed verification) | Manual DB check | N/A |
| AUTH-03 | Session maintained via JWT | integration | Manual test -- navigate after login | N/A |
| AUTH-04 | Role-based redirect after login | unit | Test role config mapping | N/A |
| AUTH-05 | Role sees only permitted tabs | unit | Test ROLE_ROUTES config | N/A |
| AUTH-06 | Logout from any page | integration | Manual test via browser | N/A |

### Sampling Rate
- **Per task commit:** `npm run build` (type checking + compilation)
- **Per wave merge:** `npm run build` + manual login test
- **Phase gate:** Full manual walkthrough of all 4 roles

### Wave 0 Gaps
- No test framework installed. For this phase, validation is primarily through `npm run build` (TypeScript compilation) and manual browser testing. Test framework setup is deferred to a future phase as the project has no testing infrastructure yet.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth bcrypt + signInWithPassword |
| V3 Session Management | yes | Supabase JWT + cookie-based sessions via @supabase/ssr |
| V4 Access Control | yes | Middleware role verification + route config |
| V5 Input Validation | yes | PIN: numeric 4-6 digits validation, nome: string sanitization |
| V6 Cryptography | no | Delegated to Supabase Auth (bcrypt, JWT signing) |

### Known Threat Patterns for Supabase Auth + Next.js

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session cookie tampering | Tampering | JWT signature verification via jose in middleware |
| User enumeration via login errors | Information Disclosure | Generic error message "Nome ou PIN incorreto" (D-06) |
| PIN brute force | Elevation of Privilege | Supabase Auth built-in rate limiting + short PIN = limited attempts |
| Open redirect via returnTo param | Spoofing | Validate returnTo is local path (starts with `/`, no protocol) |
| Stale role in JWT after role change | Elevation of Privilege | Custom Access Token Hook re-reads role on every token refresh |

## Sources

### Primary (HIGH confidence)
- Supabase official docs: Custom Claims RBAC -- https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- Supabase official docs: Custom Access Token Hook -- https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- GitHub Issue #28000: JWT verification in Next.js middleware -- https://github.com/supabase/supabase/issues/28000
- Existing codebase: `middleware.ts`, `src/lib/supabase/*.ts`, `supabase/migrations/00001_initial_schema.sql`

### Secondary (MEDIUM confidence)
- jose npm package (Edge-compatible JWT) -- https://github.com/panva/jose
- Next.js 14 middleware documentation -- https://nextjs.org/docs/app/building-your-application/routing/middleware

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already installed and verified, only `jose` needs adding
- Architecture: HIGH -- Custom Access Token Hook is the officially documented Supabase RBAC pattern, middleware approach is well-established
- Pitfalls: HIGH -- based on official docs and verified GitHub issues

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable -- Supabase Auth and Next.js 14 are mature)

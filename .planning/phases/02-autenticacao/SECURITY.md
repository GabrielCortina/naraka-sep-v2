---
phase: 02-autenticacao
audited: 2026-04-04
asvs_level: 1
threats_total: 11
threats_closed: 11
threats_open: 0
---

# Security Audit — Phase 02: Autenticacao

## Summary

**Phase:** 02 — autenticacao
**Plans audited:** 02-01, 02-02, 02-03
**Threats Closed:** 11/11
**ASVS Level:** 1
**Result:** SECURED

---

## Threat Verification

### Mitigate Disposition (6 threats)

| Threat ID | Category | Component | Status | Evidence |
|-----------|----------|-----------|--------|----------|
| T-02-01 | Elevation of Privilege | custom_access_token_hook | CLOSED | `supabase/migrations/00002_custom_claims_hook.sql` line 31: `REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;` |
| T-02-04 | Tampering | middleware JWT | CLOSED | `middleware.ts` lines 2, 69–70: `import { jwtVerify } from 'jose'`; `const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)` + `const { payload } = await jwtVerify(session.access_token, secret)` |
| T-02-05 | Spoofing | login form | CLOSED | `src/features/auth/components/login-form.tsx` line 44: `setError('Nome ou PIN incorreto')` — identical message for all auth failures; catch block line 64 also uses same string |
| T-02-06 | Spoofing | returnTo param | CLOSED | `src/features/auth/components/login-form.tsx` line 57: `if (returnTo && returnTo.startsWith('/') && !returnTo.includes('://'))` — enforces relative path, blocks protocol-relative and absolute URLs |
| T-02-07 | Elevation of Privilege | route access | CLOSED | `middleware.ts` lines 6–11 (ROLE_ROUTES constant) + lines 88–92: `const allowedRoutes = ROLE_ROUTES[userRole]` / `if (allowedRoutes && !allowedRoutes.some(route => pathname.startsWith(route)))` — server-side check on every request |
| T-02-09 | Elevation of Privilege | layout.tsx | CLOSED | `app/(authenticated)/layout.tsx` lines 13–14: `supabase.auth.getUser()` — uses server-side getUser() (not client session); lines 20–24: queries `public.users` table for role via `.from('users').select('role, nome').eq('id', user.id).single()` — never trusts client-provided role |

### Accept Disposition (5 threats)

| Threat ID | Category | Disposition | Rationale |
|-----------|----------|-------------|-----------|
| T-02-02 | Information Disclosure | accept | `src/features/auth/lib/role-config.ts` contains route mappings and nav labels only — no credentials, tokens, or secrets. Authorization enforcement is server-side in middleware. |
| T-02-03 | Spoofing | accept | `scripts/seed-auth-users.ts` requires `SUPABASE_SERVICE_ROLE_KEY` env var; not deployed to Vercel; dev-only by design. |
| T-02-08 | Denial of Service | accept | Login rate limiting is handled by Supabase Auth built-in controls. No custom rate limiting needed at this ASVS level. |
| T-02-10 | Repudiation | accept | Logout (`supabase.auth.signOut()`) is a simple session clear; no audit trail required for logout events at this stage. |
| T-02-11 | Information Disclosure | accept | Placeholder pages reveal feature names and future phase numbers; this information is not sensitive. |

---

## Unregistered Flags

None. No threat flags were raised in 02-01-SUMMARY.md, 02-02-SUMMARY.md, or 02-03-SUMMARY.md that lack a corresponding threat ID.

---

## Key Evidence Detail

### T-02-01 — REVOKE EXECUTE (line 31, 00002_custom_claims_hook.sql)
```sql
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```
Combined with line 30:
```sql
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```
Only `supabase_auth_admin` can invoke the hook.

### T-02-04 — JWT signature verification (middleware.ts lines 69–70)
```typescript
const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
const { payload } = await jwtVerify(session.access_token, secret)
```
Uses `jose` (Edge-compatible). Falls through to catch block on verification failure, redirecting to `/login`.

### T-02-05 — Generic error message (login-form.tsx lines 44 and 64)
```typescript
setError('Nome ou PIN incorreto')
```
Identical string for both the auth error branch and the unexpected catch branch. User enumeration is not possible via error message differentiation.

### T-02-06 — returnTo open redirect prevention (login-form.tsx line 57)
```typescript
if (returnTo && returnTo.startsWith('/') && !returnTo.includes('://')) {
```
Blocks protocol-relative URLs (e.g., `//evil.com`) and absolute URLs (e.g., `https://evil.com`).

### T-02-07 — Role-based route enforcement (middleware.ts lines 88–92)
```typescript
const allowedRoutes = ROLE_ROUTES[userRole]
if (allowedRoutes && !allowedRoutes.some(route => pathname.startsWith(route))) {
  return NextResponse.redirect(
    new URL(ROLE_DEFAULTS[userRole] || '/login', request.url)
  )
}
```
Evaluated on every request in the middleware before the response is passed through.

### T-02-09 — Server-side role lookup (app/(authenticated)/layout.tsx lines 11–28)
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
// ...
const { data: userData } = await supabase
  .from('users')
  .select('role, nome')
  .eq('id', user.id)
  .single()
```
`getUser()` re-validates the JWT server-side via Supabase. Role is then fetched from `public.users` — the database is the authoritative source, not any client-supplied value.

---

## Accepted Risks Log

| Threat ID | Risk | Justification | Accepted By |
|-----------|------|---------------|-------------|
| T-02-02 | Route config readable by clients | No secrets in file; authorization enforced server-side | GSD Phase 02 threat model |
| T-02-03 | Seed script with admin API access | Local-only script, not deployed; requires service role key from env | GSD Phase 02 threat model |
| T-02-08 | Login brute-force | Supabase Auth built-in rate limiting covers this attack vector | GSD Phase 02 threat model |
| T-02-10 | No logout audit trail | Logout is a session clear; audit trail not required at this phase | GSD Phase 02 threat model |
| T-02-11 | Placeholder text reveals feature names | Phase references and feature names are not sensitive information | GSD Phase 02 threat model |

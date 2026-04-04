---
phase: 02
slug: autenticacao
status: secured
threats_open: 0
asvs_level: 1
created: 2026-04-04
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Supabase Auth | Login credentials (nome + PIN) cross client→server | Credentials (sensitive) |
| Supabase Auth → JWT | Custom Access Token Hook injects role claim | user_role claim |
| Browser → Next.js Middleware | JWT token on every request | Access token (sensitive) |
| Middleware → App Routes | Verified role passed to route handlers | user_role (verified) |
| Server Layout → Supabase DB | Server-side role lookup from database | user_id → role mapping |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Elevation of Privilege | custom_access_token_hook | mitigate | REVOKE EXECUTE from authenticated/anon/public; only supabase_auth_admin can call | closed |
| T-02-02 | Information Disclosure | role-config.ts | accept | Route config contains no secrets; enforcement is server-side | closed |
| T-02-03 | Spoofing | seed script | accept | Script is dev-only, requires service role key, not deployed | closed |
| T-02-04 | Tampering | middleware JWT | mitigate | jwtVerify with jose + SUPABASE_JWT_SECRET verifies signature before trusting claims | closed |
| T-02-05 | Spoofing | login form | mitigate | Generic error "Nome ou PIN incorreto" prevents user enumeration | closed |
| T-02-06 | Spoofing | returnTo param | mitigate | Validates returnTo starts with '/' and does not contain '://' (prevents open redirect) | closed |
| T-02-07 | Elevation of Privilege | route access | mitigate | Middleware checks ROLE_ROUTES server-side on every request; unauthorized → default route | closed |
| T-02-08 | Denial of Service | login form | accept | Supabase Auth has built-in rate limiting | closed |
| T-02-09 | Elevation of Privilege | layout.tsx | mitigate | Server-side getUser() + database role lookup; does not trust client-provided role | closed |
| T-02-10 | Repudiation | signOut | accept | Logout is session clear; no audit trail needed | closed |
| T-02-11 | Information Disclosure | placeholder pages | accept | Placeholder text (feature names, phase numbers) is not sensitive | closed |

---

## Accepted Risks

| Threat ID | Risk | Justification |
|-----------|------|---------------|
| T-02-02 | Client-readable route config | Contains no secrets; enforcement is server-side in middleware |
| T-02-03 | Seed script creates users | Dev-only, requires service_role key from env, never deployed |
| T-02-08 | No custom rate limiting on login | Supabase Auth built-in rate limiting covers brute-force scenarios |
| T-02-10 | No logout audit trail | Simple session clear; logout events not business-critical |
| T-02-11 | Feature names visible in placeholders | Phase numbers and feature names are not sensitive information |

---

## Audit Trail

### Security Audit 2026-04-04

| Metric | Count |
|--------|-------|
| Threats found | 11 |
| Closed | 11 |
| Open | 0 |

**Evidence:**
- T-02-01: `supabase/migrations/00002_custom_claims_hook.sql:31` — REVOKE EXECUTE confirmed
- T-02-04: `middleware.ts:69-70` — jwtVerify with jose + secret
- T-02-05: `src/features/auth/components/login-form.tsx:44,64` — identical generic error string
- T-02-06: `src/features/auth/components/login-form.tsx:57` — returnTo validation
- T-02-07: `middleware.ts:88-92` — ROLE_ROUTES checked server-side
- T-02-09: `app/(authenticated)/layout.tsx:13-14,20-24` — getUser() + DB role lookup

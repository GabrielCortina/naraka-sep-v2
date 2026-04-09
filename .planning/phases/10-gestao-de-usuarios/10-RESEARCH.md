# Phase 10: Gestao de Usuarios - Research

**Researched:** 2026-04-09
**Domain:** User management CRUD (Supabase Auth + public.users), admin-only access control
**Confidence:** HIGH

## Summary

This phase implements an admin-only user management screen with full CRUD operations. The system already has all foundational pieces in place: Supabase Auth with `admin.createUser`/`admin.updateUserById`, the `public.users` table with `ativo` flag, the `nomeToEmail` slug function, role-based middleware protection, and established API route patterns. The work is primarily assembling existing patterns into a new feature page.

The key complexity is the dual-write requirement: every user operation must synchronize Supabase Auth (`auth.users`) and the application table (`public.users`). The seed script (`scripts/seed-auth-users.ts`) already demonstrates this exact pattern. PIN handling requires hashing via Supabase Auth (password field), not manual hashing.

**Critical finding:** The current login flow (`src/features/auth/components/login-form.tsx`) does NOT check the `ativo` field. D-10 requires this. This phase MUST add an `ativo` check to the login flow so deactivated users cannot log in.

**Primary recommendation:** Follow the seed script pattern for create/update flows. Use `supabaseAdmin.auth.admin.*` methods for Auth operations and `supabaseAdmin.from('users').*` for the public table. Build API routes for user CRUD, a client page with table + modal, and patch the login flow to check `ativo`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tabela simples com colunas Nome, Role, Status (ativo/inativo), Acoes (editar, toggle ativo)
- **D-02:** Botao "+ Novo Usuario" no topo da pagina
- **D-03:** No mobile, tabela adapta para formato responsivo (cards ou tabela compacta -- Claude's discretion)
- **D-04:** Formulario em modal/dialog (shadcn/ui Dialog) com 3 campos: nome (texto), PIN (numerico 4-6 digitos com confirmacao 2x), role (select com 4 opcoes: admin, lider, separador, fardista)
- **D-05:** Ao criar, sistema cria usuario no Supabase Auth via `admin.createUser` (email ficticio `nome@naraka.local` + PIN como senha) e upsert na tabela public.users -- mesmo padrao do seed script
- **D-06:** Feedback: modal fecha, toast verde "Usuario criado com sucesso", tabela atualiza. Se erro, toast vermelho com mensagem
- **D-07:** Admin pode editar nome, role e PIN de qualquer usuario. PIN aparece como campo opcional no modal de edicao (so preenche se quiser resetar)
- **D-08:** Edicao atualiza Supabase Auth (updateUserById para email/senha se mudou nome/PIN) e tabela public.users
- **D-09:** Desativacao via toggle ativo/inativo na tabela com dialog de confirmacao antes de desativar ("Tem certeza? Usuario nao conseguira mais logar"). Reativar nao pede confirmacao
- **D-10:** Desativar seta `ativo = false` na tabela users. Login deve verificar campo `ativo` antes de permitir acesso
- **D-11:** Qualquer admin pode editar/desativar qualquer usuario, incluindo outros admins, sem restricoes
- **D-12:** Protecao via middleware (rota /usuarios so acessivel por admin) + role check na API route (mesmo padrao existente: getUser() -> dbUser.role check)
- **D-13:** Operacoes de escrita via supabaseAdmin (service role key), nao pelo client do usuario

### Claude's Discretion
- Adaptacao mobile da tabela (responsive table vs card list)
- Design exato do modal (spacing, labels, validacao visual)
- Icones para acoes na tabela (editar, desativar/ativar)
- Loading states e skeleton durante fetch de usuarios
- Ordem de exibicao dos usuarios na tabela (por nome, por role, por data criacao)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| USER-01 | Admin pode criar novos usuarios (nome, PIN, role) | Seed script pattern (admin.createUser + upsert public.users) fully documented. nomeToEmail slug function exists at `src/features/auth/lib/slugify.ts`. API route pattern from `app/api/cards/assign/route.ts`. |
| USER-02 | Admin pode editar usuarios existentes | Supabase Auth `admin.updateUserById` supports email+password update. public.users update via supabaseAdmin. PIN optional on edit (D-07). |
| USER-03 | Admin pode desativar usuarios | Toggle `ativo` field on public.users table. Login flow MUST be patched to check `ativo` (currently missing -- VERIFIED). Confirmation dialog for deactivation only. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | App framework, API routes, server components | Project stack [VERIFIED: package.json] |
| @supabase/supabase-js | (project version) | Auth admin API + DB operations | Project stack [VERIFIED: package.json] |
| shadcn/ui | (project configured) | Dialog, Table, Switch, Input, Select, Button, Label, Badge, Sonner | Project UI library [VERIFIED: components.json + src/components/ui/] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | (project version) | Icons (Users, Pencil, etc.) | Nav item icon, table action icons |

### New shadcn Components to Install
| Component | Purpose |
|-----------|---------|
| Table | User list table (TableHeader, TableBody, TableRow, TableHead, TableCell) |
| Switch | Ativo/inativo toggle in table actions column |

**Installation:**
```bash
npx shadcn@latest add table switch
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/users/
  components/
    users-table.tsx          # Table + mobile card list
    user-form-dialog.tsx     # Create/edit modal
    deactivate-dialog.tsx    # Confirmation for deactivation
    user-card.tsx            # Mobile card representation
  hooks/
    use-users.ts             # Fetch + mutate users (SWR or simple state)
  lib/
    user-actions.ts          # Server-side helpers if needed

app/(authenticated)/usuarios/
  page.tsx                   # Server component: auth check, render client
  usuarios-client.tsx        # Client component: state, modals, table

app/api/users/
  route.ts                   # GET (list) + POST (create)
  [id]/route.ts              # PATCH (edit) + (toggle ativo)
```

### Pattern 1: Dual-Write (Auth + public.users)
**What:** Every user mutation must update both Supabase Auth and public.users in sequence.
**When to use:** Create, edit (name/PIN change), and potentially deactivation.
**Example:**
```typescript
// Source: scripts/seed-auth-users.ts (existing pattern) [VERIFIED]
// CREATE flow:
const email = nomeToEmail(nome)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
  user_metadata: { nome },
})
// Then upsert public.users with the auth user ID
await supabaseAdmin.from('users').upsert({
  id: data.user.id,
  nome,
  pin_hash: 'supabase-auth-managed',
  role,
  ativo: true,
}, { onConflict: 'id' })
```

### Pattern 2: API Route Auth (admin-only)
**What:** Standard auth + role check pattern for API routes.
**When to use:** All /api/users/* routes.
**Example:**
```typescript
// Source: app/api/cards/assign/route.ts (existing pattern) [VERIFIED]
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
}
const { data: dbUser } = await supabaseAdmin
  .from('users').select('role').eq('id', user.id).single()
if (!dbUser || dbUser.role !== 'admin') {
  return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
}
```

### Pattern 3: Page Structure (Server + Client)
**What:** Server component handles auth, client component handles interactivity.
**When to use:** The /usuarios page.
**Example:**
```typescript
// Source: app/(authenticated)/fardos/page.tsx (existing pattern) [VERIFIED]
export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userData } = await supabase
    .from('users').select('role, nome').eq('id', user.id).single()
  if (!userData) redirect('/login')
  return <UsuariosClient userRole={userData.role} />
}
```

### Pattern 4: Middleware Route Registration
**What:** Add /usuarios to ROLE_ROUTES for admin in both role-config.ts and middleware.ts (inlined copy).
**When to use:** Required for route protection.
**Critical detail:** middleware.ts has an INLINED copy of ROLE_ROUTES (Edge Runtime cannot resolve path aliases). BOTH files must be updated. [VERIFIED: middleware.ts lines 5-10 vs role-config.ts lines 7-12]
```typescript
// middleware.ts (line 6) -- ADD /usuarios to admin array
admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao', '/baixa', '/usuarios'],

// src/features/auth/lib/role-config.ts (line 8) -- ADD /usuarios to admin array
admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao', '/baixa', '/usuarios'],

// NAV_ITEMS -- ADD entry
{ label: 'Usuarios', href: '/usuarios', icon: 'Users', roles: ['admin'] },
```

### Anti-Patterns to Avoid
- **Using client-side Supabase for writes:** All write operations MUST use `supabaseAdmin` (service role key) via API routes, not the user's client. [VERIFIED: D-13]
- **Forgetting to update middleware.ts:** The middleware has an inlined copy of ROLE_ROUTES that does NOT import from role-config.ts. Updating only one breaks route protection. [VERIFIED: middleware.ts lines 5-10]
- **Hashing PIN manually:** PIN is stored as Supabase Auth password. Never hash it manually; Supabase handles hashing. The `pin_hash` field in public.users is set to `'supabase-auth-managed'`. [VERIFIED: seed script line 98]
- **Deleting users:** Use soft delete (ativo=false), never Supabase Auth deleteUser. The user record must remain for FK references in atribuicoes, trafego_fardos, baixados, etc. [VERIFIED: schema FK constraints]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email slug generation | Custom slug logic | `nomeToEmail` from `src/features/auth/lib/slugify.ts` | Already handles NFD normalization, accent removal, edge cases |
| Form validation UI | Custom error display | shadcn Input + inline error text pattern | Consistent with existing modals |
| Confirmation dialog | Custom modal | shadcn AlertDialog or Dialog with explicit confirm/cancel | Radix handles focus trap, escape key, accessibility |
| Toast notifications | Custom notification | Sonner (already configured) | Project standard for feedback |
| Route protection | Custom auth wrapper | Existing middleware.ts + API route auth pattern | Already handles JWT validation, role check, redirect |

## Common Pitfalls

### Pitfall 1: Name Change Requires Email Update in Auth
**What goes wrong:** Admin changes user nome but forgets to update the email in Supabase Auth. Login breaks because email is derived from nome.
**Why it happens:** Email is `nomeToEmail(nome)` -- a deterministic slug. Changing nome changes the expected email.
**How to avoid:** On edit, if nome changed, call `admin.updateUserById(id, { email: nomeToEmail(newNome) })`.
**Warning signs:** User cannot log in after name edit.

### Pitfall 2: Duplicate Email in Auth
**What goes wrong:** Creating a user with a name that slugifies to the same email as an existing user (e.g., "Jose da Silva" and "Jose Da Silva").
**Why it happens:** `nomeToEmail` normalizes names, so similar names can collide.
**How to avoid:** Check for existing email in Auth before creating. Handle the `user_already_exists` error gracefully with a user-friendly message like "Ja existe um usuario com nome similar."
**Warning signs:** Auth createUser returns error about duplicate email.

### Pitfall 3: Deactivated User Still Has Active Session
**What goes wrong:** After setting `ativo = false`, the user's existing JWT remains valid until expiry.
**Why it happens:** JWT-based auth doesn't revoke on flag change. The middleware/API routes only check `ativo` if they query the DB.
**How to avoid:** Accept that sessions expire naturally (short JWT TTL). The login flow check (Pitfall 5 fix) prevents new logins. For immediate effect, could optionally call `admin.signOut` for the deactivated user's sessions.
**Warning signs:** Deactivated user continues using the app until token refresh fails.

### Pitfall 4: Middleware ROLE_ROUTES Out of Sync
**What goes wrong:** /usuarios added to role-config.ts but not to middleware.ts inline copy (or vice versa).
**Why it happens:** Edge Runtime cannot resolve path aliases, so middleware has its own copy.
**How to avoid:** Always update BOTH files. Add a comment in middleware.ts referencing role-config.ts.
**Warning signs:** Admin gets redirected away from /usuarios despite being admin.

### Pitfall 5: Login Does NOT Check ativo Field (VERIFIED -- must fix)
**What goes wrong:** Deactivated users can still log in.
**Why it happens:** Current login-form.tsx authenticates via `signInWithPassword` and extracts role from JWT/DB, but NEVER queries the `ativo` field from public.users. [VERIFIED: src/features/auth/components/login-form.tsx lines 38-76]
**How to avoid:** After successful Supabase Auth login, query public.users for `ativo`. If `ativo === false`, call `supabase.auth.signOut()` and show error "Usuario desativado. Contate o administrador."
**Warning signs:** Deactivated user logs in successfully.
**File to modify:** `src/features/auth/components/login-form.tsx` -- add ativo check after line 48 (successful auth) and before role extraction.

## Code Examples

### Supabase Auth Admin Create User
```typescript
// Source: scripts/seed-auth-users.ts [VERIFIED]
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nomeToEmail } from '@/features/auth/lib/slugify'

const email = nomeToEmail(nome)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
  user_metadata: { nome },
})
```

### Supabase Auth Admin Update User
```typescript
// Source: Supabase Auth admin API [ASSUMED]
const updates: Record<string, unknown> = {}
if (nomeChanged) updates.email = nomeToEmail(newNome)
if (pinProvided) updates.password = newPin
if (Object.keys(updates).length > 0) {
  await supabaseAdmin.auth.admin.updateUserById(userId, updates)
}
```

### Toggle Ativo
```typescript
// Source: project schema pattern [VERIFIED]
await supabaseAdmin
  .from('users')
  .update({ ativo: newAtivoValue })
  .eq('id', userId)
```

### Fetch All Users (for table)
```typescript
// Source: project pattern [VERIFIED]
const { data: users } = await supabaseAdmin
  .from('users')
  .select('id, nome, role, ativo, created_at')
  .order('nome', { ascending: true })
```

### Login Ativo Check (to add to login-form.tsx)
```typescript
// Source: research finding [VERIFIED: login-form.tsx lacks this check]
// After successful signInWithPassword (line ~48), before role extraction:
const { data: userRecord } = await supabase
  .from('users')
  .select('ativo')
  .eq('id', data.user.id)
  .single()

if (!userRecord?.ativo) {
  await supabase.auth.signOut()
  setError('Usuario desativado. Contate o administrador.')
  setLoading(false)
  return
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual PIN hashing (SHA-256) | Supabase Auth manages password hashing | Phase 2 decision | PIN stored as Supabase Auth password, not manual hash |
| Direct DB operations from client | API routes with supabaseAdmin | Project convention | All writes go through server-side API routes |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `admin.updateUserById` accepts `{ email, password }` for updating both fields | Code Examples | Would need to find correct API signature -- LOW risk, well-documented Supabase API |

**A2 resolved:** Login flow confirmed to NOT check `ativo`. Verified by reading `src/features/auth/components/login-form.tsx` -- no query to `ativo` field exists in the entire file.

## Open Questions (RESOLVED)

1. **Session invalidation on deactivation?** (RESOLVED)
   - What we know: JWT tokens remain valid until expiry even after ativo=false. The login ativo check prevents NEW logins but does not kill existing sessions.
   - What's unclear: Whether immediate session kill is required or natural expiry is acceptable
   - Recommendation: Natural expiry is likely fine for warehouse context (short sessions, shared devices). Could optionally add `admin.signOut` call as enhancement but not blocking.
   - **RESOLVED:** Natural JWT expiry acceptable for warehouse context. No immediate session kill required. Short session lifetimes on shared devices mean deactivated users lose access quickly. Login ativo check (D-10) prevents new logins.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (jsdom environment) |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/features/users/` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| USER-01 | Create user: nomeToEmail slug, dual-write Auth+DB, validation (PIN length, required fields) | unit | `npx vitest run src/features/users/lib/__tests__/user-validation.test.ts -x` | Wave 0 |
| USER-02 | Edit user: name change updates email, PIN optional, role change | unit | `npx vitest run src/features/users/lib/__tests__/user-validation.test.ts -x` | Wave 0 |
| USER-03 | Deactivate user: toggle ativo flag, login ativo check | unit | `npx vitest run src/features/users/lib/__tests__/user-validation.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/users/`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/users/lib/__tests__/user-validation.test.ts` -- covers validation logic (PIN length, name required, email slug generation)
- [ ] Test for duplicate name/email detection logic

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth admin API (createUser, updateUserById) |
| V3 Session Management | partial | JWT via Supabase; deactivated user session expiry concern |
| V4 Access Control | yes | Middleware route protection + API route role check (admin only) |
| V5 Input Validation | yes | PIN length 4-6 digits, nome non-empty, role from enum |
| V6 Cryptography | no | Supabase Auth handles password hashing internally |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation via API | Elevation of Privilege | API route checks dbUser.role === 'admin' via supabaseAdmin lookup |
| Direct DB manipulation bypassing Auth | Tampering | RLS enabled on users table; writes only via supabaseAdmin (service role) in API routes |
| Deactivated user retains access | Elevation of Privilege | Login checks ativo flag (D-10 -- must be added); short JWT TTL for natural expiry |
| IDOR on user edit/deactivate | Information Disclosure / Tampering | Admin can edit any user (D-11) so IDOR is by design; non-admin blocked at role check |

## Sources

### Primary (HIGH confidence)
- `scripts/seed-auth-users.ts` -- Full create user flow pattern (Auth + public.users)
- `app/api/cards/assign/route.ts` -- API route auth + role check pattern
- `middleware.ts` -- Route protection with inlined ROLE_ROUTES
- `src/features/auth/lib/role-config.ts` -- NAV_ITEMS and ROLE_ROUTES structure
- `src/features/auth/lib/slugify.ts` -- nomeToEmail function
- `supabase/migrations/00001_initial_schema.sql` -- users table schema (role CHECK, ativo field)
- `app/(authenticated)/fardos/page.tsx` -- Page pattern (server auth + client component)
- `src/features/auth/components/login-form.tsx` -- Verified: no ativo check present
- `.planning/phases/10-gestao-de-usuarios/10-UI-SPEC.md` -- UI design contract

### Secondary (MEDIUM confidence)
- Supabase Auth Admin API docs -- `admin.updateUserById` signature [ASSUMED based on training]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, patterns established
- Architecture: HIGH -- follows existing project patterns exactly (feature-based, API routes, server+client pages)
- Pitfalls: HIGH -- identified from codebase analysis (dual middleware, dual-write, ativo check verified)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable -- project patterns well-established)

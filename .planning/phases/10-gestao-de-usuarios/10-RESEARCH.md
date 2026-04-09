# Phase 10: Gestao de Usuarios - Research

**Researched:** 2026-04-09
**Domain:** User CRUD admin panel (Next.js 14 + Supabase Auth + shadcn/ui)
**Confidence:** HIGH

## Summary

This phase implements an admin-only user management screen at `/usuarios` where admins can create, edit, and deactivate system users. The system already has a complete auth foundation (Phase 2) with Supabase Auth + fictitious email pattern + PIN-as-password, a seed script demonstrating the exact creation flow, and an established API route auth pattern. The UI-SPEC is already approved with detailed layout contracts.

The core challenge is straightforward CRUD: 3 API routes (list, create/update, toggle-active), a page with table/card views, and modal dialogs for forms. All building blocks exist -- the seed script's `admin.createUser` flow maps directly to the create API, `admin.updateUserById` handles edits, and the `ativo` boolean column handles soft-delete. Navigation and middleware need `/usuarios` added to admin routes.

**Primary recommendation:** Follow the seed script pattern exactly for Supabase Auth operations. Use `supabaseAdmin` (service role) for all writes. Install shadcn Table, Switch, and AlertDialog components. Build 3 API routes and 4 client components per UI-SPEC.

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
- **D-09:** Desativacao via toggle ativo/inativo na tabela com dialog de confirmacao antes de desativar. Reativar nao pede confirmacao
- **D-10:** Desativar seta `ativo = false` na tabela users. Login deve verificar campo `ativo` antes de permitir acesso
- **D-11:** Qualquer admin pode editar/desativar qualquer usuario, incluindo outros admins, sem restricoes
- **D-12:** Protecao via middleware (rota /usuarios so acessivel por admin) + role check na API route
- **D-13:** Operacoes de escrita via supabaseAdmin (service role key), nao pelo client do usuario

### Claude's Discretion
- Adaptacao mobile da tabela (responsive table vs card list)
- Design exato do modal (spacing, labels, validacao visual)
- Icones para acoes na tabela (editar, desativar/ativar)
- Loading states e skeleton durante fetch de usuarios
- Ordem de exibicao dos usuarios na tabela (por nome, por role, por data criacao)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| USER-01 | Admin pode criar novos usuarios (nome, PIN, role) | Seed script pattern verified: `admin.createUser` + `nomeToEmail` slug + upsert public.users. API route pattern from `cards/assign/route.ts` |
| USER-02 | Admin pode editar usuarios existentes | `admin.updateUserById` for Auth changes (email if name changed, password if PIN changed) + `supabaseAdmin.from('users').update()` for public.users |
| USER-03 | Admin pode desativar usuarios | Toggle `ativo` boolean in public.users. Login flow must check `ativo` field. Deactivation dialog per D-09 |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.35 | Framework | Project stack [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | Auth admin operations | `admin.createUser`, `admin.updateUserById` [VERIFIED: package.json] |
| @supabase/ssr | 0.10.0 | Server-side auth | API route auth check [VERIFIED: package.json] |
| lucide-react | 1.7.0 | Icons | Users, Pencil icons [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast notifications | Success/error feedback [VERIFIED: package.json] |

### To Install (shadcn components)
| Component | Purpose | Why Needed |
|-----------|---------|------------|
| Table | User list table | UI-SPEC requires semantic table markup [VERIFIED: not in src/components/ui/] |
| Switch | Ativo/inativo toggle | UI-SPEC requires toggle in actions column [VERIFIED: not in src/components/ui/] |
| AlertDialog | Deactivation confirmation | UI-SPEC requires non-dismissable confirm dialog [VERIFIED: not in src/components/ui/] |

**Installation:**
```bash
npx shadcn@latest add table switch alert-dialog
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/users/
  components/
    users-table.tsx        # Table (desktop) + card list (mobile) with actions
    user-form-dialog.tsx   # Create/edit modal with form validation
    deactivate-dialog.tsx  # AlertDialog for deactivation confirmation
    user-card.tsx          # Mobile card representation of a user row
  hooks/
    use-users.ts           # Client-side fetch/mutate hook (SWR or manual)
  lib/
    user-actions.ts        # Shared types/validation for API requests
app/(authenticated)/usuarios/
  page.tsx                 # Server component: auth check + initial data fetch + client wrapper
app/api/users/
  route.ts                 # GET (list) + POST (create)
  [id]/
    route.ts               # PATCH (edit)
  [id]/toggle/
    route.ts               # PATCH (toggle ativo)
```

### Pattern 1: API Route Auth (established project pattern)
**What:** Every API route authenticates via `createClient() -> getUser()`, checks role via `supabaseAdmin` DB lookup, writes via `supabaseAdmin`
**When to use:** All 3 API routes in this phase
**Example:**
```typescript
// Source: app/api/cards/assign/route.ts (existing project pattern)
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }
  // ... write operations via supabaseAdmin
}
```

### Pattern 2: User Creation (from seed script)
**What:** Create user in Supabase Auth + upsert in public.users with same ID
**When to use:** POST /api/users
**Example:**
```typescript
// Source: scripts/seed-auth-users.ts (existing project pattern)
import { nomeToEmail } from '@/features/auth/lib/slugify'

const email = nomeToEmail(nome)
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: pin,
  email_confirm: true,
  user_metadata: { nome },
})

if (error) throw error

await supabaseAdmin.from('users').upsert({
  id: data.user.id,
  nome,
  pin_hash: 'supabase-auth-managed',
  role,
  ativo: true,
}, { onConflict: 'id' })
```

### Pattern 3: User Edit (Auth + DB sync)
**What:** Update Supabase Auth user (email/password) + update public.users
**When to use:** PATCH /api/users/[id]
**Example:**
```typescript
// Source: Supabase Auth Admin API [ASSUMED: based on supabase-js v2 training knowledge]
// Only update auth fields that changed
const authUpdates: Record<string, unknown> = {}
if (nomeChanged) {
  authUpdates.email = nomeToEmail(newNome)
  authUpdates.user_metadata = { nome: newNome }
}
if (pinProvided) {
  authUpdates.password = newPin
}

if (Object.keys(authUpdates).length > 0) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
  if (error) throw error
}

// Always update public.users for nome/role changes
await supabaseAdmin.from('users')
  .update({ nome: newNome, role: newRole })
  .eq('id', userId)
```

### Pattern 4: Navigation + Middleware Integration
**What:** Add `/usuarios` to admin-only routes in both role-config.ts and middleware.ts
**When to use:** Route protection setup
**Critical detail:** Middleware has INLINED ROLE_ROUTES (does not import from role-config.ts due to Edge Runtime path alias limitation). BOTH files must be updated.
```typescript
// middleware.ts - INLINED copy (line 6)
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao', '/baixa', '/usuarios'],
  // ... other roles unchanged
}

// src/features/auth/lib/role-config.ts - canonical source
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/transformacao', '/baixa', '/usuarios'],
  // ... other roles unchanged
}

// NAV_ITEMS - add entry
{ label: 'Usuarios', href: '/usuarios', icon: 'Users', roles: ['admin'] }
```

### Anti-Patterns to Avoid
- **Forgetting middleware.ts:** ROLE_ROUTES is inlined in middleware (Edge Runtime limitation). Updating only role-config.ts will NOT protect the route.
- **Using client-side Supabase for writes:** All auth admin operations and DB writes MUST use `supabaseAdmin` (service role key), never the user's client.
- **Duplicate email collision:** Two users with the same name will generate the same email slug. Must handle `user_already_exists` error from `admin.createUser`.
- **Forgetting email_confirm: true:** Without this, Supabase requires email verification which is impossible with fictitious @naraka.local emails.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form modal | Custom modal from scratch | shadcn Dialog + form | Accessibility, focus trap, ESC handling |
| Confirmation dialog | Custom confirm popup | shadcn AlertDialog | Non-dismissable by overlay click, accessible |
| Toggle switch | Checkbox with styling | shadcn Switch | Consistent design, accessibility |
| Data table | Manual HTML table | shadcn Table | Semantic markup, consistent styling |
| Toast notifications | Custom notification system | Sonner (already installed) | Already used project-wide |
| Email slug generation | New slug function | `nomeToEmail` from `@/features/auth/lib/slugify` | Already exists, tested, used in login flow |

**Key insight:** Every building block for this feature already exists in the project. The seed script is the reference implementation for user creation. The API route pattern from cards/assign is the reference for auth + role checks.

## Common Pitfalls

### Pitfall 1: Middleware ROLE_ROUTES Desync
**What goes wrong:** `/usuarios` route is accessible to non-admin users
**Why it happens:** middleware.ts has its own inlined copy of ROLE_ROUTES separate from role-config.ts
**How to avoid:** Update BOTH files. Comment in middleware.ts references this pattern.
**Warning signs:** Non-admin user can navigate to /usuarios

### Pitfall 2: Duplicate Name Email Collision
**What goes wrong:** `admin.createUser` fails with `user_already_exists` when two users have the same name
**Why it happens:** `nomeToEmail("Joao Silva")` always produces `joao-silva@naraka.local`
**How to avoid:** Return a clear error message: "Ja existe um usuario com este nome. Use um nome diferente." Do NOT silently merge accounts.
**Warning signs:** 409/422 error on user creation with common names

### Pitfall 3: Auth + DB Out of Sync
**What goes wrong:** User exists in Supabase Auth but not in public.users, or vice versa
**Why it happens:** One operation succeeds, the other fails (no transaction across Auth + DB)
**How to avoid:** Create Auth user first. If DB upsert fails, attempt to delete the Auth user for cleanup. Use try/catch with rollback logic.
**Warning signs:** User can't login, or user appears in table but auth fails

### Pitfall 4: Login Not Checking `ativo` Field
**What goes wrong:** Deactivated users can still log in
**Why it happens:** Login flow authenticates via Supabase Auth (which knows nothing about `ativo`), then the app must check `ativo` before allowing access
**How to avoid:** Verify that login flow (or middleware/layout) checks `ativo` field. The authenticated layout already queries `users` table -- add `ativo` check there.
**Warning signs:** User with `ativo=false` can access the system

### Pitfall 5: PIN Validation Asymmetry
**What goes wrong:** Server accepts PIN that client rejected, or vice versa
**Why it happens:** Validation logic duplicated between client and server without shared rules
**How to avoid:** Define PIN rules once (4-6 numeric digits), validate on both client (for UX) and server (for security). Server is authoritative.
**Warning signs:** Form allows submission but API rejects it

## Code Examples

### Fetching Users List (GET /api/users)
```typescript
// Server-side: fetch all users ordered by nome
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, nome, role, ativo, created_at')
    .order('nome', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuarios' }, { status: 500 })
  }

  return NextResponse.json({ users })
}
```

### Toggle Ativo (PATCH /api/users/[id]/toggle)
```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth + admin check (same pattern)...

  const { data: targetUser } = await supabaseAdmin
    .from('users')
    .select('ativo, nome')
    .eq('id', params.id)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }

  const newAtivo = !targetUser.ativo

  const { error } = await supabaseAdmin
    .from('users')
    .update({ ativo: newAtivo })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }

  return NextResponse.json({ success: true, ativo: newAtivo })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server Actions for mutations | API Routes (project standard) | Phase 2 decision | All mutations go through /api/ routes, not Server Actions |
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Project already uses @supabase/ssr 0.10.0 |

**Deprecated/outdated:**
- `supabase.auth.admin.deleteUser`: Not used -- this project uses soft delete via `ativo` boolean (D-10)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `admin.updateUserById` can update email and password in a single call | Architecture Pattern 3 | Would need two separate calls -- minor refactor |
| A2 | Supabase Auth allows updating email without re-verification for admin operations | Architecture Pattern 3 | Might need `email_confirm: true` in update payload |
| A3 | Login flow currently does NOT check `ativo` field | Pitfall 4 | If already checked, D-10 is partially done |

## Open Questions

1. **Login ativo check location**
   - What we know: Authenticated layout queries `users` table for role/nome but may not check `ativo`
   - What's unclear: Whether login API or middleware already validates `ativo`
   - Recommendation: Check and add `ativo` validation in login flow or middleware as part of this phase

2. **Duplicate name handling**
   - What we know: `nomeToEmail` is deterministic -- same name = same email
   - What's unclear: Whether warehouse has employees with identical names
   - Recommendation: Return clear validation error on duplicate name, let admin disambiguate (e.g., "Joao Silva 2")

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (installed in project) |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| USER-01 | Create user via API (Auth + DB) | integration | `npx vitest run src/features/users/ -t "create"` | No - Wave 0 |
| USER-01 | PIN validation (4-6 digits, confirmation match) | unit | `npx vitest run src/features/users/ -t "pin"` | No - Wave 0 |
| USER-02 | Edit user via API (partial updates) | integration | `npx vitest run src/features/users/ -t "edit"` | No - Wave 0 |
| USER-03 | Toggle ativo via API | integration | `npx vitest run src/features/users/ -t "toggle"` | No - Wave 0 |
| USER-01/02/03 | Admin-only access (role check) | unit | `npx vitest run src/features/users/ -t "role"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/users/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/users/__tests__/user-api.test.ts` -- covers USER-01, USER-02, USER-03 API logic
- [ ] `src/features/users/__tests__/user-validation.test.ts` -- covers PIN validation rules

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth admin API (service role key) for user creation/modification |
| V3 Session Management | no | Handled by existing Phase 2 infrastructure |
| V4 Access Control | yes | Admin-only route protection (middleware + API role check) |
| V5 Input Validation | yes | PIN: 4-6 numeric digits. Nome: non-empty string. Role: enum check against valid values |
| V6 Cryptography | no | PIN hashing handled by Supabase Auth internally |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Non-admin accessing user management | Elevation of Privilege | Middleware route protection + API route role check (defense in depth) |
| PIN injection via API | Tampering | Server-side validation: numeric only, 4-6 chars |
| Auth/DB desync on failed create | Integrity | Create Auth first, rollback on DB failure |
| Inactive user bypassing deactivation | Elevation of Privilege | Check `ativo` field in login/middleware flow |

## Sources

### Primary (HIGH confidence)
- `scripts/seed-auth-users.ts` -- exact user creation flow [VERIFIED: codebase]
- `app/api/cards/assign/route.ts` -- API route auth pattern [VERIFIED: codebase]
- `middleware.ts` -- inlined ROLE_ROUTES, route protection logic [VERIFIED: codebase]
- `src/features/auth/lib/role-config.ts` -- ROLE_ROUTES, NAV_ITEMS [VERIFIED: codebase]
- `src/features/auth/lib/slugify.ts` -- nomeToEmail function [VERIFIED: codebase]
- `supabase/migrations/00001_initial_schema.sql` -- users table schema [VERIFIED: codebase]
- `10-UI-SPEC.md` -- approved UI design contract [VERIFIED: phase artifacts]

### Secondary (MEDIUM confidence)
- Supabase Auth Admin API (`admin.updateUserById`) [ASSUMED: based on supabase-js v2 training knowledge]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, versions verified from package.json
- Architecture: HIGH - all patterns exist in codebase (seed script, API routes, middleware)
- Pitfalls: HIGH - identified from direct code review of existing patterns

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable -- no external dependencies expected to change)

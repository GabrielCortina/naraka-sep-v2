# Security Audit — Phase 05: Cards e UI Foundation

**Audited:** 2026-04-05
**ASVS Level:** 1
**Block On:** open
**Result:** SECURED — 12/12 threats closed

---

## Threat Verification

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-05-01 | Tampering | accept | Pure functions in card-utils.ts receive already-validated Supabase data; no direct user input in plan scope |
| T-05-02 | Information Disclosure | accept | OrderCard receives pre-filtered data from upstream data layer; filtering responsibility declared upstream |
| T-05-03 | Information Disclosure | accept | KanbanBoard renders cards array passed as props; role-based filtering delegated to useCardData (Plan 05) |
| T-05-04 | Tampering | mitigate | src/features/cards/components/numpad-popup.tsx:49 — `if (qty >= 0 && qty <= quantidadeNecessaria)` blocks out-of-range confirmation |
| T-05-05 | Elevation of Privilege | mitigate | AssignModal `filterRole` prop restricts displayed user list; supabase/migrations/00004_rls_write_policies.sql:17-28 — RLS INSERT policy on atribuicoes enforces `user_role IN ('admin', 'lider')` via JWT claim as second barrier |
| T-05-06 | Information Disclosure | mitigate | src/features/cards/hooks/use-card-data.ts:72-81 — `if (userRole === 'separador' \|\| userRole === 'fardista')` filters pedidos to assigned card_keys only; RLS SELECT policy (from 00001_initial_schema.sql) enforces server-side |
| T-05-07 | Tampering | mitigate | app/(authenticated)/prateleira/prateleira-client.tsx:102-117 — `fetch('/api/cards/progress', ...)` used for all progress writes; no direct `supabase.from('progresso').upsert()` present in client code |
| T-05-08 | Elevation of Privilege | mitigate | app/(authenticated)/prateleira/prateleira-client.tsx:147-161 — `fetch('/api/cards/assign', ...)` used for all assignment writes; server role check delegated to /api/cards/assign route |
| T-05-09 | Tampering | mitigate | src/app/api/cards/progress/route.ts:31-37,49-51 — `quantidade_separada < 0` rejected; `validStatus` whitelist enforced; `quantidade_separada > pedido.quantidade` rejected after DB lookup |
| T-05-10 | Elevation of Privilege | mitigate | src/app/api/cards/assign/route.ts:7-25 — `supabase.auth.getUser()` verifies session; `supabaseAdmin.from('users').select('role')` performs DB role lookup; `['admin', 'lider'].includes(dbUser.role)` gates the operation; 403 returned otherwise |
| T-05-11 | Spoofing | mitigate | src/app/api/cards/assign/route.ts:57-74 — `supabaseAdmin.from('users').select('role, ativo')` verifies target user exists, `targetUser.ativo` check enforces active status, `targetUser.role !== tipo` enforces role match |
| T-05-12 | Tampering | mitigate | src/app/api/cards/assign/route.ts:49 — `!['separador', 'fardista'].includes(tipo as string)` rejects any other value before DB write, respecting schema CHECK constraint |

---

## Accepted Risks Log

| Threat ID | Rationale | Owner |
|-----------|-----------|-------|
| T-05-01 | card-utils functions are pure with no user input surface in this plan; data originates from authenticated Supabase queries validated upstream | Phase 05 |
| T-05-02 | OrderCard is a presentational component; information scope is controlled by the data layer (useCardData) and RLS SELECT policies, not the component itself | Phase 05 |
| T-05-03 | KanbanBoard is a layout component; it renders only what is passed via props; role-based filtering enforced in useCardData (T-05-06) | Phase 05 |

---

## Unregistered Flags

No unregistered threat flags were declared in any `## Threat Flags` section across the six SUMMARY files for this phase.

**Informational — Deferred Item (not a threat gap):**
The 05-05-SUMMARY.md notes that `DeleteCardModal` backend logic (PIN verification, cascaded deletion, API route POST /api/cards/delete) is deferred to Phase 07. The modal is visual-only in this phase and performs no writes. This deferred item is not within Phase 05 threat scope and carries no open threat in this audit.

---

## Audit Notes

- All `mitigate` threats verified by direct code inspection of cited implementation files.
- The `/api/cards/progress` route uses a select-then-insert/update pattern (instead of upsert) because the `progresso` table has no UNIQUE constraint on `pedido_id`. The T-05-09 quantity and status validations are applied before both code paths; the deviation from the plan template does not weaken the mitigation.
- The `/api/cards/assign` route uses `supabaseAdmin` singleton (not `createAdminClient()` factory) matching the actual codebase export. The security behavior is identical.
- Both API routes wrap `request.json()` in try/catch (added by executor as auto-fix), providing additional robustness against malformed request bodies.
- RLS write policies (00004_rls_write_policies.sql) are present on disk and cover INSERT/UPDATE on `progresso` and INSERT/UPDATE/DELETE on `atribuicoes`. Deployment via `supabase db push` is required before policies take effect in production — this is a operational prerequisite, not a code gap.

---

*Audited by: gsd-security-auditor*
*Phase: 05 — cards-e-ui-foundation*
*Completed: 2026-04-05*

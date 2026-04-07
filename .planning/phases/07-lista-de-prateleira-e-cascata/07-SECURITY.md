# SECURITY.md — Phase 07: Lista de Prateleira e Cascata

**Audited:** 2026-04-06
**ASVS Level:** 1
**Block On:** critical
**Threats Closed:** 10/10
**Threats Open:** 0/10

---

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-01 | Tampering | mitigate | CLOSED | `supabase/migrations/00006_transformacoes_and_cascata.sql` lines 28-32: `ALTER TABLE transformacoes ENABLE ROW LEVEL SECURITY`, `FOR SELECT TO authenticated USING (true)`, `FOR ALL TO service_role USING (true)` |
| T-07-02 | Information Disclosure | accept | CLOSED | See Accepted Risks log below |
| T-07-03 | Spoofing | mitigate | CLOSED | `app/api/prateleira/cascata/route.ts` lines 9-26: `createClient()` → `getUser()` → role check `['separador', 'admin', 'lider']`, returns 401/403 on failure |
| T-07-04 | Tampering | mitigate | CLOSED | `app/api/prateleira/cascata/route.ts` lines 66-79: `quantidade_confirmada >= 0` (typeof number), `quantidade_restante > 0` (typeof number), both validated server-side before any DB operation |
| T-07-05 | Tampering | mitigate | CLOSED | `app/api/prateleira/cascata/route.ts` lines 53-61: `Array.isArray(pedido_ids)`, `pedido_ids.length === 0` guard, `.every((id) => typeof id === 'string' && id.length > 0)` |
| T-07-06 | Tampering | mitigate | CLOSED | `app/api/prateleira/cascata/route.ts` lines 222-228: `insertError.code === '23505'` caught on `reservas.codigo_in` insert, returns HTTP 409 with message "Fardo ja reservado, tente novamente" |
| T-07-07 | Repudiation | accept | CLOSED | See Accepted Risks log below |
| T-07-08 | Tampering | accept | CLOSED | See Accepted Risks log below |
| T-07-09 | Denial of Service | accept | CLOSED | See Accepted Risks log below |
| T-07-10 | Denial of Service | mitigate | CLOSED | `app/api/fardos/ne/route.ts` line 124: `naoEncontradosSet.add(codigo_in)` executes before `findCascadeBales` call at line 129; excluded set passed into algorithm; chain terminates at Priority 4 when `disponiveis.length === 0` in `src/features/prateleira/utils/cascade-engine.ts` lines 36-38 |

---

## Accepted Risks Log

### T-07-02 — Information Disclosure: transformacoes table

- **Category:** Information Disclosure
- **Component:** `transformacoes` table (Supabase)
- **Risk:** Authenticated users can read all rows in `transformacoes`, including SKU codes and quantities from other cards/separadores.
- **Rationale:** Table contains no PII — only SKU codes, quantities, and internal warehouse identifiers. All users of the system are internal warehouse staff. Read access to operational SKU data across cards is acceptable for this internal-only warehouse application. RLS enforces read-only; writes are restricted to service_role.
- **Evidence:** Migration lines 29-30: `FOR SELECT TO authenticated USING (true)`.
- **Accepted by:** Threat register, Phase 07-01-PLAN.md
- **Review date:** 2026-04-06

---

### T-07-07 — Repudiation: cascade actions

- **Category:** Repudiation
- **Component:** Cascade flow (cascata route + fardos/ne cascade chain)
- **Risk:** No per-action audit log with user identity for cascade-triggered bale reservations or transformacao records.
- **Rationale:** The `transformacoes` table has `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` (migration line 12) and optional `separador_id`/`separador_nome` fields. The `trafego_fardos` table tracks which fardista acted via `fardista_id`. Combined timestamps and user references provide sufficient audit trail for an internal warehouse operation at this scale (~5-10 concurrent users). Full action-level audit logging is not required for ASVS Level 1.
- **Evidence:** `supabase/migrations/00006_transformacoes_and_cascata.sql` lines 10-12.
- **Accepted by:** Threat register, Phase 07-02-PLAN.md
- **Review date:** 2026-04-06

---

### T-07-08 — Tampering: search field injection

- **Category:** Tampering
- **Component:** SKU search field in `app/(authenticated)/prateleira/prateleira-client.tsx`
- **Risk:** Malicious input in the search field could be used for injection.
- **Rationale:** Search is implemented as a pure client-side filter on already-fetched `CardData[]` using `Array.filter` and `String.includes` (lines 67-71 of prateleira-client.tsx). No database query is constructed from the search term. There is no injection surface. Input is never sent to the server.
- **Evidence:** `app/(authenticated)/prateleira/prateleira-client.tsx` lines 67-71: `cards.filter(card => card.items.some(item => item.sku.toLowerCase().includes(term)))`.
- **Accepted by:** Threat register, Phase 07-03-PLAN.md
- **Review date:** 2026-04-06

---

### T-07-09 — Denial of Service: rapid cascade calls

- **Category:** Denial of Service
- **Component:** `POST /api/prateleira/cascata`
- **Risk:** A user could call the cascade endpoint repeatedly in rapid succession, causing excessive DB operations and stock API refreshes.
- **Rationale:** The warehouse has approximately 5-10 concurrent users maximum. Each cascade call is gated behind a user interaction in the UI (Parcial numpad entry or NE button click), and the frontend disables the button by replacing it with a spinner (`loadingItems` Set) during the in-flight request, preventing double-submission for any given SKU. No rate limiting at the infrastructure level is implemented, which is acceptable for this scale and internal deployment.
- **Evidence:** `app/(authenticated)/prateleira/prateleira-client.tsx` lines 43, 198-252: `loadingItems` Set tracking in-flight SKUs; `Loader2` spinner replaces buttons in `src/features/cards/components/item-modal.tsx` lines 240-243.
- **Accepted by:** Threat register, Phase 07-03-PLAN.md
- **Review date:** 2026-04-06

---

## Unregistered Threat Flags

No unregistered threat flags were reported in any SUMMARY.md `## Threat Flags` section across Plans 01, 02, or 03 for this phase.

---

## Notes

- The `as any` casts used throughout the cascade route and fardos/ne route for `transformacoes` table and `is_cascata` column are a TypeScript workaround pending Supabase type regeneration after schema push. They do not introduce a security risk — the runtime behavior is correct and server-validated.
- T-07-05 threat register description states "Verify each pedido_id is non-empty string array". Implementation performs array type check, non-empty length check, and per-element `typeof id === 'string' && id.length > 0` validation. No DB existence check is performed per pedido_id, matching the threat register's stated mitigation (not the plan's expanded description). This is consistent with the accepted ASVS Level 1 posture.
- Schema push (Task 3 of Plan 02) was a human-action checkpoint and remains pending. RLS policies exist in the migration SQL and will be enforced once applied to the remote database.

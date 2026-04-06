# Phase 7: Lista de Prateleira e Cascata - Research

**Researched:** 2026-04-06
**Domain:** Shelf list UI actions (Confirmar/Parcial/NE), cascade bale search, transformation registration, realtime sync
**Confidence:** HIGH

## Summary

Phase 7 extends the existing prateleira (shelf) page with real cascade logic. The current `prateleira-client.tsx` already has KanbanBoard + ItemModal + handlers for Confirmar/NaoTem, but they only call `/api/cards/progress` to update status directly. This phase replaces those simple handlers with a cascade flow: Parcial triggers cascade for the remaining quantity, NE triggers cascade for the full quantity, and Confirmar works as-is for full quantity.

The cascade engine is a new API route that (1) searches external stock via Google Sheets for alternative bales, (2) creates reservations + trafego_fardos entries with `is_cascata=true`, and (3) if no bale found, creates a `transformacoes` record and removes those pieces from the card's total. The `findAlternativeBale` function in `fardo-ne-handler.ts` already has an `isCascata` branch (returns first available bale without 20% rule) but only selects a single bale -- Phase 7 needs multi-bale selection with the 4-priority algorithm defined in D-07.

A new `transformacoes` table and `is_cascata` column on `trafego_fardos` must be created via Supabase migration. The `is_cascata` field currently exists only in the TypeScript FardoItem type (hardcoded to `false` in `use-fardos-data.ts`) but NOT in the database -- confirmed by checking all migrations [VERIFIED: grepped migrations and codebase]. The realtime subscription (`use-cards-realtime.ts`) must add the `transformacoes` table. Progress calculation (`calcProgress`, `aggregateItems`) must exclude transformation pieces from the denominator.

**Primary recommendation:** Build a single `/api/prateleira/cascata` route that handles all cascade logic (search stock, reserve bales, create trafego_fardos, register transformacoes), then update the frontend handlers and progress calculations.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Spinner + toast during alternative search. Button shows spinner. Toast on result
- **D-02:** Parcial triggers automatic cascade for REMAINING quantity. Zero extra friction
- **D-03:** NE applies per INDIVIDUAL LINE, not per whole SKU
- **D-04:** Both sides update: modal shows AGUARDAR FARDISTA (blocked), fardos list gets new unassigned bale with is_cascata=true
- **D-05:** Status changes directly to AGUARDAR FARDISTA after spinner
- **D-06:** Cascade has NO 20% rule. Any available bale accepted
- **D-07:** 4-priority selection: (1) closest to demand, (2) any that covers fully, (3) best combo maximizing coverage with remainder to Transformacao, (4) all to Transformacao
- **D-08:** Exclude from search: already reserved bales AND bales in fardos_nao_encontrados
- **D-09:** No retry limit on cascade chains. NE on cascade bale searches again
- **D-10:** Each NE registers in fardos_nao_encontrados. Excluded from future searches
- **D-11:** Only goes to Transformacao when NO bales available for SKU
- **D-12:** Unblock AGUARDAR FARDISTA happens in Phase 8 (Baixa), NOT on fardista OK
- **D-13:** Lines AGUARDAR FARDISTA remain blocked in Phase 7
- **D-14:** Orange badge 'CASCATA' on fardo line in fardos list
- **D-15:** Realtime toast for leader when new cascade bale appears
- **D-16:** Item disappears from modal when sent to Transformacao
- **D-17:** New `transformacoes` table with specified schema
- **D-18:** Transformation pieces REMOVED from card total. Card can reach 100% without them
- **D-19:** Full Transformacao tab is Phase 7.1 -- DEFERRED
- **D-20:** Progress bar only counts effectively separated pieces. AGUARDAR FARDISTA does NOT count
- **D-21:** Transformation pieces removed from denominator
- **D-22:** Print only per individual card (existing button from Phase 5 D-32)
- **D-23:** Header with counters: "X pecas separadas / Y total" + "Z cards pendentes, W concluidos"
- **D-24:** SKU search field: filters cards containing that SKU
- **D-25:** Existing KanbanBoard maintained as principal layout
- **D-26:** Card assignment: one at a time by leader, reuse AssignModal with filterRole='separador'
- **D-27:** Separador only sees assigned cards. Unassigned cards visible only to lider/admin

### Claude's Discretion
- Search field implementation (debounce, position in header)
- Counter design in header (chips, text, badges)
- Animation for item disappearing from modal when going to transformacao
- Internal structure of cascade Route Handlers
- Exact toast text for cascade
- Exact layout of CASCATA badge in fardos list

### Deferred Ideas (OUT OF SCOPE)
- **Phase 7.1: Aba de Transformacao** -- Full new tab with kanban, modal, validation, flow
- **Phase 8: Desbloqueio AGUARDAR FARDISTA** -- Unblock on physical delivery (baixa)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRAT-01 | Separador ve lista de itens agrupados por card com SKU, endereco, quantidade | Existing KanbanBoard + ItemModal from Phase 5 already display this. Extend with header counters (D-23) and search (D-24) |
| PRAT-02 | Separador pode confirmar quantidade separada (Confirmar) | Existing `handleConfirmQuantity` works for full confirm. No cascade needed -- just update progresso |
| PRAT-03 | Separador pode marcar como Parcial -- dispara cascata | Replace simple progress update with cascade API call. Parcial = confirm partial qty + cascade for remainder (D-02) |
| PRAT-04 | Separador pode marcar como N/E (nao encontrado) -- dispara cascata | Replace `handleNaoTem` with cascade API call for full quantity (D-03) |
| PRAT-05 | Cascata: busca fardo alternativo; se achar cria AGUARDAR FARDISTA + fardo na lista; se nao, Transformacao | New `/api/prateleira/cascata` route with 4-priority algorithm (D-07), new `transformacoes` table (D-17) |
| PRAT-06 | Lista atualiza em tempo real via Supabase subscription | Extend `use-cards-realtime.ts` to listen to `transformacoes` table. Already listens to progresso, reservas, trafego_fardos |
| PRAT-07 | Lider pode atribuir separadores a cards | Already implemented via AssignModal + `/api/cards/assign` (Phase 5). D-26 confirms reuse |
| PRAT-08 | Botao Imprimir Lista por card gera PDF | Already implemented via generateChecklist in ItemModal (Phase 5 D-32). D-22 confirms per-card only |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | App Router, Route Handlers | Project stack [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | DB queries, realtime subscriptions | Project stack [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast notifications for cascade results | Already used in fardo-list.tsx and upload [VERIFIED: codebase] |
| jspdf + jspdf-autotable | 4.2.1 / 5.0.7 | PDF generation (existing) | Already used in pdf-generator [VERIFIED: package.json] |
| lucide-react | 1.7.0 | Icons | Project standard [VERIFIED: package.json] |

### No New Dependencies Needed
This phase requires zero new npm packages. All functionality is achievable with existing stack.

## Architecture Patterns

### Recommended Project Structure
```
app/api/prateleira/
  cascata/route.ts          # NEW: cascade logic (Parcial + NE)
src/features/prateleira/    # NEW feature folder (or extend cards/)
  utils/
    cascade-engine.ts       # NEW: 4-priority bale search (D-07)
  lib/
    cascade-utils.ts        # NEW: helpers for cascade flow
supabase/migrations/
  00006_transformacoes_and_cascata.sql  # NEW: transformacoes table + is_cascata column
```

### Pattern 1: Cascade API Route
**What:** Single POST route that handles both Parcial and NE cascade flows
**When to use:** When separador marks Parcial or NE on a shelf item
**Example:**
```typescript
// Source: Based on existing /api/fardos/ne/route.ts pattern [VERIFIED: codebase]
// POST /api/prateleira/cascata
// Body: { pedido_ids: string[], sku: string, quantidade_restante: number, tipo: 'parcial' | 'ne' }
// 
// Flow:
// 1. Auth check (createClient -> getUser -> role check)
// 2. Update progresso for pedido_ids (parcial: set qty + status; NE: set 0 + nao_encontrado)
// 3. Fetch stock via fetchStock(true) -- force refresh
// 4. Build exclusion sets (reservados + nao_encontrados)
// 5. Run 4-priority cascade search
// 6. If bale(s) found: create reserva(s) + trafego_fardos(is_cascata=true) + update progresso to aguardar_fardista
// 7. If no bale: create transformacoes record + remove from card total
// 8. Return { found_alternative: boolean, bales?: [], transformacao?: boolean }
```

### Pattern 2: 4-Priority Cascade Search Algorithm (D-07)
**What:** Custom bale selection algorithm without the 20% rule
**When to use:** In cascade engine, replacing the normal subset-sum approach
**Example:**
```typescript
// Source: Decision D-07 from CONTEXT.md
interface CascadeResult {
  fardos: StockItem[]
  quantidade_coberta: number
  quantidade_transformacao: number // remainder going to transformacao
}

function findCascadeBales(
  stock: StockItem[],
  sku: string,
  demanda: number,
  reservedSet: Set<string>,
  naoEncontradosSet: Set<string>,
): CascadeResult {
  // Filter available bales for this SKU
  const disponiveis = stock.filter(
    item => item.sku === sku 
      && !reservedSet.has(item.codigo_in) 
      && !naoEncontradosSet.has(item.codigo_in)
  )
  
  if (disponiveis.length === 0) {
    // Priority 4: all to transformacao
    return { fardos: [], quantidade_coberta: 0, quantidade_transformacao: demanda }
  }
  
  // Priority 1: bale closest to demand (smallest abs difference)
  const sorted = [...disponiveis].sort(
    (a, b) => Math.abs(a.quantidade - demanda) - Math.abs(b.quantidade - demanda)
  )
  const closest = sorted[0]
  if (closest.quantidade >= demanda) {
    // Priority 1 or 2: single bale covers demand
    return { fardos: [closest], quantidade_coberta: demanda, quantidade_transformacao: 0 }
  }
  
  // Priority 3: best combination maximizing coverage
  // Greedy approach: sort descending, take until covered or exhausted
  const descending = [...disponiveis].sort((a, b) => b.quantidade - a.quantidade)
  const selected: StockItem[] = []
  let coberta = 0
  for (const bale of descending) {
    if (coberta >= demanda) break
    selected.push(bale)
    coberta += bale.quantidade
  }
  const remainder = Math.max(0, demanda - coberta)
  return { fardos: selected, quantidade_coberta: Math.min(coberta, demanda), quantidade_transformacao: remainder }
}
```

### Pattern 3: Progress Calculation with Transformation Exclusion (D-18, D-20, D-21)
**What:** Modified calcProgress that excludes transformation pieces from total
**When to use:** Everywhere card progress is displayed
**Example:**
```typescript
// Source: Decisions D-18, D-20, D-21
// Modify calcProgress to accept transformation data
export function calcProgress(
  items: { quantidade: number; quantidade_separada: number }[],
  transformacaoTotal: number = 0, // pieces sent to transformacao
): { total: number; separadas: number; percent: number } {
  let total = 0
  let separadas = 0
  for (const item of items) {
    total += item.quantidade
    separadas += item.quantidade_separada
  }
  // Remove transformation pieces from denominator
  total = total - transformacaoTotal
  const percent = total === 0 ? 0 : Math.round((separadas / total) * 100)
  return { total, separadas, percent }
}
```

### Anti-Patterns to Avoid
- **Calling subset-sum for cascade:** Cascade has its own 4-priority algorithm without 20% margin. Do NOT reuse `findOptimalCombination` from subset-sum.ts [VERIFIED: D-06]
- **Updating progress client-side before API returns:** Always wait for cascade API response before updating UI. Use spinner during call [VERIFIED: D-01]
- **Creating cascade trafego_fardos with fardista assigned:** Cascade bales are ALWAYS unassigned (NAO ATRIBUIDO). Leader assigns manually [VERIFIED: D-04]
- **Counting AGUARDAR_FARDISTA as progress:** These items must NOT count toward the progress percentage [VERIFIED: D-20]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | `toast()` from sonner | Already installed, used in fardos-list and upload [VERIFIED: codebase] |
| Realtime sync | WebSocket management | Supabase postgres_changes subscription | Existing pattern in use-cards-realtime.ts [VERIFIED: codebase] |
| PDF generation | Custom PDF builder | jsPDF + jspdf-autotable via existing generateChecklist | Already built in Phase 5 [VERIFIED: codebase] |
| Auth/role checking | Custom middleware | createClient() + getUser() + supabaseAdmin role lookup | Established pattern since Phase 2 [VERIFIED: codebase] |
| Bale exclusion sets | Manual filtering | Query fardos_nao_encontrados + reservas with status='reservado' | Pattern from /api/fardos/ne/route.ts [VERIFIED: codebase] |

## Common Pitfalls

### Pitfall 1: Cascade Infinite Loop
**What goes wrong:** NE on cascade bale triggers another cascade that picks the same bale
**Why it happens:** Bale not excluded from future searches
**How to avoid:** Every NE must register in `fardos_nao_encontrados` BEFORE searching for next alternative. Build exclusion set from both `reservas` (status=reservado) AND `fardos_nao_encontrados` [VERIFIED: D-08, D-10]
**Warning signs:** Same bale appearing multiple times in trafego_fardos

### Pitfall 2: Race Condition on Stock Search
**What goes wrong:** Two concurrent cascade calls select the same bale
**Why it happens:** Stock search is not atomic -- between search and reserve, another request can grab the same bale
**How to avoid:** Use `fetchStock(true)` for fresh data, build reservedSet from DB right before search, handle unique constraint violation (23505) gracefully as the fardos/ne route already does [VERIFIED: reservation-engine.ts line 109]
**Warning signs:** Duplicate reservation errors in logs

### Pitfall 3: Progress Denominator Not Updated
**What goes wrong:** Card shows less than 100% even when all separatable items are done
**Why it happens:** Transformation pieces still counted in total
**How to avoid:** Fetch transformacoes for each card and subtract from total in calcProgress. Must also update useCardData to fetch transformacoes [VERIFIED: D-18, D-21]
**Warning signs:** Cards stuck at <100% with no actionable items

### Pitfall 4: Realtime Not Firing for New Tables
**What goes wrong:** Cascade bales or transformacoes don't appear in realtime
**Why it happens:** New table `transformacoes` not added to Supabase realtime publication AND not subscribed in use-cards-realtime
**How to avoid:** Add `transformacoes` to the ALTER PUBLICATION migration, AND add `.on()` handler in use-cards-realtime.ts [VERIFIED: migration 20260405_realtime_publication.sql pattern]
**Warning signs:** Data only appears after manual page refresh

### Pitfall 5: Stale Stock Cache During Cascade Chain
**What goes wrong:** Second cascade in chain finds a bale that was already reserved by first cascade
**Why it happens:** Stock cache (2-min TTL) serves stale data
**How to avoid:** Always call `fetchStock(true)` (forceRefresh) in cascade route, same pattern as fardos/ne [VERIFIED: fardos/ne route.ts line 60]
**Warning signs:** Reservation unique_violation errors during cascade chains

### Pitfall 6: Missing is_cascata Column in Database
**What goes wrong:** Cascade trafego_fardos inserts fail or is_cascata flag not persisted
**Why it happens:** `is_cascata` exists only in TypeScript types (FardoItem), hardcoded to `false` in use-fardos-data.ts line 139 -- NOT in any database migration [VERIFIED: grepped all migrations, no is_cascata column exists]
**How to avoid:** Migration 00006 MUST add `is_cascata BOOLEAN NOT NULL DEFAULT false` to `trafego_fardos` table, and use-fardos-data.ts must read from DB instead of hardcoding
**Warning signs:** TypeScript compiles but DB insert/read ignores is_cascata

## Code Examples

### Migration: Transformacoes Table + is_cascata Column
```sql
-- Source: Decision D-17 from CONTEXT.md + verified missing is_cascata column
-- [VERIFIED: is_cascata NOT in any existing migration -- checked 00001-00005 + 20260405]

-- 1. New table: transformacoes (D-17)
CREATE TABLE transformacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  card_key TEXT NOT NULL,
  numero_pedido TEXT,
  lider_id UUID REFERENCES users(id),
  lider_nome TEXT,
  separador_id UUID REFERENCES users(id),
  separador_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atribuido', 'concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_at TIMESTAMPTZ
);

-- 2. Add is_cascata to trafego_fardos (D-04, D-14)
ALTER TABLE trafego_fardos
  ADD COLUMN IF NOT EXISTS is_cascata BOOLEAN NOT NULL DEFAULT false;

-- 3. Enable realtime for transformacoes
ALTER PUBLICATION supabase_realtime ADD TABLE transformacoes;

-- 4. RLS for transformacoes
ALTER TABLE transformacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read transformacoes"
  ON transformacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage transformacoes"
  ON transformacoes FOR ALL TO service_role USING (true);
```

### Updated Realtime Subscription
```typescript
// Source: Existing use-cards-realtime.ts pattern [VERIFIED: codebase]
// Add transformacoes to the channel
const channel = supabase
  .channel('cards-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'progresso' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'atribuicoes' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trafego_fardos' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transformacoes' }, () => onUpdate())
  .subscribe()
```

### Header Counters Pattern
```typescript
// Source: Existing fardo-counters.tsx pattern [VERIFIED: codebase]
// Compute from cards array before role filtering (D-23)
const counters = useMemo(() => {
  let totalPecas = 0
  let separadas = 0
  let pendentes = 0
  let concluidos = 0
  for (const card of allCards) {
    totalPecas += card.total_pecas
    separadas += card.pecas_separadas
    if (card.urgency === 'done') concluidos++
    else pendentes++
  }
  return { totalPecas, separadas, pendentes, concluidos }
}, [allCards])
```

### Toast Pattern for Cascade Results
```typescript
// Source: Existing sonner usage in fardos-list.tsx [VERIFIED: codebase]
import { toast } from 'sonner'

// After cascade API responds:
if (data.found_alternative) {
  toast.success('Fardo alternativo reservado - AGUARDAR FARDISTA')
} else if (data.transformacao) {
  toast.info('Sem fardo disponivel - enviado para Transformacao')
}
```

### CASCATA Badge on Fardo Item (D-14)
```typescript
// Source: Existing fardo-item.tsx badge pattern [VERIFIED: codebase]
// Add after existing status badges:
{fardo.is_cascata && (
  <Badge
    className="w-fit bg-orange-500 text-white hover:bg-orange-500"
    aria-live="polite"
  >
    CASCATA
  </Badge>
)}
```

### Updated use-fardos-data.ts -- Read is_cascata from DB
```typescript
// Source: Current code hardcodes is_cascata: false [VERIFIED: line 139 of use-fardos-data.ts]
// After migration, change to read from trafego_fardos:
is_cascata: trafego.is_cascata ?? false,
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| handleNaoTem calls /api/cards/progress directly | handleNaoTem calls /api/prateleira/cascata | Phase 7 | NE now triggers cascade search |
| handleConfirmQuantity with qty < needed = parcial status | Parcial triggers cascade for remainder | Phase 7 | Automatic cascade on partial confirm |
| calcProgress counts all items in total | calcProgress excludes transformacao pieces | Phase 7 | Cards can reach 100% without transformacao items |
| findAlternativeBale returns single bale | New cascade engine returns multiple bales with 4-priority | Phase 7 | Better coverage of demand |
| is_cascata hardcoded false in TypeScript | is_cascata stored in DB, read from trafego_fardos | Phase 7 | Cascade bales visually distinguished |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Greedy descending sort is sufficient for Priority 3 (best combination) instead of full combinatorial search | Architecture Patterns, Pattern 2 | Could miss optimal combination, but with typical bale counts (5-20 per SKU) the impact is minimal. Full DP would be over-engineered given no 20% constraint |

## Open Questions (RESOLVED)

1. **Should cascade search use greedy or optimal algorithm for Priority 3?**
   - What we know: D-07 says "best combination that maximizes coverage"
   - What's unclear: Whether "best" means optimal (DP/backtracking) or greedy-good-enough
   - Recommendation: Use greedy descending (largest bales first) -- fast, simple, good enough for typical warehouse SKU counts (5-20 bales)
   - RESOLVED: Use greedy descending (largest bales first). Implemented in Plan 07-01 cascade-engine.ts

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAT-02 | Confirmar updates progresso correctly | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "confirm"` | Wave 0 |
| PRAT-03 | Parcial triggers cascade for remainder | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "parcial"` | Wave 0 |
| PRAT-04 | NE triggers cascade for full quantity | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "ne"` | Wave 0 |
| PRAT-05 | 4-priority cascade search algorithm | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "priority"` | Wave 0 |
| PRAT-05 | Transformacao created when no bales | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -t "transformacao"` | Wave 0 |
| PRAT-01 | Progress excludes transformacao pieces | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -t "transformacao"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/prateleira/utils/__tests__/cascade-engine.test.ts` -- covers PRAT-03, PRAT-04, PRAT-05
- [ ] Updated `src/features/cards/lib/__tests__/card-utils.test.ts` -- covers transformacao exclusion for PRAT-01

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | createClient() + getUser() on every route [VERIFIED: established pattern] |
| V3 Session Management | yes | JWT via Supabase (established) |
| V4 Access Control | yes | Role check via supabaseAdmin users table lookup [VERIFIED: fardos/ne pattern] |
| V5 Input Validation | yes | Validate pedido_ids, sku, quantidade in route handler body |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized cascade trigger | Spoofing | Auth + role check (separador/lider/admin only) |
| Quantity tampering in Parcial | Tampering | Server-side validation: quantidade <= pedido.quantidade |
| Fake pedido_ids in request | Tampering | Verify pedido exists in DB before processing |
| Concurrent cascade race condition | Tampering | Handle unique constraint (23505) on reservas.codigo_in |

## Project Constraints (from CLAUDE.md)

- Tech stack: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui -- non-negotiable [VERIFIED: CLAUDE.md]
- Realtime: Mandatory via Supabase subscriptions -- polling prohibited [VERIFIED: CLAUDE.md]
- External stock: Google Sheets never migrates to Supabase [VERIFIED: CLAUDE.md]
- Communication: Always in Brazilian Portuguese [VERIFIED: CLAUDE.md]

## Sources

### Primary (HIGH confidence)
- Codebase files: prateleira-client.tsx, item-modal.tsx, use-card-data.ts, card-utils.ts, use-cards-realtime.ts, fardo-ne-handler.ts, reservation-engine.ts, stock-parser.ts, fardo-item.tsx, use-fardos-data.ts
- Types: database.types.ts, src/types/index.ts, src/features/cards/types.ts, src/features/fardos/types.ts
- API routes: /api/cards/progress/route.ts, /api/fardos/ne/route.ts
- All 6 migration files verified for is_cascata absence
- Package.json for dependency versions
- CONTEXT.md decisions D-01 through D-27

### Secondary (MEDIUM confidence)
- Migration naming pattern (00006) inferred from existing migrations [VERIFIED: supabase/migrations/ listing]

### Tertiary (LOW confidence)
- None -- all claims verified against codebase or CONTEXT.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in package.json
- Architecture: HIGH -- patterns directly extend existing codebase patterns (fardos/ne route, use-cards-realtime)
- Pitfalls: HIGH -- identified from existing code patterns and cascade-specific concerns from CONTEXT.md decisions

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable -- no external dependency changes expected)

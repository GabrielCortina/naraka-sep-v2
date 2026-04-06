# Phase 7: Lista de Prateleira e Cascata - Research

**Researched:** 2026-04-06 (re-research)
**Domain:** Shelf item separation with cascade bale search and transformation workflow
**Confidence:** HIGH

## Summary

Phase 7 extends the existing prateleira page (`prateleira-client.tsx`) with cascade logic: when a separador marks an item as Parcial or N/E, the system searches for alternative bales in the external stock (Google Sheets), creates reservas + trafego_fardos entries with `is_cascata=true`, or sends items to a new `transformacoes` table. The phase requires one new database migration (transformacoes table + is_cascata column on trafego_fardos), a new API route for cascade search, modifications to the NE handler for cascade chain support, updates to progress calculation (exclude transformacao from totals), and a new PrateleiraHeader component with counters and SKU search.

The codebase is well-structured with clear patterns from Phases 4-6. The cascade engine is a new pure function (different from reservation-engine's subset sum -- no 20% rule) that can be built with TDD. The `findAlternativeBale` function already has an `isCascata` branch (returns `disponiveis[0]` for cascata) but Phase 7 needs a more sophisticated version with the 4-priority selection algorithm (D-07). All existing components (KanbanBoard, ItemModal, NumpadPopup, AssignModal) are reusable with handler modifications.

**Primary recommendation:** Build in 3 waves: (1) Migration + cascade engine pure function + calcProgress update (TDD-friendly, no UI), (2) API route + NE handler cascade chain + realtime subscription updates (integration layer), (3) UI updates -- PrateleiraHeader, spinner states, cascade toasts, CASCATA badge on fardos list.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Spinner + toast during cascade search. Button shows spinner while API processes. Found: toast "Fardo alternativo reservado -- AGUARDAR FARDISTA". Not found: toast "Sem fardo -- enviado para Transformacao"
- **D-02:** Parcial triggers automatic cascade. Separador enters quantity via numpad. If quantity < needed, system calculates difference and searches alternative bale automatically for REMAINDER. Zero extra friction -- no additional confirmation
- **D-03:** NE applies per INDIVIDUAL LINE, not per entire SKU. If SKU has multiple lines (shelf + bales), separador marks NE on each line separately. Per-line granularity
- **D-04:** Both sides update during cascade. Modal: item changes to AGUARDAR FARDISTA (blocked). Fardos list: new bale appears automatically with is_cascata=true, UNASSIGNED. Leader must assign manually
- **D-05:** Status changes directly to AGUARDAR FARDISTA after spinner. No intermediate state
- **D-06:** Cascade has NO 20% rule. Any available bale of the SKU is accepted regardless of quantity
- **D-07:** Selection criteria with 4 priorities: (1) closest quantity to demand, (2) any single bale covering demand, (3) best combination maximizing coverage (remainder to Transformacao), (4) no bale available -> all to Transformacao
- **D-08:** Exclude from search: already reserved bales AND bales in fardos_nao_encontrados. Prevents loops
- **D-09:** No retry limit for cascade chain. When fardista marks NE on cascade bale, system searches another. Continues until no bales available
- **D-10:** Each NE registers in fardos_nao_encontrados. Previously NE'd bales excluded from future searches
- **D-11:** Only goes to Transformacao when NO bale of the SKU remains available in stock
- **D-12:** Unlock does NOT happen on fardista OK. Correct flow: OK = bale in transit. Unlock only on Baixa (Phase 8)
- **D-13:** In Phase 7: AGUARDAR FARDISTA lines remain blocked. Unlock logic is Phase 8
- **D-14:** Orange 'CASCATA' badge on bale line in fardos list. Leader identifies urgency quickly
- **D-15:** Realtime toast for leader when new cascade bale appears in fardos list
- **D-16:** When cascade finds no bale: item disappears from separador modal. No badge -- vanishes
- **D-17:** Register in new table `transformacoes` with: sku, quantidade, card_key, numero_pedido, lider_id, lider_nome, separador_id, separador_nome, status (pendente/atribuido/concluido), created_at, concluido_at
- **D-18:** Transformacao pieces REMOVED from card total. Card can reach 100% without them. Phase 7.1 handles transformacao tab
- **D-19:** Complete Transformacao tab (kanban, modal, validation) is Phase 7.1 -- DEFERRED
- **D-20:** Progress bar only counts effectively separated pieces. AGUARDAR FARDISTA does NOT count as progress
- **D-21:** Transformacao pieces removed from denominator (total). Card closes when everything it can separate is separated
- **D-22:** Print only per individual card, using existing button in modal (Phase 5 D-32). NO global "Print All" button
- **D-23:** Header with counters: "X pecas separadas / Y total" + "Z cards pendentes, W concluidos". Quick global progress view
- **D-24:** SKU search field: filters cards containing that SKU. Clear search = return to normal kanban
- **D-25:** Existing KanbanBoard (Phase 5) maintained as main layout. Columns by shipping method, collapsible cards on mobile
- **D-26:** Shelf card assignment: one card at a time by leader (Phase 5 D-27). Reuse AssignModal with filterRole='separador'
- **D-27:** Separador only sees assigned cards. Unassigned cards only visible to leader/admin (Phase 5 D-29)

### Claude's Discretion
- Exact search field implementation (debounce, position in header)
- Counter design in header (chips, text, badges)
- Animation for item disappearing from modal when sent to transformacao
- Internal structure of cascade Route Handlers
- Exact toast text for cascade
- Exact layout of CASCATA badge in fardos list

### Deferred Ideas (OUT OF SCOPE)
- **Phase 7.1: Aba de Transformacao** -- Complete new tab with kanban, modal with exact validation, leader/separador flow, transformacoes management
- **Phase 8 (Baixa): AGUARDAR FARDISTA unlock** -- When fardista delivers bale physically, AGUARDAR FARDISTA line unlocks in separador modal via realtime
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRAT-01 | Separador sees item list grouped by card with SKU, address, quantity | Existing KanbanBoard + ItemModal already display this. useCardData hook fetches and groups data. Extend with PrateleiraHeader for counters/search |
| PRAT-02 | Separador can confirm separated quantity (Confirmar) | Existing handleConfirmQuantity + NumpadPopup in prateleira-client.tsx. Needs update to detect partial and trigger cascade |
| PRAT-03 | Separador can mark as Parcial -- triggers cascade | New cascade API route. handleConfirmQuantity detects qty < needed, calls /api/prateleira/cascata with remainder |
| PRAT-04 | Separador can mark as N/E -- triggers cascade | handleNaoTem updated to call /api/prateleira/cascata instead of /api/cards/progress with status nao_encontrado |
| PRAT-05 | Cascade: search alternative bale in external stock; if found, create blocked AGUARDAR FARDISTA line + add to fardos list; if not, send to Transformacao | New findCascadeBales pure function + /api/prateleira/cascata route. Creates reserva + trafego_fardos (is_cascata=true) or transformacoes record |
| PRAT-06 | Shelf list updates in realtime via Supabase subscription | Existing useCardsRealtime subscribes to progresso, atribuicoes, reservas, trafego_fardos. Needs to add transformacoes table |
| PRAT-07 | Leader can assign separadores to cards | Already implemented: AssignModal with filterRole='separador' in prateleira-client.tsx. handleAssignUser calls /api/cards/assign |
| PRAT-08 | "Print List" button per card generates PDF | Already implemented: generateChecklist in pdf-generator.ts, Printer button in ItemModal header. No changes needed for per-card print |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui -- non-negotiable [VERIFIED: CLAUDE.md]
- **Realtime**: Mandatory via Supabase subscriptions -- polling forbidden [VERIFIED: CLAUDE.md]
- **Communication**: Always in Brazilian Portuguese [VERIFIED: CLAUDE.md]
- **GSD Workflow**: Use GSD entry points for repo edits [VERIFIED: CLAUDE.md]

## Standard Stack

### Core (already installed -- no new packages needed)
| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| Next.js | 14.2.35 | App Router, Route Handlers | [VERIFIED: package.json] |
| @supabase/supabase-js | (installed) | DB queries, realtime subscriptions | [VERIFIED: codebase imports] |
| jsPDF + jspdf-autotable | ^4.2.1 | PDF generation for checklists | [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications | [VERIFIED: package.json] |
| lucide-react | (installed) | Icons (Check, X, Loader2, Search, Printer) | [VERIFIED: component imports] |
| shadcn/ui | (configured) | Badge, Dialog, Input, ScrollArea, Button | [VERIFIED: components/ui/] |

**No new packages needed for Phase 7.** All functionality builds on existing dependencies.

## Architecture Patterns

### Verified Project Structure
```
app/
  (authenticated)/
    prateleira/
      page.tsx                    # Server component: auth + role check [VERIFIED]
      prateleira-client.tsx       # Client component: KanbanBoard + ItemModal + handlers [VERIFIED]
  api/
    cards/
      progress/route.ts           # POST: update progresso [VERIFIED]
      assign/route.ts             # POST: assign user to card [VERIFIED]
    fardos/
      ok/route.ts                 # POST: fardo OK flow [VERIFIED]
      ne/route.ts                 # POST: fardo NE + alternative search [VERIFIED]
    prateleira/
      cascata/route.ts            # NEW: cascade search for shelf items

src/
  features/
    cards/
      components/                 # KanbanBoard, ItemModal, NumpadPopup, etc. [VERIFIED]
      hooks/
        use-card-data.ts          # Fetches + assembles CardData[] [VERIFIED]
        use-cards-realtime.ts     # Supabase subscription [VERIFIED]
      lib/
        card-utils.ts             # groupByCardKey, calcProgress, aggregateItems [VERIFIED]
        pdf-generator.ts          # generateChecklist [VERIFIED]
      types.ts                    # CardItem, CardData [VERIFIED]
    fardos/
      utils/
        fardo-ne-handler.ts       # findAlternativeBale [VERIFIED]
        stock-parser.ts           # fetchStock [VERIFIED]
      components/
        fardo-item.tsx            # Individual fardo display [VERIFIED]
      hooks/
        use-fardos-data.ts        # is_cascata hardcoded false at line 139 [VERIFIED]
    prateleira/
      utils/
        cascade-engine.ts         # NEW: findCascadeBales pure function

supabase/
  migrations/
    00006_transformacoes_and_cascata.sql  # NEW: transformacoes table + is_cascata column
```

### Pattern 1: Route Handler Auth (established)
**What:** Every API route follows createClient() -> getUser() -> role check via supabaseAdmin -> write via supabaseAdmin
**Source:** [VERIFIED: app/api/cards/progress/route.ts, app/api/fardos/ne/route.ts, app/api/fardos/ok/route.ts]
```typescript
// Source: [VERIFIED: app/api/fardos/ne/route.ts lines 8-22]
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
}
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('role, nome')
  .eq('id', user.id)
  .single()
if (!userData || !['separador', 'admin', 'lider'].includes(userData.role)) {
  return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
}
```

### Pattern 2: Select-then-insert/update for progresso
**What:** No UNIQUE constraint on pedido_id in progresso table. Must check existing record first.
**Source:** [VERIFIED: app/api/cards/progress/route.ts lines 53-86]
```typescript
const { data: existing } = await supabaseAdmin
  .from('progresso')
  .select('id')
  .eq('pedido_id', pedido_id)
  .maybeSingle()

if (existing) {
  // update
} else {
  // insert
}
```

### Pattern 3: Realtime subscription via single channel with multiple .on() handlers
**Source:** [VERIFIED: use-cards-realtime.ts]
```typescript
const channel = supabase
  .channel('cards-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'progresso' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transformacoes' }, () => onUpdate())
  // ... more tables
  .subscribe()
```

### Pattern 4: eslint-disable for migration columns not in generated types
**Source:** [VERIFIED: app/api/fardos/ok/route.ts line 91, app/api/fardos/ne/route.ts line 104]
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const insertData: Record<string, any> = { ... }
const { error } = await supabaseAdmin
  .from('trafego_fardos')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .insert(insertData as any)
```

### Anti-Patterns to Avoid
- **Using spread for Set conversion:** Use `Array.from(new Set())` for tsconfig target compatibility [VERIFIED: STATE.md Phase 3 decision]
- **Auto-closing toasts during important operations:** Keep toast visible until user acknowledges [VERIFIED: STATE.md Phase 4 decision]
- **Modifying reservas.status to values other than 'reservado'|'cancelado':** DB CHECK constraint prevents it [VERIFIED: STATE.md Phase 6 decision]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stock reading from Google Sheets | Custom API call | `fetchStock(forceRefresh)` from stock-parser.ts | Has retry, caching, NFD normalization [VERIFIED] |
| Bale exclusion logic | Custom filtering | Build on `findAlternativeBale` pattern from fardo-ne-handler.ts | Already handles reservedSet + naoEncontradosSet filtering [VERIFIED] |
| Toast notifications | Custom toast system | `toast` from sonner (already imported in fardo-list.tsx) | Project standard [VERIFIED] |
| PDF checklist generation | Custom PDF | `generateChecklist` from pdf-generator.ts | Already works per-card [VERIFIED] |
| Realtime subscription | Custom polling | `useCardsRealtime` hook pattern | Supabase subscription required by project constraints [VERIFIED] |
| Progress calculation | Custom counter | `calcProgress` from card-utils.ts | Just needs transformacaoTotal param addition [VERIFIED] |

## Common Pitfalls

### Pitfall 1: Cascade Search Returning Already-Reserved Bales
**What goes wrong:** Cascade finds a bale that's already reserved for another SKU/card, creating a double reservation
**Why it happens:** Reservas table has no UNIQUE constraint check at application level between cascade search and insert
**How to avoid:** (1) Build a fresh reservedSet from `reservas.status='reservado'` at cascade time. (2) Also add currentCodigoIn exclusion. (3) Also exclude fardos_nao_encontrados. All three checks already established in fardo-ne-handler.ts [VERIFIED]
**Warning signs:** Duplicate codigo_in in reservas, 23505 unique_violation errors

### Pitfall 2: is_cascata Column Missing from Database
**What goes wrong:** trafego_fardos inserts with is_cascata fail silently or flag not persisted
**Why it happens:** is_cascata exists only in TypeScript types (FardoItem.is_cascata), hardcoded to `false` at line 139 of use-fardos-data.ts. NOT in any existing migration [VERIFIED: grepped all 6 migrations]
**How to avoid:** Migration 00006 MUST add `is_cascata BOOLEAN NOT NULL DEFAULT false` to trafego_fardos
**Warning signs:** TypeScript compiles but DB ignores is_cascata values

### Pitfall 3: calcProgress Not Excluding Transformacao Pieces
**What goes wrong:** Card never reaches 100% because transformacao pieces remain in denominator
**Why it happens:** Current calcProgress simply sums all pedido.quantidade. D-18/D-21 require subtracting transformacao quantities
**How to avoid:** Add `transformacaoTotal` parameter to calcProgress. In useCardData, fetch transformacoes and pass total to calcProgress [VERIFIED: current calcProgress at card-utils.ts line 55]
**Warning signs:** Cards stuck at < 100% even when all separable items are done

### Pitfall 4: Cascade Creating Infinite Loop
**What goes wrong:** Same bale repeatedly found and rejected in cascade chain
**Why it happens:** NE'd bales not properly excluded from future searches
**How to avoid:** (1) Every NE must register in fardos_nao_encontrados (D-10). (2) Cascade search must query fardos_nao_encontrados and exclude them (D-08). Pattern already established in fardos/ne/route.ts [VERIFIED: lines 77-86]
**Warning signs:** Repeated API calls for same SKU cascade

### Pitfall 5: Transformacao Realtime Not Triggering
**What goes wrong:** Cards don't update when items go to transformacao
**Why it happens:** transformacoes table not in Supabase realtime publication, or not subscribed in use-cards-realtime.ts
**How to avoid:** (1) Migration must include `ALTER PUBLICATION supabase_realtime ADD TABLE transformacoes`. (2) use-cards-realtime.ts must add `.on()` handler for transformacoes table
**Warning signs:** UI only updates after manual page refresh

### Pitfall 6: Partial Cascade Calculation Error
**What goes wrong:** Cascade searches for wrong remainder quantity
**Why it happens:** When separador confirms 30 of 50, remainder is 20. But if there are multiple pedido_ids for same SKU, quantity split is not straightforward
**How to avoid:** Cascade route should receive `sku`, `card_key`, and `quantidade_faltante` (difference) directly. Let the frontend calculate the remainder from numpad input vs needed quantity
**Warning signs:** Wrong quantity reserved for cascade bale

### Pitfall 7: use-fardos-data Select Query Missing is_cascata
**What goes wrong:** is_cascata always undefined/false even after migration adds the column
**Why it happens:** Current trafego_fardos select at use-fardos-data.ts line 37 is `select('id, reserva_id, codigo_in, status, fardista_id')` -- does NOT include is_cascata [VERIFIED]
**How to avoid:** Must expand trafego_fardos select to include is_cascata. Then build trafegoMap that tracks is_cascata per codigo_in. use-fardos-data line 139 changes from `is_cascata: false` to `is_cascata: trafegoEntry?.is_cascata ?? false`
**Warning signs:** CASCATA badge never appears on fardos list

## Code Examples

### Cascade Engine Pure Function (NEW)
```typescript
// Source: Design based on D-06, D-07, D-08 decisions + existing fardo-ne-handler pattern
// File: src/features/prateleira/utils/cascade-engine.ts

import type { StockItem } from '@/features/fardos/types'

export interface CascadeResult {
  found: boolean
  bales: StockItem[]          // bales to reserve (may be multiple per D-07 priority 3)
  remainder: number           // quantity not covered -> goes to transformacao
  totalCovered: number        // sum of bale quantities assigned
}

/**
 * Cascade bale search with 4-priority algorithm (D-07).
 * NO 20% rule (D-06). Excludes reserved + NE bales (D-08).
 */
export function findCascadeBales(
  stock: StockItem[],
  sku: string,
  demanda: number,
  reservedCodigosIn: Set<string>,
  naoEncontradosCodigosIn: Set<string>,
): CascadeResult {
  // Filter available bales for this SKU
  const disponiveis = stock.filter(
    item =>
      item.sku === sku &&
      !reservedCodigosIn.has(item.codigo_in) &&
      !naoEncontradosCodigosIn.has(item.codigo_in)
  )

  if (disponiveis.length === 0) {
    return { found: false, bales: [], remainder: demanda, totalCovered: 0 }
  }

  // Priority 1+2: find single bale closest to demand that covers it
  const sortedByCloseness = [...disponiveis].sort(
    (a, b) => Math.abs(a.quantidade - demanda) - Math.abs(b.quantidade - demanda)
  )
  const singleCover = sortedByCloseness.find(b => b.quantidade >= demanda)
  if (singleCover) {
    return { found: true, bales: [singleCover], remainder: 0, totalCovered: singleCover.quantidade }
  }
  
  // Priority 3: best combination maximizing coverage
  // Greedy approach: sort by quantity descending, pick until covered or exhausted
  const sortedDesc = [...disponiveis].sort((a, b) => b.quantidade - a.quantidade)
  const selected: StockItem[] = []
  let totalCovered = 0
  for (const bale of sortedDesc) {
    if (totalCovered >= demanda) break
    selected.push(bale)
    totalCovered += bale.quantidade
  }

  const remainder = Math.max(0, demanda - totalCovered)
  return {
    found: selected.length > 0,
    bales: selected,
    remainder,
    totalCovered,
  }
}
```

### Cascade API Route Structure
```typescript
// Source: Follows pattern from app/api/fardos/ne/route.ts [VERIFIED]
// File: app/api/prateleira/cascata/route.ts

// POST body: { sku, card_key, quantidade_faltante, pedido_ids, action: 'parcial'|'ne' }
// Flow:
// 1. Auth (createClient -> getUser -> role check separador/admin/lider)
// 2. fetchStock(true) for fresh data
// 3. Build reservedSet + naoEncontradosSet (same pattern as fardos/ne)
// 4. findCascadeBales(stock, sku, quantidade_faltante, reservedSet, neSet)
// 5a. If found: for each bale -> create reserva + trafego_fardos(is_cascata=true) + update progresso
// 5b. If remainder > 0: create transformacoes record
// 5c. If not found at all: create transformacoes record for full quantity
// 6. Return { found_alternative: boolean, bales_reserved: number, transformacao_created: boolean, remainder: number }
```

### Migration 00006 Structure
```sql
-- Source: Decision D-17 from CONTEXT.md + verified is_cascata absence
-- [VERIFIED: is_cascata NOT in any existing migration -- checked 00001-00005 + 20260405]

-- 1. Create transformacoes table (D-17)
CREATE TABLE IF NOT EXISTS transformacoes (
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
CREATE POLICY "Service role can insert/update transformacoes"
  ON transformacoes FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### Updated calcProgress with transformacao exclusion
```typescript
// Source: Current code at card-utils.ts line 55 [VERIFIED]
// Modification per D-18, D-21

export function calcProgress(
  items: { quantidade: number; quantidade_separada: number }[],
  transformacaoTotal: number = 0,  // NEW param
): { total: number; separadas: number; percent: number } {
  let total = 0
  let separadas = 0
  for (const item of items) {
    total += item.quantidade
    separadas += item.quantidade_separada
  }
  // D-21: subtract transformacao pieces from total
  total = Math.max(0, total - transformacaoTotal)
  const percent = total === 0 ? 0 : Math.round((separadas / total) * 100)
  return { total, separadas, percent }
}
```

### PrateleiraHeader Component
```typescript
// Source: UI-SPEC Phase 7 + fardo-counters.tsx pattern [VERIFIED]
// File: src/features/cards/components/prateleira-header.tsx

interface PrateleiraHeaderProps {
  pecasSeparadas: number
  totalPecas: number
  cardsPendentes: number
  cardsConcluidos: number
  searchTerm: string
  onSearchChange: (term: string) => void
}

// Sticky top bar with counters + search input (D-23, D-24)
// Mobile: flex-col gap-2 (counters above search)
// Desktop: flex-row justify-between
// Search: Input with Search icon, placeholder "Buscar por SKU...", 300ms debounce
```

### Cascade chain in fardos/ne (NE on cascade bale)
```typescript
// Source: Existing fardos/ne/route.ts [VERIFIED] -- needs modification for D-09
// When fardista marks NE on a bale that has is_cascata=true in trafego_fardos:
// 1. Check trafego_fardos for is_cascata flag
// 2. If is_cascata=true: use findCascadeBales (no 20% rule) instead of findAlternativeBale
// 3. Register NE in fardos_nao_encontrados (prevents loop per D-10)
// 4. If new bale found: create new reserva + trafego_fardos(is_cascata=true)
// 5. If no bale found: create transformacoes record + remove from card total (D-11)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| is_cascata hardcoded false in TypeScript | is_cascata stored in DB, read from trafego_fardos | Phase 7 | Cascade bales visually distinguished |
| calcProgress counts all pieces | calcProgress excludes transformacao total | Phase 7 | Cards can reach 100% without unsatisfied pieces |
| handleNaoTem calls /api/cards/progress directly | handleNaoTem calls /api/prateleira/cascata | Phase 7 | N/E triggers automatic bale search |
| findAlternativeBale returns single bale | findCascadeBales returns multiple bales with priority algorithm | Phase 7 | Better coverage, multiple bales can cover demand |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Greedy descending sort is adequate for Priority 3 multi-bale selection (vs optimal subset sum) | Cascade Engine | Suboptimal bale selection. Mitigated: D-06 says no 20% rule, any combination works. Greedy maximizes coverage simply [ASSUMED] |
| A2 | numero_pedido in transformacoes can be populated by looking up pedidos by sku+card_key | Migration | If mapping is ambiguous (multiple pedidos per SKU in card), may need comma-separated or first-match. Low risk [ASSUMED] |

## Open Questions (RESOLVED)

1. **Partial cascade: what status should the original progresso record get?**
   - What we know: separador confirms 30 of 50. Progress updated to 30/50 status='parcial'. Cascade searches for remainder of 20.
   - What's unclear: If cascade finds a bale for the 20, does the progresso status change to 'aguardar_fardista' or stay 'parcial'?
   - Recommendation: The confirmed 30 pieces stay as 'parcial' status with quantidade_separada=30. The cascaded remainder is tracked through the new reserva + trafego_fardos entry. The item in the modal should show both: the partially confirmed quantity AND an AGUARDAR FARDISTA badge for the remainder. D-20 says AGUARDAR FARDISTA does NOT count as progress, so the 30 confirmed pieces count but the pending 20 do not.
   - RESOLVED: Implemented in Plan 07-02 Task 1 — status stays 'parcial' with quantidade_separada=confirmed_qty; AGUARDAR FARDISTA display driven by trafego_fardos entry

2. **Multiple pedido_ids per SKU in a card: how does cascade handle them?**
   - What we know: aggregateItems groups multiple pedidos by SKU. A combo card might have 3 pedidos for same SKU.
   - What's unclear: When cascading, should we cascade the full remainder or per-pedido?
   - Recommendation: Cascade at the aggregate SKU level (total needed - total confirmed = remainder for cascade). This matches the UI which shows one line per SKU. The cascade API receives sku + card_key + quantidade_faltante, not individual pedido_ids.
   - RESOLVED: Implemented in Plan 07-02 Task 1 — cascade at aggregate SKU level with quantidade_restante

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (jsdom environment) |
| Config file | vitest.config.ts [VERIFIED] |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRAT-05 | Cascade bale search Priority 1: closest single bale covering demand | unit | `npx vitest run src/features/prateleira/utils/__tests__/cascade-engine.test.ts -x` | Wave 0 |
| PRAT-05 | Cascade bale search Priority 3: multi-bale combination | unit | (same file) | Wave 0 |
| PRAT-05 | Cascade bale search Priority 4: no bale -> full remainder | unit | (same file) | Wave 0 |
| PRAT-05 | Cascade excludes reserved + NE bales | unit | (same file) | Wave 0 |
| CARD-03 | calcProgress excludes transformacao total from denominator | unit | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts -x` | Existing (extend) |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/prateleira/utils/__tests__/cascade-engine.test.ts` -- covers PRAT-05 cascade logic (4 priorities, exclusion, remainder)
- [ ] Extend `src/features/cards/lib/__tests__/card-utils.test.ts` -- add tests for calcProgress with transformacaoTotal param

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | createClient() -> getUser() pattern (established) |
| V3 Session Management | yes | JWT via Supabase (established) |
| V4 Access Control | yes | Role check via supabaseAdmin DB lookup + RLS policies |
| V5 Input Validation | yes | Validate sku (string), quantidade_faltante (number > 0), card_key (string) in cascade API route |
| V6 Cryptography | no | N/A |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Separador cascading items not assigned to them | Elevation of Privilege | Verify card_key belongs to user via atribuicoes table in cascade route |
| Negative or zero quantidade_faltante | Tampering | Validate quantidade_faltante > 0 in API |
| Race condition: two cascades for same SKU bale | Tampering | reservas unique constraint on codigo_in catches duplicates; handle 23505 error gracefully |
| Direct progress manipulation bypassing cascade | Tampering | Cascade route is the only path for Parcial/NE; progress route should not accept aguardar_fardista or transformacao status from client |

## Sources

### Primary (HIGH confidence)
- Codebase files directly read and verified: prateleira-client.tsx, item-modal.tsx, use-card-data.ts, use-cards-realtime.ts, card-utils.ts, reservation-engine.ts, fardo-ne-handler.ts, stock-parser.ts, fardos/ne/route.ts, fardos/ok/route.ts, cards/progress/route.ts, use-fardos-data.ts, fardo-item.tsx, database.types.ts, types/index.ts, all migration files
- 07-CONTEXT.md decisions (D-01 through D-27)
- 07-UI-SPEC.md component inventory and interaction contracts

### Secondary (MEDIUM confidence)
- Established patterns inferred from 5 completed phases of consistent codebase style

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, no new deps needed [VERIFIED: package.json + codebase]
- Architecture: HIGH -- clear patterns from 5 phases, well-documented in STATE.md [VERIFIED]
- Cascade logic: HIGH -- decisions D-06 through D-11 are precise and unambiguous [VERIFIED: CONTEXT.md]
- Pitfalls: HIGH -- verified against actual code (is_cascata hardcoded, calcProgress signature, select query columns)

**Research date:** 2026-04-06
**Valid until:** 2026-04-20 (stable internal project, no external dependency changes expected)

# Phase 9: Dashboard - Research

**Researched:** 2026-04-09
**Domain:** Real-time dashboard with Supabase subscriptions, aggregate queries, historical snapshots
**Confidence:** HIGH

## Summary

Phase 9 builds a read-only real-time dashboard for lider and admin roles, consisting of 6 data blocks: Resumo Geral, Progressao por Metodo de Envio, Top Separadores, Top Fardistas, Status de Fardos, and Por Separador. All blocks update via Supabase realtime subscriptions following the established pattern in `use-cards-realtime.ts`. The phase also introduces a new `historico_diario` table for persisting daily snapshots before day change, and a period filter that queries historical data for rankings.

The codebase already has all UI primitives needed (Card, Badge, Progress, Collapsible, Select, ProgressBar, UrgencyBadge, MarketplaceBadge). The dashboard route exists as a placeholder at `app/(authenticated)/dashboard/page.tsx` and is already wired into NAV_ITEMS for admin and lider roles. The primary technical challenge is writing efficient aggregate queries client-side and integrating the historical snapshot into the existing upload API day-reset flow.

**Primary recommendation:** Build dashboard as a client component tree with a single `useDashboardRealtime` hook (modeled on `useCardsRealtime`) that triggers re-fetch of all aggregated data. Use Supabase client-side `.select()` with `.eq()` filters for aggregation in JS (not SQL RPCs), matching the established `useCardData` pattern. Create `historico_diario` table via migration and insert snapshot logic into the upload route's day-reset block.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Layout assimetrico com 2 colunas: esquerda maior (60%) com Resumo Geral + Progressao por Metodo + Por Separador; direita menor (40%) com Top Separadores + Top Fardistas + Status de Fardos
- **D-02:** Dashboard e uma aba no AppShell existente (nao pagina dedicada). Lider e Admin acessam via navegacao padrao
- **D-03:** Blocos sao cards expansiveis -- clicar expande detalhes dentro do proprio dashboard (lista de cards relacionados)
- **D-04:** Blocos empilhados verticalmente em scroll mobile: Resumo -> Progressao -> Por Separador -> Rankings -> Status Fardos. Full-width, sem colapsar
- **D-05:** 4 stat cards lado a lado com numero grande + label pequeno: pecas separadas | listas pendentes | concluidas | em atraso. Card "em atraso" em vermelho
- **D-06:** Uma linha por grupo de envio: badge com cor do marketplace + nome + barra de progresso + "X/Y pecas" + contagem regressiva + badge de urgencia. Mesmas cores e padrao de urgencia do Phase 5
- **D-07:** Lista numerada com medalha (ouro/prata/bronze) para top 3. Cada linha: posicao + nome + pecas separadas + cards concluidos. Ordenado por pecas (metrica principal)
- **D-08:** Filtro de periodo via Select dropdown dentro do header do bloco. Opcoes: Hoje, Ultimos 15 dias, Ultimos 30 dias, Mes atual, Ultimo mes, Ultimos 3 meses, Periodo personalizado (abre date picker). Aplica simultaneamente para Top Separadores e Top Fardistas
- **D-09:** Mesmo estilo do Top Separadores: lista numerada com medalhas, nome + fardos confirmados. Compartilha filtro de periodo com Top Separadores
- **D-10:** 3 contadores empilhados com cores: PENDENTES (amarelo), ENCONTRADOS (azul), BAIXADOS (verde)
- **D-11:** Lista com barra de progresso por separador: nome + barra + percentual + "X/Y pecas" + N de cards atribuidos. Ordenado por % conclusao
- **D-12:** Queries agregadas (COUNT, SUM, GROUP BY) no Supabase client. Realtime subscription dispara re-fetch. Mesmo padrao do use-cards-realtime.ts
- **D-13:** Snapshot diario antes da virada de dia (aproveita logica existente do UPLD-08). Antes de limpar o banco, salvar dados na tabela historico_diario
- **D-14:** Schema do snapshot: uma linha por usuario por dia com totais por metodo de envio: user_id, role, grupo_envio, pecas_separadas, cards_concluidos, fardos_confirmados, data
- **D-15:** Tabela historico_diario NAO e limpa na virada de dia -- persiste indefinidamente

### Claude's Discretion
- Espacamento e proporcoes exatas do layout assimetrico
- Animacoes de expansao dos blocos
- Skeleton loading durante carregamento inicial
- Tratamento de estados vazios (sem dados no dia)
- Estrategia de debounce para realtime updates

### Deferred Ideas (OUT OF SCOPE)
- **Layout personalizavel com drag-and-drop** (Phase 9.1) -- Blocos arrastaveis e redimensionaveis usando react-grid-layout ou @dnd-kit. Posicao/tamanho salvo por usuario em localStorage ou banco
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Bloco Resumo Geral -- total de pecas separadas no dia, listas pendentes, concluidas, em atraso | Aggregate from pedidos + progresso tables; count cards by completion status; use getUrgencyTier for "em atraso" |
| DASH-02 | Bloco Progressao por Metodo de Envio -- barra de progresso, status urgencia, contagem regressiva por grupo | Group pedidos by grupo_envio, sum progresso, reuse ProgressBar + UrgencyBadge + MarketplaceBadge + useCountdown |
| DASH-03 | Bloco Top Separadores -- ranking por pecas separadas e cards concluidos no dia | Join atribuicoes (tipo=separador) + progresso + pedidos; for historical periods, query historico_diario |
| DASH-04 | Bloco Top Fardistas -- ranking por fardos confirmados no dia | Count baixados grouped by baixado_por; for historical periods, query historico_diario |
| DASH-05 | Bloco Status de Fardos -- pendentes, encontrados, baixados | Count trafego_fardos by status + count baixados; three distinct states with color coding |
| DASH-06 | Bloco Por Separador -- barra de progresso dos cards atribuidos a cada separador | Join atribuicoes (tipo=separador) with card progress aggregation per user |
| DASH-07 | Todos os blocos atualizam em tempo real via Supabase subscriptions | Single channel useDashboardRealtime hook listening to progresso, atribuicoes, reservas, trafego_fardos, baixados, pedidos |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Tailwind + shadcn/ui (non-negotiable) [VERIFIED: package.json]
- **Realtime**: Obrigatorio via Supabase subscriptions -- polling proibido [VERIFIED: CLAUDE.md]
- **Communication**: Sempre em portugues brasileiro [VERIFIED: CLAUDE.md]
- **GSD workflow**: Do not make direct repo edits outside a GSD workflow unless user explicitly asks [VERIFIED: CLAUDE.md]

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.101.1 | Client queries + realtime subscriptions | Project standard, already used everywhere [VERIFIED: package.json] |
| @supabase/ssr | ^0.10.0 | Server-side Supabase client | Project standard for server components [VERIFIED: package.json] |
| next | 14.2.35 | App Router, API routes | Project framework [VERIFIED: package.json] |
| react | ^18 | UI components | Project framework [VERIFIED: package.json] |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-collapsible | ^1.1.12 | Block expand/collapse | Dashboard blocks with expandable details (D-03) [VERIFIED: package.json] |
| @radix-ui/react-select | ^2.2.6 | Period filter dropdown | Rankings period filter (D-08) [VERIFIED: package.json] |
| @radix-ui/react-progress | ^1.1.8 | Progress primitive | Underlying ProgressBar component [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icons (ChevronDown, ChevronUp, Trophy) | Block expand indicators [VERIFIED: package.json] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side aggregation | Supabase RPC/Views | RPC would be more efficient but breaks project pattern of client-side queries; views require migration and are harder to debug |
| Multiple realtime channels | Single channel | Single channel matches useCardsRealtime pattern and avoids connection limit issues |
| react-query/SWR | useState + useEffect | Project uses raw useState/useEffect pattern throughout; adding data fetching library would be inconsistent |

**Installation:**
```bash
# No new dependencies needed. All required packages are already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/dashboard/
  components/
    dashboard-client.tsx        # Main client component (entry point)
    resumo-geral.tsx            # DASH-01: 4 stat cards
    progressao-metodo.tsx       # DASH-02: progress by shipping method
    top-separadores.tsx         # DASH-03: separator ranking
    top-fardistas.tsx           # DASH-04: bale handler ranking
    status-fardos.tsx           # DASH-05: bale status counters
    por-separador.tsx           # DASH-06: per-separator progress
    period-filter.tsx           # D-08: shared period Select
    dashboard-block.tsx         # Shared wrapper: Card + Collapsible
    stat-card.tsx               # Reusable stat card for Resumo Geral
  hooks/
    use-dashboard-data.ts       # Fetches + aggregates all dashboard data
    use-dashboard-realtime.ts   # Supabase subscription (triggers re-fetch)
    use-period-filter.ts        # Period filter state + date range logic
  lib/
    dashboard-queries.ts        # Pure functions: aggregate raw data into dashboard metrics
    date-utils.ts               # Period date range calculation
  types.ts                      # Dashboard-specific types
```
[VERIFIED: matches project feature structure in src/features/cards/, src/features/fardos/, etc.]

### Pattern 1: Realtime Subscription with Re-fetch
**What:** Single Supabase channel subscribes to multiple tables; any change triggers full data re-fetch and re-aggregation.
**When to use:** All 6 dashboard blocks.
**Example:**
```typescript
// Source: src/features/cards/hooks/use-cards-realtime.ts (existing pattern)
export function useDashboardRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progresso' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atribuicoes' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trafego_fardos' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baixados' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => onUpdate())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [onUpdate])
}
```
[VERIFIED: exact pattern from use-cards-realtime.ts]

### Pattern 2: Client-Side Data Aggregation
**What:** Fetch raw rows from Supabase, aggregate in JS using Maps and loops.
**When to use:** Computing dashboard metrics (counts, sums, groupings).
**Example:**
```typescript
// Source: src/features/cards/hooks/use-card-data.ts (existing pattern)
// Fetch all tables in parallel, then aggregate in JS
const [pedidosRes, progressoRes, atribuicoesRes, baixadosRes, trafegoRes] =
  await Promise.all([
    supabase.from('pedidos').select('*'),
    supabase.from('progresso').select('*'),
    supabase.from('atribuicoes').select('*, users(nome)'),
    supabase.from('baixados').select('*'),
    supabase.from('trafego_fardos').select('*'),
  ])

// Aggregate in JS (same pattern as useCardData)
const pecasPorGrupo = new Map<string, { total: number; separadas: number }>()
```
[VERIFIED: exact pattern from use-card-data.ts]

### Pattern 3: Period-Filtered Historical Query
**What:** When period filter is not "Hoje", query `historico_diario` table with date range filter.
**When to use:** Top Separadores and Top Fardistas with non-today period.
**Example:**
```typescript
// For "Hoje": aggregate from live tables (pedidos + progresso + atribuicoes + baixados)
// For historical periods: query historico_diario with date range
const { data } = await supabase
  .from('historico_diario')
  .select('*')
  .gte('data', startDate)
  .lte('data', endDate)
// Then aggregate: sum pecas_separadas, cards_concluidos, fardos_confirmados per user
```
[ASSUMED: historico_diario table does not exist yet -- D-13/D-14 define it]

### Anti-Patterns to Avoid
- **Separate fetch per block:** Do NOT create 6 independent fetch calls. Fetch all raw data once, aggregate into 6 different views in a single hook.
- **Polling fallback:** Do NOT use setInterval as fallback. Supabase subscriptions are mandatory (project constraint).
- **Server Components for realtime data:** Dashboard MUST be a client component tree since it needs realtime subscriptions and useEffect.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bars | Custom div-based progress | Existing `ProgressBar` component from cards | Already handles urgency tiers and colors [VERIFIED: src/features/cards/components/progress-bar.tsx] |
| Urgency badges | Custom styled spans | Existing `UrgencyBadge` component | Handles countdown display and pulse animation [VERIFIED: src/features/cards/components/urgency-badge.tsx] |
| Marketplace badges | Custom colored badges | Existing `MarketplaceBadge` component | Uses established color config [VERIFIED: src/features/cards/components/marketplace-badge.tsx] |
| Urgency calculation | Custom deadline logic | Existing `getUrgencyTier` from card-utils | Already handles all 6 shipping groups with correct deadlines [VERIFIED: src/features/cards/lib/card-utils.ts] |
| Countdown formatting | Custom time math | Existing `formatCountdown` from card-utils | Already handles hours/minutes format [VERIFIED: src/features/cards/lib/card-utils.ts] |
| Collapsible blocks | Custom height animation | shadcn `Collapsible` | Already installed, handles aria properly [VERIFIED: src/components/ui/collapsible.tsx] |
| Period dropdown | Custom dropdown | shadcn `Select` | Already installed, handles keyboard navigation [VERIFIED: src/components/ui/select.tsx] |

**Key insight:** ~80% of the visual components this dashboard needs already exist in the cards feature. The dashboard is primarily a data aggregation layer with layout composition, not a UI engineering challenge.

## Common Pitfalls

### Pitfall 1: Supabase Realtime Publication Missing for New Tables
**What goes wrong:** `baixados` and `pedidos` tables may not be in the realtime publication, causing subscriptions to connect but never fire events.
**Why it happens:** The existing `20260405_realtime_publication.sql` migration only adds progresso, atribuicoes, reservas, trafego_fardos to supabase_realtime publication. [VERIFIED: migration file]
**How to avoid:** Create a new migration that adds `baixados` and `pedidos` to the realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE baixados;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
```
**Warning signs:** Dashboard blocks update on some actions but not on baixa confirmations or new uploads.

### Pitfall 2: Debounce Needed for Rapid Realtime Updates
**What goes wrong:** Multiple progresso updates in quick succession (e.g., separador confirming several items rapidly) cause the dashboard to re-fetch 10+ times in 2 seconds, creating UI flicker and Supabase rate concerns.
**Why it happens:** Each progresso row update fires a separate realtime event.
**How to avoid:** Debounce the onUpdate callback in useDashboardRealtime. 300-500ms debounce is appropriate -- fast enough to feel real-time, slow enough to batch rapid changes.
**Warning signs:** Dashboard stat numbers flickering during active separation.

### Pitfall 3: Historical Snapshot Must Run Before Delete
**What goes wrong:** If the snapshot logic runs after the virada-de-dia delete, there is no data to snapshot.
**Why it happens:** The upload route deletes atribuicoes, progresso, reservas, pedidos THEN updates config. Snapshot must be inserted BEFORE these deletes.
**How to avoid:** Insert snapshot aggregation query and insert into `historico_diario` immediately after the `if (!dataConfig || dataConfig.valor !== today)` check but BEFORE the delete statements in `app/api/upload/route.ts` lines 59-62. [VERIFIED: upload route.ts lines 53-75]
**Warning signs:** historico_diario table always empty despite normal daily operation.

### Pitfall 4: "Hoje" Filter Must Not Use historico_diario
**What goes wrong:** If "Hoje" queries historico_diario, it finds no data (snapshot only written at day change).
**Why it happens:** The snapshot is created at virada de dia, which means today's data only appears in historico_diario tomorrow.
**How to avoid:** "Hoje" must always query live tables (pedidos + progresso + atribuicoes + baixados). Only non-today periods query historico_diario.
**Warning signs:** Rankings show 0 for everyone when "Hoje" is selected but work for "Ultimos 15 dias".

### Pitfall 5: Counting "Em Atraso" Cards Requires Deadline Awareness
**What goes wrong:** The "Em Atraso" stat card shows wrong count because it counts incomplete cards without checking deadline.
**Why it happens:** A card is only "em atraso" if it is incomplete AND its deadline has passed. An incomplete card with 3 hours left is NOT em atraso.
**How to avoid:** Use the existing `getUrgencyTier` function per card; count cards where urgency === 'overdue'. [VERIFIED: card-utils.ts]
**Warning signs:** "Em Atraso" shows all incomplete cards instead of only deadline-exceeded ones.

### Pitfall 6: Status de Fardos Must Count Correctly Across Tables
**What goes wrong:** ENCONTRADOS count is wrong because it counts all trafego_fardos with status='encontrado' without excluding those that are already baixados.
**Why it happens:** A fardo moves through: reserva -> trafego (pendente) -> trafego (encontrado) -> baixados. ENCONTRADOS should be found but NOT yet baixado.
**How to avoid:** ENCONTRADOS = trafego_fardos WHERE status='encontrado' AND codigo_in NOT IN (SELECT codigo_in FROM baixados). BAIXADOS = count of baixados table. PENDENTES = trafego_fardos WHERE status='pendente'.
**Warning signs:** ENCONTRADOS + BAIXADOS > total trafego_fardos with status='encontrado'.

## Code Examples

### Dashboard Data Types
```typescript
// Source: derived from CONTEXT.md D-05 through D-11
export interface DashboardData {
  resumo: {
    pecas_separadas: number
    listas_pendentes: number
    listas_concluidas: number
    listas_em_atraso: number
  }
  progressao: ProgressaoMetodo[]
  topSeparadores: RankingEntry[]
  topFardistas: RankingEntry[]
  statusFardos: {
    pendentes: number
    encontrados: number
    baixados: number
  }
  porSeparador: SeparadorProgress[]
}

export interface ProgressaoMetodo {
  grupo_envio: string
  total_pecas: number
  pecas_separadas: number
  percent: number
  urgency: UrgencyTier
  deadline_ms: number // for countdown
}

export interface RankingEntry {
  position: number
  user_id: string
  nome: string
  pecas_separadas: number
  cards_concluidos: number
  fardos_confirmados: number
}

export interface SeparadorProgress {
  user_id: string
  nome: string
  total_pecas: number
  pecas_separadas: number
  percent: number
  num_cards: number
}

export type PeriodFilter =
  | 'hoje'
  | '15d'
  | '30d'
  | 'mes_atual'
  | 'ultimo_mes'
  | '3m'
  | 'personalizado'
```

### historico_diario Migration
```sql
-- Source: CONTEXT.md D-13, D-14, D-15
CREATE TABLE historico_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  grupo_envio TEXT NOT NULL,
  pecas_separadas INTEGER NOT NULL DEFAULT 0,
  cards_concluidos INTEGER NOT NULL DEFAULT 0,
  fardos_confirmados INTEGER NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for period queries
CREATE INDEX idx_historico_data ON historico_diario(data);
CREATE INDEX idx_historico_user_data ON historico_diario(user_id, data);

-- RLS: read for authenticated
ALTER TABLE historico_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura autenticada" ON historico_diario FOR SELECT TO authenticated USING (true);
-- Write via service role only (from upload API)
```

### Snapshot Insert Logic (in upload route virada de dia)
```typescript
// Source: CONTEXT.md D-13 -- insert BEFORE the delete block in upload route
// Must run after line 56 check and BEFORE line 59 deletes

// Aggregate separador stats: pecas_separadas and cards concluidos per user per grupo_envio
const { data: separadorStats } = await supabase.rpc('snapshot_separadores') // or manual join

// Alternative: manual aggregation (matching project pattern)
const { data: allPedidos } = await supabase.from('pedidos').select('id, card_key, grupo_envio, quantidade')
const { data: allProgresso } = await supabase.from('progresso').select('pedido_id, quantidade_separada')
const { data: allAtrib } = await supabase.from('atribuicoes').select('card_key, user_id, tipo')
const { data: allBaixados } = await supabase.from('baixados').select('baixado_por, codigo_in')

// Build snapshot rows and insert into historico_diario
await supabase.from('historico_diario').insert(snapshotRows)
```

### Debounced Realtime Hook
```typescript
// Source: project pattern + Claude's discretion on debounce strategy
import { useEffect, useRef, useCallback } from 'react'

export function useDebouncedCallback(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(callback, delay)
  }, [callback, delay])
}

// Usage in dashboard:
const debouncedFetch = useDebouncedCallback(fetchDashboardData, 300)
useDashboardRealtime(debouncedFetch)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase .rpc() for aggregation | Client-side aggregation with .select('*') | Project convention from Phase 5 | Simpler to debug; no need for SQL functions in Supabase |
| Multiple realtime channels | Single channel with multiple .on() | Phase 5 pattern | Avoids connection limit issues |
| Server-side dashboard | Client-side with realtime | Project architecture | Enables real-time updates without SSR re-rendering |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | historico_diario does not need to be in realtime publication (it is written once at day change, not subscribed to) | Architecture Patterns | LOW -- if someone opens rankings on historical filter during day change, they might miss the new snapshot; acceptable since day change is a rare event |
| A2 | Date range calculation for "Mes atual" uses local Sao Paulo timezone | Code Examples | MEDIUM -- timezone mismatch could cause off-by-one day errors in period queries; upload route uses `America/Sao_Paulo` [VERIFIED: upload route getTodayBrasilia()] |
| A3 | "Concluidas" in Resumo Geral means cards where all pecas are 100% separated (urgency='done') | Pitfalls | MEDIUM -- if "concluidas" means something different (e.g., delivered), the stat will be wrong |

## Open Questions

1. **Should transformacao deductions apply to dashboard progress?**
   - What we know: `calcProgress` in card-utils already deducts transformacao from total [VERIFIED: card-utils.ts line 66]
   - What's unclear: Should dashboard Resumo Geral "pecas separadas" include transformacao deduction?
   - Recommendation: Yes, reuse calcProgress consistently. Otherwise dashboard numbers won't match card-level numbers.

2. **Should the historico_diario snapshot include transformacao data?**
   - What we know: D-14 specifies user_id, role, grupo_envio, pecas_separadas, cards_concluidos, fardos_confirmados, data
   - What's unclear: Whether pecas_separadas should be raw or net-of-transformacao
   - Recommendation: Store raw pecas_separadas (what the separador actually touched). Transformation is a system adjustment, not a user metric.

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
| DASH-01 | Resumo Geral aggregation (pecas, pendentes, concluidas, em atraso) | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "resumo"` | Wave 0 |
| DASH-02 | Progressao por Metodo aggregation + urgency tiers | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "progressao"` | Wave 0 |
| DASH-03 | Top Separadores ranking logic (today + historical) | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "separadores"` | Wave 0 |
| DASH-04 | Top Fardistas ranking logic (today + historical) | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "fardistas"` | Wave 0 |
| DASH-05 | Status de Fardos counting (pendentes/encontrados/baixados) | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "status fardos"` | Wave 0 |
| DASH-06 | Por Separador progress aggregation | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -t "por separador"` | Wave 0 |
| DASH-07 | Realtime subscription fires re-fetch | manual-only | Manual: verify dashboard updates when another user modifies data | N/A |
| D-13 | Historical snapshot created before day change | unit | `npx vitest run src/features/dashboard/lib/__tests__/snapshot.test.ts` | Wave 0 |
| D-08 | Period filter date range calculation | unit | `npx vitest run src/features/dashboard/lib/__tests__/date-utils.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/dashboard/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/dashboard/lib/__tests__/dashboard-queries.test.ts` -- covers DASH-01 through DASH-06
- [ ] `src/features/dashboard/lib/__tests__/snapshot.test.ts` -- covers D-13 snapshot aggregation
- [ ] `src/features/dashboard/lib/__tests__/date-utils.test.ts` -- covers D-08 period filter date ranges

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Already handled by AppShell layout (redirect if no user) [VERIFIED: app/(authenticated)/layout.tsx] |
| V3 Session Management | no | JWT handled by Supabase SSR [VERIFIED: existing auth flow] |
| V4 Access Control | yes | Dashboard visible only to admin/lider via NAV_ITEMS role filtering + middleware [VERIFIED: role-config.ts] |
| V5 Input Validation | yes | Period filter date inputs must be validated (no future dates, start <= end) |
| V6 Cryptography | no | No crypto operations in dashboard |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized dashboard access | Elevation of Privilege | Role check in middleware + NAV_ITEMS filtering [VERIFIED: existing] |
| historico_diario data tampering | Tampering | Write only via service_role_key in upload API; RLS blocks client writes |
| Date injection in period filter | Tampering | Validate date format and range client-side before query |

## Sources

### Primary (HIGH confidence)
- `src/features/cards/hooks/use-cards-realtime.ts` -- Realtime subscription pattern
- `src/features/cards/hooks/use-card-data.ts` -- Data fetching and aggregation pattern
- `src/features/cards/lib/card-utils.ts` -- Urgency tiers, progress calculation, countdown formatting
- `src/features/cards/lib/deadline-config.ts` -- Deadline hours, marketplace colors
- `app/api/upload/route.ts` -- Virada de dia logic (lines 53-75)
- `supabase/migrations/00001_initial_schema.sql` -- Database schema
- `supabase/migrations/20260405_realtime_publication.sql` -- Realtime publication config
- `src/features/auth/lib/role-config.ts` -- Dashboard already in NAV_ITEMS for admin/lider
- `.planning/phases/09-dashboard/09-UI-SPEC.md` -- Complete visual specification
- `.planning/phases/09-dashboard/09-CONTEXT.md` -- All implementation decisions

### Secondary (MEDIUM confidence)
- `package.json` -- All dependency versions verified

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed and verified in package.json
- Architecture: HIGH -- directly follows established patterns from Phase 5 cards feature
- Pitfalls: HIGH -- identified from concrete codebase analysis (missing realtime publications, snapshot ordering)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable -- no external dependency changes expected)

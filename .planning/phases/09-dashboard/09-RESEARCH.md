# Phase 9: Dashboard - Research

**Researched:** 2026-04-09 (re-research)
**Domain:** Real-time dashboard with Supabase subscriptions, aggregate queries, historical snapshots
**Confidence:** HIGH

## Summary

Phase 9 builds a read-only real-time dashboard for lider and admin roles, consisting of 6 data blocks: Resumo Geral, Progressao por Metodo de Envio, Top Separadores, Top Fardistas, Status de Fardos, and Por Separador. All blocks update via Supabase realtime subscriptions following the established pattern in `use-cards-realtime.ts`. The phase also introduces a new `historico_diario` table for persisting daily snapshots before day change, and a period filter that queries historical data for rankings.

The codebase already has all UI primitives needed (Card, Badge, Progress, Collapsible, Select, ProgressBar, UrgencyBadge, MarketplaceBadge). The dashboard page exists as a placeholder at `app/(authenticated)/dashboard/page.tsx` with AppShell already wired for admin and lider roles via `role-config.ts`. The primary technical challenges are: (1) writing efficient aggregate queries client-side from 6+ tables, (2) integrating the historical snapshot into the existing upload API day-reset flow at `app/api/upload/route.ts`, and (3) adding `pedidos` to the Supabase realtime publication (currently missing).

**Primary recommendation:** Build dashboard as a client component tree with a single `useDashboardRealtime` hook (modeled on `useCardsRealtime`) that triggers re-fetch of all aggregated data. Use Supabase client-side `.select()` with JS-side aggregation (matching the `useCardData` pattern). Create `historico_diario` table via migration and insert snapshot logic into the upload route's day-reset block (lines 56-75 of `app/api/upload/route.ts`).

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
- **Layout personalizavel com drag-and-drop** (Phase 9.1) -- Blocos arrastaveis e redimensionaveis. Posicao/tamanho salvo por usuario
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Bloco Resumo Geral -- total pecas separadas, listas pendentes, concluidas, em atraso | Aggregation from pedidos+progresso tables; stat-card component pattern |
| DASH-02 | Bloco Progressao por Metodo -- barra progresso, urgencia, contagem regressiva por grupo | Reuse ProgressBar, UrgencyBadge, DEADLINES config; group by grupo_envio |
| DASH-03 | Bloco Top Separadores -- ranking por pecas separadas e cards concluidos | Aggregate progresso+atribuicoes by user_id; historico_diario for period filter |
| DASH-04 | Bloco Top Fardistas -- ranking por fardos confirmados | Aggregate baixados by baixado_por; historico_diario for period filter |
| DASH-05 | Bloco Status de Fardos -- pendentes, encontrados, baixados | Count from reservas (pendentes), trafego_fardos (encontrados), baixados (baixados) |
| DASH-06 | Bloco Por Separador -- barra progresso cards atribuidos a cada separador | Join atribuicoes+pedidos+progresso; aggregate by separador user_id |
| DASH-07 | Todos os blocos atualizam em tempo real via Supabase subscriptions | Single channel multi-table subscription pattern from useCardsRealtime |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.101.1 | Database queries + realtime subscriptions | Already installed, project standard [VERIFIED: package.json] |
| @supabase/ssr | 0.10.0 | Server-side Supabase client | Already installed [VERIFIED: package.json] |
| React 18 | ^18 | UI framework | Already installed [VERIFIED: package.json] |
| Next.js 14 | 14.2.35 | App router, API routes | Already installed [VERIFIED: package.json] |
| shadcn/ui | N/A | Card, Badge, Progress, Collapsible, Select, Separator, Input | All components already installed [VERIFIED: src/components/ui/] |
| lucide-react | 1.7.0 | Icons (ChevronDown, ChevronUp) | Already installed [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing ProgressBar | N/A | Progress bars in Progressao and Por Separador | Reuse from `src/features/cards/components/progress-bar.tsx` [VERIFIED: codebase] |
| Existing UrgencyBadge | N/A | Urgency indicators in Progressao | Reuse from Phase 5 components [VERIFIED: CONTEXT.md canonical refs] |
| Existing MarketplaceBadge | N/A | Marketplace color badges | Reuse from Phase 5 components [VERIFIED: CONTEXT.md canonical refs] |
| Existing deadline-config | N/A | DEADLINES, COLUMN_ORDER, MARKETPLACE_COLORS | Reuse from `src/features/cards/lib/deadline-config.ts` [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side JS aggregation | Supabase RPC/Views | RPC adds complexity; JS aggregation matches established useCardData pattern |
| date-fns for period ranges | Manual Date math | No need for extra dependency; date range calculations are simple arithmetic |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/dashboard/
  types.ts                           # Dashboard-specific types
  lib/
    dashboard-queries.ts             # Pure aggregation functions (computeResumo, etc.)
    date-utils.ts                    # Period filter date range calculation
    snapshot.ts                      # Snapshot row builder for virada de dia
    __tests__/
      dashboard-queries.test.ts
      date-utils.test.ts
      snapshot.test.ts
  hooks/
    use-dashboard-data.ts            # Main data hook (fetch + aggregate)
    use-dashboard-realtime.ts        # Single channel multi-table subscription
    use-period-filter.ts             # Period filter state management
  components/
    dashboard-client.tsx             # Main client entry composing all blocks
    dashboard-block.tsx              # Shared block wrapper (Card + Collapsible)
    stat-card.tsx                    # Individual stat card (DASH-01)
    resumo-geral.tsx                 # Resumo Geral block
    progressao-metodo.tsx            # Progressao por Metodo block
    top-separadores.tsx              # Top Separadores block
    top-fardistas.tsx                # Top Fardistas block
    status-fardos.tsx                # Status de Fardos block
    por-separador.tsx                # Por Separador block
    period-filter.tsx                # Period Select + custom date picker

app/(authenticated)/dashboard/
  page.tsx                           # Server component importing DashboardClient

supabase/migrations/
  00011_historico_diario.sql         # New table for historical snapshots
  00012_realtime_pedidos.sql         # Add pedidos to realtime publication

app/api/upload/route.ts              # Modified: insert snapshot before day-reset delete
```

### Pattern 1: Client-side Aggregation with Re-fetch on Realtime
**What:** Fetch raw data from Supabase, aggregate in JS, re-fetch everything when a realtime event arrives.
**When to use:** When data needs to be aggregated across multiple tables and Supabase RPC is overkill.
**Example:**
```typescript
// Source: established pattern in src/features/cards/hooks/use-card-data.ts [VERIFIED: codebase]
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [pedidosRes, progressoRes, atribuicoesRes, reservasRes, trafegoRes, baixadosRes] =
      await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('progresso').select('*'),
        supabase.from('atribuicoes').select('*, users(nome)'),
        supabase.from('reservas').select('*'),
        supabase.from('trafego_fardos').select('*'),
        supabase.from('baixados').select('*'),
      ])
    // ... error handling, then aggregate in JS
    setData({
      resumo: computeResumo(pedidos, progresso),
      progressao: computeProgressao(pedidos, progresso),
      // ...
    })
  }, [])

  useDashboardRealtime(fetchData)

  useEffect(() => { fetchData() }, [fetchData])
  return { data, loading }
}
```

### Pattern 2: Single Channel Multi-table Subscription
**What:** One Supabase channel with multiple `.on()` handlers, each watching a different table. Triggers a single callback on any change.
**When to use:** Dashboard listening to changes across 5+ tables.
**Example:**
```typescript
// Source: src/features/cards/hooks/use-cards-realtime.ts [VERIFIED: codebase]
const channel = supabase
  .channel('dashboard-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'progresso' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'atribuicoes' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trafego_fardos' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'baixados' }, () => onUpdate())
  .subscribe()
```

### Pattern 3: Snapshot Before Day-Reset
**What:** Before the upload route deletes daily data on virada de dia, insert aggregated snapshot rows into `historico_diario`.
**When to use:** Preserving ranking data across days for the period filter.
**Example:**
```typescript
// Insert into app/api/upload/route.ts BEFORE the delete block (line ~58)
// Source: D-13 in CONTEXT.md [VERIFIED: user decision]
if (!dataConfig || dataConfig.valor !== today) {
  // --- SNAPSHOT BEFORE DELETE ---
  const snapshotRows = await buildSnapshotRows(supabase, dataConfig?.valor || today)
  if (snapshotRows.length > 0) {
    await supabase.from('historico_diario').insert(snapshotRows)
  }
  // --- THEN DELETE AS BEFORE ---
  await supabase.from('atribuicoes').delete().neq('id', '')
  // ...
}
```

### Anti-Patterns to Avoid
- **Separate channels per table:** Creates memory leaks and connection overhead. Use single channel with multiple `.on()` handlers. [VERIFIED: established pattern in useCardsRealtime]
- **Polling instead of subscriptions:** Explicitly prohibited by project constraints. [VERIFIED: CLAUDE.md project constraints]
- **Heavy SQL RPCs for aggregation:** Overkill for this data volume. JS aggregation matches the established useCardData pattern and keeps logic testable. [VERIFIED: codebase pattern]
- **Separate fetch per block:** Use a single fetch-all + distribute pattern. Reduces round trips from 6 to 1.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bars | Custom div+width | Existing `ProgressBar` from `src/features/cards/components/progress-bar.tsx` | Already handles urgency colors and clamping [VERIFIED: codebase] |
| Urgency calculation | Custom deadline logic | Existing `getUrgencyTier` from `src/features/cards/lib/card-utils.ts` | Handles all 6 deadline groups, testable with custom `now` [VERIFIED: codebase] |
| Marketplace badges | Custom colored badges | Existing `MarketplaceBadge` + `MARKETPLACE_COLORS` from deadline-config | Already has correct hex colors per marketplace [VERIFIED: codebase] |
| Countdown formatting | Custom time formatting | Existing `formatCountdown` from `src/features/cards/lib/card-utils.ts` | Returns "Xh Ymin" format, null if overdue [VERIFIED: codebase] |
| Block expand/collapse | Custom animation | shadcn Collapsible component | Already installed, handles aria-expanded [VERIFIED: components/ui/collapsible.tsx] |
| Period select dropdown | Custom dropdown | shadcn Select component | Already installed, keyboard accessible [VERIFIED: components/ui/select.tsx] |

**Key insight:** Phase 5 established virtually all the UI primitives needed. The dashboard is primarily a composition exercise, not a component-building exercise.

## Common Pitfalls

### Pitfall 1: pedidos Not in Realtime Publication
**What goes wrong:** Dashboard subscribes to `pedidos` table changes but receives no events.
**Why it happens:** The `20260405_realtime_publication.sql` migration only added `progresso`, `atribuicoes`, `reservas`, and `trafego_fardos`. `pedidos` was added later but never included in the publication. [VERIFIED: supabase/migrations/]
**How to avoid:** Create migration `00012_realtime_pedidos.sql` that adds `pedidos` to `supabase_realtime` publication.
**Warning signs:** Dashboard stat cards don't update when new imports happen.

### Pitfall 2: Snapshot Runs on Empty Database
**What goes wrong:** First upload of a brand new day triggers virada de dia, but there's no previous day's data to snapshot.
**Why it happens:** On the very first use or after the first day, `dataConfig.valor` may be null or equal to today (no previous day data exists).
**How to avoid:** Guard snapshot logic: only build snapshot if the previous date is different from today AND progresso table has rows.
**Warning signs:** Empty rows in historico_diario with zeros.

### Pitfall 3: Debounce Missing on Realtime Updates
**What goes wrong:** Rapid-fire realtime events during bulk operations (upload, cascata) cause dozens of re-fetches per second, hammering Supabase.
**Why it happens:** `useCardsRealtime` does not debounce (fires on every event). During upload of 200 pedidos, each insert triggers an event.
**How to avoid:** Add debounce (300-500ms) to the `useDashboardRealtime` hook's `onUpdate` callback.
**Warning signs:** Browser becomes sluggish during uploads; Supabase rate limits hit.

### Pitfall 4: Status de Fardos Double-Counting
**What goes wrong:** "ENCONTRADOS" count includes fardos that have already been baixados.
**Why it happens:** A fardo in `trafego_fardos` with `status='encontrado'` may also have a row in `baixados`. Without cross-referencing, it gets counted as both.
**How to avoid:** ENCONTRADOS = trafego_fardos where status='encontrado' AND codigo_in NOT IN baixados. Or simpler: PENDENTES = reservas with status='reservado' minus trafego entries; ENCONTRADOS = trafego minus baixados; BAIXADOS = count of baixados.
**Warning signs:** Total across all 3 statuses exceeds total reservas.

### Pitfall 5: Period Filter Timezone Mismatch
**What goes wrong:** "Hoje" filter returns no data or previous day's data.
**Why it happens:** `historico_diario.data` uses Brasilia date (from `getTodayBrasilia()`) but Date comparisons in the browser use local timezone.
**How to avoid:** Always use `America/Sao_Paulo` timezone when computing date ranges. The existing `getTodayBrasilia()` pattern in the upload route shows how. [VERIFIED: app/api/upload/route.ts line 11-13]
**Warning signs:** Rankings empty during early morning hours.

### Pitfall 6: Snapshot Misses Fardista Data
**What goes wrong:** Top Fardistas historical data is incomplete because `baixados` references `trafego_fardos` which references `reservas` -- all of which may be deleted on virada de dia.
**Why it happens:** The virada de dia in the upload route currently only deletes `atribuicoes`, `progresso`, `reservas`, `pedidos` -- but `trafego_fardos` and `baixados` are preserved [VERIFIED: upload route.ts lines 57-63]. However, `reservas` deletion cascades to `trafego_fardos` via FK, which cascades to `baixados`.
**How to avoid:** The snapshot MUST run before any deletes. The buildSnapshotRows function must count baixados.baixado_por for fardista rankings.
**Warning signs:** Top Fardistas shows zero historical data despite fardistas having worked.

## Code Examples

### Database Migration: historico_diario
```sql
-- Source: D-14 schema decision [VERIFIED: CONTEXT.md]
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

CREATE INDEX idx_historico_data ON historico_diario(data);
CREATE INDEX idx_historico_user ON historico_diario(user_id, data);

-- RLS: read for authenticated
ALTER TABLE historico_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura autenticada" ON historico_diario FOR SELECT TO authenticated USING (true);
-- Write via service role only (upload API)
```

### Computing Resumo Geral (Pure Function)
```typescript
// Source: derived from useCardData aggregation pattern [VERIFIED: codebase]
export function computeResumo(
  pedidos: PedidoRow[],
  progresso: ProgressoRow[],
  deadlines: Record<string, number>,
): ResumoData {
  const progressMap = new Map(progresso.map(p => [p.pedido_id, p]))
  const cardKeys = new Set(pedidos.map(p => p.card_key))

  let pecasSeparadas = 0
  let totalPecas = 0
  const cardProgress = new Map<string, { separadas: number; total: number }>()

  for (const pedido of pedidos) {
    const prog = progressMap.get(pedido.id)
    const sep = prog?.quantidade_separada ?? 0
    pecasSeparadas += sep
    totalPecas += pedido.quantidade

    const existing = cardProgress.get(pedido.card_key) ?? { separadas: 0, total: 0 }
    existing.separadas += sep
    existing.total += pedido.quantidade
    cardProgress.set(pedido.card_key, existing)
  }

  let concluidas = 0
  let emAtraso = 0
  for (const [cardKey, progress] of Array.from(cardProgress.entries())) {
    if (progress.total > 0 && progress.separadas >= progress.total) {
      concluidas++
    }
  }
  // Em atraso: cards where urgency === 'overdue' and not complete
  // ... use getUrgencyTier with grupo_envio from first pedido of each card

  const pendentes = cardKeys.size - concluidas
  return { pecasSeparadas, pendentes, concluidas, emAtraso }
}
```

### Debounced Realtime Hook
```typescript
// Source: useCardsRealtime pattern + debounce for dashboard volume [VERIFIED: codebase pattern]
export function useDashboardRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    let timeout: NodeJS.Timeout

    const debouncedUpdate = () => {
      clearTimeout(timeout)
      timeout = setTimeout(onUpdate, 300)
    }

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progresso' }, debouncedUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atribuicoes' }, debouncedUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, debouncedUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trafego_fardos' }, debouncedUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baixados' }, debouncedUpdate)
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling for dashboard data | Supabase Realtime subscriptions | Project inception | Mandatory per project constraints |
| Server-side aggregation via SQL views | Client-side fetch + JS aggregation | Established in Phase 5 | Matches useCardData pattern, keeps logic testable |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | historico_diario only needs INSERT via service role (no client writes) | Architecture | LOW -- write policy can be added later if needed |
| A2 | reservas deletion cascades to trafego_fardos and then to baixados via FK | Pitfall 6 | HIGH -- if cascade doesn't happen, snapshot timing is less critical but virada data retention changes |
| A3 | Data volume per day is small enough (<5000 pedidos, <50 users) for full table fetches | Architecture | MEDIUM -- if volume grows, would need pagination or server-side aggregation |

## Open Questions (RESOLVED)

1. **Reservas FK cascade behavior** -- RESOLVED
   - What we know: `trafego_fardos.reserva_id` references `reservas(id) ON DELETE CASCADE`, and `baixados.trafego_id` references `trafego_fardos(id)` [VERIFIED: 00001_initial_schema.sql]. However, the upload route comments say "NAO limpar: trafego_fardos, baixados, fardos_nao_encontrados" suggesting they intend to keep these. But deleting reservas WILL cascade-delete trafego_fardos.
   - Resolution: The baixados FK to trafego_fardos was dropped in migration 00010_baixados_full_data.sql, so deleting reservas cascade-deletes trafego_fardos but baixados survives. The snapshot MUST run before deletes regardless to capture trafego_fardos data. Plan 09-04 implements this guard.

2. **historico_diario write policy** -- RESOLVED
   - What we know: All other tables use service role for writes (upload API pattern).
   - Resolution: Service role only for writes (matching upload API pattern). SELECT policy for authenticated users. This matches the migration in 00011_historico_diario.sql which creates an authenticated SELECT policy with no INSERT/UPDATE/DELETE policies (service role bypasses RLS).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run src/features/dashboard` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | computeResumo returns correct counts | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-02 | computeProgressao groups by metodo with urgency | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-03 | computeTopSeparadores ranks by pecas | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-04 | computeTopFardistas ranks by fardos | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-05 | computeStatusFardos excludes double-counted fardos | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-06 | computePorSeparador aggregates by assigned user | unit | `npx vitest run src/features/dashboard/lib/__tests__/dashboard-queries.test.ts -x` | Wave 0 |
| DASH-07 | Realtime subscription fires on table changes | manual-only | N/A -- requires live Supabase connection | N/A |
| D-13 | buildSnapshotRows produces correct rows | unit | `npx vitest run src/features/dashboard/lib/__tests__/snapshot.test.ts -x` | Wave 0 |
| D-08 | getDateRange computes correct ranges for all periods | unit | `npx vitest run src/features/dashboard/lib/__tests__/date-utils.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/features/dashboard`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/dashboard/lib/__tests__/dashboard-queries.test.ts` -- covers DASH-01 through DASH-06
- [ ] `src/features/dashboard/lib/__tests__/date-utils.test.ts` -- covers D-08 period filter
- [ ] `src/features/dashboard/lib/__tests__/snapshot.test.ts` -- covers D-13 snapshot logic

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Handled by existing auth (Phase 2) |
| V3 Session Management | no | Handled by existing JWT (Phase 2) |
| V4 Access Control | yes | Dashboard page only accessible to admin/lider via role-config.ts; historico_diario writes via service role only |
| V5 Input Validation | yes | Period filter date inputs validated (no SQL injection risk since client-side queries use parameterized Supabase client) |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized dashboard access | Elevation of Privilege | AppShell + middleware role check (existing) [VERIFIED: role-config.ts] |
| Data leakage via realtime | Information Disclosure | RLS policies on all tables (SELECT for authenticated only) [VERIFIED: 00001_initial_schema.sql] |
| Snapshot data tampering | Tampering | historico_diario write only via service role (no client write policy) |

## Codebase Findings (Re-Research Specific)

### Key Discoveries Since Previous Research

1. **App directory is at project root (`/app/`), not under `/src/app/`** -- The plan files reference `app/(authenticated)/dashboard/page.tsx` which is correct at the root level. [VERIFIED: filesystem]

2. **Dashboard page already exists as placeholder** at `app/(authenticated)/dashboard/page.tsx` with a simple "Fase 9" message. [VERIFIED: codebase]

3. **`pedidos` is NOT in Supabase realtime publication** -- Only progresso, atribuicoes, reservas, trafego_fardos, baixados, and transformacoes are added. Dashboard needs pedidos for detecting new imports. [VERIFIED: all migration files]

4. **`baixados` IS already in realtime publication** -- Added in `00009_baixa_status.sql`. No new migration needed for this table. [VERIFIED: migration]

5. **Day-reset deletes reservas which CASCADE-deletes trafego_fardos and baixados** -- The upload route comments say "NAO limpar trafego_fardos, baixados" but the FK cascade from reservas will delete them anyway. This is a critical detail for snapshot timing. [VERIFIED: schema FK + upload route]

6. **useCardData fetches all data client-side in parallel** -- 6 concurrent `.select('*')` queries, then aggregates in JS. Dashboard should follow the same pattern. [VERIFIED: use-card-data.ts]

7. **Existing getUrgencyTier accepts optional `now` parameter** -- Perfect for testability. Dashboard can reuse this directly. [VERIFIED: card-utils.ts]

8. **DEADLINES config has all 6 marketplace groups with hour values** -- Shopee SPX: 11, ML Flex: 12, ML Coleta: 14, TikTok Shop: 15, Shein: 16, Shopee Xpress: 19. [VERIFIED: deadline-config.ts]

9. **Users table has id, nome, role fields** -- Rankings need to join with users table to display names. [VERIFIED: database.types.ts]

10. **The authenticated layout already passes userRole and userName to AppShell** -- Dashboard client component can receive these as props from the server page component. [VERIFIED: app/(authenticated)/layout.tsx]

## Sources

### Primary (HIGH confidence)
- `src/features/cards/hooks/use-cards-realtime.ts` -- Realtime subscription pattern
- `src/features/cards/hooks/use-card-data.ts` -- Data fetching and aggregation pattern
- `src/features/cards/lib/card-utils.ts` -- Urgency, progress, countdown utilities
- `src/features/cards/lib/deadline-config.ts` -- Marketplace deadlines and colors
- `app/api/upload/route.ts` -- Day-reset (virada de dia) logic, snapshot insertion point
- `supabase/migrations/00001_initial_schema.sql` -- Table schema and FK constraints
- `supabase/migrations/20260405_realtime_publication.sql` -- Current realtime tables
- `supabase/migrations/00009_baixa_status.sql` -- baixados added to realtime
- `src/types/database.types.ts` -- Generated Supabase types
- `.planning/phases/09-dashboard/09-CONTEXT.md` -- User decisions D-01 through D-15
- `.planning/phases/09-dashboard/09-UI-SPEC.md` -- Visual design contract

### Secondary (MEDIUM confidence)
- `app/(authenticated)/layout.tsx` -- Authenticated layout passing user data
- `src/features/auth/lib/role-config.ts` -- NAV_ITEMS and role routing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, no new dependencies
- Architecture: HIGH - follows established useCardData pattern exactly
- Pitfalls: HIGH - verified via codebase analysis (FK cascades, realtime publication gaps)
- Snapshot logic: HIGH - upload route code inspected, insertion point identified

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable -- no external dependency changes expected)

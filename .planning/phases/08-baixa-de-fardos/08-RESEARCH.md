# Phase 8: Baixa de Fardos - Research

**Researched:** 2026-04-08
**Domain:** Barcode scanning, Supabase CRUD operations, realtime UI updates
**Confidence:** HIGH

## Summary

Phase 8 implements the "baixa" (discharge) flow where a fardista scans or types a barcode (codigo IN), sees a confirmation modal with fardo details and which separadores to deliver to, and confirms the discharge. The backend removes the fardo from trafego, unlocks AGUARDAR FARDISTA lines in progresso, and records the baixa. The phase does NOT touch the external Google Sheets stock spreadsheet (colunas F+ already cleared in Phase 6 OK flow per D-20).

The codebase already has all necessary database tables (`baixados`, `trafego_fardos`, `progresso`, `reservas`, `atribuicoes`), established API route patterns (auth + supabaseAdmin writes), realtime subscriptions (`useCardsRealtime`), and UI components (Dialog, Sonner toasts, Input, Collapsible). The main new element is an optional camera-based barcode scanner (`@yudiel/react-qr-scanner`). The lookup logic requires a multi-table join chain: `trafego_fardos` (by codigo_in, status=encontrado) -> `reservas` (by codigo_in, get sku+importacao_numero) -> `pedidos` (by sku+importacao_numero, get card_key) -> `atribuicoes` (by card_key+tipo=separador, get user nome).

**Primary recommendation:** Build a `/api/baixa/buscar` GET endpoint for lookup and a `/api/baixa/confirmar` POST endpoint that performs all 3 DB operations (insert baixados, update trafego_fardos status to 'baixado', update progresso from aguardar_fardista to pendente). A DB migration is required to add 'baixado' to the trafego_fardos status CHECK constraint. Use `@yudiel/react-qr-scanner` for optional camera scanning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Campo unico grande centralizado com auto-focus ao entrar na pagina. Enter dispara busca no trafego. Funciona com scanner Bluetooth e teclado manual
- **D-02:** Campo ocupa ~80% da largura no mobile, ~50% no desktop. Fonte grande. Tela de baixa e simples -- layout centralizado em ambos
- **D-03:** Icone de camera opcional ao lado do campo para leitura de codigo de barras via camera do celular. Fallback para quem nao tem scanner BT
- **D-04:** Erro (codigo nao encontrado no trafego): toast vermelho "Fardo nao encontrado no trafego" + borda vermelha no campo por 2s. Campo limpa e volta ao foco
- **D-05:** Ao encontrar o fardo no trafego, abre modal/popup centralizado na tela com: codigo IN, SKU, quantidade (label "CONTEM" + numero grande bold), endereco com icone pin verde, e secao "Entregar para" com lista de separadores
- **D-06:** Modal com borda superior na cor do marketplace (Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000)
- **D-07:** Botao verde "Confirmar Baixa" + botao cinza "Cancelar". Clique unico confirma, sem confirmacao dupla. Spinner + desabilita durante processamento
- **D-08:** Fardo ja baixado (duplicado): toast amarelo "Fardo IN-XX ja teve baixa" + campo limpa. NAO abre modal
- **D-09:** Secao "Entregar para:" com lista vertical. Cada separador em uma linha com nome + card_key completo (grupo_envio|tipo|importacao_numero). Cada linha na cor do marketplace
- **D-10:** Logica: buscar na tabela reservas quais card_keys usam esse codigo IN, depois buscar nas atribuicoes quem esta atribuido como separador de cada card_key
- **D-11:** Card sem separador atribuido: mostrar "Nao atribuido (card_key)". Fardista entrega ao lider para redistribuir
- **D-12:** Lista completa com scroll interno se necessario. Raro ter mais de 3-4 separadores
- **D-13:** Toast verde "Baixa confirmada -- IN-XX". Modal fecha. Campo limpa e auto-focus. Fluxo continuo
- **D-14:** Secao "BAIXADOS HOJE" no final da tela com: codigo IN, SKU, quantidade, para quem foi entregue, horario. Contador no header
- **D-15:** Secao comeca colapsada, expande no primeiro fardo baixado. Dados da tabela baixados
- **D-16:** Sem botao de desfazer. Baixa e definitiva
- **D-17:** Ao confirmar baixa: atualizar status 'aguardar_fardista' para 'pendente' na progresso
- **D-18:** Identificar linhas AGUARDAR FARDISTA pelo SKU do fardo + card_keys que usam esse fardo (via reservas)
- **D-19:** Sequencia: (1) inserir baixados, (2) remover/atualizar trafego_fardos, (3) desbloquear progresso
- **D-20:** NAO apagar colunas F+ da planilha de estoque

### Claude's Discretion
- Biblioteca de leitura de camera (pesquisar melhor opcao leve para browser)
- Animacao do modal abrindo/fechando
- Layout exato da secao BAIXADOS HOJE (fontes, espacamento)
- Estrutura interna dos Route Handlers
- Debounce do campo de busca
- Como tratar fardo no trafego mas sem reserva vinculada (edge case)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BAIX-01 | Fardista pode digitar ou escanear codigo IN do fardo | Input field with auto-focus + optional camera scanner via `@yudiel/react-qr-scanner` |
| BAIX-02 | Enter aciona busca automatica no trafego | onKeyDown handler on input -> calls `/api/baixa/buscar` GET endpoint |
| BAIX-03 | Card de confirmacao exibe SKU, quantidade, endereco | Modal using existing shadcn Dialog, data from trafego_fardos lookup |
| BAIX-04 | Card mostra "para quem entregar" -- nome do separador | Join reservas -> pedidos (card_key) -> atribuicoes -> users(nome) |
| BAIX-05 | Se fardo atende multiplos cards/separadores, mostra todos | reservas query returns all card_keys using this codigo_in; display all |
| BAIX-06 | Confirmar Baixa remove fardo do trafego, libera prateleira | `/api/baixa/confirmar` POST: insert baixados + update trafego_fardos + update progresso |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui -- non-negotiable [VERIFIED: CLAUDE.md]
- **Realtime**: Obrigatorio via Supabase subscriptions -- polling proibido [VERIFIED: CLAUDE.md]
- **Communication**: Always in Portuguese brasileiro [VERIFIED: CLAUDE.md]
- **GSD Workflow**: File changes must go through GSD workflow commands [VERIFIED: CLAUDE.md]

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | Framework | Project standard [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.101.1 | Database + realtime | Project standard [VERIFIED: package.json] |
| @radix-ui/react-dialog | ^1.1.15 | Confirmation modal | Already installed, shadcn Dialog [VERIFIED: package.json] |
| @radix-ui/react-collapsible | ^1.1.12 | BAIXADOS HOJE section | Already installed [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications | Already installed [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icons (MapPin, Camera, Loader2, ChevronDown) | Already installed [VERIFIED: package.json] |

### New (to install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @yudiel/react-qr-scanner | 2.5.1 | Camera barcode scanning | Optional fallback for devices without BT scanner [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @yudiel/react-qr-scanner | html5-qrcode (2.3.8) | html5-qrcode is ~2.6MB vs ~385KB; no React wrapper; heavier bundle [CITED: npmjs.com] |
| @yudiel/react-qr-scanner | Native BarcodeDetector API | Not available in Firefox; no polyfill needed with library [ASSUMED] |

**Installation:**
```bash
npm install @yudiel/react-qr-scanner
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/baixa/
  components/
    baixa-input.tsx           # Input field + camera toggle
    baixa-modal.tsx           # Confirmation modal (fardo details + separadores)
    baixados-hoje.tsx         # Collapsible section with today's discharges
    camera-scanner.tsx        # Camera scanner wrapper (lazy loaded via dynamic import)
  hooks/
    use-baixa.ts              # Main hook: search, confirm, state management
    use-baixa-realtime.ts     # Realtime subscription for baixados table
  lib/
    baixa-utils.ts            # Shared helpers (marketplace color from grupo_envio)
app/(authenticated)/baixa/
  page.tsx                    # Server component (auth + role check) -> client
  baixa-client.tsx            # Client component orchestrator
app/api/baixa/
  buscar/route.ts             # GET: lookup fardo by codigo_in in trafego
  confirmar/route.ts          # POST: execute baixa (3-step DB operation)
  hoje/route.ts               # GET: today's baixados with entregas data
supabase/migrations/
  00009_baixa_status.sql      # Add 'baixado' to trafego_fardos status CHECK
```

### Pattern 1: Server/Client Page Split (established project pattern)
**What:** Server component handles auth + user data, passes to client component
**When to use:** The baixa page.tsx
**Example:**
```typescript
// Source: app/(authenticated)/fardos/page.tsx (existing pattern)
export default async function BaixaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: userData } = await supabase
    .from('users').select('role, nome').eq('id', user.id).single()
  if (!userData) redirect('/login')
  return <BaixaClient userId={user.id} userRole={userData.role} userName={userData.nome} />
}
```
[VERIFIED: app/(authenticated)/fardos/page.tsx]

### Pattern 2: API Route Auth (established project pattern)
**What:** All API routes follow createClient() -> getUser() -> role check via supabaseAdmin
**When to use:** Every route handler in this phase
**Example:**
```typescript
// Source: app/api/fardos/ok/route.ts (existing pattern)
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
if (!userData || !['fardista', 'admin', 'lider'].includes(userData.role)) {
  return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
}
```
[VERIFIED: app/api/fardos/ok/route.ts]

### Pattern 3: Lookup Chain (trafego -> reservas -> pedidos -> atribuicoes)
**What:** Find which separadores need a fardo by tracing through DB tables
**When to use:** Building the "Entregar para" section in the buscar endpoint
**Critical DB details:**
- `reservas` has NO `pedido_id` (removed in migration 00003). Join is via `sku` + `importacao_numero` [VERIFIED: migration 00003]
- `reservas.status` CHECK only allows `'reservado' | 'cancelado'` [VERIFIED: migration 00001]
- `trafego_fardos.status` CHECK only allows `'pendente' | 'encontrado' | 'nao_encontrado'` -- needs migration for 'baixado' [VERIFIED: migration 00001]
- `card_key` format is `grupo_envio|tipo|importacao_numero` [VERIFIED: classify.ts line 36]
- `atribuicoes` has UNIQUE on `(card_key, tipo)` [VERIFIED: migration 00001]
**Example:**
```typescript
// Step 1: Find trafego_fardos by codigo_in with status='encontrado'
const { data: fardo } = await supabaseAdmin
  .from('trafego_fardos')
  .select('*')
  .eq('codigo_in', codigoIn)
  .eq('status', 'encontrado')
  .maybeSingle()

// Step 2: Find reservas with same codigo_in to get sku + importacao_numero
const { data: reservas } = await supabaseAdmin
  .from('reservas')
  .select('sku, importacao_numero')
  .eq('codigo_in', codigoIn)
  .eq('status', 'reservado')

// Step 3: Derive card_keys from pedidos (NO pedido_id on reservas!)
const cardKeys = new Set<string>()
for (const reserva of reservas ?? []) {
  const { data: pedidos } = await supabaseAdmin
    .from('pedidos')
    .select('card_key')
    .eq('sku', reserva.sku)
    .eq('importacao_numero', reserva.importacao_numero)
  pedidos?.forEach(p => cardKeys.add(p.card_key))
}

// Step 4: Find separadores assigned to those card_keys
const { data: atribuicoes } = await supabaseAdmin
  .from('atribuicoes')
  .select('card_key, users(nome)')
  .in('card_key', Array.from(cardKeys))
  .eq('tipo', 'separador')
```
[VERIFIED: database.types.ts schema + migration 00003 confirming no pedido_id on reservas]

### Pattern 4: AGUARDAR FARDISTA Unlock (D-17, D-18)
**What:** When fardo is discharged, update progresso rows from 'aguardar_fardista' to 'pendente' for matching SKU+card_keys
**When to use:** Step 3 of the confirmar route handler
**Example:**
```typescript
// Find pedidos matching fardo's SKU and derived card_keys
const { data: matchingPedidos } = await supabaseAdmin
  .from('pedidos')
  .select('id')
  .eq('sku', fardo.sku)
  .in('card_key', Array.from(cardKeys))

const pedidoIds = matchingPedidos?.map(p => p.id) ?? []
if (pedidoIds.length > 0) {
  await supabaseAdmin
    .from('progresso')
    .update({ status: 'pendente', updated_at: new Date().toISOString() })
    .in('pedido_id', pedidoIds)
    .eq('status', 'aguardar_fardista')
}
```
[VERIFIED: database.types.ts progresso schema, types/index.ts StatusProgresso]

### Pattern 5: Realtime Subscription (established project pattern)
**What:** Supabase channel with postgres_changes for live updates
**When to use:** Updating BAIXADOS HOJE section in real-time
**Example:**
```typescript
// Source: use-cards-realtime.ts (existing pattern)
const channel = supabase
  .channel('baixa-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'baixados' }, () => onUpdate())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trafego_fardos' }, () => onUpdate())
  .subscribe()
```
[VERIFIED: src/features/cards/hooks/use-cards-realtime.ts]

### Pattern 6: Marketplace Color from grupo_envio
**What:** Extract marketplace color for modal border from card_key's grupo_envio component
**When to use:** Modal top border color (D-06), separador line accent (D-09)
**Key detail:** card_key = `grupo_envio|tipo|importacao_numero`. The grupo_envio maps to marketplace via existing `MARKETPLACE_COLORS` in `deadline-config.ts` [VERIFIED: deadline-config.ts]. CSS variables already available: `--shopee`, `--ml`, `--tiktok`, `--shein` [VERIFIED: globals.css, tailwind.config.ts].
**Example:**
```typescript
// Utility to get marketplace border color from grupo_envio
function getMarketplaceBorderColor(grupoEnvio: string): string {
  if (grupoEnvio.includes('Shopee')) return 'hsl(var(--shopee))'
  if (grupoEnvio.includes('ML') || grupoEnvio.includes('Mercado')) return 'hsl(var(--ml))'
  if (grupoEnvio.includes('TikTok')) return 'hsl(var(--tiktok))'
  if (grupoEnvio.includes('Shein')) return 'hsl(var(--shein))'
  return 'hsl(var(--foreground))' // default black
}
// Use in modal: style={{ borderTopColor: getMarketplaceBorderColor(grupoEnvio) }}
```
[VERIFIED: existing marketplace color pattern in deadline-config.ts + globals.css]

### Anti-Patterns to Avoid
- **Don't call Google Sheets API:** D-20 explicitly states colunas F+ already cleared in Phase 6 OK flow. `clearSheetRange` must NOT be called in baixa [VERIFIED: CONTEXT.md D-20]
- **Don't use upsert on progresso:** Table has no UNIQUE constraint on pedido_id; use select-then-update [VERIFIED: migration 00001, Phase 05 decision]
- **Don't use polling:** Project mandates Supabase realtime subscriptions [VERIFIED: CLAUDE.md constraints]
- **Don't use onChange/debounce for search trigger:** Only trigger on Enter key (D-01). BT scanners send characters one-by-one [VERIFIED: CONTEXT.md D-01]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera barcode scanning | Custom WebRTC + canvas decoding | @yudiel/react-qr-scanner | Handles camera permissions, orientation, frame processing, format detection |
| Toast notifications | Custom notification system | sonner (already installed) | Consistent with rest of app, handles aria-live |
| Modal/dialog | Custom overlay | shadcn Dialog (already installed) | Accessible, keyboard-friendly, project standard |
| Collapsible section | Custom expand/collapse | @radix-ui/react-collapsible (already installed) | BAIXADOS HOJE collapse behavior |
| Marketplace colors | Hardcoded hex strings | CSS variables (--shopee, --ml, --tiktok, --shein) | Already in globals.css + tailwind.config.ts |

**Key insight:** Nearly all UI primitives are already installed. The only new npm dependency is `@yudiel/react-qr-scanner` for optional camera scanning.

## Common Pitfalls

### Pitfall 1: Duplicate Baixa (Race Condition)
**What goes wrong:** Two fardistas scan the same fardo simultaneously; both get confirmation modal; both confirm
**Why it happens:** `baixados` table has NO UNIQUE constraint on `codigo_in` [VERIFIED: migration 00001 line 79-85]. No DB-level uniqueness enforcement.
**How to avoid:** (1) Check for existing `baixados` record with same `codigo_in` at the START of the confirmar route. (2) Use `trafego_fardos` status update as a guard: update WHERE status='encontrado' and check rows affected. If 0 rows, another request already changed it. (3) Consider adding UNIQUE constraint on `baixados.codigo_in` in the migration.
**Warning signs:** 409 Conflict errors in production, duplicate rows in baixados table

### Pitfall 2: trafego_fardos Status CHECK Constraint
**What goes wrong:** Trying to update trafego_fardos.status to 'baixado' fails with constraint violation
**Why it happens:** Current CHECK only allows `'pendente' | 'encontrado' | 'nao_encontrado'` [VERIFIED: migration 00001 line 74]
**How to avoid:** Migration 00009 MUST add 'baixado' to the CHECK constraint before any baixa code runs. This is a prerequisite task.
**Warning signs:** DB error on first baixa attempt

### Pitfall 3: Missing Separador Attribution
**What goes wrong:** "Entregar para" section shows "Nao atribuido" for all cards
**Why it happens:** Atribuicoes haven't been created yet (lider hasn't assigned separadores)
**How to avoid:** D-11 handles this explicitly -- show "Nao atribuido (card_key)" as a graceful fallback. Allow baixa to proceed regardless.

### Pitfall 4: Camera Scanner Performance on Low-End Devices
**What goes wrong:** Camera scanner is slow/laggy on warehouse mobile devices
**Why it happens:** Continuous video frame processing is CPU-intensive
**How to avoid:** Lazy-load via Next.js `dynamic()` with `{ ssr: false }`. Only mount when user clicks camera icon. Unmount immediately after scan. Camera requires HTTPS or localhost [CITED: npmjs.com/@yudiel/react-qr-scanner]

### Pitfall 5: AGUARDAR FARDISTA Lines Not Unlocking
**What goes wrong:** Separador still sees "AGUARDAR FARDISTA" after fardo is discharged
**Why it happens:** The unlock query doesn't correctly match pedido_ids through the reservas -> pedidos chain. Remember: reservas has NO pedido_id column [VERIFIED: migration 00003]
**How to avoid:** The join MUST go through sku + importacao_numero. Test the full chain: trafego_fardos.sku -> pedidos(sku + importacao_numero derived from reservas) -> progresso(pedido_id). Log each step.

### Pitfall 6: Bluetooth Scanner Input Behavior
**What goes wrong:** BT scanner sends characters one-by-one, triggering intermediate searches
**Why it happens:** Using onChange with debounce instead of Enter key
**How to avoid:** ONLY trigger search on Enter keypress (D-01). Most BT scanners send Enter after barcode. If not, fardista presses Enter manually. No debounce needed.

### Pitfall 7: Fardo in trafego but no reserva
**What goes wrong:** A cascata fardo exists in trafego_fardos but its reserva was cancelled or doesn't match
**Why it happens:** Complex cascata flow from Phase 7 may create edge cases
**How to avoid:** If no reservas found for a codigo_in, still show fardo details (from trafego_fardos itself which has sku, quantidade, endereco). Show empty "Entregar para" section. Allow baixa to proceed.

## Code Examples

### DB Migration for 'baixado' Status
```sql
-- Migration 00009: Add 'baixado' to trafego_fardos status CHECK
ALTER TABLE trafego_fardos DROP CONSTRAINT IF EXISTS trafego_fardos_status_check;
ALTER TABLE trafego_fardos ADD CONSTRAINT trafego_fardos_status_check
  CHECK (status IN ('pendente', 'encontrado', 'nao_encontrado', 'baixado'));
```
[VERIFIED: current CHECK constraint from migration 00001 line 74]

### Confirmar Baixa Sequence (D-19)
```typescript
// POST /api/baixa/confirmar
// Body: { codigo_in: string, trafego_id: string }

// Step 1: Duplicate check
const { data: existing } = await supabaseAdmin
  .from('baixados')
  .select('id')
  .eq('codigo_in', codigoIn)
  .maybeSingle()
if (existing) {
  return NextResponse.json({ error: 'Fardo ja teve baixa' }, { status: 409 })
}

// Step 2: Insert into baixados
await supabaseAdmin.from('baixados').insert({
  codigo_in: codigoIn,
  trafego_id: trafegoId,
  baixado_por: user.id,
})

// Step 3: Update trafego_fardos status to 'baixado'
const { data: updated } = await supabaseAdmin
  .from('trafego_fardos')
  .update({ status: 'baixado' })
  .eq('id', trafegoId)
  .eq('status', 'encontrado') // Guard: only update if still 'encontrado'
  .select('sku')
  .single()

// Step 4: Unlock AGUARDAR FARDISTA lines (see Pattern 4)
```
[VERIFIED: database.types.ts baixados schema, trafego_fardos schema]

### Marketplace Color Utility
```typescript
// Reuse existing CSS variables from globals.css and tailwind.config.ts
// grupo_envio values: 'Shopee SPX', 'ML Flex', 'ML Coleta', 'TikTok Shop', 'Shein', 'Shopee Xpress'
const GRUPO_TO_MARKETPLACE: Record<string, string> = {
  'Shopee SPX': 'shopee',
  'Shopee Xpress': 'shopee',
  'ML Flex': 'ml',
  'ML Coleta': 'ml',
  'TikTok Shop': 'tiktok',
  'Shein': 'shein',
}

function getMarketplaceKey(grupoEnvio: string): string {
  return GRUPO_TO_MARKETPLACE[grupoEnvio] ?? 'foreground'
}

// In JSX: border-top style uses hsl(var(--{marketplace}))
// For separador line left-border color: same mapping
```
[VERIFIED: MARKETPLACE_COLORS in deadline-config.ts uses exact same grupo_envio keys]

### Camera Scanner with Dynamic Import
```typescript
// Lazy load to avoid SSR issues and reduce initial bundle
import dynamic from 'next/dynamic'
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner),
  { ssr: false }
)

// Usage: only rendered when camera overlay is open
// On successful scan: extract value, close overlay, set input value, trigger search
```
[CITED: npmjs.com/@yudiel/react-qr-scanner - SSR not supported]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html5-qrcode monolithic (2.6MB) | @yudiel/react-qr-scanner with Barcode Detection API (385KB) | 2024+ | 7x smaller bundle, React hooks integration [CITED: npmjs.com] |
| Manual camera MediaStream | Library-managed camera lifecycle | 2024+ | Handles permissions, orientation, cleanup |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | StatusTrafego needs a 'baixado' value added via migration (current CHECK only allows pendente/encontrado/nao_encontrado) | Architecture / Code Examples | CONFIRMED via migration 00001 line 74. Migration IS required. Low risk -- just write the migration. |
| A2 | reservas.codigo_in is the correct join field to find card_keys (reservas has NO pedido_id) | Architecture Pattern 3 | CONFIRMED via migration 00003. Join must go through sku + importacao_numero. |
| A3 | @yudiel/react-qr-scanner works with 1D barcodes (Code 128, EAN) in warehouse conditions | Standard Stack | Library docs claim support [CITED: npmjs.com]. Untested in actual warehouse lighting. Fallback is manual typing. |
| A4 | BT scanners used in this warehouse send Enter after barcode | Pitfall 6 | If they don't, user presses Enter manually. No code change needed -- just operational. |
| A5 | Native BarcodeDetector API not available in Firefox | Alternatives | Based on training data [ASSUMED]. Library abstracts this away regardless. |

## Open Questions

1. **trafego_fardos on baixa: update status or delete row?**
   - What we know: D-19 says "remover/atualizar fardo do trafego_fardos"
   - Recommendation: Update status to 'baixado' (preserves audit trail, keeps FK for baixados.trafego_id). Requires migration to add 'baixado' to CHECK constraint.

2. **Edge case: fardo in trafego but no reserva linked**
   - What we know: Claude's discretion item. All trafego_fardos have a reserva_id FK [VERIFIED: migration 00001 line 69]
   - Recommendation: If reservas lookup returns nothing (e.g., reserva was cancelled), still show fardo details from trafego_fardos. Show empty "Entregar para" section. Allow baixa to proceed.

3. **UNIQUE constraint on baixados.codigo_in**
   - What we know: Table currently has no UNIQUE constraint [VERIFIED: migration 00001 line 79-85]
   - Recommendation: Add UNIQUE on codigo_in in the same migration (00009). Provides DB-level protection against duplicate baixas.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 [VERIFIED: package.json] |
| Config file | vitest.config.ts (jsdom env, @/ alias) [VERIFIED: vitest.config.ts] |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BAIX-01 | Input field accepts typed/scanned codigo IN | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |
| BAIX-02 | Enter triggers search in trafego | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |
| BAIX-03 | Modal displays SKU, quantidade, endereco | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |
| BAIX-04 | Modal shows separador name | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |
| BAIX-05 | Multiple separadores displayed | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |
| BAIX-06 | Confirmar removes from trafego, unlocks prateleira | unit | `npx vitest run src/features/baixa --reporter=verbose` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/baixa/lib/__tests__/baixa-utils.test.ts` -- covers marketplace color utility, lookup helpers
- [ ] Test mocks for supabaseAdmin queries (established pattern from existing Phase 5 tests)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | createClient() -> getUser() (existing pattern) |
| V3 Session Management | yes | JWT via Supabase (existing pattern) |
| V4 Access Control | yes | Role check: only fardista/admin/lider can execute baixa |
| V5 Input Validation | yes | Validate codigo_in is non-empty string; validate trafego_id exists and status='encontrado' |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized baixa | Elevation of Privilege | Role check in route handler (fardista/admin/lider only) |
| Duplicate baixa (race condition) | Tampering | DB check before insert + trafego_fardos status guard + UNIQUE constraint |
| Invalid trafego_id injection | Tampering | Verify trafego_id exists and status='encontrado' before processing |
| Cross-user baixa attribution | Spoofing | baixado_por always set to authenticated user.id, never from request body |

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/00001_initial_schema.sql` -- baixados table (no UNIQUE on codigo_in), trafego_fardos CHECK constraint (pendente/encontrado/nao_encontrado only) [VERIFIED]
- `supabase/migrations/00003_alter_reservas_schema.sql` -- reservas.pedido_id REMOVED, join via sku+importacao_numero [VERIFIED]
- `src/types/database.types.ts` -- complete table schemas for all tables [VERIFIED]
- `src/types/index.ts` -- StatusProgresso includes 'aguardar_fardista', StatusTrafego enum [VERIFIED]
- `app/api/fardos/ok/route.ts` -- established API route pattern [VERIFIED]
- `src/features/cards/hooks/use-cards-realtime.ts` -- realtime subscription pattern [VERIFIED]
- `src/features/cards/lib/deadline-config.ts` -- MARKETPLACE_COLORS with exact grupo_envio keys [VERIFIED]
- `src/features/upload/lib/classify.ts` -- card_key format: `grupo_envio|tipo|importacao_numero` [VERIFIED]
- `app/globals.css` -- marketplace CSS variables (--shopee, --ml, --tiktok, --shein) [VERIFIED]
- `tailwind.config.ts` -- marketplace colors mapped as Tailwind utilities [VERIFIED]
- `package.json` -- all existing dependencies confirmed [VERIFIED]
- [npm registry: @yudiel/react-qr-scanner v2.5.1](https://www.npmjs.com/package/@yudiel/react-qr-scanner) [VERIFIED]

### Secondary (MEDIUM confidence)
- [GitHub: yudielcurbelo/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner) -- 1D barcode support (Code 128, EAN, UPC)
- `08-UI-SPEC.md` -- UI design contract with component specs [VERIFIED: exists in phase directory]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libs installed; only new dep verified on npm registry
- Architecture: HIGH - follows established project patterns; DB schema constraints verified against actual migrations
- Pitfalls: HIGH - identified from real DB constraints (CHECK, missing UNIQUE) and existing code patterns

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, no fast-moving dependencies)

# Phase 8: Baixa de Fardos - Research

**Researched:** 2026-04-08
**Domain:** Barcode scanning, Supabase CRUD operations, realtime UI updates
**Confidence:** HIGH

## Summary

Phase 8 implements the "baixa" (discharge) flow where a fardista scans or types a barcode (codigo IN), sees a confirmation modal with fardo details and which separadores to deliver to, and confirms the discharge. The backend removes the fardo from trafego, unlocks AGUARDAR FARDISTA lines in progresso, and records the baixa. The phase does NOT touch the external Google Sheets stock spreadsheet (colunas F+ already cleared in Phase 6 OK flow).

The codebase already has all necessary database tables (`baixados`, `trafego_fardos`, `progresso`, `reservas`, `atribuicoes`), established API route patterns (auth + supabaseAdmin writes), realtime subscriptions (`useCardsRealtime`), and UI components (Dialog, Sonner toasts, Input). The main new element is an optional camera-based barcode scanner. The lookup logic requires joining `trafego_fardos` -> `reservas` (by codigo_in/sku) -> `pedidos` (by sku+importacao_numero for card_key) -> `atribuicoes` (by card_key for separador name).

**Primary recommendation:** Build a single `/api/baixa/confirmar` Route Handler that performs all 3 DB operations atomically (insert baixados, update trafego_fardos status, update progresso from aguardar_fardista to pendente), plus a `/api/baixa/buscar` GET endpoint for the lookup. Use `@yudiel/react-qr-scanner` for optional camera scanning (lightweight, React-native, supports 1D barcodes).

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
- **D-09:** Secao "Entregar para:" com lista vertical. Cada separador em uma linha com nome + card_key completo
- **D-10:** Logica: buscar na tabela reservas quais card_keys usam esse codigo IN, depois buscar nas atribuicoes quem esta atribuido como separador de cada card_key
- **D-11:** Card sem separador atribuido: mostrar "Nao atribuido (card_key)"
- **D-12:** Lista completa com scroll interno se necessario
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

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | Framework | Project standard [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.101.1 | Database + realtime | Project standard [VERIFIED: package.json] |
| @radix-ui/react-dialog | ^1.1.15 | Confirmation modal | Already installed, used by shadcn Dialog [VERIFIED: package.json] |
| sonner | ^2.0.7 | Toast notifications | Already installed [VERIFIED: package.json] |
| lucide-react | ^1.7.0 | Icons (MapPin, Camera, Check) | Already installed [VERIFIED: package.json] |

### New (to install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @yudiel/react-qr-scanner | 2.5.1 | Camera barcode scanning | Optional fallback for devices without BT scanner [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @yudiel/react-qr-scanner | html5-qrcode (2.3.8) | html5-qrcode is 2.6MB vs 385KB; no React wrapper; heavier bundle. react-qr-scanner is React-native with hooks support [VERIFIED: npm registry] |
| @yudiel/react-qr-scanner | Native BarcodeDetector API | Not available in all browsers (no Firefox); no polyfill needed with library |

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
    camera-scanner.tsx        # Camera scanner wrapper (lazy loaded)
  hooks/
    use-baixa.ts              # Main hook: search, confirm, state management
    use-baixa-realtime.ts     # Realtime subscription for baixados table
  lib/
    baixa-utils.ts            # Shared helpers (marketplace color lookup, etc)
app/(authenticated)/baixa/
  page.tsx                    # Server component (auth + role check) -> client component
app/api/baixa/
  buscar/route.ts             # GET: lookup fardo by codigo_in in trafego
  confirmar/route.ts          # POST: execute baixa (3-step DB operation)
  hoje/route.ts               # GET: today's baixados with full entregas data
```

### Pattern 1: API Route Auth (established project pattern)
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

### Pattern 2: Lookup Chain (reservas -> pedidos -> atribuicoes)
**What:** Find which separadores need a fardo by tracing through reservas -> card_keys -> atribuicoes
**When to use:** Building the "Entregar para" section in the confirmation modal
**Example:**
```typescript
// Step 1: Find the trafego_fardos record by codigo_in with status='encontrado'
const { data: fardo } = await supabaseAdmin
  .from('trafego_fardos')
  .select('*')
  .eq('codigo_in', codigoIn)
  .eq('status', 'encontrado')
  .maybeSingle()

// Step 2: Find reservas with same codigo_in to get importacao_numero
const { data: reservas } = await supabaseAdmin
  .from('reservas')
  .select('sku, importacao_numero')
  .eq('codigo_in', codigoIn)
  .eq('status', 'reservado')

// Step 3: Derive card_keys from reservas + pedidos
// card_key = grupo_envio|tipo|importacao_numero (from pedidos table)
// Query pedidos by sku + importacao_numero to get card_keys
const cardKeys = new Set<string>()
for (const reserva of reservas) {
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
[VERIFIED: database.types.ts schema + use-card-data.ts pattern]

### Pattern 3: Realtime Subscription (established project pattern)
**What:** Supabase channel with postgres_changes for live updates
**When to use:** Updating BAIXADOS HOJE section and prateleira when AGUARDAR FARDISTA unlocks
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

### Pattern 4: AGUARDAR FARDISTA Unlock
**What:** When a fardo is discharged, find progresso rows with status='aguardar_fardista' for matching SKU+card_keys and update them to 'pendente'
**When to use:** In the confirmar route handler, step 3 of D-19
**Example:**
```typescript
// Find pedido_ids that have aguardar_fardista status AND match the fardo's SKU + card_keys
// Step 1: Get pedidos matching the fardo's SKU and the card_keys found via reservas
const { data: matchingPedidos } = await supabaseAdmin
  .from('pedidos')
  .select('id')
  .eq('sku', fardo.sku)
  .in('card_key', Array.from(cardKeys))

// Step 2: Find progresso rows with status='aguardar_fardista' for those pedido_ids
const pedidoIds = matchingPedidos?.map(p => p.id) ?? []
if (pedidoIds.length > 0) {
  await supabaseAdmin
    .from('progresso')
    .update({ status: 'pendente', updated_at: new Date().toISOString() })
    .in('pedido_id', pedidoIds)
    .eq('status', 'aguardar_fardista')
}
```
[VERIFIED: database.types.ts (progresso table), types/index.ts (StatusProgresso includes 'aguardar_fardista')]

### Anti-Patterns to Avoid
- **Don't call Google Sheets API:** D-20 explicitly states colunas F+ already cleared in Phase 6 OK flow. The `clearSheetRange` function must NOT be called in baixa
- **Don't use upsert on progresso:** Table has no UNIQUE constraint on pedido_id; use select-then-update pattern [VERIFIED: Phase 05 decision]
- **Don't use polling for updates:** Project mandates Supabase realtime subscriptions [VERIFIED: CLAUDE.md constraints]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera barcode scanning | Custom WebRTC + canvas decoding | @yudiel/react-qr-scanner | Handles camera permissions, orientation, frame processing, format detection |
| Toast notifications | Custom notification system | sonner (already installed) | Consistent with rest of app |
| Modal/dialog | Custom overlay | shadcn Dialog (already installed) | Accessible, keyboard-friendly, project standard |
| Collapsible section | Custom expand/collapse | @radix-ui/react-collapsible (already installed) | BAIXADOS HOJE section needs collapse behavior |

**Key insight:** Nearly all UI primitives are already installed. The only new dependency is the camera scanner library.

## Common Pitfalls

### Pitfall 1: Duplicate Baixa (Race Condition)
**What goes wrong:** Two fardistas scan the same fardo simultaneously; both get confirmation modal; both confirm
**Why it happens:** No DB-level uniqueness enforcement between check and insert
**How to avoid:** Check for existing `baixados` record with same `codigo_in` at the START of the confirmar route. Use `trafego_fardos` status update as a guard -- if the update returns 0 rows affected (already changed), reject the second request. Consider adding a UNIQUE constraint on `baixados.codigo_in` if not already present
**Warning signs:** 409 Conflict errors in production

### Pitfall 2: Stale Trafego Data
**What goes wrong:** Fardista scans a fardo that was just discharged by another user; gets "not found" or sees stale data
**Why it happens:** Client-side cache not invalidated between scans
**How to avoid:** Always query fresh from API on each scan (no client-side caching of trafego state). The buscar endpoint should do a fresh DB query every time

### Pitfall 3: Missing Separador Attribution
**What goes wrong:** "Entregar para" section shows empty or "Nao atribuido" for all cards
**Why it happens:** Atribuicoes haven't been created yet (lider hasn't assigned separadores); or query joins are wrong
**How to avoid:** D-11 handles this explicitly -- show "Nao atribuido (card_key)" when no separador is assigned. Make this a graceful fallback, not an error

### Pitfall 4: Camera Scanner Performance on Low-End Devices
**What goes wrong:** Camera scanner is slow/laggy on warehouse mobile devices
**Why it happens:** Continuous video frame processing is CPU-intensive
**How to avoid:** Lazy-load the camera component (dynamic import). Only mount when user clicks camera icon. Unmount immediately after successful scan. Use `constraints` prop to request lower resolution if needed

### Pitfall 5: AGUARDAR FARDISTA Lines Not Unlocking
**What goes wrong:** Separador still sees "AGUARDAR FARDISTA" after fardo is discharged
**Why it happens:** The unlock query doesn't correctly match pedido_ids through the reservas -> pedidos chain
**How to avoid:** Thorough testing of the join chain: trafego_fardos.codigo_in -> reservas.codigo_in -> pedidos.sku+importacao_numero -> progresso.pedido_id. Log each step in the chain for debugging

### Pitfall 6: Bluetooth Scanner Input Behavior
**What goes wrong:** BT scanner sends characters one-by-one, triggering intermediate searches, or doesn't send Enter
**Why it happens:** Different scanner models have different behaviors
**How to avoid:** Do NOT use onChange with debounce for search trigger. ONLY trigger on Enter keypress (D-01). Most BT scanners send Enter after the barcode. If they don't, the fardista can press Enter manually

## Code Examples

### Baixa Input Component Pattern
```typescript
// Source: project patterns (Input from shadcn, auto-focus, Enter handler)
'use client'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Camera } from 'lucide-react'

export function BaixaInput({ onSearch }: { onSearch: (codigo: string) => void }) {
  const [value, setValue] = useState('')
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount (D-01)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim())
    }
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-[80%] md:max-w-[50%]">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); setHasError(false) }}
        onKeyDown={handleKeyDown}
        placeholder="Escanear ou digitar codigo IN"
        className={`text-lg h-14 ${hasError ? 'border-red-500' : ''}`}
      />
      {/* Camera icon button (D-03) */}
    </div>
  )
}
```
[VERIFIED: project patterns from existing components]

### Marketplace Color Map
```typescript
// Source: CONTEXT.md D-06, REQUIREMENTS.md UIUX-04
const MARKETPLACE_COLORS: Record<string, string> = {
  'Shopee': '#ee4d2d',
  'Shopee Xpress': '#ee4d2d',
  'ML': '#ffe600',
  'Mercado Livre': '#ffe600',
  'TikTok': '#25F4EE',
  'TikTok Shop': '#25F4EE',
  'Shein': '#000000',
}

function getMarketplaceColor(grupoEnvio: string): string {
  for (const [key, color] of Object.entries(MARKETPLACE_COLORS)) {
    if (grupoEnvio.toLowerCase().includes(key.toLowerCase())) return color
  }
  return '#000000' // default
}
```
[VERIFIED: REQUIREMENTS.md UIUX-04, existing color usage in Phase 5 components]

### Confirmar Baixa Sequence (D-19)
```typescript
// POST /api/baixa/confirmar
// Body: { codigo_in: string, trafego_id: string }

// Step 1: Insert into baixados
const { error: baixaError } = await supabaseAdmin
  .from('baixados')
  .insert({
    codigo_in: codigoIn,
    trafego_id: trafegoId,
    baixado_por: user.id,
  })

// Step 2: Update trafego_fardos (mark as 'baixado' or delete)
// NOTE: StatusTrafego currently has 'pendente' | 'encontrado' | 'nao_encontrado'
// Need to decide: add 'baixado' status or physically delete the row
// Recommendation: update status to differentiate from active trafego
await supabaseAdmin
  .from('trafego_fardos')
  .update({ status: 'baixado' })
  .eq('id', trafegoId)

// Step 3: Unlock AGUARDAR FARDISTA lines (D-17, D-18)
// ... (see Pattern 4 above)
```
[VERIFIED: database.types.ts baixados table schema]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| html5-qrcode monolithic | @yudiel/react-qr-scanner (React wrapper, Barcode Detection API) | 2024+ | 7x smaller bundle, React hooks integration |
| Manual camera MediaStream | Library-managed camera lifecycle | 2024+ | Handles permissions, orientation, cleanup |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | StatusTrafego needs a 'baixado' value for discharged fardos (not in current enum) | Architecture Pattern 4 / Code Examples | If DB has CHECK constraint on trafego_fardos.status, insert will fail. May need migration or use deletion instead of status update |
| A2 | reservas.codigo_in is the correct join field to find card_keys for a given fardo | Architecture Pattern 2 | If reservas use a different identifier, the lookup chain breaks |
| A3 | @yudiel/react-qr-scanner works well with 1D barcodes in warehouse lighting conditions | Standard Stack | May need html5-qrcode as fallback if detection rate is poor |
| A4 | BT scanners used in this warehouse send Enter after barcode | Pitfall 6 | If scanners don't send Enter, may need configurable delimiter or timeout-based detection |

## Open Questions (RESOLVED)

1. **trafego_fardos status on baixa: update or delete?** -- RESOLVED
   - What we know: D-19 says "remover/atualizar fardo do trafego_fardos". StatusTrafego enum currently has 'pendente' | 'encontrado' | 'nao_encontrado'
   - Resolution: Update status to 'baixado' (preserves audit trail). Migration 00009 adds 'baixado' to the CHECK constraint. Plan 01 Task 1 creates this migration.

2. **Edge case: fardo in trafego but no reserva linked** -- RESOLVED
   - What we know: D-10 says lookup via reservas. Claude's discretion includes handling this edge case
   - Resolution: If no reservas found, still show the fardo details but with empty "Entregar para" section. Allow baixa to proceed -- the physical delivery still happens. Implemented in Plan 01 Task 2 buscar route (Step 7).

3. **Marketplace color for modal border** -- RESOLVED
   - What we know: D-06 specifies marketplace-colored border. The grupo_envio field contains the marketplace info
   - Resolution: Trace through reservas -> pedidos to get grupo_envio. Return marketplace_color in the buscar API response via getMarketplaceColor(). Implemented in Plan 01 Task 1 (utility) and Task 2 (buscar route Step 6).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | vitest.config.ts |
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
- [ ] `src/features/baixa/lib/__tests__/baixa-utils.test.ts` -- covers utility functions (marketplace color, lookup helpers)
- [ ] Test mocks for supabaseAdmin queries (established pattern from Phase 5 tests)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | createClient() -> getUser() (existing pattern) |
| V3 Session Management | yes | JWT via Supabase (existing pattern) |
| V4 Access Control | yes | Role check: only fardista/admin/lider can execute baixa |
| V5 Input Validation | yes | Validate codigo_in is non-empty string; validate trafego_id exists |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized baixa | Elevation of Privilege | Role check in route handler (fardista/admin/lider only) |
| Duplicate baixa (race condition) | Tampering | DB-level check before insert; status guard on trafego_fardos |
| Invalid trafego_id injection | Tampering | Verify trafego_id exists and status='encontrado' before processing |
| Cross-user baixa attribution | Spoofing | baixado_por always set to authenticated user.id, never from request body |

## Sources

### Primary (HIGH confidence)
- `src/types/database.types.ts` -- complete table schemas for baixados, trafego_fardos, progresso, reservas, atribuicoes, pedidos [VERIFIED]
- `src/types/index.ts` -- StatusProgresso includes 'aguardar_fardista', StatusTrafego enum [VERIFIED]
- `app/api/fardos/ok/route.ts` -- established API route pattern with auth + supabaseAdmin [VERIFIED]
- `src/features/cards/hooks/use-cards-realtime.ts` -- realtime subscription pattern [VERIFIED]
- `src/features/cards/hooks/use-card-data.ts` -- reservas -> pedidos -> atribuicoes join pattern [VERIFIED]
- `src/features/cards/components/item-modal.tsx` -- AGUARDAR FARDISTA split logic (lines 75-99) [VERIFIED]
- `package.json` -- all existing dependencies confirmed [VERIFIED]
- [npm registry: @yudiel/react-qr-scanner](https://www.npmjs.com/package/@yudiel/react-qr-scanner) -- v2.5.1, 385KB [VERIFIED]

### Secondary (MEDIUM confidence)
- [GitHub: yudielcurbelo/react-qr-scanner](https://github.com/yudielcurbelo/react-qr-scanner) -- supports 1D barcodes (Code 128, EAN, UPC) via Barcode Detection API
- [npm: html5-qrcode](https://www.npmjs.com/package/html5-qrcode) -- alternative considered, 2.6MB

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libs already installed; only new dep is camera scanner (verified on npm)
- Architecture: HIGH - follows established project patterns found in codebase
- Pitfalls: HIGH - identified from existing route handler patterns and DB schema analysis

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain, no fast-moving dependencies)

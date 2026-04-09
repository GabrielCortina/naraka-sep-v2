---
phase: 08-baixa-de-fardos
verified: 2026-04-08T00:00:00Z
status: human_needed
score: 8/8 must-haves verified (automated checks)
re_verification: false
human_verification:
  - test: "Scan or type a codigo IN with status='encontrado' in trafego_fardos and press Enter"
    expected: "Modal opens with marketplace-colored top border, SKU, CONTEM + quantity, endereco with green pin, and Entregar Para list of separador names"
    why_human: "Full modal rendering and border color require visual inspection in a browser"
  - test: "Click Confirmar Baixa in the modal"
    expected: "Green toast appears, modal closes, input re-focuses, BAIXADOS HOJE section auto-expands showing the item with separador name in 'Entregue para'"
    why_human: "Toast behavior, focus management, and live list update require browser interaction"
  - test: "Scan the same codigo IN a second time"
    expected: "Yellow toast 'Fardo X ja teve baixa' appears without opening the modal"
    why_human: "Toast and suppression of modal require browser interaction"
  - test: "Type a non-existent codigo IN and press Enter"
    expected: "Red toast appears and input border flashes red for 2 seconds"
    why_human: "Border flash timing and toast require visual/interactive verification"
  - test: "Tap the camera icon and point at a barcode"
    expected: "Full-screen overlay opens, scan triggers search, overlay closes automatically"
    why_human: "Camera access requires HTTPS/localhost and physical barcode scanning"
  - test: "After confirming baixa for a fardo that had AGUARDAR FARDISTA lines, open prateleira"
    expected: "Previously blocked AGUARDAR FARDISTA items are now unlocked (pendente)"
    why_human: "Cross-screen state change requires end-to-end browser testing with real data"
  - test: "Open /baixa on a second browser tab (or another device) while a different user confirms a baixa"
    expected: "BAIXADOS HOJE section updates in real time via Supabase realtime subscription"
    why_human: "Realtime subscription behavior requires two concurrent sessions"
---

# Phase 8: Baixa de Fardos Verification Report

**Phase Goal:** Fardista pode escanear ou digitar codigo IN para dar baixa no fardo, removendo do trafego e atualizando a planilha de estoque
**Verified:** 2026-04-08
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Fardista digita ou escaneia codigo IN e Enter aciona busca automatica no trafego | VERIFIED | `BaixaInput` handles Enter keydown, calls `onSearch`, wired through `BaixaPageClient` to `useBaixa.search()` which calls `GET /api/baixa/buscar` |
| 2 | Card de confirmacao exibe SKU, quantidade, endereco e "para quem entregar" (todos os nomes) | VERIFIED | `BaixaModal` renders `fardo.sku`, `fardo.quantidade` with CONTEM label, `fardo.endereco` with green MapPin, and full `fardo.entregas` list with separador names; buscar route builds complete lookup chain (trafego -> reservas -> pedidos -> atribuicoes -> users) |
| 3 | Confirmar Baixa remove fardo do trafego, libera prateleira e apaga colunas F+ na planilha de estoque externa | VERIFIED (partial) | Confirmar route DELETES from `trafego_fardos` and unlocks `aguardar_fardista` progresso rows. Sheets column clearing is satisfied by Phase 6 OK flow per D-20 (confirmed in `app/api/fardos/ok/route.ts` lines 147-154) |
| 4 | Discharged fardo status is tracked in the system for audit trail | VERIFIED | `baixados` table records every discharge; confirmar route inserts full fardo data (sku, quantidade, endereco, reserva_id, fardista_id, fardista_nome) per migration 00010 |
| 5 | Duplicate baixa returns 409 without mutating data | VERIFIED | buscar route checks `baixados` for existing record (returns 409 with `duplicado:true`); confirmar route has double protection: pre-check query + DB UNIQUE constraint on `baixados.codigo_in` (migration 00009) catching race conditions |
| 6 | BAIXADOS HOJE section shows discharged fardos with entregas names and updates in real time | VERIFIED | `BaixadosHoje` component receives `baixadosHoje` from `useBaixa`; hook calls `GET /api/baixa/hoje` on mount and subscribes to INSERT events on `baixados` table via `baixa-realtime` channel |
| 7 | Camera scanner opens overlay and auto-triggers search | VERIFIED | `CameraScanner` renders in `fixed inset-0` overlay via React.lazy, calls `onScan(result[0].rawValue)` + `onClose()` on scan; wired through `BaixaPageClient.handleCameraScan` |
| 8 | Input has auto-focus on mount, error flash on not found, disabled during modal | VERIFIED | `BaixaInput` calls `inputRef.current?.focus()` in useEffect on mount; applies `border-red-500` when `hasError=true`; `disabled` prop gates both input and camera button |

**Score:** 8/8 truths verified (automated)

### Deferred Items

None — no items explicitly deferred to later phases.

**Note on BAIX-06 Sheets clearing:** The ROADMAP SC3 includes "apaga colunas F+ na planilha de estoque externa via Google Sheets API." Per user decision D-20 (documented in `08-CONTEXT.md` and `08-RESEARCH.md`), this was intentionally satisfied by Phase 6's OK flow, not Phase 8. The clearing code exists at `app/api/fardos/ok/route.ts:150` calling `clearSheetRange`. This is a deliberate design split, not a gap.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00009_baixa_status.sql` | ALTER CHECK constraint to add baixado | VERIFIED | Contains correct ALTER TABLE, UNIQUE constraint on `baixados.codigo_in`, RLS policies, and realtime publication |
| `src/features/baixa/lib/baixa-utils.ts` | getMarketplaceColor helper and BaixaFardoResult type | VERIFIED | Exports `getMarketplaceColor`, `BaixaFardoResult`, `EntregaInfo`, `BaixadoItem` |
| `app/api/baixa/buscar/route.ts` | GET endpoint for fardo lookup by codigo_in | VERIFIED | Full lookup chain: trafego_fardos -> reservas -> pedidos -> atribuicoes -> users; returns 409/404/200 |
| `app/api/baixa/confirmar/route.ts` | POST endpoint for confirming baixa | VERIFIED | Insert baixados, DELETE trafego_fardos (deviation from plan's status update — documented bug fix), unlock aguardar_fardista |
| `app/api/baixa/hoje/route.ts` | GET endpoint for today's baixados with full entregas data | VERIFIED | Queries `baixados` filtered to today, builds full entregas array for each record |
| `src/features/baixa/hooks/use-baixa.ts` | Main hook managing search, confirm, state, and baixados list | VERIFIED | Exports `useBaixa` with all 9 return values; fetches all 3 API endpoints; realtime subscription on `baixa-realtime` channel |
| `src/features/baixa/components/baixa-input.tsx` | Input field with auto-focus and Enter handler | VERIFIED | Auto-focus in useEffect; Enter handler clears value and calls onSearch; `border-red-500` on error; camera button with `aria-label` |
| `src/features/baixa/components/baixa-modal.tsx` | Confirmation modal with fardo details and Entregar Para | VERIFIED | `borderTop` inline style with marketplace color; CONTEM label; MapPin; Entregar para list with per-line colors; Loader2 spinner; Nao atribuido fallback |
| `src/features/baixa/components/baixados-hoje.tsx` | Collapsible section showing today's discharges | VERIFIED | Collapsible with ChevronUp/Down; auto-expands on first item via prevLengthRef; displays entregas via `formatEntregas`; timestamps via `toLocaleTimeString` |
| `app/(authenticated)/baixa/page.tsx` | Baixa page wiring all components together | VERIFIED | Server component with metadata; delegates to `BaixaPageClient` |
| `src/features/baixa/components/baixa-page-client.tsx` | Client component orchestrating all baixa UI | VERIFIED | Imports all 4 components + useBaixa; handles search/confirm/cancel with input re-focus; renders CameraScanner conditionally |
| `src/features/baixa/components/camera-scanner.tsx` | Lazy-loaded camera scanner overlay | VERIFIED | `React.lazy` import from `@yudiel/react-qr-scanner`; `fixed inset-0` overlay; Escape key listener; formats include code_128, ean_13, ean_8, upc_a |
| `supabase/migrations/00010_baixados_full_data.sql` | Restructure baixados for delete-based flow | VERIFIED | Drops FK, makes trafego_id nullable, adds sku/quantidade/endereco/reserva_id/fardista_id/fardista_nome columns |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/api/baixa/buscar/route.ts` | trafego_fardos -> reservas -> pedidos -> atribuicoes | supabaseAdmin queries | WIRED | All 4 table queries confirmed in file; result returns as BaixaFardoResult |
| `app/api/baixa/confirmar/route.ts` | baixados + trafego_fardos + progresso | 3-step DB mutation | WIRED | Insert to baixados, DELETE from trafego_fardos, update progresso from aguardar_fardista to pendente |
| `app/api/baixa/hoje/route.ts` | baixados -> trafego_fardos -> reservas -> pedidos -> atribuicoes | supabaseAdmin join queries | WIRED | Queries baixados table (line 31), builds full entregas chain for each record |
| `src/features/baixa/hooks/use-baixa.ts` | /api/baixa/buscar, /api/baixa/confirmar, /api/baixa/hoje | fetch calls | WIRED | All 3 fetch calls verified: buscar (line 66), confirmar (line 106), hoje (line 28) |
| `src/features/baixa/components/baixa-input.tsx` | src/features/baixa/hooks/use-baixa.ts | onSearch callback | WIRED | BaixaInput receives `onSearch` prop; BaixaPageClient passes `handleSearch` which calls `useBaixa.search()` |
| `app/(authenticated)/baixa/page.tsx` | src/features/baixa/hooks/use-baixa.ts | useBaixa hook via BaixaPageClient | WIRED | page.tsx -> BaixaPageClient -> useBaixa (verified in baixa-page-client.tsx line 4) |
| `src/features/baixa/components/camera-scanner.tsx` | @yudiel/react-qr-scanner | React.lazy dynamic import | WIRED | `React.lazy(() => import('@yudiel/react-qr-scanner').then(...))` at line 6; package confirmed in package.json at version ^2.5.1 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `BaixaModal` | `fardo` (BaixaFardoResult) | `useBaixa.fardo` state, set from `GET /api/baixa/buscar` response | Yes — API queries `trafego_fardos`, `reservas`, `pedidos`, `atribuicoes`, `users` | FLOWING |
| `BaixadosHoje` | `items` (BaixadoItem[]) | `useBaixa.baixadosHoje` state, set from `GET /api/baixa/hoje` response | Yes — API queries `baixados` filtered by today's date, builds full entregas per record | FLOWING |
| `BaixaInput` | `hasError`, `disabled` | `useBaixa.hasError`, computed from `isSearching || modalOpen` | Yes — driven by real API response states (404 sets hasError, isSearching gate) | FLOWING |

### Behavioral Spot-Checks

No runnable entry points testable without a live server. All checks require authenticated Supabase session and real trafego_fardos data.

Step 7b: SKIPPED — requires running server with authenticated session and database records.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BAIX-01 | 08-02, 08-03 | Fardista pode digitar ou escanear codigo IN do fardo | SATISFIED | `BaixaInput` component with text input + camera scanner; `CameraScanner` component with `@yudiel/react-qr-scanner` |
| BAIX-02 | 08-02, 08-03 | Enter aciona busca automatica no trafego | SATISFIED | `BaixaInput` `handleKeyDown` triggers `onSearch` on Enter; calls `GET /api/baixa/buscar` |
| BAIX-03 | 08-02, 08-03 | Card de confirmacao exibe SKU, quantidade, endereco | SATISFIED | `BaixaModal` renders fardo.sku, CONTEM + fardo.quantidade, fardo.endereco with MapPin |
| BAIX-04 | 08-01 | Card mostra "para quem entregar" — nome do separador responsavel | SATISFIED | buscar route builds entregas array with separador_nome via atribuicoes -> users lookup; BaixaModal renders "Entregar para:" section |
| BAIX-05 | 08-01 | Se fardo atende multiplos cards/separadores, mostra todos os nomes | SATISFIED | buscar route iterates all reservas and all unique card_keys, collecting one separador per card_key; BaixaModal maps `fardo.entregas` rendering all entries |
| BAIX-06 | 08-01 | Confirmar Baixa remove fardo do trafego, libera prateleira, apaga colunas F+ na planilha | SATISFIED (split) | trafego DELETE + progresso unlock: `app/api/baixa/confirmar/route.ts`. Sheets clearing (colunas F+): `app/api/fardos/ok/route.ts:150` (Phase 6 OK flow, per D-20 decision) |

**Requirements coverage: 6/6 SATISFIED**

**Document note:** REQUIREMENTS.md traceability table still shows BAIX-01 through BAIX-06 as `Pending` (unchecked `[ ]`). This is a documentation inconsistency — the code satisfies all 6 requirements. The requirement status checkboxes need to be updated from `[ ]` to `[x]`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/api/baixa/hoje/route.ts` | 30 | `(supabaseAdmin as any)` cast | Info | Non-blocking — workaround for generated types not including new `baixados` columns added by migration 00010. Functionally correct. |
| `app/api/baixa/confirmar/route.ts` | 81-85 | `(trafego as any).fardista_id`, `(trafego as any).fardista_nome` | Info | Non-blocking — same root cause as above; generated types don't reflect migration 00010 schema additions yet. Functionally correct. |

No blockers. No stubs. No TODO/FIXME comments in any phase 8 file.

**Deviation note (documented in 08-03-SUMMARY.md):** `app/api/baixa/confirmar/route.ts` was refactored from updating `trafego_fardos.status = 'baixado'` to DELETING the row entirely and copying all data to `baixados`. Migration 00010 supports this schema. The PLAN 01 spec originally said "update status to 'baixado'" but this was superseded by a documented bug fix. The `StatusTrafego` type still includes `'baixado'` in `src/types/index.ts` and migration 00009 still adds the CHECK constraint — these are not harmful but the 'baixado' status is no longer written to trafego_fardos in practice. This is a minor inconsistency with no functional impact.

### Human Verification Required

#### 1. Modal rendering and marketplace color

**Test:** Log in as a fardista user, navigate to /baixa, type a codigo IN that exists in trafego_fardos with status='encontrado', and press Enter.
**Expected:** Modal opens with a 4px colored top border matching the marketplace, showing SKU, CONTEM + quantity (large text), endereco with green MapPin, and the "Entregar para:" section listing separador names.
**Why human:** Visual border color, layout, and conditional rendering of all sections require browser inspection.

#### 2. Confirm baixa end-to-end flow

**Test:** From the open modal, click "Confirmar Baixa".
**Expected:** Green toast "Baixa confirmada -- {codigo_in}" appears, modal closes, input re-focuses, BAIXADOS HOJE section auto-expands and shows the item with separador name under "Entregue para:".
**Why human:** Toast appearance, auto-focus behavior, and live list update require interactive browser testing.

#### 3. Duplicate scan (yellow toast, no modal)

**Test:** After confirming a baixa, type or scan the same codigo IN again and press Enter.
**Expected:** Yellow warning toast appears with "Fardo {codigo_in} ja teve baixa". Modal does NOT open.
**Why human:** Toast type (warning vs error) and modal suppression require browser interaction.

#### 4. Not-found error flash

**Test:** Type a non-existent codigo IN and press Enter.
**Expected:** Red error toast appears and input border turns red for approximately 2 seconds then reverts.
**Why human:** Visual animation timing requires browser observation.

#### 5. Camera scanner overlay

**Test:** Tap the camera icon button.
**Expected:** Full-screen dark overlay appears with a 280x280 viewfinder. Scanning a barcode triggers search and closes the overlay.
**Why human:** Camera permission, barcode detection, and overlay dismissal require a device with camera access on HTTPS or localhost.

#### 6. AGUARDAR FARDISTA unlock (cross-screen)

**Test:** After confirming baixa for a fardo that corresponds to AGUARDAR FARDISTA progresso rows, navigate to /prateleira.
**Expected:** Items that were blocked with "AGUARDAR FARDISTA" status are now unlocked (showing as pendente / actionable).
**Why human:** Requires real database records with aguardar_fardista status and cross-screen navigation.

#### 7. Realtime list update

**Test:** Open /baixa in two browser tabs (or on two devices). Have user A confirm a baixa while user B's page is idle.
**Expected:** User B's BAIXADOS HOJE section updates automatically without page refresh.
**Why human:** Realtime subscription behavior requires two concurrent authenticated sessions.

### Gaps Summary

No automated gaps found. All artifacts are present, substantive, wired, and data-flowing. All 6 requirements are satisfied by the implementation. All 3 plans' must-haves are met.

The only open items are human verification tasks (7 items) for the visual/interactive behaviors that cannot be confirmed programmatically.

**Minor inconsistencies (non-blocking):**

1. `REQUIREMENTS.md` traceability table still shows BAIX-01 through BAIX-06 as `[ ] Pending`. These should be updated to `[x]` to reflect completion.
2. `src/types/index.ts` declares `StatusTrafego` including `'baixado'` and migration 00009 adds the CHECK constraint, but the confirmar route now deletes the trafego row instead of setting status='baixado'. The 'baixado' type is unused in practice. No functional impact.
3. `BaixaInput` placeholder text differs from plan spec ("Digite ou escaneie o código IN..." vs planned "Escanear ou digitar codigo IN") — purely cosmetic.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_

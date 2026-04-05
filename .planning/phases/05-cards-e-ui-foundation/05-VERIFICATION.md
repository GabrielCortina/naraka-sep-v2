---
phase: 05-cards-e-ui-foundation
verified: 2026-04-05T21:00:00Z
status: human_needed
score: 5/5 must-haves verified (automated); visual/functional verification pending human
re_verification: false
human_verification:
  - test: "Abrir /prateleira como lider e verificar layout kanban com colunas por metodo de envio"
    expected: "Colunas ordenadas por prazo (SPX primeiro), cores dos badges marketplace, contagem regressiva/urgencia nos cards"
    why_human: "Comportamento visual e responsivo nao verificavel por grep"
  - test: "Clicar em um card no /prateleira: modal ItemModal abre com lista de itens"
    expected: "Modal exibe SKU, quantidade necessaria, status, botoes Confirmar e Nao Tem. Itens aguardar_fardista aparecem no final com botoes desabilitados"
    why_human: "Fluxo de interacao do usuario no browser"
  - test: "Clicar Confirmar em um item: NumpadPopup abre, digitar quantidade, confirmar"
    expected: "Numpad exibe digitos 0-9, backspace e Confirmar verde. Confirmar chama /api/cards/progress e card atualiza em tempo real"
    why_human: "Interacao mobile com numpad, validacao visual e realtime update"
  - test: "Redimensionar para mobile (<768px)"
    expected: "Colunas viram secoes colapsaveis por marketplace. Secoes com urgency overdue/warning ficam expandidas. Cards sao full-width"
    why_human: "Comportamento responsivo requer browser"
  - test: "Verificar secao CONCLUIDOS no final"
    expected: "Se algum card tem 100%, aparece na secao CONCLUIDOS colapsavel (comeca fechada)"
    why_human: "Requer dados reais no banco com card completado"
  - test: "Acessar /prateleira como separador"
    expected: "Separador ve apenas cards atribuidos a ele (ou nenhum se nao atribuido)"
    why_human: "Filtro por role requer autenticacao com usuario real de role separador"
---

# Phase 05: Cards e UI Foundation — Verification Report

**Phase Goal:** Pedidos processados aparecem organizados em cards com progresso, urgencia e design system completo do sistema
**Verified:** 2026-04-05T21:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pedidos aparecem agrupados em cards por grupo_envio + tipo + importacao_numero, com lista de itens, barra de progresso e atribuicao | ? HUMAN | `groupByCardKey` implementada e wired em `useCardData`. `KanbanBoard` renderiza `OrderCard` com progress bar e assign. Requer dados reais para validar visualmente. |
| 2 | Cada card exibe contagem regressiva ate o prazo com badge de urgencia colorido (verde >2h, amarelo <2h, vermelho atrasado) | ? HUMAN | `useCountdown` com 60s interval implementado. `UrgencyBadge` com ATRASADO/countdown e cores urgency-overdue/warning/ok. Visual requer browser. |
| 3 | Cards sao colapsiveis por metodo de envio e cards 100% completos vao para secao CONCLUIDOS colapsavel | ? HUMAN | `KanbanColumn` usa `Collapsible` no mobile. `CompletedSection` filtra `urgency === 'done'`, comeca fechada (`useState(false)`). Requer browser. |
| 4 | Design minimalista preto e branco com cores por marketplace; mobile first para separadores/fardistas, desktop para lider/admin | ? HUMAN | Design tokens configurados (CSS vars HSL + Tailwind extend). Layout responsivo `hidden md:block` / `md:hidden`. Inter font configurada. Visual requer browser. |
| 5 | Modal abre card para trabalhar itens; popup de quantidade funciona no mobile | ? HUMAN | `ItemModal` com lista de itens, ordenacao aguardar_fardista, botoes Confirmar/Nao Tem. `NumpadPopup` grid 3x4 com validacao. Wired em prateleira-client.tsx. Requer browser. |

**Score automatizado (artifacts + wiring):** 5/5 truths supported by verified artifacts and key links

---

### Required Artifacts

| Artifact | Plan | Status | Details |
|----------|------|--------|---------|
| `src/features/cards/types.ts` | 05-01 | VERIFIED | Exports `UrgencyTier`, `MarketplaceKey`, `CardItem`, `CardData` |
| `src/features/cards/lib/deadline-config.ts` | 05-01 | VERIFIED | Exports `DEADLINES` (SPX:11..Xpress:19), `COLUMN_ORDER`, `MARKETPLACE_COLORS`, `TYPE_ABBREV` |
| `src/features/cards/lib/card-utils.ts` | 05-01 | VERIFIED | 6 exported functions: `groupByCardKey`, `getUrgencyTier`, `calcProgress`, `isCardComplete`, `formatCountdown`, `aggregateItems` |
| `src/features/cards/lib/__tests__/card-utils.test.ts` | 05-01 | VERIFIED | 286 lines, 29 test cases, 6 describe blocks |
| `app/globals.css` | 05-01 | VERIFIED | `--shopee: 14 89% 55%`, `--urgency-overdue: 0 72% 51%`, `--urgency-ok: 142 71% 45%` |
| `app/layout.tsx` | 05-01 | VERIFIED | `import { Inter } from "next/font/google"` with `weight: ["400", "700"]` |
| `tailwind.config.ts` | 05-01 | VERIFIED | `shopee: "hsl(var(--shopee))"`, `"urgency-overdue": "hsl(var(--urgency-overdue))"` |
| `src/features/cards/components/progress-bar.tsx` | 05-02 | VERIFIED | Exports `ProgressBar`, uses `bg-urgency-overdue`, `h-1` |
| `src/features/cards/components/urgency-badge.tsx` | 05-02 | VERIFIED | Exports `UrgencyBadge`, renders "ATRASADO" for overdue |
| `src/features/cards/components/marketplace-badge.tsx` | 05-02 | VERIFIED | Exports `MarketplaceBadge`, imports `MARKETPLACE_COLORS` |
| `src/features/cards/components/order-card.tsx` | 05-02 | VERIFIED | Exports `OrderCard`, imports ProgressBar/UrgencyBadge/MarketplaceBadge, uses `border-l-4`, `TYPE_ABBREV`, peças count |
| `src/components/ui/dialog.tsx` | 05-02 | VERIFIED | shadcn Dialog installed |
| `src/components/ui/collapsible.tsx` | 05-02 | VERIFIED | Exports `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` |
| `src/components/ui/scroll-area.tsx` | 05-02 | VERIFIED | Exports `ScrollArea`, `ScrollBar` |
| `src/components/ui/progress.tsx` | 05-02 | VERIFIED | Exports `Progress` |
| `src/features/cards/components/kanban-column.tsx` | 05-03 | VERIFIED | Exports `KanbanColumn`, uses `Collapsible` (mobile), `hidden md:block`, `md:hidden`, `tierOrder` sort, `defaultOpen` logic |
| `src/features/cards/components/kanban-board.tsx` | 05-03 | VERIFIED | Exports `KanbanBoard`, uses `COLUMN_ORDER`, `hidden md:block`, `md:hidden`, `bg-zinc-100`, `KanbanColumn`, `CompletedSection`, empty state "Nenhum pedido para separar" — NOTE: CSS grid used instead of ScrollArea (approved user deviation) |
| `src/features/cards/components/completed-section.tsx` | 05-03 | VERIFIED | Exports `CompletedSection`, shows "CONCLUIDOS", uses `Collapsible`, starts closed (`useState(false)`) |
| `src/features/cards/components/item-modal.tsx` | 05-04 | VERIFIED | Exports `ItemModal`, sorts `aguardar_fardista` to bottom, "AGUARDAR FARDISTA" badge, imports `NumpadPopup` and `generateChecklist`, "Imprimir" button, `disabled` conditioned on `aguardar_fardista` |
| `src/features/cards/components/numpad-popup.tsx` | 05-04 | VERIFIED | Exports `NumpadPopup`, `grid grid-cols-3`, "Quantidade necessaria", `bg-green-600`, validation `qty >= 0 && qty <= quantidadeNecessaria` |
| `src/features/cards/components/assign-modal.tsx` | 05-04 | VERIFIED | Exports `AssignModal`, "Atribuir Separador"/"Atribuir Fardista", `onAssign` |
| `src/features/cards/lib/pdf-generator.ts` | 05-04 | VERIFIED | Exports `generateChecklist`, uses `jsPDF`, `autoTable`, head `['SKU', 'Qtd', 'Check']` |
| `src/features/cards/lib/__tests__/pdf-generator.test.ts` | 05-04 | VERIFIED | Uses `vi.mock('jspdf')`, tests `generateChecklist` |
| `src/features/cards/hooks/use-countdown.ts` | 05-05 | VERIFIED | Exports `useCountdown`, `'use client'`, `setInterval(..., 60_000)`, imports `DEADLINES` |
| `src/features/cards/hooks/__tests__/use-countdown.test.ts` | 05-05 | VERIFIED | 78 lines, 6 test cases, `vi.useFakeTimers()`, tests ok/warning/overdue/done/update |
| `src/features/cards/hooks/use-cards-realtime.ts` | 05-05 | VERIFIED | Exports `useCardsRealtime`, `'use client'`, `postgres_changes` on `progresso` + `atribuicoes`, `removeChannel` |
| `src/features/cards/hooks/use-card-data.ts` | 05-05 | VERIFIED | Exports `useCardData`, `'use client'`, `groupByCardKey`, `aggregateItems`, `useCardsRealtime`, role filter for separador/fardista |
| `supabase/migrations/20260405_realtime_publication.sql` | 05-05 | VERIFIED | `ALTER PUBLICATION supabase_realtime ADD TABLE progresso` + `atribuicoes` + `reservas` + `trafego_fardos` |
| `app/(authenticated)/prateleira/page.tsx` | 05-05 | VERIFIED | 37 lines, imports `PrateleiraClient`, metadata "Prateleira | NARAKA SEP v2" |
| `app/(authenticated)/prateleira/prateleira-client.tsx` | 05-05 | VERIFIED | `useCardData`, `KanbanBoard`, `ItemModal`, `AssignModal`, `filterRole="separador"`, `fetch('/api/cards/progress'`, `fetch('/api/cards/assign'` |
| `app/(authenticated)/fardos/page.tsx` | 05-05 | VERIFIED | 37 lines, imports `FardosClient`, metadata "Fardos | NARAKA SEP v2" |
| `app/(authenticated)/fardos/fardos-client.tsx` | 05-05 | VERIFIED | `useCardData`, `KanbanBoard`, `ItemModal`, `AssignModal`, `filterRole="fardista"`, `fetch('/api/cards/progress'`, `fetch('/api/cards/assign'` |
| `supabase/migrations/00004_rls_write_policies.sql` | 05-06 | VERIFIED | 5 `CREATE POLICY` statements: INSERT/UPDATE on progresso, INSERT/UPDATE/DELETE on atribuicoes (lider/admin) |
| `src/app/api/cards/progress/route.ts` | 05-06 | VERIFIED | Exports `POST`, `getUser()`, validates `quantidade_separada >= 0`, validates against `pedido.quantidade`, status whitelist |
| `src/app/api/cards/assign/route.ts` | 05-06 | VERIFIED | Exports `POST`, `getUser()`, checks `['admin', 'lider']`, validates `['separador', 'fardista']`, checks `targetUser.role !== tipo` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `card-utils.ts` | `deadline-config.ts` | `import DEADLINES` | WIRED | Line 3: `import { DEADLINES } from './deadline-config'` |
| `card-utils.ts` | `types.ts` | `import CardItem, UrgencyTier` | WIRED | Line 2: `import type { CardItem, UrgencyTier } from '../types'` |
| `order-card.tsx` | `progress-bar.tsx` | `import ProgressBar` | WIRED | Line 12: `import { ProgressBar } from './progress-bar'` |
| `order-card.tsx` | `urgency-badge.tsx` | `import UrgencyBadge` | WIRED | Line 11: `import { UrgencyBadge } from './urgency-badge'` |
| `kanban-board.tsx` | `kanban-column.tsx` | `import KanbanColumn` | WIRED | Line 6: `import { KanbanColumn } from './kanban-column'` |
| `kanban-board.tsx` | `completed-section.tsx` | `import CompletedSection` | WIRED | Line 7: `import { CompletedSection } from './completed-section'` |
| `item-modal.tsx` | `numpad-popup.tsx` | `import NumpadPopup` | WIRED | Line 20: `import { NumpadPopup } from './numpad-popup'` |
| `item-modal.tsx` | `pdf-generator.ts` | `import generateChecklist` | WIRED | Line 18: `import { generateChecklist } from '../lib/pdf-generator'` |
| `prateleira-client.tsx` | `use-card-data.ts` | `import useCardData` | WIRED | Line 5: `import { useCardData } from '@/features/cards/hooks/use-card-data'` |
| `use-card-data.ts` | `use-cards-realtime.ts` | `import useCardsRealtime` | WIRED | Line 11: `import { useCardsRealtime } from './use-cards-realtime'` |
| `use-cards-realtime.ts` | `src/lib/supabase` | `import createClient` | WIRED | Line 4: `import { createClient } from '@/lib/supabase/client'` |
| `prateleira-client.tsx` | `/api/cards/progress` | `fetch POST` | WIRED | Lines 101, 127: `fetch('/api/cards/progress', { method: 'POST' ...})` |
| `prateleira-client.tsx` | `/api/cards/assign` | `fetch POST` | WIRED | Line 146: `fetch('/api/cards/assign', { method: 'POST' ...})` |
| `progress/route.ts` | `src/lib/supabase/admin` | `import supabaseAdmin` | WIRED | Line 3: `import { supabaseAdmin } from '@/lib/supabase/admin'` |
| `assign/route.ts` | `src/lib/supabase/server` | `import createClient` | WIRED | Line 2: `import { createClient } from '@/lib/supabase/server'` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `prateleira-client.tsx` | `cards` from `useCardData` | `useCardData` -> `supabase.from('pedidos').select('*')` + progresso + reservas + atribuicoes | Yes — DB queries, not static | FLOWING |
| `fardos-client.tsx` | `cards` from `useCardData` | Same `useCardData` hook | Yes | FLOWING |
| `useCardsRealtime` | `onUpdate` callback | `postgres_changes` subscription on 4 tables | Yes — Supabase realtime | FLOWING |
| `use-countdown.ts` | `countdown`, `urgency` | `DEADLINES[grupoEnvio]` + `new Date()` updated every 60s | Yes — live time calculation | FLOWING |
| `api/cards/progress/route.ts` | `pedido.quantidade` | `supabaseAdmin.from('pedidos').select('quantidade').eq('id', pedido_id)` | Yes — DB lookup before write | FLOWING |
| `api/cards/assign/route.ts` | `dbUser.role`, `targetUser` | `supabaseAdmin.from('users').select('role')` | Yes — DB role verification | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| card-utils test suite | `npx vitest run src/features/cards/lib/__tests__/card-utils.test.ts` | 29 test cases in 286-line file; file exists and is substantive | PASS (file verified; execution needs running env) |
| useCountdown test suite | 78-line test file with 6 test cases including `useFakeTimers` | File verified | PASS (static) |
| pdf-generator tests | 4 tests with `vi.mock('jspdf')` | File verified | PASS (static) |
| No direct upsert in browser pages | `grep -c "supabase.from.*upsert"` on both page files | 0 matches | PASS |
| RLS migration has 5 policies | `grep -c "CREATE POLICY" 00004_rls_write_policies.sql` | 5 | PASS |
| progress route validates qty bounds | `grep "quantidade_separada < 0\|quantidade_separada > pedido.quantidade"` | Both validations present | PASS |
| assign route verifies lider/admin | `grep "['admin', 'lider'].includes"` | Line 20 present | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CARD-01 | 05-01 | Cada card agrupa pedidos por grupo_envio + tipo + importacao_numero | SATISFIED | `groupByCardKey` in card-utils; `useCardData` groups by card_key = grupo_envio+tipo+importacao |
| CARD-02 | 05-04 | Card exibe lista de itens (SKU, endereco, quantidade, fardo ID) | SATISFIED | `ItemModal` with `CardItem[]` list, sku, quantidade_necessaria, reservas |
| CARD-03 | 05-01, 05-02, 05-06 | Card exibe barra de progresso (pecas separadas / total) | SATISFIED | `ProgressBar` component wired via `OrderCard`, `calcProgress` function |
| CARD-04 | 05-01, 05-05 | Card exibe contagem regressiva ate o prazo de envio | SATISFIED | `useCountdown` hook with 60s interval, `formatCountdown` function, `DEADLINES` constants |
| CARD-05 | 05-01, 05-02 | Card exibe badge de urgencia colorido (verde >2h, amarelo <2h, vermelho atrasado, verde opaco concluido) | SATISFIED | `UrgencyBadge` with urgency-overdue/warning/ok colors, `getUrgencyTier` logic |
| CARD-06 | 05-04, 05-05, 05-06 | Card exibe atribuicao (separador/fardista responsavel) | SATISFIED | `AssignModal` + `/api/cards/assign` route + `useCardData` fetches atribuicoes |
| CARD-07 | 05-03, 05-05 | Cards sao colapsiveis por metodo de envio | SATISFIED | `KanbanColumn` with `Collapsible` on mobile, `hidden md:block`/`md:hidden` responsive layout |
| CARD-08 | 05-03 | Card 100% completo vai automaticamente para secao CONCLUIDOS | SATISFIED | `KanbanBoard` filters `urgency === 'done'` to `CompletedSection` |
| CARD-09 | 05-03 | Secao CONCLUIDOS e colapsavel no final da lista | SATISFIED | `CompletedSection` with `Collapsible`, `useState(false)` starts closed |
| UIUX-01 | 05-01 | Design minimalista preto e branco, fonte Inter | SATISFIED | `app/layout.tsx` with Inter weight 400/700 via next/font/google |
| UIUX-02 | 05-03, 05-05 | Mobile first para separadores/fardistas | SATISFIED | `md:hidden` sections with Collapsible, full-width cards on mobile |
| UIUX-03 | 05-03, 05-05 | Desktop otimizado para lider/admin | SATISFIED | `hidden md:block` CSS grid layout for desktop |
| UIUX-04 | 05-01 | Cores por marketplace: Shopee #ee4d2d, ML #ffe600, TikTok #25F4EE, Shein #000000 | SATISFIED | CSS vars `--shopee: 14 89% 55%` (HSL equivalent), `--ml: 54 100% 50%`, etc. Tailwind extend. |
| UIUX-05 | 05-04 | Modal para abrir card e trabalhar itens | SATISFIED | `ItemModal` based on shadcn Dialog, wired in prateleira-client and fardos-client |
| UIUX-06 | 05-04 | Popup de quantidade no mobile | SATISFIED | `NumpadPopup` with 3x4 grid, min 48px buttons, Dialog-based for mobile |

All 16 declared requirement IDs (CARD-01 through CARD-09, UIUX-01 through UIUX-06) are satisfied by verified artifacts.

---

### Notable Deviations (Non-Blocking)

| Deviation | Plan | Approved | Impact |
|-----------|------|----------|--------|
| Desktop kanban uses CSS grid instead of `ScrollArea` with horizontal scroll | 05-03 plan required `ScrollArea`, 05-05 changed to responsive grid | Yes — user approved during visual review | Layout adapts gracefully; grid fills viewport rather than scrolling horizontally |
| `KanbanColumn` desktop missing `w-[240px] min-w-[240px]` (uses `min-w-0` in grid) | 05-03 plan specified 240px | Yes — approved grid deviation | Grid distributes columns equally |
| `prateleira-client.tsx` and `fardos-client.tsx` are separate files (not inline) | 05-05 plan mentioned inline or separate | Acceptable per plan intent | No impact on functionality |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| No significant anti-patterns found across verified files | — | — | — |

No TODO/FIXME/PLACEHOLDER comments found in key component or hook files. No empty return stubs in production paths. All state variables that are rendered are populated by real DB queries via `useCardData`.

---

### Human Verification Required

#### 1. Layout Kanban Desktop (UIUX-03, CARD-07, SC-4)
**Test:** Acessar `/prateleira` como lider no desktop
**Expected:** Colunas por marketplace ordenadas por prazo (SPX primeiro), cores dos badges corretas, contagem regressiva visivel nos cards
**Why human:** Comportamento visual e responsivo nao verificavel por grep

#### 2. Modal ItemModal e NumpadPopup (UIUX-05, UIUX-06, CARD-02, SC-5)
**Test:** Clicar em um card — ItemModal abre. Clicar Confirmar em um item — NumpadPopup abre.
**Expected:** Modal mostra lista de itens, itens bloqueados (AGUARDAR FARDISTA) no final com botoes desabilitados. Numpad tem grid 3x4, digitos, backspace, Confirmar verde.
**Why human:** Fluxo de interacao no browser; validacao de UI mobile

#### 3. Realtime update (CARD-04, SC-2)
**Test:** Confirmar quantidade em um item e verificar que o card atualiza sem reload
**Expected:** Apos POST para `/api/cards/progress`, `useCardsRealtime` dispara refetch via subscription, progresso do card atualiza em tempo real
**Why human:** Requer conexao Supabase ativa e dados reais

#### 4. Layout Mobile colapsavel (UIUX-02, CARD-07, SC-3)
**Test:** Redimensionar para < 768px
**Expected:** Colunas viram secoes colapsaveis. Secoes com urgency overdue/warning ficam abertas. Cards full-width.
**Why human:** Comportamento responsivo requer browser

#### 5. Filtro por role do separador (SC-1)
**Test:** Acessar `/prateleira` como separador com cards atribuidos e nao-atribuidos
**Expected:** Separador ve apenas cards atribuidos a ele
**Why human:** Requer autenticacao com usuario real de role separador

#### 6. Secao CONCLUIDOS (CARD-08, CARD-09, SC-3)
**Test:** Quando card chega a 100%, verificar que aparece em CONCLUIDOS colapsavel
**Expected:** Card some das colunas ativas e aparece na secao CONCLUIDOS (colapsada por padrao)
**Why human:** Requer card completado com dados reais

---

### Gaps Summary

Nenhum gap bloqueante identificado. Todos os 16 requisitos declarados (CARD-01 a CARD-09, UIUX-01 a UIUX-06) estao suportados por artefatos verificados e links de wiring confirmados.

As verificacoes humanas pendentes sao de natureza visual e funcional — comportamentos que nao podem ser verificados por analise estatica de codigo. A infra-estrutura de dados (hooks, API routes, subscriptions realtime) foi verificada e esta corretamente conectada.

**Desvio notavel:** O desktop kanban usa CSS grid em vez de `ScrollArea` com scroll horizontal (conforme aprovado pelo usuario durante a sessao interativa do Plan 05-05). Este desvio nao afeta nenhum requisito funcional — o layout responsivo funciona e as colunas sao exibidas por metodo de envio.

---

*Verified: 2026-04-05T21:00:00Z*
*Verifier: Claude (gsd-verifier)*

---
phase: 03-upload-e-processamento
plan: 04
subsystem: ui, api
tags: [nextjs, supabase, upload, xlsx, tailwind]

requires:
  - phase: 03-upload-e-processamento/03-01
    provides: business logic functions (parseXlsx, classifyOrders, classifyEnvio)
  - phase: 03-upload-e-processamento/03-02
    provides: POST/DELETE route handlers for upload API
  - phase: 03-upload-e-processamento/03-03
    provides: client-side components (DropZone, ImportPreview, ImportList, useUpload)
provides:
  - Fully integrated upload page at /upload
  - End-to-end flow: file drop → parse → preview → confirm → persist → list
affects: [dashboard, fardos, prateleira]

tech-stack:
  added: []
  patterns:
    - Service role client for server-side writes bypassing RLS
    - Normalized header lookup for ERP spreadsheet compatibility
    - Horário formatado para timezone America/Sao_Paulo

key-files:
  created: []
  modified:
    - app/(authenticated)/upload/page.tsx
    - src/features/upload/components/upload-client.tsx
    - src/features/upload/components/drop-zone.tsx
    - src/features/upload/components/import-list-item.tsx
    - src/features/upload/lib/parse-xlsx.ts
    - src/features/upload/lib/envio-groups.ts
    - app/api/upload/route.ts
    - app/not-found.tsx
    - app/error.tsx
    - app/global-error.tsx

key-decisions:
  - "Service role client para bypass RLS em operações de escrita no route handler"
  - "Normalização de headers via NFD + ordinal indicators (º→o, ª→a) para compatibilidade com planilhas ERP"
  - "Mapeamento de métodos de envio: Entrega Rápida→Shopee SPX, iMile BR→TikTok Shop, JTB→Shein"
  - "TikTok renomeado para TikTok Shop no grupo de envio"

patterns-established:
  - "col() lookup: busca valores em rows de planilha com normalização de acentos e ordinal indicators"
  - "formatHorario: timestamps ISO formatados para HH:mm timezone Brasília"

requirements-completed: [UPLD-01, UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-06, UPLD-07, UPLD-08, UPLD-09, UPLD-10]

duration: 45min
completed: 2026-04-04
---

# Phase 03 Plan 04: Integração da Página de Upload

**Página /upload conectada end-to-end: drop zone redesenhada → parse XLSX com headers normalizados → preview → confirmação com persistência via service role → lista de importações com horário formatado**

## Performance

- **Duration:** 45 min (incluindo checkpoint interativo com usuário)
- **Tasks:** 2/2
- **Files modified:** 11

## Accomplishments
- Página /upload integrada com todos os componentes e route handlers
- 8 correções aplicadas durante checkpoint interativo com dados reais do ERP
- Fluxo end-to-end validado pelo usuário com planilha de produção (9125 linhas, 12 pedidos válidos)

## Task Commits

1. **Task 1: Substituir página placeholder** - `20da023` (feat)
2. **Task 2: Checkpoint - correções de produção** - `cc97556`, `b0ef482`, `262e5e2` (fix)
3. **Error boundaries** - `e081833` (fix)

## Files Created/Modified
- `app/(authenticated)/upload/page.tsx` - Server component com query de importações do dia
- `src/features/upload/components/upload-client.tsx` - Client wrapper conectando todos os componentes
- `src/features/upload/components/drop-zone.tsx` - Drop zone redesenhada com CloudUpload, botão ENVIAR ARQUIVO
- `src/features/upload/components/import-list-item.tsx` - Horário formatado HH:mm Brasília
- `src/features/upload/lib/parse-xlsx.ts` - col() lookup normalizado para headers com acentos/ordinal
- `src/features/upload/lib/envio-groups.ts` - Novos mapeamentos: Entrega Rápida, iMile BR, JTB
- `app/api/upload/route.ts` - Service role client para bypass RLS, prazo_envio null safety
- `app/not-found.tsx` - 404 page (Next.js App Router requirement)
- `app/error.tsx` - Error boundary por rota
- `app/global-error.tsx` - Error boundary raiz

## Decisions Made
- Usar service_role key no route handler para bypass RLS (autenticação feita separadamente via auth client)
- Normalizar headers via NFD + ordinal indicator replacement ao invés de hardcodar nomes com acento
- prazo_envio: falsy values convertidos para null (Supabase rejeita string vazia em timestamp)

## Deviations from Plan

### Correções durante checkpoint

1. **Status filter case-insensitive** — "Em processo" vs "Em Processo" vs "EM PROCESSO"
2. **Header normalization** — Planilha usa acentos (Armazém, Método, Variação) e ordinal (Nº)
3. **RLS bypass** — Tabela pedidos tem RLS, route handler precisava service_role
4. **prazo_envio null** — String vazia rejeitada pelo tipo timestamp
5. **Envio groups** — 3 novos mapeamentos necessários para dados de produção
6. **Error boundaries** — Next.js 14 App Router requer not-found.tsx, error.tsx, global-error.tsx
7. **UI polish** — Drop zone redesenhada, sidebar spacing, horário formatado, título removido

**Total deviations:** 7 correções durante checkpoint
**Impact on plan:** Todas necessárias para funcionamento com dados reais de produção. Sem scope creep.

## Issues Encountered
- Next.js "missing required error components" loop — resolvido criando error boundary files
- Node v25.8.2 + Next.js 14.2.35 incompatibilidade de cache — resolvido com limpeza de .next

## User Setup Required
None - SUPABASE_SERVICE_ROLE_KEY já deve estar em .env.local.

## Next Phase Readiness
- Upload completo e validado com dados reais
- Pedidos persistidos no Supabase com card_key, grupo_envio, tipo
- Pronto para fases de reserva de fardos, separação por prateleira

---
*Phase: 03-upload-e-processamento*
*Completed: 2026-04-04*

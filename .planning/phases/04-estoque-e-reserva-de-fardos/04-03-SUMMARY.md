---
phase: 04-estoque-e-reserva-de-fardos
plan: 03
subsystem: api, ui, database
tags: [reservation, upload, google-sheets, supabase, migration, stock-feedback]

requires:
  - phase: 04-estoque-e-reserva-de-fardos
    provides: reservation-engine, stock-parser, subset-sum, types, migration SQL
provides:
  - Migration 00003 applied to remote database (reservas schema by SKU)
  - POST /api/reservas endpoint for manual re-reservation
  - Upload route extended with automatic reservation after insert
  - Stock feedback section in import preview card (fardo/prateleira/parcial/indisponivel)
  - EstoqueSummary type and estoque state in upload hook
  - Regenerated database.types.ts matching new schema
affects: [05, 06, 07]

tech-stack:
  added: []
  patterns: [auto-reservation-on-upload, stock-feedback-card, re-reservation-endpoint]

key-files:
  created:
    - app/api/reservas/route.ts
  modified:
    - app/api/upload/route.ts
    - src/features/upload/types.ts
    - src/features/upload/hooks/use-upload.ts
    - src/features/upload/components/import-preview.tsx
    - src/features/upload/components/upload-client.tsx
    - src/features/fardos/utils/reservation-engine.ts
    - src/features/fardos/utils/subset-sum.ts
    - src/features/fardos/types.ts
    - src/features/fardos/utils/stock-parser.ts
    - src/types/database.types.ts

key-decisions:
  - "Array.from(Map) pattern for Map iteration -- tsconfig target compat (consistent with Phase 03 convention)"
  - "Regenerated database.types.ts after migration 00003 -- required for type-safe Supabase queries"
  - "NFD header normalization in stock-parser -- robust against accented column names in external spreadsheet"
  - "OK button replaces auto-close setTimeout on success card -- leader controls when to dismiss"

patterns-established:
  - "Auto-reservation pattern: upload route calls executeReservation after insert, returns estoque in response"
  - "Re-reservation endpoint: POST /api/reservas with forceRefresh=true to invalidate cache"
  - "Stock feedback card: EstoqueSummary displayed in import-preview with fardo/prateleira/parcial/indisponivel states"

requirements-completed: [STOK-01, STOK-02, STOK-03, STOK-04, STOK-05, STOK-06, STOK-07]

duration: 6min
completed: 2026-04-05
---

# Phase 4 Plan 03: Integracao de Reserva no Upload e Feedback de Estoque Summary

**Reserva automatica de fardos integrada ao upload com card de feedback mostrando SKUs fardo/prateleira/reservados, cobertura parcial, e alerta de indisponibilidade; endpoint /api/reservas para re-reserva manual; migration 00003 aplicada ao banco remoto**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-05T14:33:19Z
- **Completed:** 2026-04-05T14:39:30Z
- **Tasks:** 3
- **Files created:** 1
- **Files modified:** 10

## Accomplishments
- Migration 00003 aplicada ao banco remoto: tabela reservas sem pedido_id, com importacao_numero e partial unique index
- Upload route chama executeReservation automaticamente apos insert e retorna campo estoque na resposta
- Card de resumo exibe secao de estoque com metricas (SKUs fardo, prateleira, reservados), aviso parcial amarelo, e alerta de indisponibilidade
- Endpoint POST /api/reservas funcional com auth guard, re-reserva com cache invalidado
- database.types.ts regenerado para refletir schema atualizado
- stock-parser melhorado com normalizacao NFD de headers e campo posicao
- Card de sucesso fica aberto ate lider clicar OK (substituiu auto-close de 3s)
- Build compila sem erros, 57 testes passam

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema push e endpoint de re-reserva** - `667beb4` (feat)
2. **Task 2: Integrar reserva no upload route e feedback no card de resumo** - `fdd4d29` (feat)
3. **Task 3: Verificacao humana aprovada + fixes pos-review** - `7f7767c` (fix)

## Files Created/Modified
- `app/api/reservas/route.ts` - POST endpoint de re-reserva manual com auth guard (admin/lider)
- `app/api/upload/route.ts` - Estendido com chamada executeReservation apos insert + campo estoque no response
- `src/features/upload/types.ts` - Adicionado EstoqueSummary interface
- `src/features/upload/hooks/use-upload.ts` - Estado estoque, toast com fardos reservados, removido auto-close
- `src/features/upload/components/import-preview.tsx` - Secao de estoque no card de resumo + botao OK
- `src/features/upload/components/upload-client.tsx` - Propagacao da prop estoque para ImportPreview
- `src/features/fardos/utils/reservation-engine.ts` - Fix Map iteration com Array.from
- `src/features/fardos/utils/subset-sum.ts` - Fix Map iteration com Array.from
- `src/features/fardos/types.ts` - Adicionado campo posicao ao StockItem
- `src/features/fardos/utils/stock-parser.ts` - NFD header normalization, campo posicao
- `src/types/database.types.ts` - Regenerado apos migration 00003

## Decisions Made
- Array.from(Map) para iterar Maps em subset-sum.ts e reservation-engine.ts -- necessario para tsconfig target compat (mesmo padrao de Array.from(new Set()) ja usado no Phase 03)
- database.types.ts regenerado automaticamente via `supabase gen types` -- garante type safety com schema atualizado
- NFD normalization nos headers da planilha de estoque -- robusto contra acentos (ex: POSICAO vs POSICAO)
- Botao OK no card de sucesso ao inves de auto-close -- lider precisa de tempo para ler os dados de estoque

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Map iteration incompativel com tsconfig target**
- **Found during:** Task 2 (npm run build)
- **Issue:** `for (const [k,v] of map)` exige downlevelIteration ou target es2015+; subset-sum.ts e reservation-engine.ts usavam esta sintaxe
- **Fix:** Envolvido iteracoes com Array.from() -- padrao ja estabelecido no Phase 03
- **Files modified:** src/features/fardos/utils/subset-sum.ts, src/features/fardos/utils/reservation-engine.ts
- **Verification:** npm run build compila sem erros
- **Committed in:** fdd4d29 (Task 2 commit)

**2. [Rule 1 - Bug] Variavel request nao utilizada no endpoint reservas**
- **Found during:** Task 2 (npm run build -- lint error)
- **Issue:** `export async function POST(request: NextRequest)` -- parametro nao utilizado causa lint error
- **Fix:** Removido parametro e import NextRequest
- **Files modified:** app/api/reservas/route.ts
- **Verification:** npm run build compila sem erros
- **Committed in:** fdd4d29 (Task 2 commit)

**3. [Rule 1 - Bug] Variaveis e imports nao utilizados nos testes**
- **Found during:** Task 2 (npm run build -- lint errors)
- **Issue:** mockEqStatus, mockEqImportacao, mockSelect, SubsetResult import nao utilizados em reservation-engine.test.ts
- **Fix:** Removidos
- **Files modified:** src/features/fardos/utils/__tests__/reservation-engine.test.ts
- **Verification:** npm run build compila sem erros
- **Committed in:** fdd4d29 (Task 2 commit)

**4. [Rule 3 - Blocking] database.types.ts com schema desatualizado**
- **Found during:** Task 2 (npm run build -- type error pedido_id required)
- **Issue:** Tipos gerados ainda tinham pedido_id na tabela reservas apos migration remover a coluna
- **Fix:** Regenerado database.types.ts via `supabase gen types typescript`
- **Files modified:** src/types/database.types.ts
- **Verification:** npm run build compila sem erros, tipo reservas.Insert nao exige pedido_id
- **Committed in:** fdd4d29 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 blocking)
**Impact on plan:** Todos os fixes necessarios para compilacao e corretude. Sem scope creep.

### Post-verification Changes (user review)

**5. stock-parser NFD normalization e campo posicao**
- **Issue:** Headers da planilha podem conter acentos; campo posicao necessario
- **Fix:** NFD normalization nos headers, adicionado campo posicao ao StockItem e mapeamento POSICAO
- **Files modified:** src/features/fardos/utils/stock-parser.ts, src/features/fardos/types.ts, tests
- **Committed in:** 7f7767c

**6. OK button no card de sucesso**
- **Issue:** Auto-close de 3s nao dava tempo para lider ler dados de estoque
- **Fix:** Removido setTimeout, adicionado botao OK para fechar manualmente
- **Files modified:** src/features/upload/components/import-preview.tsx, src/features/upload/hooks/use-upload.ts
- **Committed in:** 7f7767c

## Issues Encountered
None

## User Setup Required
None - migration applied during execution, no external service configuration required.

## Next Phase Readiness
- Fluxo completo de estoque e reserva funcional end-to-end
- Lider faz upload e ve resultado de reserva imediatamente no card
- Endpoint /api/reservas pronto para botao "Atualizar Reservas" na tela de fardos (Phase 06)
- Todos os requisitos STOK-01 a STOK-07 completos
- Phase 04 totalmente concluida (3/3 planos)

## Self-Check: PASSED

All 11 files exist. All 3 commits verified (667beb4, fdd4d29, 7f7767c).

---
*Phase: 04-estoque-e-reserva-de-fardos*
*Completed: 2026-04-05*

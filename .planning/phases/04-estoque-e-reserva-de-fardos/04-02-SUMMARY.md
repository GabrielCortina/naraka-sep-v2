---
phase: 04-estoque-e-reserva-de-fardos
plan: 02
subsystem: api, integration
tags: [google-sheets, cache, retry, reservation, supabase, vitest]

requires:
  - phase: 04-estoque-e-reserva-de-fardos
    provides: Types StockItem/SubsetResult/ReservationResult, findOptimalCombination, migration 00003
provides:
  - Cache in-memory com TTL de 2 minutos para estoque externo
  - stock-parser com retry 3x e backoff exponencial para Google Sheets API
  - reservation-engine orquestrando estoque + demanda + subset sum + persistencia
affects: [04-03, 05, 06, 07]

tech-stack:
  added: []
  patterns: [in-memory-cache-ttl, retry-exponential-backoff, orchestrator-pattern]

key-files:
  created:
    - src/features/fardos/utils/stock-cache.ts
    - src/features/fardos/utils/stock-parser.ts
    - src/features/fardos/utils/reservation-engine.ts
    - src/features/fardos/utils/__tests__/stock-parser.test.ts
    - src/features/fardos/utils/__tests__/reservation-engine.test.ts
  modified: []

key-decisions:
  - "withRetry generico com backoff exponencial (1s, 2s, 4s) -- reutilizavel para qualquer chamada Google Sheets"
  - "Header mapping case-insensitive com trim -- robusto contra variacoes na planilha externa"
  - "Fardos reservados adicionados ao Set durante iteracao -- unicidade intra-execucao sem queries extras"

patterns-established:
  - "Cache pattern: getCached/setCache/invalidateCache com TTL em Map simples"
  - "Retry wrapper: withRetry<T> generico com maxRetries e baseDelay configuraveis"
  - "Orchestrator pattern: executeReservation coordena multiplas fontes (Sheets, Supabase) em fluxo sequencial"

requirements-completed: [STOK-01, STOK-02, STOK-03, STOK-04, STOK-06]

duration: 4min
completed: 2026-04-05
---

# Phase 4 Plan 02: Stock Parser e Reservation Engine Summary

**Stock parser le planilha Google Sheets com retry 3x e cache 2min, reservation engine orquestra fluxo completo: estoque -> demanda agregada -> subset sum -> persistencia no Supabase com visao global de reservas**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T14:26:50Z
- **Completed:** 2026-04-05T14:30:45Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- stock-cache com TTL de 2 minutos, getCached/setCache/invalidateCache exportados
- stock-parser com fetchStock (cache + retry + parse robusto por header) e withRetry generico com backoff exponencial
- reservation-engine executeReservation orquestra: le estoque, agrega demanda por SKU, exclui fardos ja reservados globalmente, executa subset sum, persiste com tratamento de unique_violation
- 18 testes novos (9 stock-parser + 9 reservation-engine), 31 total no dominio fardos

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD RED - stock-parser tests** - `9da3ede` (test)
2. **Task 1: TDD GREEN - stock-parser implementation** - `46f8c68` (feat)
3. **Task 2: TDD RED - reservation-engine tests** - `b5e8bbf` (test)
4. **Task 2: TDD GREEN - reservation-engine implementation** - `061cf7e` (feat)

_Note: TDD tasks have separate commits for RED (test) and GREEN (implementation)_

## Files Created/Modified
- `src/features/fardos/utils/stock-cache.ts` - Cache in-memory com TTL 2min (getCached, setCache, invalidateCache)
- `src/features/fardos/utils/stock-parser.ts` - fetchStock le planilha Estoque com retry 3x e cache; withRetry generico
- `src/features/fardos/utils/reservation-engine.ts` - executeReservation orquestra fluxo completo de reserva
- `src/features/fardos/utils/__tests__/stock-parser.test.ts` - 9 testes: parse, colunas faltando, linhas invalidas, case-insensitive, cache, retry
- `src/features/fardos/utils/__tests__/reservation-engine.test.ts` - 9 testes: fardo/prateleira, demanda agregada, visao global, parcial, unicidade, persistencia

## Decisions Made
- withRetry generico com backoff exponencial (1s, 2s, 4s) -- reutilizavel para qualquer chamada Google Sheets
- Header mapping case-insensitive com trim -- robusto contra variacoes na planilha externa
- Fardos reservados adicionados ao Set durante iteracao de SKUs -- garante unicidade intra-execucao sem queries extras ao banco
- Erro 23505 unique_violation tratado como "fardo ja reservado" e silenciosamente pulado (T-04-05)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrigido Test 5 (unicidade) para refletir comportamento correto do engine**
- **Found during:** Task 2 (TDD GREEN)
- **Issue:** Teste original assumia que findOptimalCombination seria chamado para SKU sem fardos disponiveis, mas o engine corretamente pula para skus_prateleira sem chamar o algoritmo
- **Fix:** Reestruturado cenario de teste com fardo compartilhado (IN-SHARED) entre dois SKUs para verificar que o Set de ja reservados e atualizado entre iteracoes
- **Files modified:** src/features/fardos/utils/__tests__/reservation-engine.test.ts
- **Verification:** Todos 9 testes passam, segundo call recebe apenas fardos nao reservados
- **Committed in:** 061cf7e (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix in test)
**Impact on plan:** Fix necessario para testar corretamente a unicidade intra-execucao. Sem scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- stock-parser e reservation-engine prontos para integracao no upload route handler (plano 04-03)
- fetchStock aceita forceRefresh=true para re-reserva manual (D-02, futuro botao "Atualizar Reservas")
- executeReservation retorna ReservationResult completo para exibicao no card de resumo (D-14, D-15, D-16)

## Self-Check: PASSED

All 5 files exist. All 4 commits verified.

---
*Phase: 04-estoque-e-reserva-de-fardos*
*Completed: 2026-04-05*

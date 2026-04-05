---
phase: 03-upload-e-processamento
plan: 02
subsystem: api
tags: [next-api-routes, supabase, upload, deduplication, day-reset]

requires:
  - phase: 03-upload-e-processamento/01
    provides: "Funcoes puras de parsing, classificacao e envio-groups"
  - phase: 02-autenticacao
    provides: "Auth com getUser() e users table com role"
provides:
  - "POST /api/upload - processa, classifica, deduplica e persiste pedidos"
  - "DELETE /api/upload/undo - desfaz ultima importacao"
  - "Virada de dia com limpeza seletiva de tabelas"
  - "Numeracao sequencial de importacoes via config table"
affects: [03-upload-e-processamento/03, 04-reserva-fardos, 05-separacao-prateleira]

tech-stack:
  added: []
  patterns: ["Route Handler auth pattern (getUser + users table role check)", "Config table for state management (virada de dia, importacao_numero)", "Chunked insert para volumes grandes (500 por batch)", "FK-safe delete order (atribuicoes -> progresso -> reservas -> pedidos)"]

key-files:
  created:
    - app/api/upload/route.ts
    - app/api/upload/undo/route.ts
  modified: []

key-decisions:
  - "Virada de dia deleta 4 tabelas (atribuicoes, progresso, reservas, pedidos), preserva 3 (trafego_fardos, baixados, fardos_nao_encontrados)"
  - "Delete com .neq('id', '') como filtro obrigatorio (Supabase exige filtro em deletes)"
  - "Array.from(new Set()) ao inves de spread para compatibilidade com target do tsconfig"

patterns-established:
  - "Auth guard pattern: getUser() + users table role check em Route Handlers"
  - "Config table pattern: upsert com onConflict 'chave' para estado persistente"
  - "Chunked DB operations: slicing arrays em batches de 500"

requirements-completed: [UPLD-01, UPLD-05, UPLD-06, UPLD-07, UPLD-08, UPLD-09, UPLD-10]

duration: 4min
completed: 2026-04-05
---

# Phase 03 Plan 02: Upload Route Handlers Summary

**Route Handlers POST /api/upload e DELETE /api/upload/undo com auth, virada de dia, classificacao, deduplicacao e persistencia no Supabase**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T00:40:19Z
- **Completed:** 2026-04-05T00:45:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- POST /api/upload completo: autentica, verifica role, virada de dia com limpeza seletiva, classifica tipo e envio, deduplica contra banco, numera sequencialmente, persiste com chunked insert e retorna summary
- DELETE /api/upload/undo completo: autentica, verifica role, desfaz ultima importacao com limpeza FK-safe de progresso/reservas, decrementa contador
- Ambos handlers consomem funcoes puras do Plan 01 (classifyOrders, generateCardKey, classifyEnvio)

## Task Commits

Each task was committed atomically:

1. **Task 1: Criar POST /api/upload Route Handler** - `f2dfd12` (feat)
2. **Task 2: Criar DELETE /api/upload/undo Route Handler** - `235fbbe` (feat)

## Files Created/Modified
- `app/api/upload/route.ts` - POST handler com fluxo completo de upload (auth, virada de dia, classificacao, deduplicacao, persistencia)
- `app/api/upload/undo/route.ts` - DELETE handler para desfazer ultima importacao

## Decisions Made
- Virada de dia deleta 4 tabelas na ordem FK-safe (atribuicoes, progresso, reservas, pedidos), preserva 3 tabelas de historico de fardos
- Usado `Array.from(new Set())` ao inves de spread operator para compatibilidade com target do tsconfig (evita `--downlevelIteration`)
- Delete com `.neq('id', '')` como filtro obrigatorio no Supabase (nao permite delete sem filtro)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Set spread incompativel com tsconfig target**
- **Found during:** Task 1 (POST route handler)
- **Issue:** `[...new Set()]` causa erro de compilacao "can only be iterated through when using --downlevelIteration flag"
- **Fix:** Substituido por `Array.from(new Set())`
- **Files modified:** app/api/upload/route.ts
- **Verification:** npm run build compila sem erros
- **Committed in:** f2dfd12

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix necessario para compilacao. Sem scope creep.

## Issues Encountered
- ESLint `prefer-const` exigia `const` ao inves de `let` para `existingNums` -- corrigido antes do commit

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Route Handlers prontos para consumo pelo frontend (Plan 03)
- POST /api/upload recebe dados parseados e retorna ImportSummary
- DELETE /api/upload/undo permite desfazer ultima importacao
- Virada de dia e numeracao sequencial funcionais

## Self-Check: PASSED

- [x] app/api/upload/route.ts exists
- [x] app/api/upload/undo/route.ts exists
- [x] Commit f2dfd12 found
- [x] Commit 235fbbe found

---
*Phase: 03-upload-e-processamento*
*Completed: 2026-04-05*

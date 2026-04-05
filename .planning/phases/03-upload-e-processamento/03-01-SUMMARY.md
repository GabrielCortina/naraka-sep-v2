---
phase: 03-upload-e-processamento
plan: 01
subsystem: upload
tags: [sheetjs, xlsx, vitest, tdd, classification, envio-groups]

requires:
  - phase: 02-autenticacao
    provides: "Auth completa com roles para proteger rotas de upload"
provides:
  - "parseXlsx: parse de xlsx com SheetJS, mapeamento 13 colunas, filtros status/envio"
  - "classifyOrders: agrupamento por numero_pedido e classificacao Unitario/Kit/Combo"
  - "classifyEnvio: mapeamento metodo envio para 6 grupos com prioridade TikTok"
  - "generateCardKey: formato grupo|tipo|importacao_numero"
  - "ImportSummary e ImportRecord types"
  - "vitest configurado com path aliases"
  - "shadcn badge, separator, alert componentes"
affects: [03-02, 03-03, 03-04]

tech-stack:
  added: [xlsx@0.20.3, vitest@4.1.2, "@radix-ui/react-separator"]
  patterns: [TDD red-green-refactor, feature-based module structure, pure functions with tests]

key-files:
  created:
    - src/features/upload/types.ts
    - src/features/upload/lib/parse-xlsx.ts
    - src/features/upload/lib/classify.ts
    - src/features/upload/lib/envio-groups.ts
    - src/features/upload/lib/__tests__/parse-xlsx.test.ts
    - src/features/upload/lib/__tests__/classify.test.ts
    - src/features/upload/lib/__tests__/envio-groups.test.ts
    - vitest.config.ts
    - src/components/ui/badge.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/alert.tsx
  modified:
    - package.json

key-decisions:
  - "COLUMN_MAP convertido de const para comentario JSDoc para evitar lint error de variavel nao utilizada"

patterns-established:
  - "Feature modules em src/features/{feature}/lib/ com testes em __tests__/"
  - "Logica pura separada de UI e Supabase para testabilidade"
  - "TDD com vitest: testes primeiro, implementacao depois"

requirements-completed: [UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-07, UPLD-10]

duration: 5min
completed: 2026-04-05
---

# Phase 03 Plan 01: Logica de Negocio Summary

**3 modulos de logica pura com SheetJS 0.20.3 para parse xlsx, classificacao Unitario/Kit/Combo e 6 grupos de envio com 22 testes TDD**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-05T00:33:38Z
- **Completed:** 2026-04-05T00:38:11Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- parseXlsx transforma ArrayBuffer em ParsedRow[] com mapeamento das 13 colunas ERP, filtro de status (Em processo) e filtro de envio (Full/Fulfillment)
- classifyOrders agrupa por numero_pedido e classifica Unitario/Kit/Combo com logica correta de SKUs distintos
- classifyEnvio mapeia metodos de envio para 6 grupos com TikTok verificado antes de Shopee Xpress (D-08)
- 22 testes unitarios passando com vitest, cobrindo todos os cenarios de negocio

## Task Commits

Each task was committed atomically:

1. **Task 1: Instalar dependencias e configurar vitest** - `f65ab36` (chore)
2. **Task 2: Criar tipos do feature e funcao parseXlsx com testes** - `089874c` (test/RED), `4c69d32` (feat/GREEN)
3. **Task 3: Criar classifyOrders, classifyEnvio e generateCardKey com testes** - `3681286` (test/RED), `977a68b` (feat/GREEN)

## Files Created/Modified
- `vitest.config.ts` - Configuracao vitest com alias '@' para src
- `src/features/upload/types.ts` - ImportSummary e ImportRecord interfaces
- `src/features/upload/lib/parse-xlsx.ts` - Parse xlsx com SheetJS, mapeamento 13 colunas, filtros
- `src/features/upload/lib/classify.ts` - classifyOrders (Unitario/Kit/Combo), generateCardKey
- `src/features/upload/lib/envio-groups.ts` - classifyEnvio com 6 grupos e fallback Outro
- `src/features/upload/lib/__tests__/parse-xlsx.test.ts` - 6 testes para parse
- `src/features/upload/lib/__tests__/classify.test.ts` - 7 testes para classificacao
- `src/features/upload/lib/__tests__/envio-groups.test.ts` - 9 testes para grupos de envio
- `src/components/ui/badge.tsx` - Componente shadcn badge
- `src/components/ui/separator.tsx` - Componente shadcn separator
- `src/components/ui/alert.tsx` - Componente shadcn alert
- `package.json` - SheetJS, vitest, scripts test/test:watch

## Decisions Made
- COLUMN_MAP convertido de const para comentario JSDoc para evitar lint error no build (variavel declarada mas nao utilizada; mapeamento feito inline na funcao)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] COLUMN_MAP causando lint error no build**
- **Found during:** Task 3 (verificacao final do build)
- **Issue:** COLUMN_MAP declarado como const mas nao utilizado na funcao parseXlsx (mapeamento feito inline)
- **Fix:** Convertido para comentario JSDoc documentando o mapeamento das 13 colunas
- **Files modified:** src/features/upload/lib/parse-xlsx.ts
- **Verification:** npm run build passa sem erros
- **Committed in:** 977a68b (parte do commit Task 3)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessario para build passar. Sem mudanca de escopo.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 3 modulos de logica pura prontos para consumo nos planos 02 (server action), 03 (UI) e 04 (deduplicacao)
- parseXlsx, classifyOrders, classifyEnvio e generateCardKey exportados e testados
- vitest funcional para testes futuros
- shadcn badge/separator/alert prontos para UI do upload

## Self-Check: PASSED

All 11 files verified present. All 5 commits verified in git log.

---
*Phase: 03-upload-e-processamento*
*Completed: 2026-04-05*

---
phase: 03-upload-e-processamento
verified: 2026-04-04T23:40:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Fluxo end-to-end com arquivo .xlsx real do ERP UpSeller"
    expected: "Drag-and-drop -> parse -> preview numerico -> confirmar -> pedidos aparecem no Supabase com card_key, grupo_envio, tipo, importacao_numero corretos"
    why_human: "Requer arquivo .xlsx de producao, autenticacao de usuario lider/admin e conexao ativa com Supabase. Verificacao visual de toda a UI e dos dados gravados no banco nao e possivel programaticamente."
  - test: "Virada de dia limpa banco antes de processar"
    expected: "Ao fazer upload em dia diferente da ultima importacao, config ultima_importacao_data e atualizada e tabelas pedidos/progresso/reservas/atribuicoes sao limpas; trafego_fardos/baixados/fardos_nao_encontrados preservados"
    why_human: "Requer alterar data no banco ou simular virada de dia com conexao Supabase real."
  - test: "Botao Desfazer remove pedidos do banco"
    expected: "Ao clicar Desfazer na ultima importacao, pedidos da importacao desaparecem do Supabase e contador decrementado"
    why_human: "Requer estado real no banco com importacoes existentes e verificacao visual do resultado."
---

# Phase 03: Upload e Processamento — Relatorio de Verificacao

**Phase Goal:** Lider pode importar planilha do ERP e o sistema processa, classifica e persiste todos os pedidos corretamente
**Verificado:** 2026-04-04T23:40:00Z
**Status:** human_needed
**Re-verificacao:** Nao — verificacao inicial

## Resultado do Objetivo

### Verdades Observaveis (ROADMAP Success Criteria)

| # | Verdade | Status | Evidencia |
|---|---------|--------|-----------|
| 1 | Lider faz upload de arquivo .xlsx e o sistema importa apenas pedidos "Em processo", ignorando Full/Fulfillment | VERIFICADO | `parse-xlsx.ts`: filtro `estado !== 'em processo'` (case-insensitive com normalize NFD) e `/full|fulfillment/i`; 26 testes unitarios passando |
| 2 | Pedidos sao classificados automaticamente como Unitario, Kit ou Combo com base em SKU e quantidade | VERIFICADO | `classify.ts`: `classifyOrders` usa `new Set(items.map(i => i.sku))` para SKUs distintos; 1 SKU+qtd=1 -> unitario, 1 SKU+qtd>1 -> kit, 2+ SKUs -> combo; wired em `route.ts` |
| 3 | Pedidos com Numero de Pedido ja existente sao ignorados; linhas com mesmo numero dentro da planilha sao agrupadas | VERIFICADO | `route.ts`: consulta `.in('numero_pedido', chunk)` com chunks de 500; `classifyOrders` agrupa por `numero_pedido` antes de deduplicar |
| 4 | Cada importacao recebe numero sequencial e metodo de envio e classificado nos 6 grupos corretos | VERIFICADO | `route.ts`: numeracao via `config` table (`ultimo_importacao_numero`); `envio-groups.ts`: 6 grupos com TikTok Shop antes de Shopee Xpress; wired em `route.ts` |
| 5 | Upload em dia diferente da ultima importacao limpa o banco antes de processar | VERIFICADO | `route.ts`: compara `dataConfig.valor !== today` com timezone `America/Sao_Paulo`; deleta atribuicoes -> progresso -> reservas -> pedidos; preserva trafego_fardos, baixados, fardos_nao_encontrados |

**Score:** 5/5 verdades verificadas

### Artefatos Obrigatorios

| Artefato | Fornece | Linhas | Status |
|----------|---------|--------|--------|
| `src/features/upload/lib/parse-xlsx.ts` | parseXlsx, ParsedRow, ParseResult | 104 | VERIFICADO |
| `src/features/upload/lib/classify.ts` | classifyOrders, generateCardKey, GroupedOrder | 37 | VERIFICADO |
| `src/features/upload/lib/envio-groups.ts` | classifyEnvio com 6 grupos | 18 | VERIFICADO |
| `src/features/upload/types.ts` | ImportSummary, ImportRecord | 19 | VERIFICADO |
| `vitest.config.ts` | Configuracao vitest com alias '@' para src | 13 | VERIFICADO |
| `app/api/upload/route.ts` | POST handler completo (auth, virada de dia, classify, dedup, persist) | 207 | VERIFICADO |
| `app/api/upload/undo/route.ts` | DELETE handler (auth, deleta ultima importacao) | 66 | VERIFICADO |
| `src/features/upload/hooks/use-upload.ts` | Hook useUpload (state machine completa) | 232 | VERIFICADO |
| `src/features/upload/components/drop-zone.tsx` | DropZone drag-and-drop com 4 estados | 249 | VERIFICADO |
| `src/features/upload/components/import-preview.tsx` | Resumo numerico pre/pos confirmacao | 149 | VERIFICADO |
| `src/features/upload/components/import-list.tsx` | Lista de importacoes do dia | 39 | VERIFICADO |
| `src/features/upload/components/import-list-item.tsx` | Item individual com badges e undo | 91 | VERIFICADO |
| `src/features/upload/components/processing-spinner.tsx` | Overlay spinner com aria-live | 33 | VERIFICADO |
| `src/features/upload/components/upload-client.tsx` | Client wrapper conectando todos os componentes | 74 | VERIFICADO |
| `app/(authenticated)/upload/page.tsx` | Server component com query de importacoes do dia | 52 | VERIFICADO |
| `src/features/upload/lib/__tests__/parse-xlsx.test.ts` | 7 testes unitarios | 7 testes | VERIFICADO |
| `src/features/upload/lib/__tests__/classify.test.ts` | 10 testes unitarios | 10 testes | VERIFICADO |
| `src/features/upload/lib/__tests__/envio-groups.test.ts` | 9 testes unitarios | 9 testes | VERIFICADO |

### Verificacao de Links-Chave

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|----------|
| `parse-xlsx.ts` | `xlsx` (SheetJS) | `import { read, utils } from 'xlsx'` | WIRED | SheetJS 0.20.3 instalado via CDN tgz |
| `classify.ts` | `parse-xlsx.ts` | `import type { ParsedRow }` | WIRED | Linha 1 de classify.ts |
| `route.ts` | `classify.ts` | `import { classifyOrders, generateCardKey }` | WIRED | Linha 4 de route.ts |
| `route.ts` | `envio-groups.ts` | `import { classifyEnvio }` | WIRED | Linha 5 de route.ts |
| `route.ts` | `@/lib/supabase/server` | `import { createClient as createAuthClient }` | WIRED | Auth client separado do service role client |
| `use-upload.ts` | `parse-xlsx.ts` | `import { parseXlsx, type ParseResult }` | WIRED | Linha 5 de use-upload.ts |
| `use-upload.ts` | `/api/upload` | `fetch('/api/upload', { method: 'POST' })` | WIRED | handleConfirm usa fetch com body |
| `use-upload.ts` | `/api/upload/undo` | `fetch('/api/upload/undo', { method: 'DELETE' })` | WIRED | handleUndo usa fetch DELETE |
| `page.tsx` | `upload-client.tsx` | `import { UploadClient }` | WIRED | Linha 3 de page.tsx |
| `upload-client.tsx` | `use-upload.ts` | `import { useUpload }` | WIRED | Linha 3 de upload-client.tsx |

### Rastreamento de Fluxo de Dados (Nivel 4)

| Artefato | Variavel de Dados | Fonte | Dados Reais | Status |
|----------|-------------------|-------|-------------|--------|
| `upload/page.tsx` | `initialImports` | `supabase.from('pedidos').select(...).eq('importacao_data', today)` | Query real ao banco | FLUINDO |
| `use-upload.ts` | `parseResult` | `parseXlsx(buffer)` com `file.arrayBuffer()` | Arquivo real do usuario | FLUINDO |
| `use-upload.ts` | `summary` | `fetch('/api/upload')` -> response.json() | Route handler real | FLUINDO |
| `route.ts` | `records` | `classifyOrders(body.rows)` + `classifyEnvio(...)` | Dados parseados do frontend | FLUINDO |
| `route.ts` | Insert no banco | `supabase.from('pedidos').insert(chunk)` | Service role client com dados reais | FLUINDO |

### Verificacoes de Comportamento (Spot-Checks)

| Comportamento | Comando | Resultado | Status |
|---------------|---------|-----------|--------|
| Todos os 26 testes unitarios passam | `npx vitest run --reporter=verbose` | 3 test files, 26 tests PASSED (131ms) | PASSOU |
| Build de producao compila sem erros | `npm run build` | Build bem-sucedido com chunks gerados | PASSOU |
| SheetJS 0.20.3 instalado | `node -e "require('./package.json').dependencies.xlsx"` | `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` | PASSOU |
| vitest configurado | `node -e "require('./package.json').devDependencies.vitest"` | `^4.1.2` | PASSOU |
| Pagina /upload sem placeholder | Grep por "Fase 3" ou "sera implementado" | Nenhum resultado encontrado | PASSOU |

### Cobertura de Requisitos

| Requisito | Plano | Descricao | Status | Evidencia |
|-----------|-------|-----------|--------|-----------|
| UPLD-01 | 03-02, 03-03, 03-04 | Lider/Admin pode importar arquivo .xlsx do ERP UpSeller | SATISFEITO | Pagina /upload funcional com DropZone, protegida por auth com role check |
| UPLD-02 | 03-01 | Sistema le .xlsx no frontend com SheetJS e mapeia 13 colunas do ERP | SATISFEITO | `parseXlsx` com SheetJS 0.20.3, mapeamento 13 colunas via `col()` normalizado |
| UPLD-03 | 03-01 | Sistema filtra apenas pedidos com status "Em processo" | SATISFEITO | Filtro case-insensitive com normalize NFD em `parse-xlsx.ts` linha 71 |
| UPLD-04 | 03-01 | Sistema ignora pedidos com metodo de envio contendo "Full" ou "Fulfillment" | SATISFEITO | `/full|fulfillment/i` em `parse-xlsx.ts` linha 40 |
| UPLD-05 | 03-01, 03-02 | Sistema classifica Unitario (1 SKU, qtd=1), Kit (1 SKU, qtd>1), Combo (2+ SKUs) | SATISFEITO | `classifyOrders` com `new Set(items.map(i => i.sku))` em `classify.ts` |
| UPLD-06 | 03-02 | Deduplicacao entre importacoes — Nº de Pedido ja no banco e ignorado | SATISFEITO | `.in('numero_pedido', chunk)` com chunking de 500 em `route.ts` |
| UPLD-07 | 03-01, 03-02 | Linhas com mesmo Nº de Pedido dentro da planilha sao agrupadas (Combos/Kits) | SATISFEITO | `classifyOrders` usa Map para agrupar antes de classificar tipo |
| UPLD-08 | 03-02 | Virada de dia limpa banco automaticamente antes de processar | SATISFEITO | Deleta atribuicoes -> progresso -> reservas -> pedidos; preserva 3 tabelas de historico |
| UPLD-09 | 03-02, 03-04 | Cada importacao recebe numero sequencial | SATISFEITO | Config table `ultimo_importacao_numero` incrementado a cada importacao |
| UPLD-10 | 03-01, 03-02 | Sistema classifica metodo de envio nos 6 grupos (TikTok antes de Shopee Xpress) | SATISFEITO | `envio-groups.ts` com `ENVIO_RULES` ordenados: TikTok Shop -> Shopee SPX -> ML Flex -> ML Coleta -> Shein -> Shopee Xpress |

**Todos os 10 requisitos UPLD satisfeitos.**

**Nota sobre UPLD-10:** Durante o plano 04, `envio-groups.ts` foi expandido com mapeamentos adicionais de producao: `iMile BR` -> TikTok Shop, `Entrega Rapida` -> Shopee SPX, `JTB` -> Shein. O grupo `TikTok` foi renomeado para `TikTok Shop`. TikTok ainda e verificado antes de Shopee Xpress (conformidade D-08).

### Anti-Padroes Encontrados

| Arquivo | Linha | Padrao | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `parse-xlsx.ts` | 98-101 | `console.log` de debug (headers, contagens) | INFO | Logs de debug deixados na producao; nao impedem funcionamento |
| `route.ts` | 170-180 | `console.log` e `console.error` de debug extenso | INFO | Logs de debug e diagnostico de erros; util mas pode poluir logs de producao |

Nenhum anti-padrao bloqueante encontrado. Os `console.log` sao informativos e nao afetam a logica de negocio.

### Verificacao Humana Necessaria

#### 1. Fluxo End-to-End com Planilha Real

**Teste:** Fazer login como Lider ou Admin, acessar /upload, arrastar arquivo .xlsx real do ERP UpSeller (com colunas corretas) ou um gerado com as 13 colunas esperadas.

**Esperado:**
- Drop zone exibe "Arraste o arquivo Excel aqui" com botao "Enviar Arquivo"
- Ao soltar o arquivo: mostra nome + tamanho + botao "Processar planilha"
- Ao processar: exibe card "Resumo da importacao" com total de pedidos validos, filtrados por Full/Fulfillment e filtrados por status
- Ao confirmar: spinner "Importando pedidos...", toast "Importacao #1 concluida — X pedidos importados"
- Lista "Importacoes de hoje" aparece com item "#1" + horario + contagem por tipo

**Por que precisa de humano:** Requer arquivo .xlsx de producao e sessao autenticada com conexao Supabase real.

#### 2. Virada de Dia

**Teste:** Modificar manualmente o valor de `ultima_importacao_data` na tabela `config` do Supabase para ontem, depois fazer um novo upload.

**Esperado:** Toast "Virada de dia — pedidos anteriores removidos" aparece antes do toast de sucesso; tabela `pedidos` fica com apenas os pedidos da nova importacao.

**Por que precisa de humano:** Requer acesso direto ao Supabase Dashboard ou SQL para alterar data, mais upload real.

#### 3. Botao Desfazer

**Teste:** Apos uma importacao bem-sucedida, clicar "Desfazer" no item mais recente da lista.

**Esperado:** Confirmacao `window.confirm` aparece; apos confirmar, toast "Importacao #N desfeita", item removido da lista, pedidos desaparecidos do Supabase.

**Por que precisa de humano:** Requer estado real no banco com importacoes existentes.

### Resumo dos Gaps

Nenhum gap tecnico encontrado. Todos os artefatos existem, sao substanciais, estao conectados e o fluxo de dados e real (sem stubs ou dados hardcoded).

Os 3 itens de verificacao humana sao necessarios para confirmar o comportamento end-to-end com dados reais e conexao Supabase ativa. Eles foram parcialmente validados durante o checkpoint interativo do Plan 04 (planilha de producao com 9125 linhas, 12 pedidos validos — conforme SUMMARY 03-04), mas a verificacao formal programatica nao e possivel sem executar o servidor.

---

*Verificado: 2026-04-04T23:40:00Z*
*Verificador: Claude (gsd-verifier)*

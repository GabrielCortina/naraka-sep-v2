# Phase 4: Estoque e Reserva de Fardos - Research

**Researched:** 2026-04-05
**Domain:** Algoritmo subset sum, integracao Google Sheets API, reserva de estoque com Supabase
**Confidence:** HIGH

## Summary

Esta fase conecta o sistema de upload (Phase 3) ao estoque externo via Google Sheets API e implementa reserva automatica de fardos usando algoritmo subset sum com margem de 20%. O fluxo e: apos upload persistir pedidos, o backend le a planilha de estoque, calcula demanda por SKU por importacao, executa subset sum para cada SKU que tem fardos disponiveis, e persiste reservas no Supabase.

A infraestrutura de Google Sheets API ja existe (`src/lib/google-sheets.ts` com `getSheetData`). A tabela `reservas` existe mas precisa de migration para trocar o schema de `pedido_id` para `sku` + `fardo_id` (conforme D-09). O Route Handler de upload (`app/api/upload/route.ts`) precisa ser estendido para chamar a logica de reserva apos o insert de pedidos.

**Recomendacao principal:** Implementar o algoritmo subset sum como funcao pura isolada em `src/features/fardos/utils/subset-sum.ts`, com cache de estoque em Map simples no servidor, e migration SQL para alterar a tabela `reservas`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Reserva automatica apos upload -- Route Handler de upload, apos persistir pedidos, le estoque e executa reserva automaticamente
- **D-02:** Botao de re-reserva manual na tela de fardos -- modo complementar, so tenta reservar SKUs sem reserva suficiente
- **D-03:** Retry 3x com backoff se Google Sheets indisponivel -- se falhar, salva pedidos sem reserva. Toast + aviso no resumo
- **D-04:** Visao global de reservas entre importacoes -- 2a importacao ve fardos ja reservados pela 1a
- **D-05:** Cache de estoque por 2 minutos em memoria no servidor
- **D-06:** Regra fardo vs prateleira: se o SKU tem fardo fisico disponivel no estoque externo, vai para lista de fardos. Se nao tem fardo, vai para prateleira. Quantidade de fardos e irrelevante
- **D-07:** Demanda do SKU agregada por importacao
- **D-08:** Se fardos nao cobrem demanda total, reserva o que tem e a diferenca vai para prateleira como item livre
- **D-09:** Reserva vinculada ao SKU puro -- schema: fardo_id (codigo_in) + sku + qtd_reservada + status. Sem FK para pedido. Migration necessaria
- **D-10:** Preferencia por cima: soma >= demanda e soma <= demanda * 1.20. Se nao cobrir dentro de 20%, pega melhor combinacao disponivel
- **D-11:** Criterio de desempate: menos fardos fisicos
- **D-12:** Volume esperado: 20-50 fardos por SKU -- programacao dinamica ou subset sum com poda
- **D-13:** Algoritmo roda no servidor (Route Handler)
- **D-14:** Resumo no card de importacao -- secao de estoque: X SKUs com fardo, Y SKUs para prateleira, Z fardos reservados total
- **D-15:** Indicador de cobertura parcial -- icone de aviso + contagem
- **D-16:** Se estoque indisponivel, secao mostra aviso orientando usar re-reserva

### Claude's Discretion
- Implementacao exata do cache (in-memory Map, LRU, etc.)
- Estrategia de backoff do retry (exponencial, linear)
- Layout exato da secao de estoque no card de resumo
- Estrutura interna dos componentes e Route Handlers
- Escolha exata do algoritmo (DP tabular, branch-and-bound, etc.)
- Design do botao "Atualizar Reservas" na tela de fardos

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STOK-01 | Sistema le planilha externa de estoque via Google Sheets API no momento do upload | `getSheetData("Estoque")` ja existe; estender upload route handler; retry com backoff (D-01, D-03) |
| STOK-02 | Sistema identifica fardos disponiveis (codigo IN, SKU, quantidade, endereco) | Parser de rows da planilha mapeando colunas SKU, QUANTIDADE, CODIGO UPSELLER, ENDERECO |
| STOK-03 | SKU com >= 50 pecas no dia vai para lista de fardos | **CORRIGIDO por D-06:** regra real e por disponibilidade de fardo no estoque externo, nao por quantidade |
| STOK-04 | SKU com < 50 pecas no dia vai para lista de prateleira | **CORRIGIDO por D-06:** SKU sem fardo disponivel vai para prateleira |
| STOK-05 | Reserva de fardos usa algoritmo subset sum com margem maxima de 20% | Algoritmo DP com preferencia por cima (D-10), desempate por menos fardos (D-11) |
| STOK-06 | Cada fardo fisico (codigo IN) so pode ser reservado uma vez globalmente | Consulta reservas existentes no banco + UNIQUE constraint em codigo_in na tabela reservas (D-04) |
| STOK-07 | Se nao cobrir dentro de 20%, reserva o maximo disponivel | Fallback do algoritmo: melhor combinacao abaixo da demanda; diferenca vai para prateleira (D-08, D-10) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| googleapis | 171.4.0 | Google Sheets API para leitura do estoque | Ja instalado e em uso no projeto [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | Persistencia de reservas e leitura de pedidos | Ja instalado e em uso no projeto [VERIFIED: package.json] |
| Next.js | 14.2.35 | Route Handlers para logica server-side | Ja instalado, padrao do projeto [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.2 | Testes unitarios do algoritmo subset sum | Ja configurado no projeto [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast de feedback (sucesso/falha da reserva) | Ja instalado e em uso [VERIFIED: package.json] |

### Alternatives Considered
Nenhuma -- toda a stack necessaria ja esta instalada no projeto. Nao ha necessidade de novas dependencias.

**Instalacao:** Nenhuma nova dependencia necessaria.

## Architecture Patterns

### Recommended Project Structure
```
src/features/fardos/
  utils/
    subset-sum.ts           # Algoritmo puro (sem side effects)
    stock-parser.ts         # Parser das rows da planilha de estoque
    stock-cache.ts          # Cache in-memory com TTL de 2 minutos
    reservation-engine.ts   # Orquestrador: le estoque, calcula demanda, executa reserva
  types.ts                  # Tipos: StockItem, ReservationResult, etc.

app/api/
  upload/route.ts           # Estender: chamar reserva apos insert de pedidos
  reservas/
    route.ts                # POST: re-reserva manual (botao "Atualizar Reservas")

supabase/migrations/
  00003_alter_reservas_schema.sql  # Migration: trocar pedido_id por sku puro
```

### Pattern 1: Funcao Pura para Subset Sum
**O que:** O algoritmo subset sum e uma funcao pura que recebe array de fardos (cada um com quantidade) e demanda total, retorna a combinacao otima.
**Quando usar:** Sempre que precisar calcular a melhor combinacao de fardos.
**Exemplo:**
```typescript
// src/features/fardos/utils/subset-sum.ts
interface Fardo {
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string
}

interface SubsetResult {
  fardos: Fardo[]
  soma: number
  cobertura: 'total' | 'parcial' | 'nenhuma'
}

/**
 * Encontra a melhor combinacao de fardos para atender a demanda.
 * 
 * Prioridade (D-10, D-11, especificos do CONTEXT):
 * 1. Soma exata (== demanda) -- preferida mesmo com mais fardos
 * 2. Soma por cima dentro de 20% (>= demanda e <= demanda * 1.20) -- mais proxima da demanda
 * 3. Soma por cima acima de 20% -- nao aceita, cai para opcao abaixo
 * 4. Melhor soma abaixo da demanda -- cobertura parcial
 * 
 * Desempate: quando soma de pecas e igual, preferir menos fardos.
 */
export function findOptimalCombination(
  fardos: Fardo[],
  demanda: number
): SubsetResult {
  // ... implementacao DP
}
```

### Pattern 2: Cache In-Memory com TTL
**O que:** Map simples no escopo do modulo com timestamp de expiracao. [ASSUMED]
**Quando usar:** Para evitar chamadas repetidas a API do Google em operacoes proximas (D-05).
**Exemplo:**
```typescript
// src/features/fardos/utils/stock-cache.ts
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutos

interface CacheEntry<T> {
  data: T
  expires: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}
```

**Nota sobre Vercel:** Em producao no Vercel (serverless), cada invocacao pode rodar em instancias diferentes, entao o cache in-memory nao persiste entre requests de diferentes instancias. Porem, para o caso de uso descrito (operacoes proximas tipo upload seguido de re-reserva no mesmo segundo), funciona porque a mesma instancia atende requests proximos no tempo. [ASSUMED]

### Pattern 3: Retry com Backoff Exponencial
**O que:** Wrapper generico de retry para chamadas Google Sheets API. [ASSUMED]
**Quando usar:** Toda chamada a Google Sheets API deve passar pelo retry (D-03).
**Exemplo:**
```typescript
// src/features/fardos/utils/stock-parser.ts (ou utils generico)
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      const delay = baseDelay * Math.pow(2, attempt) // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}
```

### Pattern 4: Migration SQL para Alterar Reservas
**O que:** A tabela `reservas` atual tem `pedido_id UUID NOT NULL REFERENCES pedidos(id)`. Conforme D-09, precisa trocar para `sku` puro sem FK para pedido.
**Exemplo:**
```sql
-- 00003_alter_reservas_schema.sql
-- Remover FK e coluna pedido_id, adicionar importacao_numero para rastreabilidade
ALTER TABLE reservas DROP CONSTRAINT reservas_pedido_id_fkey;
ALTER TABLE reservas DROP COLUMN pedido_id;

ALTER TABLE reservas ADD COLUMN importacao_numero INTEGER;

-- Garantir unicidade: cada fardo (codigo_in) so pode ser reservado uma vez
ALTER TABLE reservas ADD CONSTRAINT reservas_codigo_in_unique UNIQUE (codigo_in)
  WHERE (status = 'reservado');

-- Index para busca por SKU
CREATE INDEX idx_reservas_sku ON reservas(sku);
```

**Nota:** O UNIQUE condicional (`WHERE status = 'reservado'`) impede que o mesmo fardo seja reservado duas vezes enquanto ativo, mas permite re-uso se cancelado. Se PostgreSQL nao suportar UNIQUE parcial diretamente no ALTER, usar CREATE UNIQUE INDEX com WHERE clause. [VERIFIED: PostgreSQL suporta partial unique indexes via `CREATE UNIQUE INDEX ... WHERE condition`]

### Anti-Patterns to Avoid
- **Subset sum no frontend:** O algoritmo DEVE rodar no servidor (D-13). Nunca enviar lista de fardos para o cliente calcular.
- **Reserva por pedido_id:** A reserva e por SKU puro (D-09), nao vinculada a pedido individual. Um fardo pode atender multiplos cards.
- **Polling do estoque:** Proibido pelo projeto (Supabase subscriptions obrigatorio). O estoque e lido sob demanda (upload ou re-reserva), nao em polling.
- **Chamar Google Sheets sem retry:** Toda chamada deve ter retry 3x com backoff (D-03).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Leitura do Google Sheets | Cliente HTTP manual | `getSheetData("Estoque")` ja existente em `src/lib/google-sheets.ts` | Ja autenticado, testado, e configurado |
| Client Supabase admin | createClient manual | `supabaseAdmin` de `src/lib/supabase/admin.ts` | Ja configurado com service role key |
| Toast de feedback | Alert manual | `toast()` do `sonner` via `src/components/ui/sonner.tsx` | Padrao do projeto |
| UUID generation | Manual | `gen_random_uuid()` do PostgreSQL (default na tabela) | Garantia de unicidade |

**Key insight:** Toda a infraestrutura de I/O ja existe. O trabalho desta fase e logica pura (algoritmo + orquestracao) e uma migration SQL.

## Common Pitfalls

### Pitfall 1: Reserva Duplicada de Fardo Fisico
**O que da errado:** Duas importacoes simultaneas reservam o mesmo fardo porque a segunda nao ve as reservas da primeira.
**Por que acontece:** Race condition entre leitura de reservas existentes e insert de novas.
**Como evitar:** (1) UNIQUE constraint parcial no `codigo_in` com `WHERE status = 'reservado'`. (2) Ao calcular fardos disponiveis, SEMPRE excluir os ja reservados no banco (D-04). (3) Tratar erro de unique violation como "fardo ja reservado" e pular.
**Sinais de alerta:** Erro 23505 (unique_violation) do PostgreSQL no insert de reservas.

### Pitfall 2: Timeout do Algoritmo Subset Sum
**O que da errado:** Com 50 fardos por SKU (D-12), subset sum ingenuamente e O(2^50) -- impossivel.
**Por que acontece:** Implementacao bruta sem poda ou DP.
**Como evitar:** Usar DP com programacao dinamica baseada na soma-alvo (demanda * 1.20). A tabela DP tem dimensao `n_fardos x soma_maxima`. Com 50 fardos e quantidades tipicas de centenas, a tabela e gerenciavel. Alternativamente, branch-and-bound com poda por limite superior.
**Sinais de alerta:** Route handler levando mais de 5 segundos para responder.

### Pitfall 3: Colunas Erradas na Planilha de Estoque
**O que da errado:** A planilha tem colunas em posicoes inesperadas ou nomes ligeiramente diferentes.
**Por que acontece:** A planilha e alimentada por automacao externa e pode mudar.
**Como evitar:** Mapear colunas por nome do header (primeira linha), nao por indice fixo. Validar que as 4 colunas obrigatorias existem antes de processar. Se faltar coluna, logar erro e retornar estoque vazio (graceful degradation, pedidos vao para prateleira).
**Sinais de alerta:** Fardos com SKU/quantidade/endereco undefined ou NaN.

### Pitfall 4: Estoque Nao Atualizado (Stale Cache)
**O que da errado:** Lider importa, estoque e cacheado, estoque externo atualiza, re-reserva usa dados velhos.
**Por que acontece:** Cache de 2 minutos (D-05) nao expira rapido o suficiente.
**Como evitar:** O botao "Atualizar Reservas" (D-02) deve invalidar o cache antes de re-executar. O TTL de 2 minutos cobre apenas operacoes muito proximas (upload imediato seguido de outra acao).
**Sinais de alerta:** Re-reserva retorna mesmos resultados apos estoque externo ter mudado.

### Pitfall 5: Virada de Dia e Reservas Orfas
**O que da errado:** Virada de dia limpa `reservas` (via DELETE CASCADE de pedidos), mas Phase 3 ja faz isso. Se a migration trocar para SKU puro sem FK, o CASCADE nao funciona mais.
**Por que acontece:** A migration remove a FK `pedido_id`, entao `ON DELETE CASCADE` de pedidos nao apaga reservas automaticamente.
**Como evitar:** Na virada de dia (upload route.ts linha 58), APOS remover reservas explicitamente antes de pedidos. O codigo atual ja faz `supabase.from('reservas').delete().neq('id', '')` antes de `pedidos`. Garantir que essa ordem se mantenha apos a migration.
**Sinais de alerta:** Reservas de dias anteriores aparecendo apos virada de dia.

## Code Examples

### Leitura e Parse do Estoque Externo
```typescript
// src/features/fardos/utils/stock-parser.ts
import { getSheetData } from '@/lib/google-sheets'
import { getCached, setCache } from './stock-cache'
import type { StockItem } from '../types'

const STOCK_CACHE_KEY = 'estoque'

// Colunas esperadas da planilha de estoque (por nome do header)
const COLUMN_MAP = {
  sku: 'SKU',
  quantidade: 'QUANTIDADE',
  codigo_in: 'CODIGO UPSELLER', // tambem chamado "codigo IN" ou "fardo ID"
  endereco: 'ENDERECO',
} as const

export async function fetchStock(): Promise<StockItem[]> {
  // Tentar cache primeiro
  const cached = getCached<StockItem[]>(STOCK_CACHE_KEY)
  if (cached) return cached

  const rows = await withRetry(() => getSheetData('Estoque'))
  if (!rows || rows.length < 2) return []

  // Mapear headers por nome
  const headers = rows[0].map((h: string) => h?.toString().trim().toUpperCase())
  const colIndex = {
    sku: headers.indexOf(COLUMN_MAP.sku),
    quantidade: headers.indexOf(COLUMN_MAP.quantidade),
    codigo_in: headers.indexOf(COLUMN_MAP.codigo_in),
    endereco: headers.indexOf(COLUMN_MAP.endereco),
  }

  // Validar colunas obrigatorias
  const missing = Object.entries(colIndex)
    .filter(([, idx]) => idx === -1)
    .map(([name]) => name)
  if (missing.length > 0) {
    console.error(`[estoque] Colunas faltando: ${missing.join(', ')}`)
    return []
  }

  const items: StockItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const codigo_in = row[colIndex.codigo_in]?.toString().trim()
    const sku = row[colIndex.sku]?.toString().trim()
    const quantidade = Number(row[colIndex.quantidade])
    const endereco = row[colIndex.endereco]?.toString().trim() ?? ''

    if (!codigo_in || !sku || !quantidade || isNaN(quantidade)) continue

    items.push({ codigo_in, sku, quantidade, endereco })
  }

  setCache(STOCK_CACHE_KEY, items)
  return items
}
```

### Orquestrador de Reserva
```typescript
// src/features/fardos/utils/reservation-engine.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchStock } from './stock-parser'
import { findOptimalCombination } from './subset-sum'
import type { ReservationResult } from '../types'

export async function executeReservation(
  importacao_numero: number
): Promise<ReservationResult> {
  // 1. Ler estoque externo
  const stock = await fetchStock()

  // 2. Calcular demanda por SKU desta importacao
  const { data: pedidos } = await supabaseAdmin
    .from('pedidos')
    .select('sku, quantidade')
    .eq('importacao_numero', importacao_numero)

  if (!pedidos || pedidos.length === 0) {
    return { skus_fardo: 0, skus_prateleira: 0, fardos_reservados: 0, parciais: [] }
  }

  const demandaPorSku = new Map<string, number>()
  for (const p of pedidos) {
    demandaPorSku.set(p.sku, (demandaPorSku.get(p.sku) ?? 0) + p.quantidade)
  }

  // 3. Buscar reservas existentes (D-04: visao global)
  const { data: reservasExistentes } = await supabaseAdmin
    .from('reservas')
    .select('codigo_in')
    .eq('status', 'reservado')

  const fardosJaReservados = new Set(
    (reservasExistentes ?? []).map(r => r.codigo_in)
  )

  // 4. Filtrar fardos disponiveis por SKU (excluindo ja reservados)
  const stockPorSku = new Map<string, typeof stock>()
  for (const item of stock) {
    if (fardosJaReservados.has(item.codigo_in)) continue
    const arr = stockPorSku.get(item.sku) ?? []
    arr.push(item)
    stockPorSku.set(item.sku, arr)
  }

  // 5. Para cada SKU com demanda, tentar reservar
  let skus_fardo = 0
  let skus_prateleira = 0
  let fardos_reservados = 0
  const parciais: string[] = []

  for (const [sku, demanda] of demandaPorSku) {
    const fardosDisponiveis = stockPorSku.get(sku)

    if (!fardosDisponiveis || fardosDisponiveis.length === 0) {
      // D-06: sem fardo disponivel -> prateleira
      skus_prateleira++
      continue
    }

    // D-06: tem fardo -> tenta reservar
    const resultado = findOptimalCombination(fardosDisponiveis, demanda)

    if (resultado.cobertura === 'nenhuma') {
      skus_prateleira++
      continue
    }

    // Persistir reservas
    const reservas = resultado.fardos.map(f => ({
      codigo_in: f.codigo_in,
      sku: f.sku,
      quantidade: f.quantidade,
      endereco: f.endereco,
      status: 'reservado' as const,
      importacao_numero,
    }))

    const { error } = await supabaseAdmin.from('reservas').insert(reservas)
    if (error) {
      console.error(`[reserva] Erro ao reservar SKU ${sku}:`, error)
      continue
    }

    skus_fardo++
    fardos_reservados += resultado.fardos.length

    if (resultado.cobertura === 'parcial') {
      parciais.push(sku)
    }
  }

  return { skus_fardo, skus_prateleira, fardos_reservados, parciais }
}
```

### Extensao da Resposta do Upload
```typescript
// Adicionar ao retorno do POST /api/upload (apos insert de pedidos):
// A resposta deve incluir secao de estoque para o card de resumo (D-14, D-15, D-16)
interface UploadApiResponse {
  success: boolean
  dayReset: boolean
  importacao_numero: number
  summary: ImportSummary
  estoque?: {
    skus_fardo: number
    skus_prateleira: number
    fardos_reservados: number
    parciais: string[]     // SKUs com cobertura parcial (D-15)
    indisponivel: boolean  // true se Google Sheets falhou (D-16)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reserva por pedido_id com FK | Reserva por SKU puro sem FK (D-09) | Decisao desta fase | Migration necessaria na tabela reservas |
| Regra >= 50 pecas para fardos | Regra por disponibilidade de fardo (D-06) | Corrigido na discussao | STOK-03/STOK-04 no REQUIREMENTS.md desatualizados |

**Nota:** Os requisitos STOK-03 e STOK-04 no REQUIREMENTS.md mencionam ">= 50 pecas" mas a regra real (confirmada pelo usuario na discussao) e por disponibilidade de fardo. O CONTEXT.md D-06 e a fonte de verdade.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cache in-memory com Map simples funciona no Vercel serverless para requests proximos | Architecture Patterns | Cache nunca funciona e toda chamada vai para Google Sheets -- funcional mas mais lento |
| A2 | Colunas da planilha de estoque sao SKU, QUANTIDADE, CODIGO UPSELLER, ENDERECO (uppercase) | Code Examples | Parser falha e todos os SKUs vao para prateleira -- precisa validar nomes exatos com usuario |
| A3 | Backoff exponencial (1s, 2s, 4s) e suficiente para retry da Google Sheets API | Architecture Patterns | Se Google Sheets demora mais, 3 retries nao bastam -- baixo risco, configurable |
| A4 | PostgreSQL partial unique index funciona com Supabase migrations | Architecture Patterns | Se nao funcionar, precisa de trigger ou check no application code |

## Open Questions

1. **Nomes exatos das colunas na planilha de estoque**
   - O que sabemos: PROJECT.md diz "SKU, QUANTIDADE, CODIGO UPSELLER (codigo IN / fardo ID), ENDERECO"
   - O que esta incerto: se os nomes sao exatamente esses ou tem acentos/espacos diferentes
   - Recomendacao: Parser deve mapear por header da primeira linha e ser case-insensitive com trim

2. **Campo `importacao_numero` na tabela reservas**
   - O que sabemos: D-09 diz schema e `fardo_id (codigo_in) + sku + qtd_reservada + status`
   - O que esta incerto: se devemos adicionar `importacao_numero` para rastreabilidade ou se a reserva e completamente desvinculada de importacao
   - Recomendacao: Adicionar `importacao_numero` como campo opcional (nullable) para debug e re-reserva complementar (D-02 precisa saber quais importacoes ja tem reserva)

3. **Tipo exato do partial unique index**
   - O que sabemos: Precisa garantir que cada `codigo_in` so apareca uma vez com `status = 'reservado'`
   - O que esta incerto: Se Supabase migrations suportam `CREATE UNIQUE INDEX ... WHERE ...` sem problemas
   - Recomendacao: Testar na migration; se falhar, usar check no application code

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STOK-01 | Le planilha de estoque via Google Sheets API | integration (mock) | `npx vitest run src/features/fardos/utils/__tests__/stock-parser.test.ts -t "fetch stock"` | Wave 0 |
| STOK-02 | Identifica fardos disponiveis com 4 campos | unit | `npx vitest run src/features/fardos/utils/__tests__/stock-parser.test.ts -t "parse stock"` | Wave 0 |
| STOK-03 | SKU com fardo disponivel vai para fardos (regra corrigida D-06) | unit | `npx vitest run src/features/fardos/utils/__tests__/reservation-engine.test.ts -t "fardo vs prateleira"` | Wave 0 |
| STOK-04 | SKU sem fardo vai para prateleira (regra corrigida D-06) | unit | `npx vitest run src/features/fardos/utils/__tests__/reservation-engine.test.ts -t "sem fardo"` | Wave 0 |
| STOK-05 | Subset sum encontra combinacao otima com margem 20% | unit | `npx vitest run src/features/fardos/utils/__tests__/subset-sum.test.ts` | Wave 0 |
| STOK-06 | Fardo fisico reservado uma vez globalmente | unit | `npx vitest run src/features/fardos/utils/__tests__/reservation-engine.test.ts -t "unicidade"` | Wave 0 |
| STOK-07 | Se nao cobrir dentro de 20%, reserva o maximo | unit | `npx vitest run src/features/fardos/utils/__tests__/subset-sum.test.ts -t "parcial"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/fardos/utils/__tests__/subset-sum.test.ts` -- cobre STOK-05, STOK-07
- [ ] `src/features/fardos/utils/__tests__/stock-parser.test.ts` -- cobre STOK-01, STOK-02
- [ ] `src/features/fardos/utils/__tests__/reservation-engine.test.ts` -- cobre STOK-03, STOK-04, STOK-06

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim (ja implementado) | getUser() + role check no Route Handler (padrao Phase 2/3) |
| V3 Session Management | nao | -- |
| V4 Access Control | sim | Apenas admin/lider podem executar upload/reserva (check existente no upload route) |
| V5 Input Validation | sim | Validar dados da planilha de estoque (tipos, ranges, campos obrigatorios) |
| V6 Cryptography | nao | -- |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injecao via dados da planilha de estoque | Tampering | Sanitizar/validar tipos ao parsear rows; usar parametrized queries do Supabase |
| Reserva duplicada por race condition | Elevation of Privilege | UNIQUE constraint parcial no banco + tratamento de unique_violation |
| Bypass de autorizacao no endpoint de re-reserva | Spoofing | Mesma verificacao auth + role do upload route (getUser + role check) |

## Sources

### Primary (HIGH confidence)
- `app/api/upload/route.ts` -- Route handler de upload existente, padrao para extensao
- `src/lib/google-sheets.ts` -- Funcoes getSheetData, updateSheetData ja prontas
- `supabase/migrations/00001_initial_schema.sql` -- Schema atual da tabela reservas (pedido_id com FK)
- `src/types/database.types.ts` -- Tipos gerados do Supabase, tabela reservas com pedido_id
- `.planning/phases/04-estoque-e-reserva-de-fardos/04-CONTEXT.md` -- Decisoes D-01 a D-16 do usuario
- `.planning/PROJECT.md` -- Google Sheet ID e colunas da planilha de estoque
- `package.json` -- Versoes verificadas de todas as dependencias

### Secondary (MEDIUM confidence)
- PostgreSQL partial unique indexes -- documentacao oficial PostgreSQL [ASSUMED: funciona com Supabase migrations]

### Tertiary (LOW confidence)
- Nenhuma

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- toda a stack ja esta instalada e verificada no package.json
- Architecture: HIGH -- padroes seguem exatamente o que Phase 3 estabeleceu (Route Handlers, feature-based structure, supabaseAdmin)
- Pitfalls: HIGH -- baseados em analise direta do codigo existente e das decisoes do usuario
- Algoritmo subset sum: MEDIUM -- logica algortimica e bem compreendida mas implementacao especifica precisa de testes

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack estavel, sem mudancas esperadas)

# Phase 6: Lista de Fardos - Research

**Researched:** 2026-04-05
**Domain:** UI de lista de fardos com acoes OK/N/E, integracao Google Sheets, PDF, realtime Supabase
**Confidence:** HIGH

## Summary

Esta fase substitui a tela de fardos atual (que usa KanbanBoard da Phase 5) por uma lista plana dedicada. O fardista interage com botoes OK (encontrado) e N/E (nao encontrado), enquanto o lider atribui fardistas em lote via checkboxes. A complexidade principal esta nos fluxos OK e N/E: OK envolve operacao transacional entre Google Sheets (leitura + apagamento de colunas) e Supabase (insercao em trafego_fardos com todos os campos da planilha); N/E envolve busca de fardo alternativo (reutilizando subset-sum para importacao normal ou busca simples para cascata) e, se nao encontrar, cancelamento de reserva + liberacao para prateleira.

O codebase ja fornece todas as pecas fundamentais: `fetchStock` com normalizacao NFD, `findOptimalCombination` para subset sum, `clearSheetRange` para apagar colunas, `AssignModal` para atribuicao, `useCardsRealtime` para subscricoes, e `jsPDF` + `jspdf-autotable` para geracao de PDF. A tabela `trafego_fardos` precisa de migration para adicionar campos da planilha de estoque (prioridade, prateleira, posicao, altura, etc.).

A tela e a unica no sistema que escreve E apaga na planilha externa de estoque, exigindo dupla verificacao antes de qualquer operacao destrutiva. O padrao de API route ja esta consolidado: `createClient()` -> `getUser()` -> role check via admin DB -> operacao com `supabaseAdmin`.

**Primary recommendation:** Dividir em 3 planos: (1) Migration DB + API routes OK/N/E + Sincronizar Estoque, (2) UI da lista plana com filtros/busca/contadores + atribuicao em lote, (3) PDF + polimento visual.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Tela de fardos e uma LISTA PLANA dedicada — NAO usa KanbanBoard, NAO agrupa por card
- D-02: Cada fardo e uma linha/card branco com borda lateral esquerda azul, fundo geral cinza claro
- D-03: Layout horizontal compacto com SKU bold, codigo IN, endereco com pin verde, badge de status, quantidade "CONTEM", botoes OK/N/E
- D-04: Lider/admin ve TODOS os fardos com checkboxes; D-05: Fardista ve APENAS seus fardos sem checkboxes
- D-06 a D-12: Header com busca por codigo IN, filtros por status/atribuicao, contadores, "Selecionar Todos", ordenacao, botao "Sincronizar Estoque"
- D-13: Ordem padrao por endereco (A-Z) para otimizar rota do fardista
- D-14 a D-19: Fluxo OK — sem confirmacao, busca na planilha por CODIGO UPSELLER (match exato, trim+toLowerCase, NFD), copia linha para trafego_fardos, apaga colunas F+ preservando A-E, tratamento transacional
- D-20 a D-22: Fluxo N/E — importacao normal usa 20% margem (subset sum), cascata aceita qualquer fardo; se encontrou alternativo reserva novo; se nao encontrou registra em fardos_nao_encontrados, cancela reserva, libera prateleira
- D-23 a D-25: Atribuicao em lote com barra flutuante, AssignModal reutilizado, checkboxes so para lider/admin
- D-26 a D-28: PDF imprime selecionados ou todos, conteudo com codigo IN/SKU/endereco/quantidade/separador, botao no header
- D-29 a D-30: Realtime com animacao suave, toast, spinner no botao, prevencao de clique duplo
- D-31: Migration para trafego_fardos — adicionar prioridade, prateleira, posicao, altura, data_entrada, hora_entrada, operador, transferencia, data_transferencia, operador_transferencia, fardista_nome, clicked_at

### Claude's Discretion
- Implementacao exata dos filtros (tabs vs chips vs dropdown)
- Animacao especifica da transicao de status
- Layout exato do PDF (fontes, espacamento, margens)
- Estrutura interna dos componentes e Route Handlers
- Debounce/throttle do campo de busca
- Design exato da barra flutuante de selecao

### Deferred Ideas (OUT OF SCOPE)
- Phase 8 (Baixa) — limpeza de colunas F+ agora acontece no OK da Phase 6, Phase 8 foca em scanner/confirmacao/remover trafego/liberar prateleira
- Phase 7 (Prateleira) — efeito visual do N/E na prateleira e Phase 7, mas logica backend (cancelar reserva + update progresso) e implementada aqui
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FARD-01 | Fardista ve lista de fardos agrupados por card com info: endereco, codigo IN, SKU, quantidade | Lista plana com dados da tabela reservas JOIN pedidos; layout D-01 a D-05 |
| FARD-02 | Fardista pode marcar fardo como OK (encontrado, entra no trafego) | API route /api/fardos/ok com fluxo D-14 a D-19; fetchStock + getSheetData + clearSheetRange + insert trafego_fardos |
| FARD-03 | Fardista pode marcar fardo como N/E — sistema busca alternativo; se nao achar, libera linha na prateleira | API route /api/fardos/ne com fluxo D-20 a D-22; findOptimalCombination para alternativo, cancel reserva + update progresso |
| FARD-04 | Lista de fardos atualiza em tempo real via Supabase subscription | useCardsRealtime ja escuta reservas e trafego_fardos; D-29 |
| FARD-05 | Lider pode atribuir fardistas a cards de fardos | AssignModal reutilizado com filterRole='fardista'; API /api/cards/assign ja suporta tipo='fardista'; D-23 a D-25 para atribuicao em lote |
| FARD-06 | Botao "Imprimir Fardos" gera PDF com codigo IN, SKU, endereco, quantidade, para quem entregar | jsPDF + jspdf-autotable; adaptar pdf-generator existente; D-26 a D-28 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | Framework, API routes, server components | Stack locked (CLAUDE.md) [VERIFIED: package.json] |
| @supabase/supabase-js | 2.101.1 | DB queries, realtime subscriptions | Stack locked [VERIFIED: package.json] |
| @supabase/ssr | 0.10.0 | Server-side Supabase client | Stack locked [VERIFIED: package.json] |
| googleapis | 171.4.0 | Google Sheets API (leitura/escrita/apagamento) | Stack locked [VERIFIED: package.json] |
| jsPDF | 4.2.1 | Geracao de PDF no cliente | Ja instalado, usado na Phase 5 [VERIFIED: package.json] |
| jspdf-autotable | 5.0.7 | Tabelas formatadas no PDF | Ja instalado, usado na Phase 5 [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.7.0 | Icones (MapPin, Check, X, Printer, Search, Filter) | UI da lista [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast de feedback ("Fardo IN-4421 encontrado") | Feedback pos-acao [VERIFIED: package.json] |
| tailwind-merge + clsx | 3.5.0 / 2.1.1 | Merge de classes CSS condicionais | Estilizacao condicional por status [VERIFIED: package.json] |
| @radix-ui/react-dialog | 1.1.15 | AssignModal | Ja usado na Phase 5 [VERIFIED: package.json] |

### Alternatives Considered
Nenhuma — todo o stack ja esta definido e instalado. Nao ha novas dependencias necessarias.

## Architecture Patterns

### Estrutura de Arquivos Recomendada
```
src/
├── features/fardos/
│   ├── components/
│   │   ├── fardos-list.tsx           # Lista principal (client component)
│   │   ├── fardo-item.tsx            # Linha individual do fardo
│   │   ├── fardos-header.tsx         # Header com busca, filtros, contadores
│   │   ├── fardos-selection-bar.tsx  # Barra flutuante de selecao
│   │   └── fardos-pdf.ts            # Gerador de PDF adaptado
│   ├── hooks/
│   │   └── use-fardos-data.ts       # Hook para buscar/filtrar dados de fardos
│   ├── types.ts                     # (existente) StockItem, SubsetResult, etc.
│   └── utils/
│       ├── reservation-engine.ts    # (existente) reutilizar para Sincronizar Estoque
│       ├── subset-sum.ts            # (existente) reutilizar para busca de alternativo
│       ├── stock-parser.ts          # (existente) reutilizar fetchStock
│       └── stock-cache.ts           # (existente) cache de 2min
├── app/
│   ├── (authenticated)/fardos/
│   │   ├── page.tsx                 # (existente) server component com auth
│   │   └── fardos-client.tsx        # (existente) SUBSTITUIR conteudo
│   └── api/fardos/
│       ├── ok/route.ts              # NOVO: fluxo OK (busca planilha + insert trafego + clear)
│       ├── ne/route.ts              # NOVO: fluxo N/E (busca alternativo ou libera prateleira)
│       ├── sync/route.ts            # NOVO: Sincronizar Estoque (reutiliza executeReservation)
│       └── list/route.ts            # NOVO: listar fardos reservados (JOIN reservas + pedidos + atribuicoes)
```

### Pattern 1: Fluxo OK Transacional
**What:** Operacao de 3 passos com rollback parcial
**When to use:** Quando fardista clica OK em um fardo
**Example:**
```typescript
// Source: decisoes D-14 a D-18 do CONTEXT.md
// 1. Buscar fardo na planilha (match exato por CODIGO UPSELLER)
const rows = await getSheetData('Estoque')
const rowIndex = findRowByCodigoIn(rows, codigoIn) // trim().toLowerCase() + NFD
if (rowIndex === -1) return { error: 'Fardo nao encontrado na planilha', status: 404 }

// 2. Inserir no trafego_fardos com TODOS os campos
const { error: insertError } = await supabaseAdmin.from('trafego_fardos').insert({
  codigo_in, sku, quantidade, endereco, reserva_id,
  prioridade, prateleira, posicao, altura,
  data_entrada, hora_entrada, operador,
  transferencia, data_transferencia, operador_transferencia,
  fardista_nome, fardista_id, clicked_at, status: 'encontrado'
})
if (insertError) return { error: 'Erro ao inserir no trafego' }

// 3. Dupla verificacao + apagar colunas F+ (preservar A-E)
const currentRow = await getSheetData(`Estoque!A${rowIndex}:N${rowIndex}`)
if (currentRow[0]?.[7]?.trim().toLowerCase() !== codigoIn.trim().toLowerCase()) {
  // Linha mudou — NAO apagar, logar erro
  return { error: 'Linha alterada, abortando limpeza' }
}
await clearSheetRange(`Estoque!F${rowIndex}:N${rowIndex}`)

// 4. Atualizar status da reserva
await supabaseAdmin.from('reservas').update({ status: 'encontrado' }).eq('codigo_in', codigoIn)
```
[VERIFIED: google-sheets.ts, stock-parser.ts, decisoes D-14 a D-18 do CONTEXT.md]

### Pattern 2: Fluxo N/E com Busca de Alternativo
**What:** Busca fardo substituto ou libera para prateleira
**When to use:** Quando fardista clica N/E em um fardo
**Example:**
```typescript
// Source: decisoes D-20 a D-22 do CONTEXT.md
// 1. Buscar alternativo
const stock = await fetchStock(true) // forceRefresh para dados atuais
const reservados = await getReservedCodigosIn()
const disponiveis = stock.filter(f => f.sku === sku && !reservados.has(f.codigo_in))

let alternativo: StockItem | null = null
if (tipoCascata) {
  // Cascata: qualquer fardo disponivel
  alternativo = disponiveis[0] ?? null
} else {
  // Normal: subset sum com 20% margem
  const resultado = findOptimalCombination(disponiveis, quantidade)
  alternativo = resultado.fardos[0] ?? null
}

// 2A. Se encontrou: reservar novo fardo
if (alternativo) {
  await supabaseAdmin.from('reservas').insert({
    codigo_in: alternativo.codigo_in, sku, quantidade: alternativo.quantidade,
    endereco: alternativo.endereco, status: 'reservado', importacao_numero
  })
  // Cancelar reserva antiga
  await supabaseAdmin.from('reservas').update({ status: 'substituido' }).eq('id', reservaId)
}

// 2B. Se NAO encontrou: registrar N/E + cancelar reserva + liberar prateleira
if (!alternativo) {
  await supabaseAdmin.from('fardos_nao_encontrados').insert({ ... })
  await supabaseAdmin.from('reservas').update({ status: 'cancelado' }).eq('id', reservaId)
  // Liberar prateleira: update progresso de 'aguardar_fardista' para 'pendente'
}
```
[VERIFIED: subset-sum.ts, reservation-engine.ts, decisoes D-20 a D-22 do CONTEXT.md]

### Pattern 3: Consulta de Fardos para Lista
**What:** Query combinada para exibir fardos com todas as informacoes necessarias
**When to use:** Ao carregar a lista de fardos
**Example:**
```typescript
// Buscar reservas do dia com dados do pedido para contexto
const { data: reservas } = await supabaseAdmin
  .from('reservas')
  .select('id, codigo_in, sku, quantidade, endereco, status, importacao_numero')
  .in('status', ['reservado', 'encontrado', 'nao_encontrado'])

// Buscar atribuicoes de fardista
const { data: atribuicoes } = await supabaseAdmin
  .from('atribuicoes')
  .select('card_key, user_id')
  .eq('tipo', 'fardista')

// Buscar trafego para saber quais ja foram encontrados
const { data: trafego } = await supabaseAdmin
  .from('trafego_fardos')
  .select('codigo_in, status')
```
[VERIFIED: database.types.ts, padrao de query da Phase 5]

### Anti-Patterns to Avoid
- **KanbanBoard na tela de fardos:** D-01 proibe explicitamente. Substituir completamente o FardosClient atual
- **Polling para atualizacao:** CLAUDE.md proibe. Usar useCardsRealtime (ja escuta trafego_fardos e reservas)
- **Apagar planilha antes de inserir no trafego:** D-18 exige ordem inversa. Insert primeiro, clear depois
- **Buscar fardo sem dupla verificacao:** D-17 exige releitura da linha antes de apagar
- **Criar nova Supabase subscription:** useCardsRealtime ja cobre as tabelas necessarias. Tambem precisa escutar fardos_nao_encontrados se usarmos essa tabela

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subset sum para alternativo | Algoritmo proprio | `findOptimalCombination` de subset-sum.ts | Ja testado, cobre edge cases de margem 20% |
| Leitura de planilha com NFD | Parser de headers | `fetchStock` de stock-parser.ts | Normalizacao NFD ja implementada e testada |
| Retry com backoff | Loop de retry | `withRetry` de stock-parser.ts | Generico, 1s/2s/4s exponencial |
| Modal de atribuicao | Dialog customizado | `AssignModal` com filterRole='fardista' | Ja existe, filtra por role |
| Realtime subscriptions | Channel manual | `useCardsRealtime` | Ja escuta trafego_fardos e reservas |
| Tabela PDF | Renderizacao manual | `jspdf-autotable` | Formatacao automatica de tabelas |
| Toast de feedback | Alert customizado | `sonner` (toast) | Ja configurado no projeto |
| Cache de estoque | Cache manual | `stock-cache.ts` (getCached/setCache/invalidateCache) | TTL 2min, invalidacao por key |

**Key insight:** Esta fase reutiliza massivamente codigo das Phases 4 e 5. As unicas pecas genuinamente novas sao: (1) os Route Handlers de OK/N/E, (2) a UI da lista plana, e (3) a migration do banco.

## Common Pitfalls

### Pitfall 1: Race Condition na Planilha de Estoque
**What goes wrong:** Dois fardistas clicam OK no mesmo momento para fardos na mesma planilha
**Why it happens:** Google Sheets nao tem transacoes ACID
**How to avoid:** Dupla verificacao (D-17): reler a linha antes de apagar. Se o conteudo mudou, abortar. Logar conflito. Usar status 'encontrado' na reserva como lock otimista no Supabase
**Warning signs:** Linhas apagadas da planilha que nao aparecem no trafego

### Pitfall 2: Cache Stale no fetchStock
**What goes wrong:** Fardista clica N/E, busca alternativo, mas cache de 2min retorna estoque desatualizado
**Why it happens:** fetchStock tem cache de 2 minutos
**How to avoid:** Sempre usar `forceRefresh=true` no fluxo N/E para buscar dados atuais. No fluxo OK tambem usar forceRefresh para garantir que a linha existe
**Warning signs:** Alternativo encontrado pelo sistema ja foi reservado por outro processo

### Pitfall 3: Indices de Linha da Planilha Off-by-One
**What goes wrong:** Apagar a linha errada na planilha de estoque
**Why it happens:** getSheetData retorna rows[0] como header, mas a API do Sheets usa indice 1-based (row 1 = header, row 2 = primeiro dado)
**How to avoid:** `sheetRowIndex = dataArrayIndex + 2` (1 para 1-based + 1 para header). Sempre incluir dupla verificacao (D-17)
**Warning signs:** Colunas de endereco (A-E) aparecem zeradas apos OK

### Pitfall 4: fardos_nao_encontrados Schema Mismatch
**What goes wrong:** Insert falha porque schema atual de fardos_nao_encontrados nao tem todos os campos necessarios (D-22)
**Why it happens:** Schema atual so tem: codigo_in, trafego_id, reportado_por, reportado_em. D-22 exige: codigo_upseller, sku, quantidade, endereco, fardista_nome, fardista_id
**How to avoid:** Migration deve alterar fardos_nao_encontrados tambem — adicionar campos faltantes. Manter trafego_id como nullable (fardo nao foi para trafego)
**Warning signs:** Insert retorna 400 por colunas desconhecidas

### Pitfall 5: Atribuicao em Lote vs Individual
**What goes wrong:** AssignModal so atribui a um card_key por vez, mas D-23 pede atribuicao em lote de multiplos fardos
**Why it happens:** AssignModal recebe um unico cardKey, nao uma lista
**How to avoid:** A barra flutuante deve coletar os card_keys selecionados e ao confirmar fardista no modal, chamar a API de assign para cada card_key. Na pratica, fardos sao agrupados por card (atribuicao e por card, nao por fardo individual), entao multiplas chamadas sequenciais funcionam
**Warning signs:** Selecionar 5 fardos de cards diferentes e atribuir so atribui o primeiro card

### Pitfall 6: Liberacao para Prateleira no N/E
**What goes wrong:** N/E sem alternativo deveria liberar linha "AGUARDAR FARDISTA" na prateleira, mas o status nao muda
**Why it happens:** Falta o update na tabela progresso para mudar status de 'aguardar_fardista' para 'pendente'
**How to avoid:** No fluxo N/E sem alternativo, buscar pedidos com esse SKU na progresso com status='aguardar_fardista' e atualizar para 'pendente'
**Warning signs:** Separador continua vendo "AGUARDAR FARDISTA" mesmo apos N/E

### Pitfall 7: clearSheetRange Range Incorreto
**What goes wrong:** Apagar colunas erradas da planilha — inclusive as de endereco (A-E)
**Why it happens:** Range string mal formado (ex: "Estoque!F2:N2" vs "Estoque!F2:2")
**How to avoid:** Range deve ser `Estoque!F${rowIndex}:N${rowIndex}` onde N e a ultima coluna com dados. Testar com planilha de teste antes
**Warning signs:** Endereco do fardo desaparece da planilha

## Code Examples

### Busca por CODIGO UPSELLER na Planilha (match exato com NFD)
```typescript
// Source: stock-parser.ts normalizeHeader + decisao D-15
function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

async function findRowInSheet(codigoIn: string): Promise<{ rowIndex: number; rowData: string[] } | null> {
  const rows = await getSheetData('Estoque')
  if (!rows || rows.length < 2) return null

  const normalizedTarget = normalizeForMatch(codigoIn)
  const headers = rows[0].map((h: string) => normalizeForMatch(h?.toString() ?? ''))
  const colH = headers.indexOf('codigo upseller') // coluna H = indice 7

  for (let i = 1; i < rows.length; i++) {
    const cellValue = rows[i]?.[colH]?.toString() ?? ''
    if (normalizeForMatch(cellValue) === normalizedTarget) {
      return { rowIndex: i + 1, rowData: rows[i] } // +1 para 1-based Sheets API
    }
  }
  return null
}
```
[VERIFIED: stock-parser.ts normalizeHeader, google-sheets.ts getSheetData]

### Mapeamento de Colunas da Planilha para trafego_fardos
```typescript
// Source: decisao D-16, headers reais documentados no STATE.md
// Colunas da planilha: A=PRIORIDADE, B=PRATELEIRA, C=POSICAO, D=ALTURA, E=ENDERECO,
// F=SKU, G=QUANTIDADE, H=CODIGO UPSELLER, I=DATA ENTRADA, J=HORA ENTRADA,
// K=OPERADOR, L=TRANFERENCIA, M=DATA TRANFERENCIA, N=OPERADOR (transferencia)
function mapRowToTrafego(row: string[], reservaId: string, fardista: { id: string; nome: string }) {
  return {
    prioridade: row[0]?.toString().trim() ?? null,
    prateleira: row[1]?.toString().trim() ?? null,
    posicao: row[2]?.toString().trim() ?? null,
    altura: row[3]?.toString().trim() ?? null,
    endereco: row[4]?.toString().trim() ?? null,
    sku: row[5]?.toString().trim() ?? '',
    quantidade: Number(row[6]) || 0,
    codigo_in: row[7]?.toString().trim() ?? '',
    data_entrada: row[8]?.toString().trim() ?? null,
    hora_entrada: row[9]?.toString().trim() ?? null,
    operador: row[10]?.toString().trim() ?? null,
    transferencia: row[11]?.toString().trim() ?? null,
    data_transferencia: row[12]?.toString().trim() ?? null,
    operador_transferencia: row[13]?.toString().trim() ?? null,
    reserva_id: reservaId,
    fardista_id: fardista.id,
    fardista_nome: fardista.nome,
    clicked_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    status: 'encontrado',
  }
}
```
[VERIFIED: STATE.md headers reais da planilha, decisao D-16 do CONTEXT.md]

### Geracao de PDF para Fardos
```typescript
// Source: pdf-generator.ts existente (Phase 5) + decisao D-27
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateFardosPdf(
  fardos: Array<{ codigo_in: string; sku: string; endereco: string; quantidade: number; separador_nome: string | null }>
): void {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Lista de Fardos', 14, 20)
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, 14, 28)

  autoTable(doc, {
    startY: 35,
    head: [['Codigo IN', 'SKU', 'Endereco', 'Qtd', 'Entregar para']],
    body: fardos.map(f => [
      f.codigo_in,
      f.sku,
      f.endereco,
      String(f.quantidade),
      f.separador_nome ?? '---',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 0, 0] },
  })

  doc.save('fardos.pdf')
}
```
[VERIFIED: pdf-generator.ts padrao, jsPDF 4.2.1, jspdf-autotable 5.0.7]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| KanbanBoard na tela de fardos | Lista plana dedicada | Phase 6 (agora) | Substituir FardosClient completamente |
| trafego_fardos com poucos campos | trafego_fardos com TODOS os campos da planilha | Phase 6 migration | Precisa SQL migration antes de qualquer insercao |
| Limpeza de planilha na Baixa (Phase 8) | Limpeza de planilha no OK (Phase 6) | Decisao Phase 6 | Phase 8 nao limpa mais planilha, Phase 6 sim |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | fardos_nao_encontrados precisa de migration para campos adicionais (sku, quantidade, endereco, fardista_nome, fardista_id) | Common Pitfalls | Insert falharia se campos nao existem; alternativa: usar reserva_id como FK e buscar dados via JOIN |
| A2 | Tipo de fardo (cascata vs normal) pode ser determinado a partir da tabela de reservas/pedidos | Architecture Patterns | Se nao houver campo que diferencie, logica N/E nao saberia qual regra aplicar |
| A3 | Atribuicao em lote reutiliza a mesma API /api/cards/assign com multiplas chamadas | Common Pitfalls | Se API for lenta, lote grande pode dar timeout; alternativa: endpoint de bulk assign |

## Open Questions

1. **Como determinar se um fardo e de cascata ou importacao normal?**
   - O que sabemos: D-20 distingue entre "fardo de IMPORTACAO NORMAL" (usa subset sum 20%) e "fardo de CASCATA" (aceita qualquer fardo)
   - O que nao esta claro: Nao ha campo explicito na tabela reservas que indique se e cascata. A cascata e um conceito da Phase 7 (PRAT-05)
   - Recomendacao: Adicionar campo `origem` ('importacao' | 'cascata') na tabela reservas durante a migration. Ou inferir pela ausencia de importacao_numero

2. **Tabela fardos_nao_encontrados precisa de quais campos adicionais?**
   - O que sabemos: Schema atual tem codigo_in, trafego_id, reportado_por, reportado_em. D-22 pede: codigo_upseller, sku, quantidade, endereco, fardista_nome, fardista_id, timestamp
   - O que nao esta claro: Se devemos alterar a tabela existente ou se os campos existentes cobrem via JOINs (trafego_id pode ser NULL se fardo nao foi para trafego)
   - Recomendacao: Alterar tabela na migration para incluir sku, quantidade, endereco, fardista_nome, fardista_id. Manter trafego_id como nullable

3. **"Para quem entregar" no PDF — como resolver separador do card?**
   - O que sabemos: D-27 pede o nome do separador do card que usa aquele fardo
   - O que nao esta claro: Um fardo (via reserva) pode atender multiplos cards. Precisamos de JOIN reservas -> pedidos -> card_key -> atribuicoes (tipo='separador')
   - Recomendacao: Query JOIN na hora de gerar o PDF. Se fardo atende multiplos cards, listar todos os separadores. Se nao tem separador atribuido, mostrar "---"

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FARD-01 | Lista de fardos exibe dados corretos | unit | `npx vitest run src/features/fardos/hooks/__tests__/use-fardos-data.test.ts -x` | Wave 0 |
| FARD-02 | Fluxo OK: busca planilha + insert trafego + clear | unit | `npx vitest run src/features/fardos/utils/__tests__/ok-flow.test.ts -x` | Wave 0 |
| FARD-03 | Fluxo N/E: busca alternativo ou libera prateleira | unit | `npx vitest run src/features/fardos/utils/__tests__/ne-flow.test.ts -x` | Wave 0 |
| FARD-04 | Realtime via subscription | manual-only | Verificar useCardsRealtime ja cobre tabelas | N/A |
| FARD-05 | Atribuicao de fardistas | unit | Reutiliza teste existente da Phase 5 | Existente |
| FARD-06 | PDF com dados corretos | unit | `npx vitest run src/features/fardos/components/__tests__/fardos-pdf.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/fardos/utils/__tests__/ok-flow.test.ts` — cobre FARD-02 (mock Google Sheets + Supabase)
- [ ] `src/features/fardos/utils/__tests__/ne-flow.test.ts` — cobre FARD-03 (mock alternativo/sem alternativo)
- [ ] `src/features/fardos/components/__tests__/fardos-pdf.test.ts` — cobre FARD-06

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | createClient() -> getUser() em cada route handler [VERIFIED: api/cards/progress/route.ts] |
| V3 Session Management | sim | JWT Supabase via @supabase/ssr [VERIFIED: padrao Phase 2] |
| V4 Access Control | sim | Role check via admin DB (lider/admin para atribuir e sync, fardista para OK/N/E) [VERIFIED: api/cards/assign/route.ts] |
| V5 Input Validation | sim | Validar codigo_in, reserva_id, user_id no body das API routes |
| V6 Cryptography | nao | Sem operacoes criptograficas nesta fase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fardista marca OK em fardo de outro | Elevation | Verificar que fardo esta atribuido ao usuario logado (ou que usuario e lider/admin) |
| Manipulacao de reserva_id no body | Tampering | Validar que reserva_id existe e pertence ao fardista logado |
| Clique duplo envia 2x para trafego | Tampering | Verificar se codigo_in ja existe em trafego_fardos antes de inserir + spinner no frontend |
| IDOR na lista de fardos | Information Disclosure | Fardista so ve fardos atribuidos a ele (filtro por user_id no backend) |

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui + SheetJS — nao negociavel
- **Realtime**: Obrigatorio via Supabase subscriptions — polling proibido
- **Estoque externo**: Planilha Google Sheets nunca migra para Supabase
- **Margem fardos**: Sempre 20% percentual
- **Comunicacao**: Sempre em portugues brasileiro
- **Auth pattern**: getUser() + DB fallback para role (nunca verificar JWT manualmente)
- **API route pattern**: createClient() -> getUser() -> role check via admin DB -> supabaseAdmin para escrita
- **Array iteration**: Array.from(Map) para iterar Maps (tsconfig compat)
- **NFD normalization**: Obrigatorio para headers da planilha externa

## Sources

### Primary (HIGH confidence)
- `src/features/fardos/utils/stock-parser.ts` — fetchStock, normalizeHeader, withRetry
- `src/features/fardos/utils/subset-sum.ts` — findOptimalCombination
- `src/features/fardos/utils/reservation-engine.ts` — executeReservation
- `src/lib/google-sheets.ts` — getSheetData, updateSheetData, clearSheetRange
- `src/features/cards/components/assign-modal.tsx` — AssignModal com filterRole
- `src/features/cards/hooks/use-cards-realtime.ts` — useCardsRealtime
- `src/features/cards/lib/pdf-generator.ts` — generateChecklist (referencia para PDF)
- `src/types/database.types.ts` — schema completo do banco
- `src/types/index.ts` — StatusTrafego, StatusProgresso
- `package.json` — versoes de todas as dependencias

### Secondary (MEDIUM confidence)
- `.planning/phases/06-lista-de-fardos/06-CONTEXT.md` — decisoes D-01 a D-31
- `.planning/STATE.md` — headers reais da planilha de estoque, decisoes acumuladas

### Tertiary (LOW confidence)
- Nenhum claim baseado apenas em WebSearch

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todo instalado e verificado no package.json
- Architecture: HIGH — padrao de API routes e componentes consolidado em 5 fases anteriores
- Pitfalls: HIGH — baseado em analise direta do codigo existente e decisoes do CONTEXT.md

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack estavel, sem mudancas esperadas)

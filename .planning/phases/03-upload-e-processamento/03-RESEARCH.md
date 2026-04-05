# Phase 3: Upload e Processamento - Research

**Researched:** 2026-04-04
**Domain:** Upload de arquivos .xlsx, parsing client-side com SheetJS, classificacao e persistencia server-side com Supabase
**Confidence:** HIGH

## Summary

Esta phase implementa o fluxo completo de upload: lider arrasta/seleciona arquivo .xlsx do ERP UpSeller, SheetJS faz parse no frontend gerando preview, lider confirma, e Route Handler no backend classifica pedidos (Unitario/Kit/Combo), deduplica contra banco existente, classifica metodo de envio nos 6 grupos, e persiste no Supabase. Inclui tambem virada de dia automatica (limpeza seletiva) e historico de importacoes do dia com undo.

O stack e simples e bem definido: SheetJS (xlsx) para parse no cliente, Next.js Route Handler para logica server-side, Supabase para persistencia. A complexidade esta na logica de negocio: agrupamento de linhas por numero_pedido para classificacao, filtros de status/envio, deduplicacao contra banco, geracao de card_key, e limpeza seletiva na virada de dia.

**Primary recommendation:** Instalar SheetJS 0.20.3 via CDN (npm registry esta desatualizado em 0.18.5). Toda logica de classificacao, deduplicacao e persistencia fica no Route Handler (server-side). Frontend apenas parseia o xlsx e exibe preview.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Drag-and-drop + botao 'Selecionar arquivo' como drop zone — zona de arrastar com fallback de botao, reusa Card do shadcn
- **D-02:** Um arquivo .xlsx por vez — lider importa, ve resultado, depois pode importar outro
- **D-03:** Apos selecionar arquivo: mostra nome do .xlsx + botao 'Processar' — lider controla quando inicia a analise
- **D-04:** Preview com resumo numerico antes de confirmar importacao — total de pedidos validos, filtrados (Full/Fulfillment), duplicados, por tipo (Unitario/Kit/Combo). Lider confirma com botao antes de persistir
- **D-05:** SheetJS parse no frontend (gera preview), confirmacao envia dados parseados para Route Handler que classifica, deduplica e persiste no Supabase server-side
- **D-06:** Classificacao automatica no backend: Unitario (1 SKU, qtd=1), Kit (1 SKU, qtd>1), Combo (2+ SKUs diferentes no mesmo pedido)
- **D-07:** Deduplicacao no backend: consulta numero_pedido existente no banco antes de inserir. Linhas com mesmo numero dentro da planilha sao agrupadas normalmente
- **D-08:** Classificacao de metodo de envio nos 6 grupos por correspondencia parcial case-insensitive (TikTok verificado antes de Shopee Xpress para evitar conflito)
- **D-09:** Toast de sucesso 'Importacao #N concluida' + card de resumo abaixo da drop zone com breakdown
- **D-10:** Spinner com texto 'Importando pedidos...' durante processamento (apos confirmacao)
- **D-11:** Se nenhum pedido valido: mensagem amigavel na tela — 'Nenhum pedido novo encontrado — X filtrados, Y ja importados'. Sem importacao criada
- **D-12:** Limpeza automatica com toast informativo: 'Virada de dia — pedidos anteriores removidos'. Sem modal de confirmacao
- **D-13:** Limpa na virada: pedidos, progresso, reservas, atribuicoes. NAO limpa: trafego_fardos, baixados, fardos_nao_encontrados (sobrevivem entre dias)
- **D-14:** Deteccao via tabela config (chave: 'ultima_importacao_data') — le antes de cada importacao, compara com data de hoje
- **D-15:** Numeracao de importacoes reseta para 1 no novo dia
- **D-16:** Lista de importacoes do dia abaixo da drop zone — cada item mostra: # da importacao, horario, pedidos por tipo (Unitario/Kit/Combo), por grupo de envio
- **D-17:** Botao 'Desfazer ultima importacao' remove os pedidos da importacao mais recente do banco

### Claude's Discretion
- Design exato da drop zone (icone, cores, bordas)
- Layout interno do card de resumo
- Implementacao do spinner/loading state
- Estrutura interna dos componentes (quantos componentes, nomes)
- Validacao do formato do arquivo (.xlsx check)
- Tratamento de erros de parse (arquivo corrompido, formato inesperado)

### Deferred Ideas (OUT OF SCOPE)
- **Tabela historico_performance** — Pertence a Phase 9 (Dashboard)
- **Botoes de limpeza manual** — Pertence a Phase 10 (Gestao de Usuarios)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPLD-01 | Lider/Admin pode importar arquivo .xlsx do ERP UpSeller | Drop zone component + hidden file input + Route Handler para persistencia |
| UPLD-02 | Sistema le .xlsx no frontend com SheetJS e mapeia as 13 colunas do ERP | SheetJS 0.20.3 `read()` + `sheet_to_json()` com mapeamento de colunas |
| UPLD-03 | Sistema filtra apenas pedidos com status "Em processo" | Filtro no frontend durante parse — campo "Estado do Pedido" |
| UPLD-04 | Sistema ignora pedidos com metodo de envio contendo "Full" ou "Fulfillment" | Filtro no frontend durante parse — campo "Metodo de Envio" |
| UPLD-05 | Sistema classifica pedidos automaticamente: Unitario, Kit, Combo | Logica no Route Handler: agrupar linhas por numero_pedido, contar SKUs distintos e somar quantidades |
| UPLD-06 | Deduplicacao entre importacoes — numero_pedido existente ignorado | Route Handler consulta pedidos existentes no Supabase antes de inserir |
| UPLD-07 | Linhas com mesmo numero_pedido na planilha sao agrupadas | Agrupamento no Route Handler antes de classificacao |
| UPLD-08 | Virada de dia limpa banco automaticamente | Route Handler verifica config.ultima_importacao_data vs hoje, limpa tabelas seletivamente |
| UPLD-09 | Cada importacao recebe numero sequencial | Route Handler incrementa config.ultimo_importacao_numero (reseta em virada de dia) |
| UPLD-10 | Sistema classifica metodo de envio nos 6 grupos | Mapeamento por correspondencia parcial case-insensitive no Route Handler |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js 14 + Supabase + Vercel + Google Sheets API + Tailwind + shadcn/ui + SheetJS — nao negociavel
- **Realtime**: Obrigatorio via Supabase subscriptions — polling proibido (relevante para atualizacao da lista de importacoes)
- **Deduplicacao**: Entre planilhas diferentes, nunca dentro da mesma planilha
- **Comunicacao**: Sempre em portugues brasileiro
- **Hospedagem**: Vercel (Route Handlers tem limite de 10s no plano hobby, 60s no pro)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx (SheetJS) | 0.20.3 | Parse .xlsx no frontend | Unica lib de parse xlsx mencionada nas constraints do projeto. NPM registry (0.18.5) esta desatualizado — instalar via CDN |
| @supabase/supabase-js | 2.101.1 | Persistencia server-side | Ja instalado no projeto |
| @supabase/ssr | 0.10.0 | Auth em Route Handlers | Ja instalado no projeto |
| next | 14.2.35 | Route Handlers (App Router) | Ja instalado no projeto |

[VERIFIED: npm registry] xlsx 0.18.5 no npm, 0.20.3 no CDN oficial
[CITED: docs.sheetjs.com/docs/getting-started/installation/nodejs/] SheetJS CDN como fonte autoritativa

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | 2.0.7 | Toast notifications | Feedback de sucesso/virada de dia/erros — ja instalado |
| lucide-react | 1.7.0 | Icones (Upload, FileSpreadsheet, Loader2) | Drop zone e estados — ja instalado |

### shadcn Components a Instalar
| Component | Purpose |
|-----------|---------|
| badge | Badges de tipo (Unitario/Kit/Combo) no preview e lista |
| separator | Divisor visual entre drop zone e lista |
| alert | Mensagens inline de resultado vazio e erros |
| progress | Barra de progresso (opcional, UI-SPEC lista como opcional) |

**Installation:**
```bash
# SheetJS via CDN (NAO usar npm install xlsx)
npm rm --save xlsx 2>/dev/null
npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz

# shadcn components
npx shadcn add badge separator alert progress
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/upload/
  components/
    drop-zone.tsx           # Drop zone + file input (client component)
    import-preview.tsx      # Resumo numerico pre-confirmacao (client component)
    import-list.tsx         # Lista de importacoes do dia (client component)
    import-list-item.tsx    # Item individual da lista
    processing-spinner.tsx  # Overlay de loading
  hooks/
    use-upload.ts           # Estado do fluxo (file, preview, loading, imports)
  lib/
    parse-xlsx.ts           # SheetJS parse + mapeamento das 13 colunas ERP
    envio-groups.ts         # Mapeamento de metodo de envio -> grupo
  types.ts                  # Tipos locais do feature (ParsedRow, PreviewData, etc.)

app/api/upload/
  route.ts                  # POST: classificar, deduplicar, persistir

app/api/upload/undo/
  route.ts                  # DELETE: desfazer ultima importacao
```

### Pattern 1: Fluxo Hibrido Frontend-Backend
**What:** Frontend parseia xlsx e filtra; backend classifica, deduplica e persiste
**When to use:** Quando dados precisam de validacao contra banco (deduplicacao) mas preview pode ser gerado localmente
**Example:**
```typescript
// src/features/upload/lib/parse-xlsx.ts
import { read, utils } from 'xlsx'

// Mapeamento das 13 colunas do ERP UpSeller
const COLUMN_MAP: Record<string, string> = {
  'Nº de Pedido da Plataforma': 'numero_pedido_plataforma',
  'Nº de Pedido': 'numero_pedido',
  'Plataformas': 'plataforma',
  'Nome da Loja no UpSeller': 'loja',
  'Estado do Pedido': 'estado_pedido',
  'Prazo de Envio': 'prazo_envio',
  'SKU (Armazém)': 'sku',
  'Quantidade de Produtos': 'quantidade',
  'Quantidade Mapeada': 'quantidade_mapeada',
  'Variação': 'variacao',
  'Nome do Produto': 'nome_produto',
  'Método de Envio': 'metodo_envio',
  'Etiqueta': 'etiqueta',
}

export interface ParsedRow {
  numero_pedido_plataforma: string
  numero_pedido: string
  plataforma: string
  loja: string
  prazo_envio: string | null
  sku: string
  quantidade: number
  variacao: string | null
  nome_produto: string | null
  metodo_envio: string
}

export interface ParseResult {
  rows: ParsedRow[]
  filtered_status: number    // filtrados por status != "Em processo"
  filtered_envio: number     // filtrados por Full/Fulfillment
  total_raw: number          // total de linhas na planilha
}

export function parseXlsx(buffer: ArrayBuffer): ParseResult {
  const workbook = read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet)

  let filtered_status = 0
  let filtered_envio = 0
  const rows: ParsedRow[] = []

  for (const raw of rawRows) {
    // Mapear colunas
    const mapped: Record<string, unknown> = {}
    for (const [xlsCol, key] of Object.entries(COLUMN_MAP)) {
      mapped[key] = raw[xlsCol]
    }

    // UPLD-03: Filtrar apenas "Em processo"
    const estado = String(mapped.estado_pedido ?? '').trim()
    if (estado !== 'Em processo') {
      filtered_status++
      continue
    }

    // UPLD-04: Ignorar Full/Fulfillment
    const metodo = String(mapped.metodo_envio ?? '')
    if (/full|fulfillment/i.test(metodo)) {
      filtered_envio++
      continue
    }

    rows.push({
      numero_pedido_plataforma: String(mapped.numero_pedido_plataforma ?? ''),
      numero_pedido: String(mapped.numero_pedido ?? ''),
      plataforma: String(mapped.plataforma ?? ''),
      loja: String(mapped.loja ?? ''),
      prazo_envio: mapped.prazo_envio ? String(mapped.prazo_envio) : null,
      sku: String(mapped.sku ?? ''),
      quantidade: Number(mapped.quantidade) || 0,
      variacao: mapped.variacao ? String(mapped.variacao) : null,
      nome_produto: mapped.nome_produto ? String(mapped.nome_produto) : null,
      metodo_envio: metodo,
    })
  }

  return { rows, filtered_status, filtered_envio, total_raw: rawRows.length }
}
```
[VERIFIED: docs.sheetjs.com] API `read()` com type 'array' e `sheet_to_json()`

### Pattern 2: Classificacao de Pedidos (Backend)
**What:** Agrupar linhas por numero_pedido, determinar tipo, gerar card_key
**When to use:** No Route Handler antes de inserir no banco
**Example:**
```typescript
// Logica de classificacao no Route Handler
type TipoPedido = 'unitario' | 'kit' | 'combo'

interface GroupedOrder {
  numero_pedido: string
  items: ParsedRow[]
  tipo: TipoPedido
}

function classifyOrders(rows: ParsedRow[]): GroupedOrder[] {
  // Agrupar por numero_pedido (UPLD-07)
  const groups = new Map<string, ParsedRow[]>()
  for (const row of rows) {
    const existing = groups.get(row.numero_pedido) ?? []
    existing.push(row)
    groups.set(row.numero_pedido, existing)
  }

  return Array.from(groups.entries()).map(([numero_pedido, items]) => {
    // Contar SKUs distintos
    const uniqueSkus = new Set(items.map(i => i.sku))
    const totalQty = items.reduce((sum, i) => sum + i.quantidade, 0)

    let tipo: TipoPedido
    if (uniqueSkus.size >= 2) {
      tipo = 'combo'     // 2+ SKUs diferentes
    } else if (totalQty > 1) {
      tipo = 'kit'        // 1 SKU, qtd > 1
    } else {
      tipo = 'unitario'   // 1 SKU, qtd = 1
    }

    return { numero_pedido, items, tipo }
  })
}
```

### Pattern 3: Classificacao de Metodo de Envio
**What:** Mapear metodo de envio para os 6 grupos via correspondencia parcial
**When to use:** No Route Handler ao gerar grupo_envio e card_key
**Critical:** TikTok deve ser verificado ANTES de Shopee Xpress (ambos podem conter "xpress")
**Example:**
```typescript
// src/features/upload/lib/envio-groups.ts
const ENVIO_RULES: { pattern: RegExp; grupo: string }[] = [
  // ORDEM IMPORTA: TikTok antes de Shopee Xpress
  { pattern: /tiktok/i, grupo: 'TikTok' },
  { pattern: /shopee.*spx|spx/i, grupo: 'Shopee SPX' },
  { pattern: /flex/i, grupo: 'ML Flex' },
  { pattern: /coleta/i, grupo: 'ML Coleta' },
  { pattern: /shein/i, grupo: 'Shein' },
  { pattern: /shopee.*xpress|xpress/i, grupo: 'Shopee Xpress' },
]

export function classifyEnvio(metodoEnvio: string): string {
  for (const rule of ENVIO_RULES) {
    if (rule.pattern.test(metodoEnvio)) {
      return rule.grupo
    }
  }
  return 'Outro' // fallback para metodos nao mapeados
}
```

### Pattern 4: Virada de Dia
**What:** Verificar data da ultima importacao vs hoje; limpar tabelas seletivamente se diferente
**When to use:** No inicio de cada POST /api/upload, antes de processar
**Example:**
```typescript
// No Route Handler POST /api/upload
async function checkDayReset(supabase: SupabaseClient): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  const { data: config } = await supabase
    .from('config')
    .select('valor')
    .eq('chave', 'ultima_importacao_data')
    .single()

  if (config && config.valor !== today) {
    // Limpar tabelas na ordem correta (FK constraints)
    // D-13: NAO limpar trafego_fardos, baixados, fardos_nao_encontrados
    await supabase.from('atribuicoes').delete().neq('id', '')
    await supabase.from('progresso').delete().neq('id', '')
    await supabase.from('reservas').delete().neq('id', '')
    await supabase.from('pedidos').delete().neq('id', '')

    // Atualizar data e resetar numeracao (D-15)
    await supabase.from('config').upsert([
      { chave: 'ultima_importacao_data', valor: today },
      { chave: 'ultimo_importacao_numero', valor: '0' },
    ], { onConflict: 'chave' })

    return true // virada ocorreu
  }

  if (!config) {
    // Primeira importacao do sistema
    await supabase.from('config').insert([
      { chave: 'ultima_importacao_data', valor: today },
      { chave: 'ultimo_importacao_numero', valor: '0' },
    ])
  }

  return false
}
```

### Pattern 5: Auth no Route Handler
**What:** API routes nao passam pelo middleware de auth — validar manualmente
**When to use:** Todo Route Handler que requer autenticacao
**Example:**
```typescript
// app/api/upload/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Verificar role (apenas lider e admin podem fazer upload)
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['admin', 'lider'].includes(userData.role)) {
    return Response.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // ... processar upload
}
```
[VERIFIED: middleware.ts linhas 58] API routes pulam auth no middleware

### Anti-Patterns to Avoid
- **Parse no servidor:** SheetJS no Route Handler aumenta payload enviado ao servidor (arquivo binario inteiro). D-05 define parse no frontend
- **Deduplicacao no frontend:** Frontend nao tem acesso ao banco para verificar numeros existentes. Sempre no backend
- **Delete sem WHERE:** Ao limpar tabelas na virada de dia, sempre usar `.delete().neq('id', '')` ou `.delete().gt('created_at', '1970-01-01')` — Supabase exige filtro no delete
- **Polling para lista de importacoes:** CLAUDE.md proibe polling — usar Supabase subscription na tabela `config` ou `pedidos` para atualizar lista em tempo real

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parse de .xlsx | Parser manual de XML/ZIP | SheetJS `read()` + `utils.sheet_to_json()` | .xlsx e um ZIP com XML complexo; SheetJS cobre edge cases (datas, formulas, encodings) |
| Drag-and-drop | API nativa DragEvent manualmente | HTML5 DnD API com onDragOver/onDrop + hidden input | Padrao web, funciona em todos os browsers |
| Toasts | Componente de notificacao custom | sonner (ja instalado via shadcn) | Acessivel, animado, com API simples |
| Validacao de tipo arquivo | Verificacao manual de bytes/magic number | `accept=".xlsx"` no input + verificacao de extensao | Suficiente para UX; backend nao precisa validar pois recebe dados ja parseados |

**Key insight:** A complexidade desta phase esta na logica de negocio (classificacao, deduplicacao, virada de dia), nao na infraestrutura tecnica. Todas as ferramentas ja existem no projeto.

## Common Pitfalls

### Pitfall 1: SheetJS do npm registry (versao 0.18.5)
**What goes wrong:** npm `xlsx` esta em 0.18.5 (desatualizado). Versao corrente e 0.20.3 no CDN do SheetJS
**Why it happens:** SheetJS parou de publicar no npm registry publico
**How to avoid:** Instalar via `npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
**Warning signs:** `npm install xlsx` instala versao antiga silenciosamente
[CITED: docs.sheetjs.com/docs/getting-started/installation/nodejs/]

### Pitfall 2: Ordem dos regex de metodo de envio
**What goes wrong:** "TikTok Xpress" pode bater em Shopee Xpress se "xpress" for verificado primeiro
**Why it happens:** TikTok e Shopee Xpress podem compartilhar substring "xpress"
**How to avoid:** Verificar TikTok ANTES de Shopee Xpress na lista de regras (D-08)
**Warning signs:** Pedidos TikTok classificados como Shopee Xpress

### Pitfall 3: Delete sem filtro no Supabase
**What goes wrong:** `supabase.from('pedidos').delete()` sem `.eq()` ou `.neq()` retorna erro
**Why it happens:** Supabase-js exige filtro em operacoes delete por seguranca
**How to avoid:** Usar `.delete().neq('id', '')` ou `.delete().gte('created_at', '1970-01-01')`
**Warning signs:** Erro 400 "no filters provided" na virada de dia
[ASSUMED]

### Pitfall 4: Classificacao Kit vs Combo com linhas duplicadas
**What goes wrong:** Pedido com 2 linhas do MESMO SKU classificado como Combo ao inves de Kit
**Why it happens:** Contagem de linhas confundida com contagem de SKUs unicos
**How to avoid:** Usar `Set` de SKUs distintos, nao `.length` do array de items
**Warning signs:** Kits aparecendo como Combos no preview

### Pitfall 5: Race condition na virada de dia
**What goes wrong:** Duas importacoes simultaneas podem ambas detectar virada de dia e limpar o banco
**Why it happens:** Check-then-act sem lock
**How to avoid:** D-02 mitiga parcialmente (um arquivo por vez). Adicionar flag `isProcessing` no frontend para desabilitar botao durante processamento. Backend pode usar transaction ou advisory lock se necessario, mas risco e baixo com um unico lider
**Warning signs:** Pedidos da primeira importacao sumirem apos segunda importacao no mesmo segundo

### Pitfall 6: Formato de data do Prazo de Envio
**What goes wrong:** SheetJS pode converter datas do Excel para numeros seriais ao inves de strings
**Why it happens:** Excel armazena datas como numeros seriais internamente
**How to avoid:** Usar opcao `cellDates: true` no `read()` ou converter manualmente com `XLSX.SSF.format()`
**Warning signs:** prazo_envio aparecendo como numero (ex: 45678) ao inves de data
[CITED: docs.sheetjs.com/docs/api/parse-options/]

### Pitfall 7: Supabase delete com FK constraints
**What goes wrong:** Delete de pedidos falha se progresso ou reservas referenciam esses pedidos
**Why it happens:** Foreign keys entre tabelas (progresso.pedido_id -> pedidos.id, reservas.pedido_id -> pedidos.id)
**How to avoid:** Limpar na ordem correta: atribuicoes -> progresso -> reservas -> pedidos
**Warning signs:** Erro de foreign key constraint na virada de dia
[VERIFIED: database.types.ts] FK progresso_pedido_id_fkey, reservas_pedido_id_fkey

## Code Examples

### Leitura de arquivo via File Input + DnD
```typescript
// Source: HTML5 File API padrao
'use client'
import { useCallback, useRef, useState } from 'react'

function useFileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.name.endsWith('.xlsx')) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  const readAsArrayBuffer = useCallback((): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file'))
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }, [file])

  return { file, setFile, inputRef, handleDrop, handleFileSelect, readAsArrayBuffer }
}
```

### Batch Insert no Supabase
```typescript
// Source: supabase.com/docs/reference/javascript/insert
// Supabase suporta insert de arrays — uma unica chamada para multiplas linhas
const { data, error } = await supabase
  .from('pedidos')
  .insert(pedidosToInsert) // array de objetos
  .select()

// Para volumes grandes (>500 linhas), chunkar:
const CHUNK_SIZE = 500
for (let i = 0; i < pedidos.length; i += CHUNK_SIZE) {
  const chunk = pedidos.slice(i, i + CHUNK_SIZE)
  const { error } = await supabase.from('pedidos').insert(chunk)
  if (error) throw error
}
```
[CITED: supabase.com/docs/reference/javascript/insert]

### card_key Generation
```typescript
// card_key = "grupo|tipo|importacao_numero" (definido em PROJECT.md)
function generateCardKey(grupo_envio: string, tipo: TipoPedido, importacao_numero: number): string {
  return `${grupo_envio}|${tipo}|${importacao_numero}`
}
```
[VERIFIED: PROJECT.md] card_key = "grupo|tipo|importacao_numero"

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx 0.18.5 (npm) | xlsx 0.20.3 (CDN) | 2023+ | npm registry abandonado; instalar via CDN |
| FileReader + xlsx.read(data, {type: 'binary'}) | xlsx.read(buffer, {type: 'array'}) | xlsx 0.19+ | 'array' type e mais eficiente que 'binary' |
| Supabase JS v1 insert | Supabase JS v2 insert com .select() | 2023 | v2 nao retorna dados por padrao; precisa de .select() |

**Deprecated/outdated:**
- SheetJS no npm registry: usar CDN `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
- `type: 'binary'` no `read()`: preferir `type: 'array'` para ArrayBuffer

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase delete exige filtro (.neq ou .eq) | Pitfall 3 | Virada de dia pode falhar — mas facil de ajustar adicionando filtro |
| A2 | Vercel hobby tem timeout de 10s em Route Handlers | Project Constraints | Se planilha for muito grande, timeout pode ocorrer — mas volumes tipicos de armazem (<1000 linhas) devem ser OK |
| A3 | SheetJS 0.20.3 funciona com Next.js 14 sem config especial de bundler | Standard Stack | Se bundler tiver problema, pode precisar de ajuste em next.config.js |

## Open Questions

1. **Volume tipico de linhas por planilha**
   - What we know: Sistema de armazem processando pedidos diarios de 4 marketplaces
   - What's unclear: Se pode chegar a milhares de linhas em uma unica planilha
   - Recommendation: Implementar chunked insert (500 por batch) por seguranca. Se volume for consistentemente <200 linhas, batch unico e suficiente

2. **Timezone para virada de dia**
   - What we know: D-14 compara data da ultima importacao com "data de hoje"
   - What's unclear: Se usa UTC ou timezone local (Brasilia GMT-3)
   - Recommendation: Usar timezone de Brasilia (America/Sao_Paulo) ja que operacao e local. Usar `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })` para formato YYYY-MM-DD

3. **Fallback para metodos de envio nao mapeados**
   - What we know: 6 grupos definidos (Shopee SPX, ML Flex, TikTok, ML Coleta, Shein, Shopee Xpress)
   - What's unclear: O que fazer com metodo de envio que nao bate em nenhum regex
   - Recommendation: Classificar como "Outro" e alertar no preview. Lider pode decidir se importa ou nao

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + runtime | SIM | v25.8.2 | -- |
| npm | Package install | SIM | 11.11.1 | -- |
| xlsx (SheetJS) | Parse .xlsx | NAO (precisa instalar) | -- | Instalar via CDN tgz |
| Supabase | Persistencia | SIM | @supabase/supabase-js 2.101.1 | -- |
| shadcn badge | UI badges | NAO (precisa instalar) | -- | npx shadcn add badge |
| shadcn separator | UI divisor | NAO (precisa instalar) | -- | npx shadcn add separator |
| shadcn alert | UI alertas | NAO (precisa instalar) | -- | npx shadcn add alert |

**Missing dependencies with no fallback:**
- xlsx (SheetJS) 0.20.3 — deve ser instalado via CDN antes de qualquer desenvolvimento

**Missing dependencies with fallback:**
- Nenhum

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Nenhum instalado |
| Config file | none -- Wave 0 deve configurar |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPLD-02 | Parse xlsx e mapeia 13 colunas | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | NAO Wave 0 |
| UPLD-03 | Filtra apenas "Em processo" | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | NAO Wave 0 |
| UPLD-04 | Ignora Full/Fulfillment | unit | `npx vitest run src/features/upload/lib/__tests__/parse-xlsx.test.ts` | NAO Wave 0 |
| UPLD-05 | Classifica Unitario/Kit/Combo | unit | `npx vitest run src/features/upload/lib/__tests__/classify.test.ts` | NAO Wave 0 |
| UPLD-07 | Agrupa linhas mesmo numero_pedido | unit | `npx vitest run src/features/upload/lib/__tests__/classify.test.ts` | NAO Wave 0 |
| UPLD-08 | Virada de dia limpa banco | integration | manual-only (requer Supabase) | -- |
| UPLD-10 | Classifica metodo envio 6 grupos | unit | `npx vitest run src/features/upload/lib/__tests__/envio-groups.test.ts` | NAO Wave 0 |
| UPLD-01 | Upload de arquivo .xlsx | e2e | manual-only (requer browser + Supabase) | -- |
| UPLD-06 | Deduplicacao entre importacoes | integration | manual-only (requer Supabase) | -- |
| UPLD-09 | Numeracao sequencial | integration | manual-only (requer Supabase) | -- |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Instalar vitest: `npm i -D vitest`
- [ ] Criar vitest.config.ts com path aliases
- [ ] `src/features/upload/lib/__tests__/parse-xlsx.test.ts` -- UPLD-02, UPLD-03, UPLD-04
- [ ] `src/features/upload/lib/__tests__/classify.test.ts` -- UPLD-05, UPLD-07
- [ ] `src/features/upload/lib/__tests__/envio-groups.test.ts` -- UPLD-10

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | getUser() no Route Handler (nao confiar apenas no JWT) |
| V3 Session Management | nao | Gerenciado pelo Supabase SSR (Phase 2) |
| V4 Access Control | sim | Verificar role = admin ou lider no Route Handler |
| V5 Input Validation | sim | Validar estrutura dos dados parseados antes de insert |
| V6 Cryptography | nao | Nenhuma operacao criptografica nesta phase |

### Known Threat Patterns for Upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Upload de arquivo malicioso | Tampering | Parse no frontend com SheetJS (nao executa macros); backend recebe apenas dados JSON ja parseados, nunca o arquivo binario |
| Injection via conteudo da planilha | Tampering | Sanitizar strings antes de insert; Supabase usa parametrized queries internamente |
| CSRF em Route Handler | Spoofing | Route Handler POST com autenticacao via cookie (Supabase SSR valida session) |
| Privilege escalation | Elevation | Verificar role no Route Handler (nao depender apenas do middleware) |
| Mass delete na virada de dia | Denial of Service | Apenas lider/admin pode disparar upload; virada e automatica e nao apagavel pelo usuario |

## Sources

### Primary (HIGH confidence)
- [database.types.ts] — Schema completo das tabelas pedidos, config, progresso, reservas, atribuicoes
- [types/index.ts] — TipoPedido, StatusProgresso types
- [PROJECT.md] — Mapeamento ERP (13 colunas), grupos de envio (6), card_key format
- [middleware.ts] — API routes pulam auth (linha 58)
- [docs.sheetjs.com/installation/nodejs] — SheetJS 0.20.3 via CDN, npm 0.18.5 desatualizado

### Secondary (MEDIUM confidence)
- [supabase.com/docs/reference/javascript/insert] — Batch insert com arrays
- [docs.sheetjs.com/api/parse-options] — read() options, type 'array', cellDates

### Tertiary (LOW confidence)
- Supabase delete filter requirement — [ASSUMED] baseado em comportamento conhecido

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SheetJS verificado via docs oficiais, Supabase ja instalado e testado
- Architecture: HIGH — Padrao hibrido frontend/backend definido em D-05, schema do banco verificado
- Pitfalls: HIGH — Verificados contra docs (SheetJS CDN, FK constraints) e logica de negocio (regex order)
- Logica de negocio: HIGH — Regras de classificacao, deduplicacao e virada de dia bem definidas em CONTEXT.md

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stack estavel, regras de negocio definidas)

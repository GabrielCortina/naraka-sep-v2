import { read, utils } from 'xlsx'

/**
 * Mapeamento das 13 colunas do ERP UpSeller para nomes internos:
 * 'No de Pedido da Plataforma' -> numero_pedido_plataforma
 * 'No de Pedido' -> numero_pedido
 * 'Plataformas' -> plataforma
 * 'Nome da Loja no UpSeller' -> loja
 * 'Estado do Pedido' -> estado_pedido (filtro, nao no output)
 * 'Prazo de Envio' -> prazo_envio
 * 'SKU (Armazem)' -> sku
 * 'Quantidade de Produtos' -> quantidade
 * 'Quantidade Mapeada' -> descartado
 * 'Variacao' -> variacao
 * 'Nome do Produto' -> nome_produto
 * 'Metodo de Envio' -> metodo_envio
 * 'Etiqueta' -> descartado
 */

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
  filtered_status: number
  filtered_envio: number
  total_raw: number
}

const FULLFILMENT_REGEX = /full|fulfillment/i

/** Remove acentos e converte para lowercase para comparação de headers */
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Busca valor numa row usando header normalizado (aceita com ou sem acento) */
function col(raw: Record<string, unknown>, target: string): unknown {
  // Tenta chave exata primeiro (mais rápido)
  if (target in raw) return raw[target]
  // Fallback: busca por header normalizado
  const normalized = normalizeKey(target)
  for (const key of Object.keys(raw)) {
    if (normalizeKey(key) === normalized) return raw[key]
  }
  return undefined
}

export function parseXlsx(buffer: ArrayBuffer): ParseResult {
  const workbook = read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet)

  const rows: ParsedRow[] = []
  let filtered_status = 0
  let filtered_envio = 0
  const total_raw = rawRows.length

  for (const raw of rawRows) {
    const estado = String(col(raw, 'Estado do Pedido') ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (estado !== 'em processo') {
      filtered_status++
      continue
    }

    const metodoEnvio = String(col(raw, 'Método de Envio') ?? '')
    if (FULLFILMENT_REGEX.test(metodoEnvio)) {
      filtered_envio++
      continue
    }

    const row: ParsedRow = {
      numero_pedido_plataforma: String(col(raw, 'No de Pedido da Plataforma') ?? ''),
      numero_pedido: String(col(raw, 'No de Pedido') ?? ''),
      plataforma: String(col(raw, 'Plataformas') ?? ''),
      loja: String(col(raw, 'Nome da Loja no UpSeller') ?? ''),
      prazo_envio: col(raw, 'Prazo de Envio') != null ? String(col(raw, 'Prazo de Envio')) : null,
      sku: String(col(raw, 'SKU (Armazém)') ?? ''),
      quantidade: Number(col(raw, 'Quantidade de Produtos')) || 0,
      variacao: col(raw, 'Variação') != null ? String(col(raw, 'Variação')) : null,
      nome_produto: col(raw, 'Nome do Produto') != null ? String(col(raw, 'Nome do Produto')) : null,
      metodo_envio: metodoEnvio,
    }

    rows.push(row)
  }

  return { rows, filtered_status, filtered_envio, total_raw }
}

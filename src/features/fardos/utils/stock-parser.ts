import { getSheetData } from '@/lib/google-sheets'
import { getCached, setCache, invalidateCache } from './stock-cache'
import type { StockItem } from '../types'

const STOCK_CACHE_KEY = 'estoque'

/** Remove acentos e converte para lowercase para comparação de headers (mesmo padrão do parse-xlsx) */
function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Colunas esperadas da planilha de estoque (normalizadas sem acento, lowercase).
 * Headers reais: PRIORIDADE, PRATELEIRA, POSIÇÃO, ALTURA, ENDEREÇO, SKU, QUANTIDADE,
 * CODIGO UPSELLER, DATA ENTRADA, HORA ENTRADA, OPERADOR, TRANFERENCIA, DATA TRANFERENCIA, OPERADOR
 */
const REQUIRED_COLUMNS = {
  sku: 'sku',
  quantidade: 'quantidade',
  codigo_in: 'codigo upseller',
  endereco: 'endereco',
  posicao: 'posicao',
} as const

/**
 * Retry generico com backoff exponencial.
 * Delays: baseDelay * 2^0, baseDelay * 2^1, baseDelay * 2^2 (1s, 2s, 4s com default)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}

/**
 * Le e parseia a planilha de estoque via Google Sheets API.
 *
 * - Cache de 2 minutos (D-05) evita chamadas repetidas
 * - Retry 3x com backoff exponencial (D-03)
 * - Headers mapeados por nome, case-insensitive com trim
 * - Rows invalidas (codigo_in vazio, sku vazio, quantidade NaN/<=0) sao ignoradas (T-04-03)
 */
export async function fetchStock(forceRefresh = false): Promise<StockItem[]> {
  // Invalidar cache se forceRefresh (D-02: re-reserva manual)
  if (forceRefresh) {
    invalidateCache(STOCK_CACHE_KEY)
  }

  // Tentar cache primeiro (D-05)
  const cached = getCached<StockItem[]>(STOCK_CACHE_KEY)
  if (cached) return cached

  // Buscar dados da planilha com retry (D-03)
  const rows = await withRetry(() => getSheetData('Estoque'))
  if (!rows || rows.length < 2) return []

  // Mapear headers por nome normalizado (sem acentos, lowercase, trim — mesmo padrão do parse-xlsx)
  const headers = rows[0].map((h: string) => normalizeHeader(h?.toString() ?? ''))
  const colIndex = {
    sku: headers.indexOf(REQUIRED_COLUMNS.sku),
    quantidade: headers.indexOf(REQUIRED_COLUMNS.quantidade),
    codigo_in: headers.indexOf(REQUIRED_COLUMNS.codigo_in),
    endereco: headers.indexOf(REQUIRED_COLUMNS.endereco),
    posicao: headers.indexOf(REQUIRED_COLUMNS.posicao),
  }

  // Validar colunas obrigatorias (posicao é opcional)
  const requiredKeys = ['sku', 'quantidade', 'codigo_in', 'endereco'] as const
  const missing = requiredKeys.filter(k => colIndex[k] === -1)
  if (missing.length > 0) {
    console.error(`[estoque] Colunas faltando: ${missing.join(', ')}`)
    return []
  }

  // Parsear rows, ignorando invalidas (T-04-03)
  const items: StockItem[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const codigo_in = row[colIndex.codigo_in]?.toString().trim()
    const sku = row[colIndex.sku]?.toString().trim()
    const quantidade = Number(row[colIndex.quantidade])
    const endereco = row[colIndex.endereco]?.toString().trim() ?? ''
    const posicao = colIndex.posicao !== -1
      ? row[colIndex.posicao]?.toString().trim() ?? ''
      : ''

    // Pular linhas invalidas
    if (!codigo_in || !sku || isNaN(quantidade) || quantidade <= 0) continue

    items.push({ codigo_in, sku, quantidade, endereco, posicao })
  }

  // Cachear resultado (D-05)
  setCache(STOCK_CACHE_KEY, items)
  return items
}

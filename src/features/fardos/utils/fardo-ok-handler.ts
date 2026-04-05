/** Headers da planilha normalizados (padrao NFD do stock-parser.ts) */
function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Busca fardo na planilha por codigo IN com match exato (D-15) */
export function findBaleInSheet(
  rows: string[][],
  codigoIn: string
): { rowIndex: number; rowData: string[]; headers: string[] } | null {
  if (!rows || rows.length < 2) return null

  const headers = rows[0].map(h => normalizeHeader(h?.toString() ?? ''))
  const codigoCol = headers.indexOf('codigo upseller')
  if (codigoCol === -1) return null

  const normalizedTarget = codigoIn.trim().toLowerCase()
  for (let i = 1; i < rows.length; i++) {
    const cellValue = rows[i][codigoCol]?.toString().trim().toLowerCase()
    if (cellValue === normalizedTarget) {
      return { rowIndex: i, rowData: rows[i], headers }
    }
  }
  return null
}

/** Mapeia linha da planilha para campos do trafego_fardos (D-16) */
export function mapRowToTrafegoFields(rowData: string[], headers: string[]) {
  const get = (name: string) => {
    const idx = headers.indexOf(normalizeHeader(name))
    return idx !== -1 ? (rowData[idx]?.toString().trim() || null) : null
  }

  // A planilha tem 2 colunas OPERADOR (col K e col N).
  // col K = operador, col N = operador_transferencia
  // headers.indexOf retorna o PRIMEIRO match, entao precisamos buscar o segundo
  const operadorIdx = headers.indexOf('operador')
  const operadorTransfIdx = headers.lastIndexOf('operador')

  return {
    prioridade: get('PRIORIDADE'),
    prateleira: get('PRATELEIRA'),
    posicao: get('POSICAO'),       // ou POSICAO — NFD normalize trata
    altura: get('ALTURA'),
    endereco: get('ENDERECO'),     // ou ENDERECO
    sku: get('SKU'),
    quantidade: Number(get('QUANTIDADE')) || 0,
    codigo_upseller: get('CODIGO UPSELLER'),
    data_entrada: get('DATA ENTRADA'),
    hora_entrada: get('HORA ENTRADA'),
    operador: operadorIdx !== -1 ? (rowData[operadorIdx]?.toString().trim() || null) : null,
    transferencia: get('TRANFERENCIA'),  // planilha real tem TRANFERENCIA (sem S)
    data_transferencia: get('DATA TRANFERENCIA'),
    operador_transferencia: operadorTransfIdx !== -1 && operadorTransfIdx !== operadorIdx
      ? (rowData[operadorTransfIdx]?.toString().trim() || null)
      : null,
  }
}

/** Dupla verificacao: re-le a linha e confere se codigo IN bate (D-17) */
export function validateRowMatch(
  originalCodigoIn: string,
  recheckRow: string[],
  headers: string[]
): boolean {
  const codigoCol = headers.indexOf('codigo upseller')
  if (codigoCol === -1) return false
  return recheckRow[codigoCol]?.toString().trim().toLowerCase() ===
         originalCodigoIn.trim().toLowerCase()
}

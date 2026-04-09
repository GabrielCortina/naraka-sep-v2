/** Response type from GET /api/baixa/buscar */
export interface BaixaFardoResult {
  trafego_id: string
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string | null
  marketplace_color: string
  entregas: EntregaInfo[]
}

export interface EntregaInfo {
  card_key: string
  grupo_envio: string
  separador_nome: string | null  // null = nao atribuido (D-11)
}

/** Item returned by GET /api/baixa/hoje */
export interface BaixadoItem {
  codigo_in: string
  sku: string
  quantidade: number
  endereco: string | null
  entregas: Pick<EntregaInfo, 'card_key' | 'separador_nome'>[]
  baixado_em: string
}

/** Marketplace color map per UIUX-04 and D-06 */
const MARKETPLACE_COLORS: Record<string, string> = {
  'shopee': '#ee4d2d',
  'ml': '#ffe600',
  'mercado livre': '#ffe600',
  'tiktok': '#25F4EE',
  'shein': '#000000',
}

/** Returns hex color for the marketplace based on grupo_envio string.
 *  Uses case-insensitive partial match. Default: '#000000'. */
export function getMarketplaceColor(grupoEnvio: string): string {
  const lower = grupoEnvio.toLowerCase()
  for (const [key, color] of Object.entries(MARKETPLACE_COLORS)) {
    if (lower.includes(key)) return color
  }
  return '#000000'
}

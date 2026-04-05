export const DEADLINES: Record<string, number> = {
  'Shopee SPX': 11,
  'ML Flex': 12,
  'ML Coleta': 14,
  'TikTok Shop': 15,
  'Shein': 16,
  'Shopee Xpress': 19,
}

export const COLUMN_ORDER: string[] = [
  'Shopee SPX',
  'ML Flex',
  'ML Coleta',
  'TikTok Shop',
  'Shein',
  'Shopee Xpress',
]

export const MARKETPLACE_COLORS: Record<string, { bg: string; text: string }> = {
  'Shopee SPX': { bg: 'bg-shopee', text: 'text-white' },
  'ML Flex': { bg: 'bg-ml', text: 'text-black' },
  'ML Coleta': { bg: 'bg-ml', text: 'text-black' },
  'TikTok Shop': { bg: 'bg-tiktok', text: 'text-black' },
  'Shein': { bg: 'bg-shein', text: 'text-white' },
  'Shopee Xpress': { bg: 'bg-shopee', text: 'text-white' },
}

export const TYPE_ABBREV: Record<string, string> = {
  'Unitario': 'U.',
  'Kit': 'K.',
  'Combo': 'C.',
}

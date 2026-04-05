const ENVIO_RULES: { pattern: RegExp; grupo: string }[] = [
  // ORDEM IMPORTA: TikTok antes de Shopee Xpress (D-08)
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
  return 'Outro'
}

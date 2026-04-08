import { describe, it, expect } from 'vitest'
import { getMarketplaceColor } from '../baixa-utils'

describe('getMarketplaceColor', () => {
  it('returns Shopee color for "Shopee Xpress"', () => {
    expect(getMarketplaceColor('Shopee Xpress')).toBe('#ee4d2d')
  })

  it('returns Mercado Livre color for "Mercado Livre"', () => {
    expect(getMarketplaceColor('Mercado Livre')).toBe('#ffe600')
  })

  it('returns TikTok color for "TikTok Shop"', () => {
    expect(getMarketplaceColor('TikTok Shop')).toBe('#25F4EE')
  })

  it('returns Shein color for "Shein"', () => {
    expect(getMarketplaceColor('Shein')).toBe('#000000')
  })

  it('returns default black for unknown carrier', () => {
    expect(getMarketplaceColor('Unknown Carrier')).toBe('#000000')
  })

  it('is case insensitive', () => {
    expect(getMarketplaceColor('shopee')).toBe('#ee4d2d')
  })
})

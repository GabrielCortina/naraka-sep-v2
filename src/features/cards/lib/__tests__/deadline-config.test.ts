import { describe, it, expect } from 'vitest'
import { DEADLINES, COLUMN_ORDER, MARKETPLACE_COLORS, TYPE_ABBREV } from '../deadline-config'

describe('DEADLINES', () => {
  it('maps Shopee SPX to 11', () => {
    expect(DEADLINES['Shopee SPX']).toBe(11)
  })

  it('maps ML Flex to 12', () => {
    expect(DEADLINES['ML Flex']).toBe(12)
  })

  it('maps ML Coleta to 14', () => {
    expect(DEADLINES['ML Coleta']).toBe(14)
  })

  it('maps TikTok Shop to 15', () => {
    expect(DEADLINES['TikTok Shop']).toBe(15)
  })

  it('maps Shein to 16', () => {
    expect(DEADLINES['Shein']).toBe(16)
  })

  it('maps Shopee Xpress to 19', () => {
    expect(DEADLINES['Shopee Xpress']).toBe(19)
  })
})

describe('COLUMN_ORDER', () => {
  it('has 6 entries ordered by ascending deadline', () => {
    expect(COLUMN_ORDER).toHaveLength(6)
    expect(COLUMN_ORDER).toEqual([
      'Shopee SPX',
      'ML Flex',
      'ML Coleta',
      'TikTok Shop',
      'Shein',
      'Shopee Xpress',
    ])
  })
})

describe('MARKETPLACE_COLORS', () => {
  it('maps Shopee SPX with shopee bg and white text', () => {
    expect(MARKETPLACE_COLORS['Shopee SPX']).toEqual({ bg: 'bg-shopee', text: 'text-white' })
  })

  it('maps ML Flex with ml bg and black text', () => {
    expect(MARKETPLACE_COLORS['ML Flex']).toEqual({ bg: 'bg-ml', text: 'text-black' })
  })

  it('maps ML Coleta with ml bg and black text', () => {
    expect(MARKETPLACE_COLORS['ML Coleta']).toEqual({ bg: 'bg-ml', text: 'text-black' })
  })

  it('maps TikTok Shop with tiktok bg and black text', () => {
    expect(MARKETPLACE_COLORS['TikTok Shop']).toEqual({ bg: 'bg-tiktok', text: 'text-black' })
  })

  it('maps Shein with shein bg and white text', () => {
    expect(MARKETPLACE_COLORS['Shein']).toEqual({ bg: 'bg-shein', text: 'text-white' })
  })

  it('maps Shopee Xpress with shopee bg and white text', () => {
    expect(MARKETPLACE_COLORS['Shopee Xpress']).toEqual({ bg: 'bg-shopee', text: 'text-white' })
  })
})

describe('TYPE_ABBREV', () => {
  it('abbreviates Unitario to U.', () => {
    expect(TYPE_ABBREV['Unitario']).toBe('U.')
  })

  it('abbreviates Kit to K.', () => {
    expect(TYPE_ABBREV['Kit']).toBe('K.')
  })

  it('abbreviates Combo to C.', () => {
    expect(TYPE_ABBREV['Combo']).toBe('C.')
  })
})

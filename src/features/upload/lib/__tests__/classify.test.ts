import { describe, it, expect } from 'vitest'
import { classifyOrders, generateCardKey } from '../classify'
import type { ParsedRow } from '../parse-xlsx'

function makeRow(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return {
    numero_pedido_plataforma: 'PLAT-001',
    numero_pedido: 'PED-001',
    plataforma: 'Shopee',
    loja: 'ELIS SHOPEE',
    prazo_envio: '2026-04-05',
    sku: 'SKU-A',
    quantidade: 1,
    variacao: 'P',
    nome_produto: 'Camiseta',
    metodo_envio: 'Shopee Xpress',
    ...overrides,
  }
}

describe('classifyOrders', () => {
  it('classifica Unitario: 1 SKU, quantidade 1', () => {
    const rows = [makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 1 })]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('unitario')
  })

  it('classifica Kit: 1 SKU, quantidade > 1', () => {
    const rows = [makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 3 })]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('kit')
  })

  it('classifica Kit: multiplas linhas mesmo SKU', () => {
    const rows = [
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 1 }),
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 1 }),
    ]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('kit')
  })

  it('classifica Combo: 2+ SKUs diferentes', () => {
    const rows = [
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 1 }),
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-B', quantidade: 1 }),
    ]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('combo')
  })

  it('agrupa linhas com mesmo numero_pedido (UPLD-07)', () => {
    const rows = [
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A' }),
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-B' }),
      makeRow({ numero_pedido: 'PED-002', sku: 'SKU-C' }),
    ]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(2)
    const ped1 = result.find(o => o.numero_pedido === 'PED-001')!
    const ped2 = result.find(o => o.numero_pedido === 'PED-002')!
    expect(ped1.items).toHaveLength(2)
    expect(ped2.items).toHaveLength(1)
  })

  it('nao confunde Kit com Combo quando linhas duplicadas tem mesmo SKU', () => {
    const rows = [
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 1 }),
      makeRow({ numero_pedido: 'PED-001', sku: 'SKU-A', quantidade: 2 }),
    ]
    const result = classifyOrders(rows)

    expect(result).toHaveLength(1)
    expect(result[0].tipo).toBe('kit')
  })
})

describe('generateCardKey', () => {
  it('gera card_key no formato grupo|tipo|importacao_numero', () => {
    expect(generateCardKey('TikTok', 'unitario', 1)).toBe('TikTok|unitario|1')
  })
})

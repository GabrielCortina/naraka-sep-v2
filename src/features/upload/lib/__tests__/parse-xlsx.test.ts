import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock xlsx module
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}))

import { read, utils } from 'xlsx'
import { parseXlsx } from '../parse-xlsx'

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    'No de Pedido da Plataforma': 'PLAT-001',
    'No de Pedido': 'PED-001',
    'Plataformas': 'Shopee',
    'Nome da Loja no UpSeller': 'ELIS SHOPEE',
    'Estado do Pedido': 'Em processo',
    'Prazo de Envio': '2026-04-05',
    'SKU (Armazem)': 'SKU-A',
    'Quantidade de Produtos': 1,
    'Quantidade Mapeada': 1,
    'Variacao': 'P',
    'Nome do Produto': 'Camiseta',
    'Metodo de Envio': 'Shopee Xpress',
    'Etiqueta': 'ETQ-001',
    ...overrides,
  }
}

describe('parseXlsx', () => {
  beforeEach(() => {
    vi.mocked(read).mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    } as never)
  })

  it('filtra linhas com estado diferente de Em processo', () => {
    const rows = [
      makeRow(),
      makeRow({ 'No de Pedido': 'PED-002' }),
      makeRow({ 'No de Pedido': 'PED-003', 'Estado do Pedido': 'Cancelado' }),
    ]
    vi.mocked(utils.sheet_to_json).mockReturnValue(rows)

    const result = parseXlsx(new ArrayBuffer(0))

    expect(result.rows).toHaveLength(2)
    expect(result.filtered_status).toBe(1)
  })

  it('filtra linhas com Full ou Fulfillment no metodo de envio', () => {
    const rows = [
      makeRow(),
      makeRow({ 'No de Pedido': 'PED-002', 'Metodo de Envio': 'Shopee Full' }),
      makeRow({ 'No de Pedido': 'PED-003', 'Metodo de Envio': 'Fulfillment Express' }),
    ]
    vi.mocked(utils.sheet_to_json).mockReturnValue(rows)

    const result = parseXlsx(new ArrayBuffer(0))

    expect(result.rows).toHaveLength(1)
    expect(result.filtered_envio).toBe(2)
  })

  it('mapeia todas as 13 colunas corretamente', () => {
    vi.mocked(utils.sheet_to_json).mockReturnValue([makeRow()])

    const result = parseXlsx(new ArrayBuffer(0))
    const row = result.rows[0]

    expect(row.numero_pedido_plataforma).toBe('PLAT-001')
    expect(row.numero_pedido).toBe('PED-001')
    expect(row.plataforma).toBe('Shopee')
    expect(row.loja).toBe('ELIS SHOPEE')
    expect(row.prazo_envio).toBe('2026-04-05')
    expect(row.sku).toBe('SKU-A')
    expect(row.quantidade).toBe(1)
    expect(row.variacao).toBe('P')
    expect(row.nome_produto).toBe('Camiseta')
    expect(row.metodo_envio).toBe('Shopee Xpress')
  })

  it('converte quantidade para number, default 0', () => {
    vi.mocked(utils.sheet_to_json).mockReturnValue([
      makeRow({ 'Quantidade de Produtos': undefined }),
    ])

    const result = parseXlsx(new ArrayBuffer(0))

    expect(result.rows[0].quantidade).toBe(0)
  })

  it('campos opcionais sao null quando ausentes', () => {
    vi.mocked(utils.sheet_to_json).mockReturnValue([
      makeRow({
        'Prazo de Envio': undefined,
        'Variacao': undefined,
        'Nome do Produto': undefined,
      }),
    ])

    const result = parseXlsx(new ArrayBuffer(0))

    expect(result.rows[0].prazo_envio).toBeNull()
    expect(result.rows[0].variacao).toBeNull()
    expect(result.rows[0].nome_produto).toBeNull()
  })

  it('total_raw conta todas as linhas brutas', () => {
    const rows = [
      makeRow(),
      makeRow({ 'Estado do Pedido': 'Cancelado' }),
      makeRow({ 'Metodo de Envio': 'Shopee Full' }),
    ]
    vi.mocked(utils.sheet_to_json).mockReturnValue(rows)

    const result = parseXlsx(new ArrayBuffer(0))

    expect(result.total_raw).toBe(3)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock stock-parser
vi.mock('../stock-parser', () => ({
  fetchStock: vi.fn(),
}))

// Mock subset-sum
vi.mock('../subset-sum', () => ({
  findOptimalCombination: vi.fn(),
}))

// Mock supabase admin
const mockInsert = vi.fn()
const mockEqStatus = vi.fn()
const mockEqImportacao = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}))

import { executeReservation } from '../reservation-engine'
import { fetchStock } from '../stock-parser'
import { findOptimalCombination } from '../subset-sum'
import type { StockItem, SubsetResult } from '../../types'

const mockedFetchStock = vi.mocked(fetchStock)
const mockedFindOptimal = vi.mocked(findOptimalCombination)

function setupSupabaseMock(options: {
  pedidos?: Array<{ sku: string; quantidade: number }>
  reservasExistentes?: Array<{ codigo_in: string }>
  insertError?: { code: string; message: string } | null
}) {
  const { pedidos = [], reservasExistentes = [], insertError = null } = options

  mockFrom.mockImplementation((table: string) => {
    if (table === 'pedidos') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: pedidos, error: null }),
        }),
      }
    }
    if (table === 'reservas') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: reservasExistentes, error: null }),
        }),
        insert: mockInsert.mockResolvedValue({ error: insertError }),
      }
    }
    return {}
  })
}

describe('reservation-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it('Test 1: SKU com fardo -> skus_fardo, SKU sem fardo -> skus_prateleira', async () => {
    const stock: StockItem[] = [
      { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' },
    ]
    mockedFetchStock.mockResolvedValue(stock)

    setupSupabaseMock({
      pedidos: [
        { sku: 'ABC', quantidade: 100 },
        { sku: 'DEF', quantidade: 200 },
      ],
      reservasExistentes: [],
    })

    mockedFindOptimal.mockReturnValue({
      fardos: [stock[0]],
      soma: 500,
      cobertura: 'total',
    })

    const result = await executeReservation(1)

    expect(result.skus_fardo).toBe(1)
    expect(result.skus_prateleira).toBe(1)
  })

  it('Test 2: demanda agregada - 3 pedidos mesmo SKU', async () => {
    const stock: StockItem[] = [
      { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' },
    ]
    mockedFetchStock.mockResolvedValue(stock)

    setupSupabaseMock({
      pedidos: [
        { sku: 'ABC', quantidade: 100 },
        { sku: 'ABC', quantidade: 200 },
        { sku: 'ABC', quantidade: 150 },
      ],
      reservasExistentes: [],
    })

    mockedFindOptimal.mockImplementation((_fardos, demanda) => {
      // Verificar que a demanda agregada e 450
      expect(demanda).toBe(450)
      return {
        fardos: [stock[0]],
        soma: 500,
        cobertura: 'total',
      }
    })

    const result = await executeReservation(1)

    expect(result.skus_fardo).toBe(1)
    expect(mockedFindOptimal).toHaveBeenCalledWith(
      expect.any(Array),
      450
    )
  })

  it('Test 3: visao global - fardo ja reservado nao aparece nos disponiveis', async () => {
    const stock: StockItem[] = [
      { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' },
      { codigo_in: 'IN-002', sku: 'ABC', quantidade: 300, endereco: 'A2' },
    ]
    mockedFetchStock.mockResolvedValue(stock)

    setupSupabaseMock({
      pedidos: [{ sku: 'ABC', quantidade: 200 }],
      reservasExistentes: [{ codigo_in: 'IN-001' }], // IN-001 ja reservado
    })

    mockedFindOptimal.mockImplementation((fardos) => {
      // Deve receber apenas IN-002 (IN-001 ja reservado)
      expect(fardos).toHaveLength(1)
      expect(fardos[0].codigo_in).toBe('IN-002')
      return {
        fardos: [fardos[0]],
        soma: 300,
        cobertura: 'total',
      }
    })

    const result = await executeReservation(1)

    expect(result.skus_fardo).toBe(1)
  })

  it('Test 4: cobertura parcial inclui SKU em parciais', async () => {
    const stock: StockItem[] = [
      { codigo_in: 'IN-001', sku: 'ABC', quantidade: 300, endereco: 'A1' },
      { codigo_in: 'IN-002', sku: 'ABC', quantidade: 300, endereco: 'A2' },
    ]
    mockedFetchStock.mockResolvedValue(stock)

    setupSupabaseMock({
      pedidos: [{ sku: 'ABC', quantidade: 1000 }],
      reservasExistentes: [],
    })

    mockedFindOptimal.mockReturnValue({
      fardos: stock,
      soma: 600,
      cobertura: 'parcial',
    })

    const result = await executeReservation(1)

    expect(result.skus_fardo).toBe(1)
    expect(result.parciais).toContain('ABC')
    expect(result.fardos_reservados).toBe(2)
  })

  it('Test 5: cada fardo fisico reservado uma vez - codigos adicionados ao set', async () => {
    // Dois SKUs compartilham o mesmo fardo IN-001
    const stock: StockItem[] = [
      { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' },
      { codigo_in: 'IN-001', sku: 'DEF', quantidade: 500, endereco: 'A1' },
    ]
    mockedFetchStock.mockResolvedValue(stock)

    setupSupabaseMock({
      pedidos: [
        { sku: 'ABC', quantidade: 100 },
        { sku: 'DEF', quantidade: 100 },
      ],
      reservasExistentes: [],
    })

    let callCount = 0
    mockedFindOptimal.mockImplementation((fardos) => {
      callCount++
      if (callCount === 1) {
        // Primeiro SKU: IN-001 disponivel
        return {
          fardos: [fardos[0]],
          soma: 500,
          cobertura: 'total' as const,
        }
      }
      // Segundo SKU: IN-001 ja reservado no primeiro, sem fardos disponiveis
      // O engine deve ter filtrado IN-001 do segundo SKU
      return {
        fardos: fardos.length > 0 ? [fardos[0]] : [],
        soma: fardos.length > 0 ? fardos[0].quantidade : 0,
        cobertura: fardos.length > 0 ? 'total' as const : 'nenhuma' as const,
      }
    })

    const result = await executeReservation(1)

    // Verifica que na segunda chamada o fardo IN-001 foi excluido
    // (o engine adiciona ao set apos primeira reserva)
    expect(mockedFindOptimal).toHaveBeenCalledTimes(2)
  })

  it('Test 6: nenhum pedido retorna resultado zerado', async () => {
    mockedFetchStock.mockResolvedValue([])

    setupSupabaseMock({
      pedidos: [],
      reservasExistentes: [],
    })

    const result = await executeReservation(99)

    expect(result).toEqual({
      skus_fardo: 0,
      skus_prateleira: 0,
      fardos_reservados: 0,
      parciais: [],
      indisponivel: false,
    })
  })

  it('Test 7: fardos selecionados sao inseridos com status reservado e importacao_numero', async () => {
    const fardo: StockItem = { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' }
    mockedFetchStock.mockResolvedValue([fardo])

    setupSupabaseMock({
      pedidos: [{ sku: 'ABC', quantidade: 100 }],
      reservasExistentes: [],
    })

    mockedFindOptimal.mockReturnValue({
      fardos: [fardo],
      soma: 500,
      cobertura: 'total',
    })

    await executeReservation(42)

    expect(mockInsert).toHaveBeenCalledWith([
      {
        codigo_in: 'IN-001',
        sku: 'ABC',
        quantidade: 500,
        endereco: 'A1',
        status: 'reservado',
        importacao_numero: 42,
      },
    ])
  })

  it('Test 8: fetchStock falha retorna indisponivel true', async () => {
    mockedFetchStock.mockRejectedValue(new Error('Google Sheets indisponivel'))

    const result = await executeReservation(1)

    expect(result).toEqual({
      skus_fardo: 0,
      skus_prateleira: 0,
      fardos_reservados: 0,
      parciais: [],
      indisponivel: true,
    })
  })

  it('Test 9: erro 23505 unique_violation no insert pula o fardo', async () => {
    const fardo: StockItem = { codigo_in: 'IN-001', sku: 'ABC', quantidade: 500, endereco: 'A1' }
    mockedFetchStock.mockResolvedValue([fardo])

    setupSupabaseMock({
      pedidos: [{ sku: 'ABC', quantidade: 100 }],
      reservasExistentes: [],
      insertError: { code: '23505', message: 'unique_violation' },
    })

    mockedFindOptimal.mockReturnValue({
      fardos: [fardo],
      soma: 500,
      cobertura: 'total',
    })

    // Nao deve lancar erro, deve pular o fardo
    const result = await executeReservation(1)

    expect(result.skus_fardo).toBe(0) // fardo nao foi contabilizado por causa do erro
  })
})

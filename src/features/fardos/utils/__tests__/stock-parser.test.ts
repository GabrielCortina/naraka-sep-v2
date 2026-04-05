import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock google-sheets
vi.mock('@/lib/google-sheets', () => ({
  getSheetData: vi.fn(),
}))

// Mock stock-cache
vi.mock('../stock-cache', () => ({
  getCached: vi.fn().mockReturnValue(null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}))

import { fetchStock, withRetry } from '../stock-parser'
import { getSheetData } from '@/lib/google-sheets'
import { getCached, setCache, invalidateCache } from '../stock-cache'
import type { StockItem } from '../../types'

const mockedGetSheetData = vi.mocked(getSheetData)
const mockedGetCached = vi.mocked(getCached)
const mockedSetCache = vi.mocked(setCache)
const mockedInvalidateCache = vi.mocked(invalidateCache)

describe('stock-parser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetCached.mockReturnValue(null)
  })

  describe('fetchStock', () => {
    it('Test 1: parse valido com 3 data rows retorna 3 StockItem', async () => {
      mockedGetSheetData.mockResolvedValue([
        ['SKU', 'QUANTIDADE', 'CODIGO UPSELLER', 'ENDERECO'],
        ['ABC-001', '100', 'IN-001', 'A1-01'],
        ['DEF-002', '200', 'IN-002', 'B2-03'],
        ['GHI-003', '50', 'IN-003', 'C3-05'],
      ])

      const result = await fetchStock()

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        sku: 'ABC-001',
        quantidade: 100,
        codigo_in: 'IN-001',
        endereco: 'A1-01',
      })
      expect(result[1]).toEqual({
        sku: 'DEF-002',
        quantidade: 200,
        codigo_in: 'IN-002',
        endereco: 'B2-03',
      })
      expect(result[2]).toEqual({
        sku: 'GHI-003',
        quantidade: 50,
        codigo_in: 'IN-003',
        endereco: 'C3-05',
      })
    })

    it('Test 2: colunas faltando retorna array vazio', async () => {
      mockedGetSheetData.mockResolvedValue([
        ['QUANTIDADE', 'CODIGO UPSELLER', 'ENDERECO'],
        ['100', 'IN-001', 'A1-01'],
      ])

      const result = await fetchStock()

      expect(result).toEqual([])
    })

    it('Test 3: linhas invalidas sao ignoradas', async () => {
      mockedGetSheetData.mockResolvedValue([
        ['SKU', 'QUANTIDADE', 'CODIGO UPSELLER', 'ENDERECO'],
        ['ABC-001', 'NaN', 'IN-001', 'A1-01'],   // quantidade NaN
        ['DEF-002', '200', '', 'B2-03'],           // codigo_in vazio
        ['GHI-003', '50', 'IN-003', 'C3-05'],     // valido
      ])

      const result = await fetchStock()

      expect(result).toHaveLength(1)
      expect(result[0].sku).toBe('GHI-003')
    })

    it('Test 4: headers case insensitive funciona', async () => {
      mockedGetSheetData.mockResolvedValue([
        ['sku', 'quantidade', 'codigo upseller', 'endereco'],
        ['ABC-001', '100', 'IN-001', 'A1-01'],
      ])

      const result = await fetchStock()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        sku: 'ABC-001',
        quantidade: 100,
        codigo_in: 'IN-001',
        endereco: 'A1-01',
      })
    })

    it('Test 5: cache hit nao chama getSheetData', async () => {
      const cachedItems: StockItem[] = [
        { sku: 'CACHED', quantidade: 999, codigo_in: 'IN-999', endereco: 'Z9-99' },
      ]
      mockedGetCached.mockReturnValue(cachedItems)

      const result = await fetchStock()

      expect(result).toEqual(cachedItems)
      expect(mockedGetSheetData).not.toHaveBeenCalled()
    })

    it('Test 6: cache expired chama getSheetData novamente', async () => {
      mockedGetCached.mockReturnValue(null) // expired
      mockedGetSheetData.mockResolvedValue([
        ['SKU', 'QUANTIDADE', 'CODIGO UPSELLER', 'ENDERECO'],
        ['FRESH-001', '300', 'IN-FRESH', 'D4-07'],
      ])

      const result = await fetchStock()

      expect(mockedGetSheetData).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(1)
      expect(result[0].sku).toBe('FRESH-001')
      expect(mockedSetCache).toHaveBeenCalledWith('estoque', result)
    })

    it('Test 7: forceRefresh invalida cache antes de buscar', async () => {
      mockedGetSheetData.mockResolvedValue([
        ['SKU', 'QUANTIDADE', 'CODIGO UPSELLER', 'ENDERECO'],
        ['FORCE-001', '150', 'IN-FORCE', 'E5-09'],
      ])

      await fetchStock(true)

      expect(mockedInvalidateCache).toHaveBeenCalledWith('estoque')
      expect(mockedGetSheetData).toHaveBeenCalled()
    })
  })

  describe('withRetry', () => {
    it('Test 7: falha 2x e sucede na 3a retorna dados', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(fn, 3, 0) // baseDelay=0 para testes rapidos

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('Test 8: falha 3x lanca erro', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValueOnce(new Error('fail 3'))

      await expect(withRetry(fn, 3, 0)).rejects.toThrow('fail 3')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })
})

import { describe, it, expect } from 'vitest'
import { findCascadeBales } from '../cascade-engine'
import type { StockItem } from '@/features/fardos/types'

function makeBale(codigo_in: string, sku: string, quantidade: number): StockItem {
  return {
    codigo_in,
    sku,
    quantidade,
    endereco: 'A1-01',
    posicao: '1',
  }
}

describe('findCascadeBales', () => {
  it('Priority 1: selects single bale closest to demand when one covers', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 100),
      makeBale('F2', 'SKU-A', 50),
      makeBale('F3', 'SKU-A', 30),
    ]
    const result = findCascadeBales(stock, 'SKU-A', 48, new Set(), new Set())
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F2') // 50 is closest to 48
    expect(result.quantidade_coberta).toBe(48)
    expect(result.quantidade_transformacao).toBe(0)
  })

  it('Priority 2: selects single bale that covers fully even if much larger', () => {
    const stock = [makeBale('F1', 'SKU-A', 200)]
    const result = findCascadeBales(stock, 'SKU-A', 48, new Set(), new Set())
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F1')
    expect(result.quantidade_coberta).toBe(48)
    expect(result.quantidade_transformacao).toBe(0)
  })

  it('Priority 3: returns multiple bales greedy descending when no single bale covers, full coverage', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 30),
      makeBale('F2', 'SKU-A', 20),
      makeBale('F3', 'SKU-A', 10),
    ]
    const result = findCascadeBales(stock, 'SKU-A', 55, new Set(), new Set())
    expect(result.fardos).toHaveLength(3) // 30+20+10=60 >= 55
    expect(result.quantidade_coberta).toBe(55)
    expect(result.quantidade_transformacao).toBe(0)
  })

  it('Priority 3 partial: returns multiple bales with remainder going to transformacao', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 30),
      makeBale('F2', 'SKU-A', 20),
    ]
    const result = findCascadeBales(stock, 'SKU-A', 55, new Set(), new Set())
    expect(result.fardos).toHaveLength(2) // 30+20=50 < 55
    expect(result.quantidade_coberta).toBe(50)
    expect(result.quantidade_transformacao).toBe(5)
  })

  it('Priority 4: returns empty fardos with full transformacao when no bales available', () => {
    const stock: StockItem[] = []
    const result = findCascadeBales(stock, 'SKU-A', 48, new Set(), new Set())
    expect(result.fardos).toHaveLength(0)
    expect(result.quantidade_coberta).toBe(0)
    expect(result.quantidade_transformacao).toBe(48)
  })

  it('excludes bales in reservedSet', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 50),
      makeBale('F2', 'SKU-A', 60),
    ]
    const reserved = new Set(['F2'])
    const result = findCascadeBales(stock, 'SKU-A', 48, reserved, new Set())
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F1')
  })

  it('excludes bales in naoEncontradosSet', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 50),
      makeBale('F2', 'SKU-A', 60),
    ]
    const naoEncontrados = new Set(['F1'])
    const result = findCascadeBales(stock, 'SKU-A', 48, new Set(), naoEncontrados)
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F2')
  })

  it('only considers bales matching the requested SKU', () => {
    const stock = [
      makeBale('F1', 'SKU-A', 50),
      makeBale('F2', 'SKU-B', 100),
      makeBale('F3', 'SKU-A', 30),
    ]
    const result = findCascadeBales(stock, 'SKU-A', 48, new Set(), new Set())
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F1') // 50 closest to 48
    // SKU-B bale should not be considered
    expect(result.fardos.every(f => f.sku === 'SKU-A')).toBe(true)
  })
})

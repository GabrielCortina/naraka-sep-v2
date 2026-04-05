import { describe, it, expect } from 'vitest'
import { findAlternativeBale } from '../fardo-ne-handler'
import type { StockItem } from '../../types'

const STOCK: StockItem[] = [
  { codigo_in: 'F-001', sku: 'SKU-A', quantidade: 100, endereco: 'E-01', posicao: 'A1' },
  { codigo_in: 'F-002', sku: 'SKU-A', quantidade: 80, endereco: 'E-02', posicao: 'A2' },
  { codigo_in: 'F-003', sku: 'SKU-A', quantidade: 50, endereco: 'E-03', posicao: 'A3' },
  { codigo_in: 'F-004', sku: 'SKU-B', quantidade: 200, endereco: 'E-04', posicao: 'B1' },
]

describe('findAlternativeBale', () => {
  it('retorna StockItem quando fardo alternativo disponivel dentro de 20% margem', () => {
    // Demanda 90, fardos SKU-A: 100 (dentro de 20% = 108), 80, 50
    // findOptimalCombination deve encontrar 100 (exato ou por cima dentro de 20%)
    const result = findAlternativeBale(STOCK, 'SKU-A', 90, new Set(), false)
    expect(result).not.toBeNull()
    expect(result!.sku).toBe('SKU-A')
  })

  it('retorna null quando nenhum fardo alternativo disponivel', () => {
    const result = findAlternativeBale(STOCK, 'SKU-Z', 100, new Set(), false)
    expect(result).toBeNull()
  })

  it('filtra fardos ja reservados (Set de codigos_in)', () => {
    // Reservar todos os fardos SKU-A
    const reserved = new Set(['F-001', 'F-002', 'F-003'])
    const result = findAlternativeBale(STOCK, 'SKU-A', 90, reserved, false)
    expect(result).toBeNull()
  })

  it('usa findOptimalCombination para importacao normal (margem 20%)', () => {
    // Demanda 100: F-001 (100) e exato, F-002 (80) esta dentro de 20% abaixo? Nao, 80 < 100.
    // subset sum com [100, 80, 50] para demanda 100: exato = F-001 (100)
    const result = findAlternativeBale(STOCK, 'SKU-A', 100, new Set(), false)
    expect(result).not.toBeNull()
    expect(result!.quantidade).toBe(100)
    expect(result!.codigo_in).toBe('F-001')
  })
})

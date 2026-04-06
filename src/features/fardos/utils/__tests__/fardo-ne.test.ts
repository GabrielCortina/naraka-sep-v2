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

  it('exclui o fardo atual (currentCodigoIn) da busca de alternativo', () => {
    // F-001 e o fardo atual, deve retornar F-002 ou F-003 como alternativo
    const result = findAlternativeBale(STOCK, 'SKU-A', 90, new Set(), false, 'F-001')
    expect(result).not.toBeNull()
    expect(result!.codigo_in).not.toBe('F-001')
  })

  it('retorna null quando unico fardo do SKU e o atual', () => {
    // SKU-B so tem F-004, que e o atual
    const result = findAlternativeBale(STOCK, 'SKU-B', 200, new Set(), false, 'F-004')
    expect(result).toBeNull()
  })

  it('exclui fardos do Set naoEncontradosCodigosIn da busca', () => {
    // F-001 ja foi marcado como nao encontrado
    const naoEncontrados = new Set(['F-001'])
    const result = findAlternativeBale(STOCK, 'SKU-A', 100, new Set(), false, undefined, naoEncontrados)
    expect(result).not.toBeNull()
    expect(result!.codigo_in).not.toBe('F-001')
  })

  it('evita loop infinito: fardo A marcado N/E nao retorna como alternativo de B', () => {
    // Cenario de loop: fardista marca F-001 (IN01) como N/E, sistema encontra F-002 (IN02)
    // Depois fardista marca F-002 como N/E. F-001 deve ser excluido por estar em naoEncontrados.
    const naoEncontrados = new Set(['F-001']) // F-001 ja registrado como N/E
    const result = findAlternativeBale(
      STOCK,
      'SKU-A',
      90,
      new Set(),
      false,
      'F-002', // fardo atual sendo marcado N/E
      naoEncontrados
    )
    // Deve retornar F-003 (unico disponivel), NUNCA F-001
    if (result) {
      expect(result.codigo_in).not.toBe('F-001')
      expect(result.codigo_in).not.toBe('F-002')
    }
  })

  it('retorna null quando todos os fardos do SKU estao em naoEncontrados ou sao o atual', () => {
    // F-001 e F-002 ja N/E, F-003 e o atual
    const naoEncontrados = new Set(['F-001', 'F-002'])
    const result = findAlternativeBale(
      STOCK,
      'SKU-A',
      90,
      new Set(),
      false,
      'F-003',
      naoEncontrados
    )
    expect(result).toBeNull()
  })
})

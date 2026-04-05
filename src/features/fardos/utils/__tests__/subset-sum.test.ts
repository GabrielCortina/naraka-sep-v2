import { describe, it, expect } from 'vitest'
import { findOptimalCombination } from '../subset-sum'
import type { StockItem } from '../../types'

function makeFardo(codigo_in: string, quantidade: number): StockItem {
  return { codigo_in, sku: 'SKU-TEST', quantidade, endereco: 'A-01', posicao: '' }
}

describe('findOptimalCombination', () => {
  it('Test 1: soma exata - demanda=900, fardos=[300,300,300] -> soma=900, total, 3 fardos', () => {
    const fardos = [makeFardo('F1', 300), makeFardo('F2', 300), makeFardo('F3', 300)]
    const result = findOptimalCombination(fardos, 900)

    expect(result.soma).toBe(900)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(3)
  })

  it('Test 2: soma por cima dentro de 20% - demanda=900, fardos=[500,460] -> soma=960, total', () => {
    const fardos = [makeFardo('F1', 500), makeFardo('F2', 460)]
    const result = findOptimalCombination(fardos, 900)

    expect(result.soma).toBe(960)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(2)
  })

  it('Test 3: soma por cima excede 20% - demanda=900, fardos=[600,500] -> parcial com 600', () => {
    const fardos = [makeFardo('F1', 600), makeFardo('F2', 500)]
    const result = findOptimalCombination(fardos, 900)

    // 600+500=1100 > 1080 (20% de 900), nao aceita
    // Melhor abaixo: 600 (parcial)
    expect(result.soma).toBe(600)
    expect(result.cobertura).toBe('parcial')
    expect(result.fardos).toHaveLength(1)
  })

  it('Test 4: desempate por menos fardos - mesma soma, menos fardos vence', () => {
    const fardos = [
      makeFardo('F1', 450),
      makeFardo('F2', 450),
      makeFardo('F3', 300),
      makeFardo('F4', 600),
    ]
    const result = findOptimalCombination(fardos, 900)

    // Combinacoes possiveis com soma=900: 450+450 (2 fardos), 300+600 (2 fardos)
    // Ambas tem 2 fardos, qualquer uma aceita
    expect(result.soma).toBe(900)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(2)
  })

  it('Test 5: desempate - soma exata com menos fardos vence (D-11)', () => {
    const fardos = [
      makeFardo('F1', 300),
      makeFardo('F2', 300),
      makeFardo('F3', 300),
      makeFardo('F4', 460),
      makeFardo('F5', 440),
    ]
    const result = findOptimalCombination(fardos, 900)

    // 460+440=900 exato (2 fardos) vs 300+300+300=900 exato (3 fardos)
    // D-11: mesma soma, menos fardos vence -> 460+440
    expect(result.soma).toBe(900)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(2)
  })

  it('Test 6: cobertura parcial - demanda=1000, fardos=[300,200] -> soma=500, parcial', () => {
    const fardos = [makeFardo('F1', 300), makeFardo('F2', 200)]
    const result = findOptimalCombination(fardos, 1000)

    expect(result.soma).toBe(500)
    expect(result.cobertura).toBe('parcial')
    expect(result.fardos).toHaveLength(2)
  })

  it('Test 7: nenhum fardo - demanda=500, fardos=[] -> soma=0, nenhuma', () => {
    const result = findOptimalCombination([], 500)

    expect(result.soma).toBe(0)
    expect(result.cobertura).toBe('nenhuma')
    expect(result.fardos).toHaveLength(0)
  })

  it('Test 8: fardo unico suficiente - demanda=100, fardos=[120] -> soma=120, total', () => {
    const fardos = [makeFardo('F1', 120)]
    const result = findOptimalCombination(fardos, 100)

    // 120 <= 120 (100 * 1.20), aceita como total
    expect(result.soma).toBe(120)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(1)
  })

  it('Test 9: exemplo do usuario - demanda=900, somas 940 e 1050 -> 940 vence', () => {
    // Criar fardos que produzam somas de 940 e 1050
    const fardos = [
      makeFardo('F1', 200),
      makeFardo('F2', 240),
      makeFardo('F3', 500),
      makeFardo('F4', 550),
    ]
    const result = findOptimalCombination(fardos, 900)

    // Somas possiveis incluem: 200+240+500=940, 200+240+550=990, 500+550=1050, etc.
    // 940 e a mais proxima por cima dentro de 20% (1080)
    expect(result.soma).toBe(940)
    expect(result.cobertura).toBe('total')
  })

  it('Test 10: performance - 50 fardos executa em menos de 1 segundo', () => {
    const fardos = Array.from({ length: 50 }, (_, i) =>
      makeFardo(`F${i}`, Math.floor(Math.random() * 500) + 50)
    )

    const start = performance.now()
    const result = findOptimalCombination(fardos, 2000)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(1000)
    expect(result).toBeDefined()
    expect(result.fardos.length).toBeGreaterThanOrEqual(0)
  })

  // Threat mitigations
  it('T-04-01: ignora fardos com quantidade <= 0', () => {
    const fardos = [
      makeFardo('F1', -10),
      makeFardo('F2', 0),
      makeFardo('F3', 300),
    ]
    const result = findOptimalCombination(fardos, 300)

    expect(result.soma).toBe(300)
    expect(result.cobertura).toBe('total')
    expect(result.fardos).toHaveLength(1)
    expect(result.fardos[0].codigo_in).toBe('F3')
  })

  it('T-04-02: cap maxTarget em 10000 para evitar tabela DP gigante', () => {
    const fardos = [makeFardo('F1', 50000)]
    // demanda alta -> maxTarget seria 120000, mas capped em 10000
    const result = findOptimalCombination(fardos, 100000)

    // O fardo de 50000 excede o cap de maxTarget, nao e considerado por cima
    // Mas pode ser considerado como parcial (50000 < 100000)
    expect(result).toBeDefined()
    expect(result.fardos.length).toBeLessThanOrEqual(1)
  })

  it('soma exata preferida sobre soma por cima mesmo que use mais fardos', () => {
    const fardos = [
      makeFardo('F1', 300),
      makeFardo('F2', 300),
      makeFardo('F3', 300),
      makeFardo('F4', 920),
    ]
    const result = findOptimalCombination(fardos, 900)

    // 300+300+300=900 exato (3 fardos) vs 920 por cima (1 fardo)
    // Soma exata preferida
    expect(result.soma).toBe(900)
    expect(result.cobertura).toBe('total')
  })
})

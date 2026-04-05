import { describe, it, expect } from 'vitest'
import {
  findBaleInSheet,
  mapRowToTrafegoFields,
  validateRowMatch,
} from '../fardo-ok-handler'

/**
 * Headers reais da planilha de estoque (14 colunas A-N):
 * PRIORIDADE, PRATELEIRA, POSICAO, ALTURA, ENDERECO, SKU, QUANTIDADE,
 * CODIGO UPSELLER, DATA ENTRADA, HORA ENTRADA, OPERADOR, TRANFERENCIA,
 * DATA TRANFERENCIA, OPERADOR
 */
const HEADERS = [
  'PRIORIDADE',
  'PRATELEIRA',
  'POSICAO',
  'ALTURA',
  'ENDERECO',
  'SKU',
  'QUANTIDADE',
  'CODIGO UPSELLER',
  'DATA ENTRADA',
  'HORA ENTRADA',
  'OPERADOR',
  'TRANFERENCIA',
  'DATA TRANFERENCIA',
  'OPERADOR',
]

const MOCK_ROWS: string[][] = [
  HEADERS,
  ['Alta', 'P1', 'A3', '2m', 'E-01', 'SKU-001', '100', 'FARDO-001', '01/04', '08:00', 'Joao', 'T-001', '02/04', 'Maria'],
  ['Media', 'P2', 'B1', '1.5m', 'E-02', 'SKU-002', '50', 'FARDO-002', '01/04', '09:00', 'Pedro', 'T-002', '02/04', 'Ana'],
  ['Baixa', 'P3', 'C2', '1m', 'E-03', 'SKU-003', '75', 'FARDO-003', '01/04', '10:00', 'Lucas', '', '', ''],
]

describe('findBaleInSheet', () => {
  it('retorna rowIndex e rowData quando codigo_in encontrado com match exato', () => {
    const result = findBaleInSheet(MOCK_ROWS, 'FARDO-001')
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(1)
    expect(result!.rowData).toEqual(MOCK_ROWS[1])
    expect(result!.headers.length).toBe(14)
  })

  it('retorna null quando codigo_in nao encontrado', () => {
    const result = findBaleInSheet(MOCK_ROWS, 'FARDO-999')
    expect(result).toBeNull()
  })

  it('ignora diferencas de case e espacos', () => {
    const result = findBaleInSheet(MOCK_ROWS, '  fardo-002  ')
    expect(result).not.toBeNull()
    expect(result!.rowIndex).toBe(2)
    expect(result!.rowData[7]).toBe('FARDO-002')
  })
})

describe('mapRowToTrafegoFields', () => {
  it('mapeia colunas A-N para campos corretos do trafego_fardos', () => {
    const headers = HEADERS.map(h =>
      h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
    const mapped = mapRowToTrafegoFields(MOCK_ROWS[1], headers)

    expect(mapped.prioridade).toBe('Alta')
    expect(mapped.prateleira).toBe('P1')
    expect(mapped.posicao).toBe('A3')
    expect(mapped.altura).toBe('2m')
    expect(mapped.endereco).toBe('E-01')
    expect(mapped.sku).toBe('SKU-001')
    expect(mapped.quantidade).toBe(100)
    expect(mapped.codigo_upseller).toBe('FARDO-001')
    expect(mapped.data_entrada).toBe('01/04')
    expect(mapped.hora_entrada).toBe('08:00')
    expect(mapped.operador).toBe('Joao')
    expect(mapped.transferencia).toBe('T-001')
    expect(mapped.data_transferencia).toBe('02/04')
    expect(mapped.operador_transferencia).toBe('Maria')
  })

  it('preserva colunas A-E como dados lidos (nao apaga)', () => {
    const headers = HEADERS.map(h =>
      h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
    const mapped = mapRowToTrafegoFields(MOCK_ROWS[2], headers)

    // Colunas A-E sao prioridade, prateleira, posicao, altura, endereco
    expect(mapped.prioridade).toBe('Media')
    expect(mapped.prateleira).toBe('P2')
    expect(mapped.posicao).toBe('B1')
    expect(mapped.altura).toBe('1.5m')
    expect(mapped.endereco).toBe('E-02')
  })
})

describe('validateRowMatch', () => {
  it('retorna true quando codigo_in da re-leitura bate com original', () => {
    const headers = HEADERS.map(h =>
      h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
    const result = validateRowMatch('FARDO-001', MOCK_ROWS[1], headers)
    expect(result).toBe(true)
  })

  it('retorna false quando linha mudou (race condition)', () => {
    const headers = HEADERS.map(h =>
      h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    )
    // Simular que a linha mudou: agora tem FARDO-999 na posicao do codigo
    const changedRow = [...MOCK_ROWS[1]]
    changedRow[7] = 'FARDO-999'
    const result = validateRowMatch('FARDO-001', changedRow, headers)
    expect(result).toBe(false)
  })
})

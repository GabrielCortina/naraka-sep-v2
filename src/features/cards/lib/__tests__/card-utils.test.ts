import { describe, it, expect } from 'vitest'
import {
  groupByCardKey,
  getUrgencyTier,
  calcProgress,
  isCardComplete,
  formatCountdown,
  aggregateItems,
} from '../card-utils'
import type { Tables } from '@/types/database.types'

type PedidoRow = Tables<'pedidos'>
type ProgressoRow = Tables<'progresso'>
type ReservaRow = Tables<'reservas'>

function makePedido(overrides: Partial<PedidoRow> = {}): PedidoRow {
  return {
    id: 'ped-1',
    card_key: 'Shopee SPX|Unitario|1',
    grupo_envio: 'Shopee SPX',
    tipo: 'Unitario',
    importacao_numero: 1,
    sku: 'SKU-001',
    quantidade: 5,
    numero_pedido: 'PED-001',
    numero_pedido_plataforma: null,
    metodo_envio: 'SPX Entrega Rapida',
    loja: 'NARAKA SHOPEE',
    plataforma: 'Shopee',
    nome_produto: null,
    prazo_envio: null,
    variacao: null,
    created_at: new Date().toISOString(),
    importacao_data: new Date().toISOString(),
    ...overrides,
  }
}

function makeProgresso(overrides: Partial<ProgressoRow> = {}): ProgressoRow {
  return {
    id: 'prog-1',
    pedido_id: 'ped-1',
    quantidade_separada: 0,
    status: 'pendente',
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeReserva(overrides: Partial<ReservaRow> = {}): ReservaRow {
  return {
    id: 'res-1',
    codigo_in: 'FARDO-001',
    sku: 'SKU-001',
    quantidade: 10,
    endereco: 'A1-01',
    importacao_numero: 1,
    status: 'reservado',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('groupByCardKey', () => {
  it('groups pedidos with same card_key together', () => {
    const pedidos = [
      makePedido({ id: 'p1', card_key: 'A|U|1' }),
      makePedido({ id: 'p2', card_key: 'A|U|1' }),
      makePedido({ id: 'p3', card_key: 'B|K|1' }),
    ]
    const result = groupByCardKey(pedidos)
    expect(result.get('A|U|1')).toHaveLength(2)
    expect(result.get('B|K|1')).toHaveLength(1)
  })

  it('returns empty map for empty input', () => {
    const result = groupByCardKey([])
    expect(result.size).toBe(0)
  })

  it('creates separate groups for different card_keys', () => {
    const pedidos = [
      makePedido({ id: 'p1', card_key: 'X|U|1' }),
      makePedido({ id: 'p2', card_key: 'Y|U|1' }),
      makePedido({ id: 'p3', card_key: 'Z|U|1' }),
    ]
    const result = groupByCardKey(pedidos)
    expect(result.size).toBe(3)
  })
})

describe('getUrgencyTier', () => {
  it('returns done when progress is 100%', () => {
    const now = new Date('2026-04-05T08:00:00') // bem antes do deadline
    expect(getUrgencyTier('Shopee SPX', 100, now)).toBe('done')
  })

  it('returns done when progress is 100% even if overdue', () => {
    const now = new Date('2026-04-05T23:00:00') // bem depois do deadline
    expect(getUrgencyTier('Shopee SPX', 100, now)).toBe('done')
  })

  it('returns overdue when current time is past deadline', () => {
    const now = new Date('2026-04-05T12:00:00') // 12h, Shopee SPX deadline is 11h
    expect(getUrgencyTier('Shopee SPX', 50, now)).toBe('overdue')
  })

  it('returns warning when less than 2h to deadline', () => {
    const now = new Date('2026-04-05T09:30:00') // 1.5h before 11h deadline
    expect(getUrgencyTier('Shopee SPX', 50, now)).toBe('warning')
  })

  it('returns ok when more than 2h to deadline', () => {
    const now = new Date('2026-04-05T08:00:00') // 3h before 11h deadline
    expect(getUrgencyTier('Shopee SPX', 50, now)).toBe('ok')
  })

  it('returns ok for unknown grupo_envio (no deadline)', () => {
    const now = new Date('2026-04-05T08:00:00')
    expect(getUrgencyTier('Outro', 50, now)).toBe('ok')
  })

  it('returns warning at exactly 2h before deadline', () => {
    const now = new Date('2026-04-05T09:00:00') // exactly 2h before 11h
    expect(getUrgencyTier('Shopee SPX', 50, now)).toBe('warning')
  })

  it('returns overdue at exactly deadline time', () => {
    const now = new Date('2026-04-05T11:00:00') // exactly at 11h
    expect(getUrgencyTier('Shopee SPX', 50, now)).toBe('overdue')
  })
})

describe('calcProgress', () => {
  it('calculates total, separadas and percent correctly', () => {
    const items = [
      { quantidade: 10, quantidade_separada: 3 },
      { quantidade: 5, quantidade_separada: 5 },
    ]
    const result = calcProgress(items)
    expect(result.total).toBe(15)
    expect(result.separadas).toBe(8)
    expect(result.percent).toBe(53)
  })

  it('returns 100% when all separated', () => {
    const items = [
      { quantidade: 5, quantidade_separada: 5 },
      { quantidade: 3, quantidade_separada: 3 },
    ]
    const result = calcProgress(items)
    expect(result.percent).toBe(100)
  })

  it('returns 0% when nothing separated', () => {
    const items = [
      { quantidade: 10, quantidade_separada: 0 },
    ]
    const result = calcProgress(items)
    expect(result.percent).toBe(0)
  })

  it('returns 0% for empty items array', () => {
    const result = calcProgress([])
    expect(result.total).toBe(0)
    expect(result.separadas).toBe(0)
    expect(result.percent).toBe(0)
  })

  it('rounds percent to integer', () => {
    const items = [
      { quantidade: 3, quantidade_separada: 1 },
    ]
    const result = calcProgress(items)
    expect(result.percent).toBe(33) // 33.33 rounds to 33
  })
})

describe('isCardComplete', () => {
  it('returns true when percent is 100', () => {
    expect(isCardComplete({ percent: 100 })).toBe(true)
  })

  it('returns false when percent is less than 100', () => {
    expect(isCardComplete({ percent: 99 })).toBe(false)
  })

  it('returns false when percent is 0', () => {
    expect(isCardComplete({ percent: 0 })).toBe(false)
  })
})

describe('formatCountdown', () => {
  it('formats 2 hours as "2h 0min"', () => {
    expect(formatCountdown(7200000)).toBe('2h 0min')
  })

  it('formats 1.5 hours as "1h 30min"', () => {
    expect(formatCountdown(5400000)).toBe('1h 30min')
  })

  it('returns null for negative values (overdue)', () => {
    expect(formatCountdown(-1)).toBeNull()
  })

  it('returns null for zero (exactly at deadline)', () => {
    expect(formatCountdown(0)).toBeNull()
  })

  it('formats minutes only when less than 1 hour', () => {
    expect(formatCountdown(1800000)).toBe('0h 30min')
  })
})

describe('aggregateItems', () => {
  it('groups pedidos by SKU and sums quantities', () => {
    const pedidos = [
      makePedido({ id: 'p1', sku: 'SKU-001', quantidade: 5 }),
      makePedido({ id: 'p2', sku: 'SKU-001', quantidade: 3 }),
      makePedido({ id: 'p3', sku: 'SKU-002', quantidade: 2 }),
    ]
    const progressMap = new Map<string, ProgressoRow>([
      ['p1', makeProgresso({ pedido_id: 'p1', quantidade_separada: 5, status: 'separado' })],
      ['p2', makeProgresso({ pedido_id: 'p2', quantidade_separada: 3, status: 'separado' })],
      ['p3', makeProgresso({ pedido_id: 'p3', quantidade_separada: 0, status: 'pendente' })],
    ])
    const reservasBySku = new Map<string, ReservaRow[]>([
      ['SKU-001', [makeReserva({ sku: 'SKU-001', codigo_in: 'F1', quantidade: 10 })]],
    ])

    const result = aggregateItems(pedidos, progressMap, reservasBySku)

    const sku001 = result.find(i => i.sku === 'SKU-001')!
    expect(sku001.quantidade_necessaria).toBe(8)
    expect(sku001.quantidade_separada).toBe(8)
    expect(sku001.status).toBe('separado')
    expect(sku001.pedido_ids).toContain('p1')
    expect(sku001.pedido_ids).toContain('p2')
    expect(sku001.reservas).toHaveLength(1)

    const sku002 = result.find(i => i.sku === 'SKU-002')!
    expect(sku002.quantidade_necessaria).toBe(2)
    expect(sku002.quantidade_separada).toBe(0)
    expect(sku002.status).toBe('pendente')
  })

  it('sets status parcial when partially separated', () => {
    const pedidos = [
      makePedido({ id: 'p1', sku: 'SKU-001', quantidade: 10 }),
    ]
    const progressMap = new Map<string, ProgressoRow>([
      ['p1', makeProgresso({ pedido_id: 'p1', quantidade_separada: 3, status: 'parcial' })],
    ])

    const result = aggregateItems(pedidos, progressMap, new Map())
    expect(result[0].status).toBe('parcial')
  })

  it('sets status nao_encontrado when any pedido has nao_encontrado', () => {
    const pedidos = [
      makePedido({ id: 'p1', sku: 'SKU-001', quantidade: 5 }),
      makePedido({ id: 'p2', sku: 'SKU-001', quantidade: 3 }),
    ]
    const progressMap = new Map<string, ProgressoRow>([
      ['p1', makeProgresso({ pedido_id: 'p1', quantidade_separada: 5, status: 'separado' })],
      ['p2', makeProgresso({ pedido_id: 'p2', quantidade_separada: 0, status: 'nao_encontrado' })],
    ])

    const result = aggregateItems(pedidos, progressMap, new Map())
    expect(result[0].status).toBe('nao_encontrado')
  })

  it('returns empty array for empty pedidos', () => {
    const result = aggregateItems([], new Map(), new Map())
    expect(result).toEqual([])
  })

  it('handles pedidos without progress entries as pendente', () => {
    const pedidos = [
      makePedido({ id: 'p1', sku: 'SKU-001', quantidade: 5 }),
    ]
    const result = aggregateItems(pedidos, new Map(), new Map())
    expect(result[0].quantidade_separada).toBe(0)
    expect(result[0].status).toBe('pendente')
  })
})

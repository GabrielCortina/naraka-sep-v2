import { describe, it, expect } from 'vitest'
import {
  computeResumo,
  computeProgressao,
  computeTopSeparadores,
  computeTopFardistas,
  computeStatusFardos,
  computePorSeparador,
} from '../dashboard-queries'

// Helper types matching the raw DB shapes
interface PedidoRow { id: string; card_key: string; grupo_envio: string; tipo: string; sku: string; quantidade: number; importacao_numero: number }
interface ProgressoRow { pedido_id: string; quantidade_separada: number; status: string }
interface AtribuicaoRow { card_key: string; user_id: string; tipo: string; users: { nome: string } | null }
interface TrafegoRow { codigo_in: string; status: string }
interface BaixadoRow { codigo_in: string; baixado_por: string }
interface TransformacaoRow { card_key: string; quantidade: number }

// Shared test data
const pedidos: PedidoRow[] = [
  { id: 'p1', card_key: 'Shopee SPX|unitario|1', grupo_envio: 'Shopee SPX', tipo: 'unitario', sku: 'SKU-A', quantidade: 10, importacao_numero: 1 },
  { id: 'p2', card_key: 'Shopee SPX|unitario|1', grupo_envio: 'Shopee SPX', tipo: 'unitario', sku: 'SKU-B', quantidade: 20, importacao_numero: 1 },
  { id: 'p3', card_key: 'ML Flex|kit|1', grupo_envio: 'ML Flex', tipo: 'kit', sku: 'SKU-C', quantidade: 30, importacao_numero: 1 },
  { id: 'p4', card_key: 'ML Flex|kit|1', grupo_envio: 'ML Flex', tipo: 'kit', sku: 'SKU-D', quantidade: 40, importacao_numero: 1 },
]

const progressoAllDone: ProgressoRow[] = [
  { pedido_id: 'p1', quantidade_separada: 10, status: 'separado' },
  { pedido_id: 'p2', quantidade_separada: 20, status: 'separado' },
  { pedido_id: 'p3', quantidade_separada: 30, status: 'separado' },
  { pedido_id: 'p4', quantidade_separada: 40, status: 'separado' },
]

const progressoPartial: ProgressoRow[] = [
  { pedido_id: 'p1', quantidade_separada: 10, status: 'separado' },
  { pedido_id: 'p2', quantidade_separada: 20, status: 'separado' },
  { pedido_id: 'p3', quantidade_separada: 15, status: 'parcial' },
  { pedido_id: 'p4', quantidade_separada: 0, status: 'pendente' },
]

const atribuicoes: AtribuicaoRow[] = [
  { card_key: 'Shopee SPX|unitario|1', user_id: 'u1', tipo: 'separador', users: { nome: 'Alice' } },
  { card_key: 'ML Flex|kit|1', user_id: 'u2', tipo: 'separador', users: { nome: 'Bob' } },
]

// Use a fixed "now" well before any deadline so urgency = 'ok'
const earlyMorning = new Date('2026-03-20T06:00:00-03:00')
// Use a "now" after all deadlines so urgency = 'overdue'
const lateNight = new Date('2026-03-20T23:00:00-03:00')

describe('computeResumo', () => {
  it('returns correct counts when all done', () => {
    const result = computeResumo(pedidos, progressoAllDone, atribuicoes, [], earlyMorning)
    expect(result.pecas_separadas).toBe(100)
    expect(result.listas_concluidas).toBe(2)
    expect(result.listas_pendentes).toBe(0)
    expect(result.listas_em_atraso).toBe(0)
  })

  it('counts overdue cards correctly', () => {
    const result = computeResumo(pedidos, progressoPartial, atribuicoes, [], lateNight)
    expect(result.pecas_separadas).toBe(45)
    expect(result.listas_concluidas).toBe(1) // Shopee SPX card is 100%
    expect(result.listas_em_atraso).toBe(1) // ML Flex card is overdue
    expect(result.listas_pendentes).toBe(0)
  })

  it('counts pending cards correctly', () => {
    const result = computeResumo(pedidos, progressoPartial, atribuicoes, [], earlyMorning)
    expect(result.listas_pendentes).toBe(1) // ML Flex card not overdue, not complete
    expect(result.listas_concluidas).toBe(1) // Shopee SPX complete
    expect(result.listas_em_atraso).toBe(0)
  })

  it('handles transformacao deduction', () => {
    const transformacoes: TransformacaoRow[] = [
      { card_key: 'ML Flex|kit|1', quantidade: 10 },
    ]
    // ML Flex: total=70, transformacao=10, adjusted total=60, separadas=45 => not 100%
    // Shopee SPX: 30/30 = 100% still
    const result = computeResumo(pedidos, progressoPartial, atribuicoes, transformacoes, earlyMorning)
    expect(result.pecas_separadas).toBe(45)
  })
})

describe('computeProgressao', () => {
  it('returns one entry per grupo_envio sorted by COLUMN_ORDER', () => {
    const result = computeProgressao(pedidos, progressoPartial, [], earlyMorning)
    expect(result.length).toBe(2)
    expect(result[0].grupo_envio).toBe('Shopee SPX')
    expect(result[1].grupo_envio).toBe('ML Flex')
  })

  it('computes correct percent per grupo_envio', () => {
    const result = computeProgressao(pedidos, progressoPartial, [], earlyMorning)
    // Shopee SPX: 30/30 = 100%
    expect(result[0].pecas_separadas).toBe(30)
    expect(result[0].total_pecas).toBe(30)
    expect(result[0].percent).toBe(100)
    // ML Flex: 15/70 = 21%
    expect(result[1].pecas_separadas).toBe(15)
    expect(result[1].total_pecas).toBe(70)
    expect(result[1].percent).toBe(21)
  })

  it('includes urgency tier and deadline_ms', () => {
    const result = computeProgressao(pedidos, progressoAllDone, [], earlyMorning)
    expect(result[0].urgency).toBe('done')
    expect(result[0].deadline_ms).toBeTypeOf('number')
  })
})

describe('computeTopSeparadores', () => {
  it('returns ranked list sorted by pecas_separadas desc', () => {
    const result = computeTopSeparadores(atribuicoes, pedidos, progressoAllDone, [])
    expect(result.length).toBe(2)
    // Bob has 70 pecas (p3=30 + p4=40), Alice has 30 (p1=10 + p2=20)
    expect(result[0].nome).toBe('Bob')
    expect(result[0].pecas_separadas).toBe(70)
    expect(result[0].position).toBe(1)
    expect(result[1].nome).toBe('Alice')
    expect(result[1].pecas_separadas).toBe(30)
    expect(result[1].position).toBe(2)
  })

  it('counts cards_concluidos correctly', () => {
    const result = computeTopSeparadores(atribuicoes, pedidos, progressoAllDone, [])
    // Both cards are 100% complete
    expect(result[0].cards_concluidos).toBe(1)
    expect(result[1].cards_concluidos).toBe(1)
  })
})

describe('computeTopFardistas', () => {
  const baixados: BaixadoRow[] = [
    { codigo_in: 'IN001', baixado_por: 'u3' },
    { codigo_in: 'IN002', baixado_por: 'u3' },
    { codigo_in: 'IN003', baixado_por: 'u4' },
  ]

  it('returns ranked fardistas sorted by fardos_confirmados desc', () => {
    const result = computeTopFardistas(baixados)
    expect(result.length).toBe(2)
    expect(result[0].user_id).toBe('u3')
    expect(result[0].fardos_confirmados).toBe(2)
    expect(result[0].position).toBe(1)
    expect(result[1].user_id).toBe('u4')
    expect(result[1].fardos_confirmados).toBe(1)
    expect(result[1].position).toBe(2)
  })

  it('sets pecas_separadas and cards_concluidos to 0', () => {
    const result = computeTopFardistas(baixados)
    expect(result[0].pecas_separadas).toBe(0)
    expect(result[0].cards_concluidos).toBe(0)
  })
})

describe('computeStatusFardos', () => {
  const trafego: TrafegoRow[] = [
    { codigo_in: 'IN001', status: 'pendente' },
    { codigo_in: 'IN002', status: 'pendente' },
    { codigo_in: 'IN003', status: 'encontrado' },
    { codigo_in: 'IN004', status: 'encontrado' },
    { codigo_in: 'IN005', status: 'encontrado' },
  ]
  const baixados: BaixadoRow[] = [
    { codigo_in: 'IN003', baixado_por: 'u3' },
  ]

  it('returns correct counts excluding baixados from encontrados', () => {
    const result = computeStatusFardos(trafego, baixados)
    expect(result.pendentes).toBe(2)
    expect(result.encontrados).toBe(2) // IN004, IN005 (IN003 is in baixados)
    expect(result.baixados).toBe(1)
  })
})

describe('computePorSeparador', () => {
  it('returns progress per separador sorted by percent desc', () => {
    const result = computePorSeparador(atribuicoes, pedidos, progressoPartial, [])
    expect(result.length).toBe(2)
    // Alice: Shopee SPX card 30/30 = 100%
    // Bob: ML Flex card 15/70 = 21%
    expect(result[0].nome).toBe('Alice')
    expect(result[0].percent).toBe(100)
    expect(result[1].nome).toBe('Bob')
    expect(result[1].percent).toBe(21)
  })

  it('includes correct num_cards', () => {
    const result = computePorSeparador(atribuicoes, pedidos, progressoPartial, [])
    expect(result[0].num_cards).toBe(1)
    expect(result[1].num_cards).toBe(1)
  })
})

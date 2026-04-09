import { describe, it, expect } from 'vitest'
import { buildSnapshotRows } from '../snapshot'

const pedidos = [
  { id: 'p1', card_key: 'Shopee SPX|unitario|1', grupo_envio: 'Shopee SPX', tipo: 'unitario', sku: 'SKU-A', quantidade: 10, importacao_numero: 1 },
  { id: 'p2', card_key: 'Shopee SPX|unitario|1', grupo_envio: 'Shopee SPX', tipo: 'unitario', sku: 'SKU-B', quantidade: 20, importacao_numero: 1 },
  { id: 'p3', card_key: 'ML Flex|kit|1', grupo_envio: 'ML Flex', tipo: 'kit', sku: 'SKU-C', quantidade: 30, importacao_numero: 1 },
]

const progresso = [
  { pedido_id: 'p1', quantidade_separada: 10, status: 'separado' },
  { pedido_id: 'p2', quantidade_separada: 20, status: 'separado' },
  { pedido_id: 'p3', quantidade_separada: 15, status: 'parcial' },
]

const atribuicoes = [
  { card_key: 'Shopee SPX|unitario|1', user_id: 'u1', tipo: 'separador' },
  { card_key: 'ML Flex|kit|1', user_id: 'u2', tipo: 'separador' },
]

const baixados = [
  { codigo_in: 'IN001', baixado_por: 'u3' },
  { codigo_in: 'IN002', baixado_por: 'u3' },
  { codigo_in: 'IN003', baixado_por: 'u4' },
]

const users = [
  { id: 'u1', role: 'separador', nome: 'Alice' },
  { id: 'u2', role: 'separador', nome: 'Bob' },
  { id: 'u3', role: 'fardista', nome: 'Carlos' },
  { id: 'u4', role: 'fardista', nome: 'Diana' },
  { id: 'u5', role: 'separador', nome: 'Eve' }, // No activity
]

const transformacoes = [{ card_key: 'ML Flex|kit|1', quantidade: 5 }]

describe('buildSnapshotRows', () => {
  it('produces one row per unique (user_id, grupo_envio) combination', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    // u1: Shopee SPX (separador)
    // u2: ML Flex (separador)
    // u3: todos (fardista) - 2 fardos
    // u4: todos (fardista) - 1 fardo
    // u5: no activity => no row
    const userIds = rows.map(r => r.user_id)
    expect(userIds).toContain('u1')
    expect(userIds).toContain('u2')
    expect(userIds).toContain('u3')
    expect(userIds).toContain('u4')
    expect(userIds).not.toContain('u5')
  })

  it('separador row has correct pecas_separadas per grupo_envio', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    const alice = rows.find(r => r.user_id === 'u1')
    expect(alice).toBeDefined()
    expect(alice!.grupo_envio).toBe('Shopee SPX')
    expect(alice!.pecas_separadas).toBe(30) // p1=10 + p2=20
    expect(alice!.role).toBe('separador')

    const bob = rows.find(r => r.user_id === 'u2')
    expect(bob).toBeDefined()
    expect(bob!.grupo_envio).toBe('ML Flex')
    expect(bob!.pecas_separadas).toBe(15) // p3=15
  })

  it('separador row has correct cards_concluidos', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    const alice = rows.find(r => r.user_id === 'u1')
    // Shopee SPX card: total=30, transf=0, separadas=30 => 100% => 1 card concluido
    expect(alice!.cards_concluidos).toBe(1)

    const bob = rows.find(r => r.user_id === 'u2')
    // ML Flex card: total=30, transf=5, adjusted=25, separadas=15 => not 100%
    expect(bob!.cards_concluidos).toBe(0)
  })

  it('fardista row has correct fardos_confirmados', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    const carlos = rows.find(r => r.user_id === 'u3')
    expect(carlos).toBeDefined()
    expect(carlos!.fardos_confirmados).toBe(2)
    expect(carlos!.grupo_envio).toBe('todos')
    expect(carlos!.role).toBe('fardista')

    const diana = rows.find(r => r.user_id === 'u4')
    expect(diana).toBeDefined()
    expect(diana!.fardos_confirmados).toBe(1)
  })

  it('users with no activity produce no rows', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    const eve = rows.find(r => r.user_id === 'u5')
    expect(eve).toBeUndefined()
  })

  it('today string is included in each row data field', () => {
    const rows = buildSnapshotRows({
      pedidos, progresso, atribuicoes, baixados, transformacoes, users,
    }, '2026-03-20')

    for (const row of rows) {
      expect(row.data).toBe('2026-03-20')
    }
  })
})

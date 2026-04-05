import type { Tables } from '@/types/database.types'
import type { CardItem, UrgencyTier } from '../types'
import { DEADLINES } from './deadline-config'

type PedidoRow = Tables<'pedidos'>
type ProgressoRow = Tables<'progresso'>
type ReservaRow = Tables<'reservas'>

/**
 * Agrupa pedidos por card_key.
 * Usa Array.from(Map) pattern para compatibilidade com tsconfig target.
 */
export function groupByCardKey(pedidos: PedidoRow[]): Map<string, PedidoRow[]> {
  const map = new Map<string, PedidoRow[]>()
  for (const pedido of pedidos) {
    const existing = map.get(pedido.card_key)
    if (existing) {
      existing.push(pedido)
    } else {
      map.set(pedido.card_key, [pedido])
    }
  }
  return map
}

/**
 * Retorna o tier de urgencia baseado no grupo de envio e progresso.
 * Aceita `now` opcional para testabilidade.
 */
export function getUrgencyTier(
  grupoEnvio: string,
  progressPercent: number,
  now?: Date,
): UrgencyTier {
  if (progressPercent === 100) return 'done'

  const deadlineHour = DEADLINES[grupoEnvio]
  if (deadlineHour === undefined) return 'ok'

  const currentTime = now ?? new Date()
  const deadlineTime = new Date(currentTime)
  deadlineTime.setHours(deadlineHour, 0, 0, 0)

  const diffMs = deadlineTime.getTime() - currentTime.getTime()

  if (diffMs <= 0) return 'overdue'
  if (diffMs <= 7200000) return 'warning' // 2h em ms
  return 'ok'
}

/**
 * Calcula progresso total: pecas separadas / total.
 * Percent arredondado para inteiro. Total === 0 retorna percent = 0.
 */
export function calcProgress(
  items: { quantidade: number; quantidade_separada: number }[],
): { total: number; separadas: number; percent: number } {
  let total = 0
  let separadas = 0
  for (const item of items) {
    total += item.quantidade
    separadas += item.quantidade_separada
  }
  const percent = total === 0 ? 0 : Math.round((separadas / total) * 100)
  return { total, separadas, percent }
}

/**
 * Verifica se um card esta 100% completo.
 */
export function isCardComplete(progress: { percent: number }): boolean {
  return progress.percent === 100
}

/**
 * Formata diferenca em ms para "Xh Ymin".
 * Retorna null se diffMs <= 0 (atrasado).
 */
export function formatCountdown(diffMs: number): string | null {
  if (diffMs <= 0) return null
  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}h ${mins}min`
}

/**
 * Agrupa pedidos por SKU, soma quantidades, merge status do progresso e reservas.
 */
export function aggregateItems(
  pedidos: PedidoRow[],
  progressMap: Map<string, ProgressoRow>,
  reservasBySku: Map<string, ReservaRow[]>,
): CardItem[] {
  const skuMap = new Map<
    string,
    {
      quantidade_necessaria: number
      quantidade_separada: number
      pedido_ids: string[]
      statuses: string[]
    }
  >()

  for (const pedido of pedidos) {
    const existing = skuMap.get(pedido.sku)
    const prog = progressMap.get(pedido.id)
    const qSeparada = prog?.quantidade_separada ?? 0
    const status = prog?.status ?? 'pendente'

    if (existing) {
      existing.quantidade_necessaria += pedido.quantidade
      existing.quantidade_separada += qSeparada
      existing.pedido_ids.push(pedido.id)
      existing.statuses.push(status)
    } else {
      skuMap.set(pedido.sku, {
        quantidade_necessaria: pedido.quantidade,
        quantidade_separada: qSeparada,
        pedido_ids: [pedido.id],
        statuses: [status],
      })
    }
  }

  const result: CardItem[] = []
  const entries = Array.from(skuMap.entries())

  for (const [sku, data] of entries) {
    const reservas = (reservasBySku.get(sku) ?? []).map((r) => ({
      codigo_in: r.codigo_in,
      quantidade: r.quantidade,
      endereco: r.endereco,
      status: r.status,
    }))

    // Determine aggregate status
    let status: CardItem['status']
    if (data.statuses.some((s) => s === 'nao_encontrado')) {
      status = 'nao_encontrado'
    } else if (
      data.quantidade_separada >= data.quantidade_necessaria &&
      data.quantidade_necessaria > 0
    ) {
      status = 'separado'
    } else if (data.quantidade_separada > 0) {
      status = 'parcial'
    } else {
      status = 'pendente'
    }

    result.push({
      sku,
      quantidade_necessaria: data.quantidade_necessaria,
      quantidade_separada: data.quantidade_separada,
      status,
      pedido_ids: data.pedido_ids,
      reservas,
    })
  }

  return result
}

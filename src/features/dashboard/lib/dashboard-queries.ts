import { getUrgencyTier, calcProgress } from '@/features/cards/lib/card-utils'
import { DEADLINES, COLUMN_ORDER } from '@/features/cards/lib/deadline-config'
import type { ProgressaoMetodo, RankingEntry, SeparadorProgress, ResumoData, StatusFardosData } from '../types'

interface PedidoRow { id: string; card_key: string; grupo_envio: string; tipo: string; sku: string; quantidade: number; importacao_numero: number }
interface ProgressoRow { pedido_id: string; quantidade_separada: number; status: string }
interface AtribuicaoRow { card_key: string; user_id: string; tipo: string; users: { nome: string } | null }
interface TrafegoRow { codigo_in: string; status: string; fardista_id?: string | null }
interface BaixadoRow { codigo_in: string; baixado_por: string }
interface TransformacaoRow { card_key: string; quantidade: number }

function groupByCard(pedidos: PedidoRow[]): Map<string, PedidoRow[]> {
  const map = new Map<string, PedidoRow[]>()
  for (const p of pedidos) {
    const existing = map.get(p.card_key)
    if (existing) {
      existing.push(p)
    } else {
      map.set(p.card_key, [p])
    }
  }
  return map
}

function buildProgressoMap(progresso: ProgressoRow[]): Map<string, ProgressoRow> {
  const map = new Map<string, ProgressoRow>()
  for (const p of progresso) {
    map.set(p.pedido_id, p)
  }
  return map
}

function sumTransformacoes(transformacoes: TransformacaoRow[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of transformacoes) {
    map.set(t.card_key, (map.get(t.card_key) ?? 0) + t.quantidade)
  }
  return map
}

function getCardProgress(
  cardPedidos: PedidoRow[],
  progressoMap: Map<string, ProgressoRow>,
  transformacaoTotal: number,
): { total: number; separadas: number; percent: number } {
  const items = cardPedidos.map(p => ({
    quantidade: p.quantidade,
    quantidade_separada: progressoMap.get(p.id)?.quantidade_separada ?? 0,
  }))
  return calcProgress(items, transformacaoTotal)
}

export function computeResumo(
  pedidos: PedidoRow[],
  progresso: ProgressoRow[],
  _atribuicoes: AtribuicaoRow[],
  transformacoes: TransformacaoRow[],
  now?: Date,
): ResumoData {
  const cardMap = groupByCard(pedidos)
  const progressoMap = buildProgressoMap(progresso)
  const transMap = sumTransformacoes(transformacoes)

  let pecas_separadas = 0
  let listas_pendentes = 0
  let listas_concluidas = 0
  let listas_em_atraso = 0

  const entries = Array.from(cardMap.entries())
  for (const [cardKey, cardPedidos] of entries) {
    const transTotal = transMap.get(cardKey) ?? 0
    const progress = getCardProgress(cardPedidos, progressoMap, transTotal)
    pecas_separadas += progress.separadas

    const grupoEnvio = cardPedidos[0].grupo_envio
    const urgency = getUrgencyTier(grupoEnvio, progress.percent, now)

    if (progress.percent === 100) {
      listas_concluidas++
    } else if (urgency === 'overdue') {
      listas_em_atraso++
    } else {
      listas_pendentes++
    }
  }

  const total_pedidos = entries.length
  const percent_conclusao = total_pedidos === 0 ? 0 : Math.round((listas_concluidas / total_pedidos) * 100)

  return {
    total_pedidos,
    pecas_separadas,
    percent_conclusao,
    fardos_processados: 0, // Filled by caller from statusFardos
    listas_pendentes,
    listas_concluidas,
    listas_em_atraso,
  }
}

export function computeProgressao(
  pedidos: PedidoRow[],
  progresso: ProgressoRow[],
  transformacoes: TransformacaoRow[],
  now?: Date,
): ProgressaoMetodo[] {
  const progressoMap = buildProgressoMap(progresso)
  const transMap = sumTransformacoes(transformacoes)

  const grupoMap = new Map<string, PedidoRow[]>()
  for (const p of pedidos) {
    const existing = grupoMap.get(p.grupo_envio)
    if (existing) {
      existing.push(p)
    } else {
      grupoMap.set(p.grupo_envio, [p])
    }
  }

  const result: ProgressaoMetodo[] = []
  const grupoEntries = Array.from(grupoMap.entries())

  for (const [grupoEnvio, grupoPedidos] of grupoEntries) {
    const cardMap = groupByCard(grupoPedidos)
    let totalPecas = 0
    let totalSeparadas = 0

    const cardEntries = Array.from(cardMap.entries())
    for (const [cardKey, cardPedidos] of cardEntries) {
      const transTotal = transMap.get(cardKey) ?? 0
      const progress = getCardProgress(cardPedidos, progressoMap, transTotal)
      totalPecas += progress.total
      totalSeparadas += progress.separadas
    }

    const percent = totalPecas === 0 ? 0 : Math.round((totalSeparadas / totalPecas) * 100)
    const urgency = getUrgencyTier(grupoEnvio, percent, now)

    const deadlineHour = DEADLINES[grupoEnvio]
    let deadline_ms = 0
    if (deadlineHour !== undefined) {
      const currentTime = now ?? new Date()
      const deadlineTime = new Date(currentTime)
      deadlineTime.setHours(deadlineHour, 0, 0, 0)
      deadline_ms = deadlineTime.getTime() - currentTime.getTime()
    }

    result.push({
      grupo_envio: grupoEnvio,
      total_pecas: totalPecas,
      pecas_separadas: totalSeparadas,
      percent,
      urgency,
      deadline_ms,
    })
  }

  result.sort((a, b) => {
    const idxA = COLUMN_ORDER.indexOf(a.grupo_envio)
    const idxB = COLUMN_ORDER.indexOf(b.grupo_envio)
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
  })

  return result
}

export function computeTopSeparadores(
  atribuicoes: AtribuicaoRow[],
  pedidos: PedidoRow[],
  progresso: ProgressoRow[],
  transformacoes: TransformacaoRow[],
): RankingEntry[] {
  const cardMap = groupByCard(pedidos)
  const progressoMap = buildProgressoMap(progresso)
  const transMap = sumTransformacoes(transformacoes)

  const separadores = atribuicoes.filter(a => a.tipo === 'separador')
  const userMap = new Map<string, { nome: string; pecas_separadas: number; cards_concluidos: number }>()

  for (const attr of separadores) {
    const cardPedidos = cardMap.get(attr.card_key)
    if (!cardPedidos) continue

    const transTotal = transMap.get(attr.card_key) ?? 0
    const progress = getCardProgress(cardPedidos, progressoMap, transTotal)

    const existing = userMap.get(attr.user_id)
    if (existing) {
      existing.pecas_separadas += progress.separadas
      if (progress.percent === 100) existing.cards_concluidos++
    } else {
      userMap.set(attr.user_id, {
        nome: attr.users?.nome ?? '',
        pecas_separadas: progress.separadas,
        cards_concluidos: progress.percent === 100 ? 1 : 0,
      })
    }
  }

  const sorted = Array.from(userMap.entries())
    .map(([user_id, data]) => ({
      user_id, nome: data.nome,
      pecas_separadas: data.pecas_separadas, cards_concluidos: data.cards_concluidos,
      fardos_confirmados: 0, fardos_ne: 0, position: 0,
    }))
    .sort((a, b) => b.pecas_separadas - a.pecas_separadas)

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].position = i + 1
  }
  return sorted
}

export function computeTopFardistas(
  baixados: BaixadoRow[],
  userNames?: Map<string, string>,
  trafego?: TrafegoRow[],
): RankingEntry[] {
  // Count OK (baixados) per fardista
  const okMap = new Map<string, number>()
  for (const b of baixados) {
    okMap.set(b.baixado_por, (okMap.get(b.baixado_por) ?? 0) + 1)
  }

  // Count N/E per fardista from trafego_fardos
  const neMap = new Map<string, number>()
  if (trafego) {
    for (const t of trafego) {
      if (t.status === 'nao_encontrado' && t.fardista_id) {
        neMap.set(t.fardista_id, (neMap.get(t.fardista_id) ?? 0) + 1)
      }
    }
  }

  // Merge all fardista IDs
  const allIds = new Set([...Array.from(okMap.keys()), ...Array.from(neMap.keys())])

  const sorted = Array.from(allIds)
    .map(user_id => ({
      user_id,
      nome: userNames?.get(user_id) ?? '',
      pecas_separadas: 0,
      cards_concluidos: 0,
      fardos_confirmados: okMap.get(user_id) ?? 0,
      fardos_ne: neMap.get(user_id) ?? 0,
      position: 0,
    }))
    .sort((a, b) => b.fardos_confirmados - a.fardos_confirmados)

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].position = i + 1
  }
  return sorted
}

export function computeStatusFardos(
  trafego: TrafegoRow[],
  baixados: BaixadoRow[],
): StatusFardosData {
  // After baixa, trafego_fardos row is DELETED and data moves to baixados (migration 00010).
  // So trafego_fardos only contains non-baixado fardos.
  const ok = baixados.length

  let nao_encontrado = 0
  let pendentes = 0
  const transformacao = 0
  const sem_atribuicao = 0

  for (const t of trafego) {
    if (t.status === 'nao_encontrado') {
      nao_encontrado++
    } else if (t.status === 'pendente') {
      pendentes++
    } else if (t.status === 'encontrado') {
      // encontrado but not yet baixado
      pendentes++
    }
  }

  const total = trafego.length + baixados.length

  return { ok, nao_encontrado, pendentes, transformacao, sem_atribuicao, total }
}

export function computePorSeparador(
  atribuicoes: AtribuicaoRow[],
  pedidos: PedidoRow[],
  progresso: ProgressoRow[],
  transformacoes: TransformacaoRow[],
): SeparadorProgress[] {
  const cardMap = groupByCard(pedidos)
  const progressoMap = buildProgressoMap(progresso)
  const transMap = sumTransformacoes(transformacoes)

  const separadores = atribuicoes.filter(a => a.tipo === 'separador')
  const userMap = new Map<string, { nome: string; total_pecas: number; pecas_separadas: number; num_cards: number }>()

  for (const attr of separadores) {
    const cardPedidos = cardMap.get(attr.card_key)
    if (!cardPedidos) continue

    const transTotal = transMap.get(attr.card_key) ?? 0
    const progress = getCardProgress(cardPedidos, progressoMap, transTotal)

    const existing = userMap.get(attr.user_id)
    if (existing) {
      existing.total_pecas += progress.total
      existing.pecas_separadas += progress.separadas
      existing.num_cards++
    } else {
      userMap.set(attr.user_id, {
        nome: attr.users?.nome ?? '',
        total_pecas: progress.total,
        pecas_separadas: progress.separadas,
        num_cards: 1,
      })
    }
  }

  return Array.from(userMap.entries())
    .map(([user_id, data]) => ({
      user_id, nome: data.nome,
      total_pecas: data.total_pecas, pecas_separadas: data.pecas_separadas,
      percent: data.total_pecas === 0 ? 0 : Math.round((data.pecas_separadas / data.total_pecas) * 100),
      num_cards: data.num_cards,
    }))
    .sort((a, b) => b.percent - a.percent)
}

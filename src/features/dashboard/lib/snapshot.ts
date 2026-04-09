import { calcProgress } from '@/features/cards/lib/card-utils'

interface PedidoRow { id: string; card_key: string; grupo_envio: string; tipo: string; sku: string; quantidade: number; importacao_numero: number }
interface ProgressoRow { pedido_id: string; quantidade_separada: number; status: string }
interface AtribuicaoRow { card_key: string; user_id: string; tipo: string }
interface BaixadoRow { codigo_in: string; baixado_por: string }
interface TransformacaoRow { card_key: string; quantidade: number }
interface UserRow { id: string; role: string; nome: string }

export interface HistoricoDiarioInsert {
  user_id: string
  role: string
  grupo_envio: string
  pecas_separadas: number
  cards_concluidos: number
  fardos_confirmados: number
  data: string
}

/**
 * Builds snapshot rows for historico_diario from live data.
 * Called before virada de dia cleanup to persist daily stats.
 *
 * - Separadores: one row per (user_id, grupo_envio) with pecas_separadas and cards_concluidos
 * - Fardistas: one row per user_id with grupo_envio='todos' and fardos_confirmados
 * - Users with zero activity produce no rows
 */
export function buildSnapshotRows(data: {
  pedidos: PedidoRow[]
  progresso: ProgressoRow[]
  atribuicoes: AtribuicaoRow[]
  baixados: BaixadoRow[]
  transformacoes: TransformacaoRow[]
  users: UserRow[]
}, today: string): HistoricoDiarioInsert[] {
  const rows: HistoricoDiarioInsert[] = []

  // Build lookup maps
  const userRoleMap = new Map<string, string>()
  for (const u of data.users) {
    userRoleMap.set(u.id, u.role)
  }

  const progressoMap = new Map<string, ProgressoRow>()
  for (const p of data.progresso) {
    progressoMap.set(p.pedido_id, p)
  }

  const transMap = new Map<string, number>()
  for (const t of data.transformacoes) {
    transMap.set(t.card_key, (transMap.get(t.card_key) ?? 0) + t.quantidade)
  }

  // Group pedidos by card_key
  const cardPedidos = new Map<string, PedidoRow[]>()
  for (const p of data.pedidos) {
    const existing = cardPedidos.get(p.card_key)
    if (existing) {
      existing.push(p)
    } else {
      cardPedidos.set(p.card_key, [p])
    }
  }

  // Card -> grupo_envio lookup
  const cardGrupo = new Map<string, string>()
  for (const p of data.pedidos) {
    if (!cardGrupo.has(p.card_key)) {
      cardGrupo.set(p.card_key, p.grupo_envio)
    }
  }

  // --- Separadores ---
  const separadores = data.atribuicoes.filter(a => a.tipo === 'separador')

  // Aggregate: user_id -> grupo_envio -> { pecas_separadas, cards_concluidos }
  const sepAgg = new Map<string, Map<string, { pecas_separadas: number; cards_concluidos: number }>>()

  for (const attr of separadores) {
    const pedidos = cardPedidos.get(attr.card_key)
    if (!pedidos) continue

    const grupoEnvio = cardGrupo.get(attr.card_key) ?? 'outros'
    const transTotal = transMap.get(attr.card_key) ?? 0

    const items = pedidos.map(p => ({
      quantidade: p.quantidade,
      quantidade_separada: progressoMap.get(p.id)?.quantidade_separada ?? 0,
    }))
    const progress = calcProgress(items, transTotal)

    let userGroups = sepAgg.get(attr.user_id)
    if (!userGroups) {
      userGroups = new Map()
      sepAgg.set(attr.user_id, userGroups)
    }

    const existing = userGroups.get(grupoEnvio)
    if (existing) {
      existing.pecas_separadas += progress.separadas
      if (progress.percent === 100) existing.cards_concluidos++
    } else {
      userGroups.set(grupoEnvio, {
        pecas_separadas: progress.separadas,
        cards_concluidos: progress.percent === 100 ? 1 : 0,
      })
    }
  }

  const sepEntries = Array.from(sepAgg.entries())
  for (const [userId, groups] of sepEntries) {
    const role = userRoleMap.get(userId) ?? 'separador'
    const groupEntries = Array.from(groups.entries())
    for (const [grupoEnvio, stats] of groupEntries) {
      if (stats.pecas_separadas === 0 && stats.cards_concluidos === 0) continue
      rows.push({
        user_id: userId,
        role,
        grupo_envio: grupoEnvio,
        pecas_separadas: stats.pecas_separadas,
        cards_concluidos: stats.cards_concluidos,
        fardos_confirmados: 0,
        data: today,
      })
    }
  }

  // --- Fardistas ---
  const fardistaCounts = new Map<string, number>()
  for (const b of data.baixados) {
    fardistaCounts.set(b.baixado_por, (fardistaCounts.get(b.baixado_por) ?? 0) + 1)
  }

  const fardEntries = Array.from(fardistaCounts.entries())
  for (const [userId, count] of fardEntries) {
    if (count === 0) continue
    const role = userRoleMap.get(userId) ?? 'fardista'
    rows.push({
      user_id: userId,
      role,
      grupo_envio: 'todos',
      pecas_separadas: 0,
      cards_concluidos: 0,
      fardos_confirmados: count,
      data: today,
    })
  }

  return rows
}

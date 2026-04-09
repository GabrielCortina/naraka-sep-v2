'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  computeResumo,
  computeProgressao,
  computeTopSeparadores,
  computeTopFardistas,
  computeStatusFardos,
  computePorSeparador,
} from '../lib/dashboard-queries'
import { useDashboardRealtime } from './use-dashboard-realtime'
import type { DashboardData, HistoricoDiarioRow, RankingEntry } from '../types'

/**
 * Main data hook for the dashboard.
 * Fetches all tables in parallel, computes 6 data blocks, and subscribes to realtime.
 * Rankings switch between live and historical based on period filter (D-08, Pitfall 4).
 */
export function useDashboardData(periodFilter: {
  isHistorical: boolean
  dateRange: { start: string; end: string } | null
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()

      // Fetch all live data in parallel (same pattern as useCardData)
      const [pedidosRes, progressoRes, atribuicoesRes, trafegoRes, baixadosRes, transformacoesRes] =
        await Promise.all([
          supabase.from('pedidos').select('id, card_key, grupo_envio, tipo, sku, quantidade, importacao_numero'),
          supabase.from('progresso').select('pedido_id, quantidade_separada, status'),
          supabase.from('atribuicoes').select('card_key, user_id, tipo, users(nome)'),
          supabase.from('trafego_fardos').select('codigo_in, status'),
          supabase.from('baixados').select('codigo_in, baixado_por'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('transformacoes').select('card_key, quantidade'),
        ])

      if (pedidosRes.error) throw pedidosRes.error
      if (progressoRes.error) throw progressoRes.error
      if (atribuicoesRes.error) throw atribuicoesRes.error
      if (trafegoRes.error) throw trafegoRes.error
      if (baixadosRes.error) throw baixadosRes.error

      const pedidos = pedidosRes.data ?? []
      const progresso = progressoRes.data ?? []
      const atribuicoes = atribuicoesRes.data ?? []
      const trafego = trafegoRes.data ?? []
      const baixados = baixadosRes.data ?? []
      const transformacoes = (transformacoesRes.data ?? []) as { card_key: string; quantidade: number }[]

      // Compute live data blocks (always from live tables)
      const resumo = computeResumo(pedidos, progresso, atribuicoes, transformacoes)
      const progressao = computeProgressao(pedidos, progresso, transformacoes)
      const statusFardos = computeStatusFardos(trafego, baixados)
      const porSeparador = computePorSeparador(atribuicoes, pedidos, progresso, transformacoes)

      // Rankings: live or historical depending on period filter
      let topSeparadores: RankingEntry[]
      let topFardistas: RankingEntry[]

      if (!periodFilter.isHistorical) {
        // "Hoje" -- use live tables (per Research Pitfall 4)
        topSeparadores = computeTopSeparadores(atribuicoes, pedidos, progresso, transformacoes)
        topFardistas = computeTopFardistas(baixados)
      } else if (periodFilter.dateRange) {
        // Historical -- query historico_diario (not in generated types yet, use any cast)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: historico } = await (supabase as any)
          .from('historico_diario')
          .select('*')
          .gte('data', periodFilter.dateRange.start)
          .lte('data', periodFilter.dateRange.end)

        const rows = (historico ?? []) as HistoricoDiarioRow[]

        // Need user names -- fetch from users table
        const { data: usersData } = await supabase.from('users').select('id, nome')
        const userNames = new Map<string, string>()
        for (const u of usersData ?? []) {
          userNames.set(u.id, u.nome)
        }

        // Aggregate separadores from historico
        const sepMap = new Map<string, { pecas: number; cards: number; nome: string }>()
        const fardMap = new Map<string, { fardos: number; nome: string }>()

        for (const row of rows) {
          if (row.role === 'separador' || row.role === 'lider' || row.role === 'admin') {
            const existing = sepMap.get(row.user_id) ?? { pecas: 0, cards: 0, nome: userNames.get(row.user_id) ?? '' }
            existing.pecas += row.pecas_separadas
            existing.cards += row.cards_concluidos
            sepMap.set(row.user_id, existing)
          }
          if (row.fardos_confirmados > 0) {
            const existing = fardMap.get(row.user_id) ?? { fardos: 0, nome: userNames.get(row.user_id) ?? '' }
            existing.fardos += row.fardos_confirmados
            fardMap.set(row.user_id, existing)
          }
        }

        topSeparadores = Array.from(sepMap.entries())
          .map(([user_id, v]) => ({
            position: 0,
            user_id,
            nome: v.nome,
            pecas_separadas: v.pecas,
            cards_concluidos: v.cards,
            fardos_confirmados: 0,
          }))
          .sort((a, b) => b.pecas_separadas - a.pecas_separadas)
          .map((entry, i) => ({ ...entry, position: i + 1 }))

        topFardistas = Array.from(fardMap.entries())
          .map(([user_id, v]) => ({
            position: 0,
            user_id,
            nome: v.nome,
            pecas_separadas: 0,
            cards_concluidos: 0,
            fardos_confirmados: v.fardos,
          }))
          .sort((a, b) => b.fardos_confirmados - a.fardos_confirmados)
          .map((entry, i) => ({ ...entry, position: i + 1 }))
      } else {
        // Custom period not fully specified yet
        topSeparadores = []
        topFardistas = []
      }

      setData({
        resumo,
        progressao,
        topSeparadores,
        topFardistas,
        statusFardos,
        porSeparador,
      })
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
      setError('Erro ao carregar dados -- atualize a pagina para tentar novamente.')
    } finally {
      setLoading(false)
    }
  }, [periodFilter.isHistorical, periodFilter.dateRange])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Realtime subscription triggers re-fetch
  useDashboardRealtime(fetchData)

  return { data, loading, error, refetch: fetchData }
}

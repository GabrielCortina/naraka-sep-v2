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
import { subtractDays, getToday } from '../lib/date-utils'
import { useDashboardRealtime } from './use-dashboard-realtime'
import type { DashboardData, HistoricoDiarioRow, RankingEntry, ComparacaoData, PerformanceSemanal } from '../types'

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

      // Resolve date range for filtering
      const today = getToday()
      const startDate = periodFilter.dateRange?.start ?? today
      const endDate = periodFilter.dateRange?.end ?? today
      const startTs = startDate + 'T00:00:00'
      const endTs = endDate + 'T23:59:59'

      // Fetch all data in parallel WITH date filters
      const [pedidosRes, progressoRes, atribuicoesRes, trafegoRes, baixadosRes, transformacoesRes] =
        await Promise.all([
          supabase.from('pedidos')
            .select('id, card_key, grupo_envio, tipo, sku, quantidade, importacao_numero, loja')
            .gte('importacao_data', startDate)
            .lte('importacao_data', endDate),
          supabase.from('progresso')
            .select('pedido_id, quantidade_separada, status'),
          supabase.from('atribuicoes')
            .select('card_key, user_id, tipo, users(nome)'),
          supabase.from('trafego_fardos')
            .select('codigo_in, status, fardista_id')
            .gte('created_at', startTs)
            .lte('created_at', endTs),
          supabase.from('baixados')
            .select('codigo_in, baixado_por')
            .gte('baixado_em', startTs)
            .lte('baixado_em', endTs),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('transformacoes')
            .select('card_key, quantidade, created_at')
            .gte('created_at', startTs)
            .lte('created_at', endTs),
        ])

      if (pedidosRes.error) throw pedidosRes.error
      if (progressoRes.error) throw progressoRes.error
      if (atribuicoesRes.error) throw atribuicoesRes.error
      if (trafegoRes.error) throw trafegoRes.error
      if (baixadosRes.error) throw baixadosRes.error
      if (transformacoesRes.error) throw transformacoesRes.error

      const pedidos = pedidosRes.data ?? []
      const allProgresso = progressoRes.data ?? []
      const allAtribuicoes = atribuicoesRes.data ?? []
      const trafego = trafegoRes.data ?? []
      const baixados = baixadosRes.data ?? []
      const transformacoes = (transformacoesRes.data ?? []) as { card_key: string; quantidade: number }[]

      // Filter progresso and atribuicoes to only match pedidos in the date range
      const pedidoIds = new Set(pedidos.map(p => p.id))
      const cardKeys = new Set(pedidos.map(p => p.card_key))
      const progresso = allProgresso.filter(p => pedidoIds.has(p.pedido_id))
      const atribuicoes = allAtribuicoes.filter(a => cardKeys.has(a.card_key))

      const resumo = computeResumo(pedidos, progresso, atribuicoes, transformacoes)
      const progressao = computeProgressao(pedidos, progresso, transformacoes)
      const statusFardos = computeStatusFardos(trafego, baixados)
      const porSeparador = computePorSeparador(atribuicoes, pedidos, progresso, transformacoes)

      // Transformacoes resumo
      const transCardKeys = new Set(transformacoes.map(t => t.card_key))
      const transformacoesResumo = {
        total_pedidos: transCardKeys.size,
        total_pecas: transformacoes.reduce((sum, t) => sum + t.quantidade, 0),
      }

      // Comparativo por loja
      const lojaMap = new Map<string, { pedidos: Set<string>; pecas: number }>()
      for (const p of pedidos as { loja: string; card_key: string; quantidade: number }[]) {
        const existing = lojaMap.get(p.loja) ?? { pedidos: new Set<string>(), pecas: 0 }
        existing.pedidos.add(p.card_key)
        existing.pecas += p.quantidade
        lojaMap.set(p.loja, existing)
      }
      const comparativoLojas = Array.from(lojaMap.entries())
        .map(([loja, v]) => ({ loja, total_pedidos: v.pedidos.size, total_pecas: v.pecas }))
        .sort((a, b) => b.total_pedidos - a.total_pedidos)

      // Volume por hora (always uses today, not the period filter)
      const volumePorHora: { hora: number; pecas: number }[] = []
      try {
        const todayStart = today + 'T00:00:00'
        const { data: progressoHora } = await supabase
          .from('progresso')
          .select('quantidade_separada, updated_at')
          .gte('updated_at', todayStart)
          .gt('quantidade_separada', 0)

        if (progressoHora && progressoHora.length > 0) {
          const hourMap = new Map<number, number>()
          for (const row of progressoHora) {
            const date = new Date(row.updated_at)
            const hour = date.getHours()
            hourMap.set(hour, (hourMap.get(hour) ?? 0) + row.quantidade_separada)
          }
          for (let h = 0; h < 24; h++) {
            const pecas = hourMap.get(h) ?? 0
            if (pecas > 0 || (h >= 6 && h <= 20)) {
              volumePorHora.push({ hora: h, pecas })
            }
          }
        }
      } catch {
        // Volume data is optional
      }

      // Fetch comparison data from historico_diario (yesterday)
      let comparacao: ComparacaoData | null = null
      try {
        const yesterday = subtractDays(new Date(), 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: historicoOntem } = await (supabase as any)
          .from('historico_diario')
          .select('*')
          .eq('data', yesterday)

        if (historicoOntem && historicoOntem.length > 0) {
          const rows = historicoOntem as HistoricoDiarioRow[]
          let pecasOntem = 0
          let fardosOntem = 0
          let pedidosOntem = 0
          for (const row of rows) {
            pecasOntem += row.pecas_separadas
            fardosOntem += row.fardos_confirmados
            pedidosOntem += row.cards_concluidos
          }

          comparacao = {
            pecas_separadas_ontem: pecasOntem,
            fardos_processados_ontem: fardosOntem,
            total_pedidos_ontem: pedidosOntem,
            percent_conclusao_ontem: 0,
          }
        }
      } catch {
        // Comparison data is optional
      }

      // Fetch user names for fardista name resolution
      const { data: usersData } = await supabase.from('users').select('id, nome')
      const userNames = new Map<string, string>()
      for (const u of usersData ?? []) {
        userNames.set(u.id, u.nome)
      }

      let topSeparadores: RankingEntry[]
      let topFardistas: RankingEntry[]

      if (!periodFilter.isHistorical) {
        topSeparadores = computeTopSeparadores(atribuicoes, pedidos, progresso, transformacoes)
        topFardistas = computeTopFardistas(baixados, userNames, trafego)
      } else if (periodFilter.dateRange) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: historico } = await (supabase as any)
          .from('historico_diario')
          .select('*')
          .gte('data', periodFilter.dateRange.start)
          .lte('data', periodFilter.dateRange.end)

        const rows = (historico ?? []) as HistoricoDiarioRow[]

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
            position: 0, user_id, nome: v.nome,
            pecas_separadas: v.pecas, cards_concluidos: v.cards, fardos_confirmados: 0, fardos_ne: 0,
          }))
          .sort((a, b) => b.pecas_separadas - a.pecas_separadas)
          .map((entry, i) => ({ ...entry, position: i + 1 }))

        topFardistas = Array.from(fardMap.entries())
          .map(([user_id, v]) => ({
            position: 0, user_id, nome: v.nome,
            pecas_separadas: 0, cards_concluidos: 0, fardos_confirmados: v.fardos, fardos_ne: 0,
          }))
          .sort((a, b) => b.fardos_confirmados - a.fardos_confirmados)
          .map((entry, i) => ({ ...entry, position: i + 1 }))
      } else {
        topSeparadores = []
        topFardistas = []
      }

      // Fetch performance semanal (last 7 days from historico_diario)
      let performanceSemanal: PerformanceSemanal[] = []
      try {
        const weekStart = subtractDays(new Date(), 6)
        const todayStr = today
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: historicoSemana } = await (supabase as any)
          .from('historico_diario')
          .select('*')
          .gte('data', weekStart)
          .lte('data', todayStr)

        if (historicoSemana && historicoSemana.length > 0) {
          const rows = historicoSemana as HistoricoDiarioRow[]
          const { data: usersAll } = await supabase.from('users').select('id, nome')
          const names = new Map<string, string>()
          for (const u of usersAll ?? []) names.set(u.id, u.nome)

          const userDays = new Map<string, Map<string, number>>()
          for (const row of rows) {
            if (row.role !== 'separador' && row.role !== 'lider' && row.role !== 'admin') continue
            if (!userDays.has(row.user_id)) userDays.set(row.user_id, new Map())
            const dayMap = userDays.get(row.user_id)!
            dayMap.set(row.data, (dayMap.get(row.data) ?? 0) + row.pecas_separadas)
          }

          const prevWeekStart = subtractDays(new Date(), 13)
          const prevWeekEnd = subtractDays(new Date(), 7)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: historicoPrev } = await (supabase as any)
            .from('historico_diario')
            .select('user_id, pecas_separadas, role')
            .gte('data', prevWeekStart)
            .lte('data', prevWeekEnd)

          const prevAvg = new Map<string, number>()
          if (historicoPrev) {
            const prevByUser = new Map<string, number[]>()
            for (const row of historicoPrev as { user_id: string; pecas_separadas: number; role: string }[]) {
              if (row.role !== 'separador' && row.role !== 'lider' && row.role !== 'admin') continue
              if (!prevByUser.has(row.user_id)) prevByUser.set(row.user_id, [])
              prevByUser.get(row.user_id)!.push(row.pecas_separadas)
            }
            for (const [uid, vals] of Array.from(prevByUser.entries())) {
              prevAvg.set(uid, vals.reduce((a: number, b: number) => a + b, 0) / vals.length)
            }
          }

          performanceSemanal = Array.from(userDays.entries()).map(([userId, dayMap]) => {
            const dias: Record<string, number> = {}
            const values: number[] = []
            for (const [date, pecas] of Array.from(dayMap.entries())) {
              dias[date] = pecas
              values.push(pecas)
            }
            const media = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
            const prev = prevAvg.get(userId) ?? 0
            let tendencia: 'up' | 'down' | 'stable' = 'stable'
            if (prev > 0) {
              const diff = media - prev
              if (diff > prev * 0.05) tendencia = 'up'
              else if (diff < -prev * 0.05) tendencia = 'down'
            }
            return {
              separador_nome: names.get(userId) ?? userId.slice(0, 8),
              dias,
              media,
              tendencia,
            }
          }).sort((a, b) => b.media - a.media)
        }
      } catch {
        // Performance data is optional
      }

      setData({
        resumo,
        progressao,
        topSeparadores,
        topFardistas,
        statusFardos,
        porSeparador,
        comparacao,
        performanceSemanal,
        transformacoesResumo,
        volumePorHora,
        comparativoLojas,
      })
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : String(err)
      console.error('Erro ao carregar dashboard:', err)
      setError(`Erro ao carregar dados: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [periodFilter.isHistorical, periodFilter.dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useDashboardRealtime(fetchData)

  return { data, loading, error, refetch: fetchData }
}

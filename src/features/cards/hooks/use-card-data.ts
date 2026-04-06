'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  groupByCardKey,
  calcProgress,
  aggregateItems,
  getUrgencyTier,
} from '../lib/card-utils'
import { useCardsRealtime } from './use-cards-realtime'
import type { CardData } from '../types'
import type { Tables } from '@/types/database.types'

type ProgressoRow = Tables<'progresso'>
type ReservaRow = Tables<'reservas'>

/**
 * Fetches pedidos, progresso, reservas, and atribuicoes from Supabase,
 * assembles CardData[], and subscribes to realtime updates.
 *
 * Visibility rules (D-29):
 * - separador/fardista: only see cards assigned to them
 * - admin/lider: see all cards
 */
export function useCardData(
  userId: string,
  userRole: string,
): { cards: CardData[]; loading: boolean; error: string | null } {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = useCallback(async () => {
    try {
      const supabase = createClient()

      // Fetch all required data in parallel
      const [pedidosRes, progressoRes, reservasRes, atribuicoesRes, transformacoesRes] =
        await Promise.all([
          supabase.from('pedidos').select('*'),
          supabase.from('progresso').select('*'),
          supabase.from('reservas').select('*'),
          supabase.from('atribuicoes').select('*, users(nome)'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('transformacoes').select('*'),
        ])

      if (pedidosRes.error) throw pedidosRes.error
      if (progressoRes.error) throw progressoRes.error
      if (reservasRes.error) throw reservasRes.error
      if (atribuicoesRes.error) throw atribuicoesRes.error
      if (transformacoesRes.error) throw transformacoesRes.error

      const pedidos = pedidosRes.data
      const progresso = progressoRes.data
      const reservas = reservasRes.data
      const atribuicoes = atribuicoesRes.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformacoes = (transformacoesRes.data ?? []) as any[]

      // Build transformacao totals by card_key
      const transformacaoByCard = new Map<string, number>()
      for (const t of transformacoes) {
        const current = transformacaoByCard.get(t.card_key) ?? 0
        transformacaoByCard.set(t.card_key, current + (t.quantidade as number))
      }

      // Build atribuicoes lookup by card_key
      const atribMap = new Map<
        string,
        { id: string; nome: string; tipo: string }
      >()
      for (const a of atribuicoes) {
        const users = a.users as { nome: string } | null
        atribMap.set(a.card_key, {
          id: a.user_id,
          nome: users?.nome ?? '',
          tipo: a.tipo,
        })
      }

      // Filter by role: separador/fardista only see assigned card_keys
      let filteredPedidos = pedidos
      if (userRole === 'separador' || userRole === 'fardista') {
        const assignedCardKeys = new Set<string>()
        for (const a of atribuicoes) {
          if (a.user_id === userId) {
            assignedCardKeys.add(a.card_key)
          }
        }
        filteredPedidos = pedidos.filter((p) => assignedCardKeys.has(p.card_key))
      }

      // Build progress map by pedido_id
      const progressMap = new Map<string, ProgressoRow>()
      for (const p of progresso) {
        progressMap.set(p.pedido_id, p)
      }

      // Build reservas map by SKU
      const reservasBySku = new Map<string, ReservaRow[]>()
      for (const r of reservas) {
        const existing = reservasBySku.get(r.sku)
        if (existing) {
          existing.push(r)
        } else {
          reservasBySku.set(r.sku, [r])
        }
      }

      // Group pedidos by card_key and build CardData[]
      const groups = groupByCardKey(filteredPedidos)
      const cardList: CardData[] = []
      const entries = Array.from(groups.entries())

      for (const [cardKey, groupPedidos] of entries) {
        const first = groupPedidos[0]
        const items = aggregateItems(groupPedidos, progressMap, reservasBySku)
        const transformTotal = transformacaoByCard.get(cardKey) ?? 0
        const progress = calcProgress(
          groupPedidos.map((p) => ({
            quantidade: p.quantidade,
            quantidade_separada:
              progressMap.get(p.id)?.quantidade_separada ?? 0,
          })),
          transformTotal,
        )

        const atrib = atribMap.get(cardKey)

        cardList.push({
          card_key: cardKey,
          grupo_envio: first.grupo_envio,
          tipo: first.tipo,
          importacao_numero: first.importacao_numero,
          items,
          total_pecas: progress.total,
          pecas_separadas: progress.separadas,
          atribuido_a: atrib ? { id: atrib.id, nome: atrib.nome } : null,
          urgency: getUrgencyTier(first.grupo_envio, progress.percent),
        })
      }

      setCards(cardList)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
      setError('Erro ao carregar pedidos. Tente atualizar a pagina.')
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  // Initial fetch
  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  // Realtime subscription: refetch on any change
  useCardsRealtime(fetchCards)

  return { cards, loading, error }
}

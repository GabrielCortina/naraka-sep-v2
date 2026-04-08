'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TransformacaoItem, TransformacaoCardData } from '../types'

/**
 * Fetches transformacoes table and assembles TransformacaoCardData[].
 * Subscribes to realtime changes on a separate channel.
 *
 * Visibility rules (D-16):
 * - separador: only sees cards where atribuido_a.id === userId
 * - admin/lider: see all cards
 */
export function useTransformacaoData(
  userId: string,
  userRole: string,
): { cards: TransformacaoCardData[]; loading: boolean; error: string | null } {
  const [cards, setCards] = useState<TransformacaoCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransformacoes = useCallback(async () => {
    try {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('transformacoes')
        .select('*')

      if (fetchError) throw fetchError

      const rows = (data ?? []) as TransformacaoItem[]

      // Group by card_key + numero_transformacao
      const groupMap = new Map<string, TransformacaoItem[]>()
      for (const row of rows) {
        const key = `${row.card_key}||${row.numero_transformacao}`
        const existing = groupMap.get(key)
        if (existing) {
          existing.push(row)
        } else {
          groupMap.set(key, [row])
        }
      }

      // Assemble TransformacaoCardData[]
      const cardList: TransformacaoCardData[] = []
      const entries = Array.from(groupMap.entries())

      for (const [, items] of entries) {
        const first = items[0]
        const parts = first.card_key.split('|')
        const grupo_envio = parts[0] ?? ''
        const tipo = parts[1] ?? ''
        const importacao_numero = parseInt(parts[2] ?? '0', 10)

        let total_pecas = 0
        let pecas_concluidas = 0
        let atribuido_a: { id: string; nome: string } | null = null

        for (const item of items) {
          total_pecas += item.quantidade
          if (item.status === 'concluido') {
            pecas_concluidas += item.quantidade
          }
          if (!atribuido_a && item.separador_id && item.separador_nome) {
            atribuido_a = { id: item.separador_id, nome: item.separador_nome }
          }
        }

        const allConcluido = items.every((i) => i.status === 'concluido')
        const anyAssigned = items.some((i) => i.separador_id !== null)
        const status: TransformacaoCardData['status'] = allConcluido
          ? 'concluido'
          : anyAssigned
            ? 'atribuido'
            : 'pendente'

        cardList.push({
          card_key: first.card_key,
          numero_transformacao: first.numero_transformacao,
          grupo_envio,
          tipo,
          importacao_numero,
          items,
          total_pecas,
          pecas_concluidas,
          atribuido_a,
          status,
        })
      }

      // Visibility filtering (D-16): separador sees only assigned cards
      let filteredCards = cardList
      if (userRole === 'separador') {
        filteredCards = cardList.filter(
          (card) => card.atribuido_a?.id === userId,
        )
      }

      setCards(filteredCards)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar transformacoes:', err)
      setError('Erro ao carregar transformacoes. Tente atualizar a pagina.')
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  // Initial fetch
  useEffect(() => {
    fetchTransformacoes()
  }, [fetchTransformacoes])

  // Realtime subscription on separate channel
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('transformacao-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transformacoes' },
        () => fetchTransformacoes(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTransformacoes])

  return { cards, loading, error }
}

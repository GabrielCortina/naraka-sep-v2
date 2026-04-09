'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCardsRealtime } from '@/features/cards/hooks/use-cards-realtime'
import type { FardoItem, FardoStatus, FardoCounters, BaixadoFardoItem } from '../types'

/**
 * Fetches reservas, trafego_fardos, atribuicoes, fardos_nao_encontrados, and pedidos
 * from Supabase, assembles a flat FardoItem[] list, and subscribes to realtime updates.
 *
 * Visibility rules:
 * - fardista: only sees fardos from cards assigned to them (tipo='fardista')
 * - admin/lider: see all fardos
 *
 * T-06-01: Role-based filtering enforced in hook
 */
export function useFardosData(userId: string, userRole: string) {
  const [fardos, setFardos] = useState<FardoItem[]>([])
  const [baixadosHoje, setBaixadosHoje] = useState<BaixadoFardoItem[]>([])
  const [counters, setCounters] = useState<FardoCounters>({
    pendentes: 0,
    encontrados: 0,
    nao_encontrados: 0,
    baixados: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFardos = useCallback(async () => {
    try {
      const supabase = createClient()

      // Fetch all required data in parallel
      const [
        reservasRes,
        trafegoRes,
        atribuicoesRes,
        naoEncontradosRes,
        pedidosRes,
        baixadosRes,
      ] = await Promise.all([
        supabase
          .from('reservas')
          .select('id, codigo_in, sku, quantidade, endereco, status, importacao_numero')
          .eq('status', 'reservado'),
        supabase
          .from('trafego_fardos')
          // is_cascata from migration 00006 not yet in generated types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select('id, reserva_id, codigo_in, status, fardista_id, is_cascata') as any,
        supabase
          .from('atribuicoes')
          .select('card_key, user_id, tipo, users(nome)'),
        supabase
          .from('fardos_nao_encontrados')
          .select('codigo_in'),
        supabase
          .from('pedidos')
          .select('sku, card_key, importacao_numero'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('baixados')
          .select('codigo_in, sku, quantidade, endereco, fardista_nome, baixado_em'),
      ])

      if (reservasRes.error) throw reservasRes.error
      if (trafegoRes.error) throw trafegoRes.error
      if (atribuicoesRes.error) throw atribuicoesRes.error
      if (naoEncontradosRes.error) throw naoEncontradosRes.error
      if (pedidosRes.error) throw pedidosRes.error
      if (baixadosRes.error) throw baixadosRes.error

      const reservas = reservasRes.data
      const trafego = trafegoRes.data
      const atribuicoes = atribuicoesRes.data
      const naoEncontrados = naoEncontradosRes.data
      const pedidos = pedidosRes.data
      const baixadosAll = baixadosRes.data as { codigo_in: string; sku: string | null; quantidade: number | null; endereco: string | null; fardista_nome: string | null; baixado_em: string }[]

      // Build set of codigo_in that have been baixado (fardo delivered and removed from trafego)
      const baixadoSet = new Set<string>()
      for (const b of baixadosAll) {
        baixadoSet.add(b.codigo_in)
      }

      // Build today's baixados list for the "Baixados" filter tab
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const hojeTs = hoje.getTime()
      const baixadosHojeList: BaixadoFardoItem[] = baixadosAll
        .filter((b) => new Date(b.baixado_em).getTime() >= hojeTs)
        .map((b) => ({
          codigo_in: b.codigo_in,
          sku: b.sku ?? '',
          quantidade: b.quantidade ?? 0,
          endereco: b.endereco,
          fardista_nome: b.fardista_nome,
          baixado_em: b.baixado_em,
        }))
        .sort((a, b) => new Date(b.baixado_em).getTime() - new Date(a.baixado_em).getTime())

      // Build trafego lookup by codigo_in
      const trafegoMap = new Map<string, { status: string; fardista_id: string | null; is_cascata: boolean }>()
      for (const t of trafego) {
        trafegoMap.set(t.codigo_in, {
          status: t.status,
          fardista_id: t.fardista_id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          is_cascata: (t as any).is_cascata ?? false,
        })
      }

      // Build nao_encontrados set by codigo_in
      const neSet = new Set<string>()
      for (const ne of naoEncontrados) {
        neSet.add(ne.codigo_in)
      }

      // Build pedidos lookup: SKU+importacao_numero -> card_key (first match)
      const skuCardMap = new Map<string, string>()
      for (const p of pedidos) {
        const key = `${p.sku}|${p.importacao_numero}`
        if (!skuCardMap.has(key)) {
          skuCardMap.set(key, p.card_key)
        }
      }

      // Build atribuicoes lookups by card_key and tipo
      const fardistaMap = new Map<string, { id: string; nome: string }>()
      const separadorMap = new Map<string, { id: string; nome: string }>()
      for (const a of atribuicoes) {
        const users = a.users as { nome: string } | null
        const entry = { id: a.user_id, nome: users?.nome ?? '' }
        if (a.tipo === 'fardista') {
          fardistaMap.set(a.card_key, entry)
        } else if (a.tipo === 'separador') {
          separadorMap.set(a.card_key, entry)
        }
      }

      // Build flat FardoItem[] from reservas
      const fardoList: FardoItem[] = []

      for (const r of reservas) {
        // Skip reservas whose fardos have been baixado (delivered and removed from trafego)
        if (baixadoSet.has(r.codigo_in)) continue

        // Derive card_key from pedidos by SKU + importacao_numero
        const cardKey = skuCardMap.get(`${r.sku}|${r.importacao_numero}`) ?? null

        // Derive status
        let status: FardoStatus = 'pendente'
        const trafegoEntry = trafegoMap.get(r.codigo_in)
        if (trafegoEntry && trafegoEntry.status === 'encontrado') {
          status = 'encontrado'
        } else if (neSet.has(r.codigo_in)) {
          status = 'nao_encontrado'
        }

        // Derive fardista info from atribuicoes for this card_key
        const fardistaInfo = cardKey ? fardistaMap.get(cardKey) : null
        const separadorInfo = cardKey ? separadorMap.get(cardKey) : null

        fardoList.push({
          reserva_id: r.id,
          codigo_in: r.codigo_in,
          sku: r.sku,
          quantidade: r.quantidade,
          endereco: r.endereco ?? '',
          status,
          fardista_id: fardistaInfo?.id ?? null,
          fardista_nome: fardistaInfo?.nome ?? null,
          card_key: cardKey,
          separador_nome: separadorInfo?.nome ?? null,
          importacao_numero: r.importacao_numero ?? 0,
          is_cascata: trafegoEntry?.is_cascata ?? false,
        })
      }

      // Calculate counters from full list (before role filtering)
      const newCounters: FardoCounters = {
        pendentes: 0,
        encontrados: 0,
        nao_encontrados: 0,
        baixados: baixadosHojeList.length,
      }
      for (const f of fardoList) {
        if (f.status === 'pendente') newCounters.pendentes++
        else if (f.status === 'encontrado') newCounters.encontrados++
        else if (f.status === 'nao_encontrado') newCounters.nao_encontrados++
      }

      // Filter by role (T-06-01: fardista only sees fardos from assigned cards)
      let filteredFardos = fardoList
      if (userRole === 'fardista') {
        const assignedCardKeys = new Set<string>()
        for (const a of atribuicoes) {
          if (a.user_id === userId && a.tipo === 'fardista') {
            assignedCardKeys.add(a.card_key)
          }
        }
        filteredFardos = fardoList.filter(
          (f) => f.card_key !== null && assignedCardKeys.has(f.card_key),
        )
      }

      setFardos(filteredFardos)
      setBaixadosHoje(baixadosHojeList)
      setCounters(newCounters)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar fardos:', err)
      setError('Erro ao carregar fardos. Tente atualizar a pagina.')
    } finally {
      setLoading(false)
    }
  }, [userId, userRole])

  // Initial fetch
  useEffect(() => {
    fetchFardos()
  }, [fetchFardos])

  // Realtime subscription: refetch on any change
  useCardsRealtime(fetchFardos)

  const updateFardos = useCallback(
    (updater: (prev: FardoItem[]) => FardoItem[]) => {
      setFardos((prev) => {
        const updated = updater(prev)
        // Recalculate counters
        const newCounters: FardoCounters = {
          pendentes: 0,
          encontrados: 0,
          nao_encontrados: 0,
          baixados: baixadosHoje.length,
        }
        for (const f of updated) {
          if (f.status === 'pendente') newCounters.pendentes++
          else if (f.status === 'encontrado') newCounters.encontrados++
          else if (f.status === 'nao_encontrado') newCounters.nao_encontrados++
        }
        setCounters(newCounters)
        return updated
      })
    },
    [],
  )

  return { fardos, baixadosHoje, counters, loading, error, refetch: fetchFardos, updateFardos }
}

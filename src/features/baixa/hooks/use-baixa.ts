'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { BaixaFardoResult, BaixadoItem } from '../lib/baixa-utils'
import { createClient } from '@/lib/supabase/client'

export type { BaixadoItem } from '../lib/baixa-utils'

interface SearchResult {
  clear: boolean
}

interface ConfirmResult {
  success: boolean
}

export function useBaixa() {
  const [fardo, setFardo] = useState<BaixaFardoResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [baixadosHoje, setBaixadosHoje] = useState<BaixadoItem[]>([])
  const [hasError, setHasError] = useState(false)

  const loadBaixadosHoje = useCallback(async () => {
    try {
      const res = await fetch('/api/baixa/hoje')
      if (res.ok) {
        const data: BaixadoItem[] = await res.json()
        setBaixadosHoje(data)
      }
    } catch {
      // Silent fail -- list refresh is non-critical
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadBaixadosHoje()
  }, [loadBaixadosHoje])

  // Realtime subscription for baixados table
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('baixa-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'baixados' },
        () => loadBaixadosHoje(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadBaixadosHoje])

  const search = useCallback(async (codigoIn: string): Promise<SearchResult> => {
    setIsSearching(true)
    setHasError(false)

    try {
      const res = await fetch(`/api/baixa/buscar?codigo_in=${encodeURIComponent(codigoIn)}`)

      if (res.status === 409) {
        toast.warning(`Fardo ${codigoIn} ja teve baixa`)
        setIsSearching(false)
        return { clear: true }
      }

      if (res.status === 404) {
        toast.error('Fardo nao encontrado no trafego')
        setHasError(true)
        setTimeout(() => setHasError(false), 2000)
        setIsSearching(false)
        return { clear: true }
      }

      if (res.ok) {
        const data: BaixaFardoResult = await res.json()
        setFardo(data)
        setModalOpen(true)
        setIsSearching(false)
        return { clear: false }
      }

      toast.error('Erro ao buscar fardo')
      setIsSearching(false)
      return { clear: true }
    } catch {
      toast.error('Erro de conexao')
      setIsSearching(false)
      return { clear: true }
    }
  }, [])

  const confirm = useCallback(async (): Promise<ConfirmResult> => {
    if (!fardo) return { success: false }

    setIsConfirming(true)

    try {
      const res = await fetch('/api/baixa/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_in: fardo.codigo_in,
          trafego_id: fardo.trafego_id,
        }),
      })

      if (res.ok) {
        toast.success(`Baixa confirmada -- ${fardo.codigo_in}`)

        // Prepend to baixadosHoje from current fardo data
        const newItem: BaixadoItem = {
          codigo_in: fardo.codigo_in,
          sku: fardo.sku,
          quantidade: fardo.quantidade,
          endereco: fardo.endereco,
          entregas: fardo.entregas.map((e) => ({
            separador_nome: e.separador_nome,
            card_key: e.card_key,
          })),
          baixado_em: new Date().toISOString(),
        }
        setBaixadosHoje((prev) => [newItem, ...prev])

        setModalOpen(false)
        setFardo(null)
        setIsConfirming(false)
        return { success: true }
      }

      if (res.status === 409) {
        toast.warning(`Fardo ${fardo.codigo_in} ja teve baixa`)
        setModalOpen(false)
        setFardo(null)
        setIsConfirming(false)
        return { success: false }
      }

      toast.error('Erro ao confirmar baixa')
      setIsConfirming(false)
      return { success: false }
    } catch {
      toast.error('Erro ao confirmar baixa')
      setIsConfirming(false)
      return { success: false }
    }
  }, [fardo])

  const cancel = useCallback(() => {
    setModalOpen(false)
    setFardo(null)
  }, [])

  return {
    fardo,
    isSearching,
    isConfirming,
    modalOpen,
    hasError,
    baixadosHoje,
    search,
    confirm,
    cancel,
  }
}

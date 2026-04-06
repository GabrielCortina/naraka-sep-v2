'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to Supabase Realtime changes on cards-related tables.
 * Uses a single channel with multiple .on() handlers to avoid memory leaks (Pitfall 2).
 * Calls onUpdate on any INSERT/UPDATE/DELETE on progresso, atribuicoes, reservas, trafego_fardos.
 */
export function useCardsRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('cards-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progresso' },
        () => onUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atribuicoes' },
        () => onUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas' },
        () => onUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trafego_fardos' },
        () => onUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transformacoes' },
        () => onUpdate(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}

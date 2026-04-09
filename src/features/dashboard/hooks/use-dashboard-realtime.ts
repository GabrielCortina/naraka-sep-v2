'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to Supabase Realtime changes on dashboard-related tables.
 * Uses a single channel with multiple .on() handlers (same pattern as use-cards-realtime.ts).
 * Adds 300ms debounce to prevent excessive re-fetches from rapid realtime events (T-09-05).
 */
export function useDashboardRealtime(onUpdate: () => void) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const debouncedUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(onUpdate, 300)
    }

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progresso' },
        () => debouncedUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atribuicoes' },
        () => debouncedUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trafego_fardos' },
        () => debouncedUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'baixados' },
        () => debouncedUpdate(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => debouncedUpdate(),
      )
      .subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}

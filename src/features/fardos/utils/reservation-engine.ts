import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchStock } from './stock-parser'
import { findOptimalCombination } from './subset-sum'
import type { ReservationResult } from '../types'

/**
 * Orquestrador de reserva de fardos para uma importacao.
 *
 * Fluxo:
 * 1. Le estoque externo via Google Sheets (com cache e retry)
 * 2. Calcula demanda por SKU desta importacao
 * 3. Busca reservas existentes globalmente (D-04: visao global)
 * 4. Para cada SKU com demanda: filtra fardos disponiveis, executa subset sum, persiste reservas
 * 5. Retorna ReservationResult com classificacao fardo vs prateleira (D-06)
 *
 * Se Google Sheets indisponivel (retry exauriu), retorna indisponivel: true (D-03, D-16)
 */
export async function executeReservation(
  importacao_numero: number,
  forceRefresh = false
): Promise<ReservationResult> {
  // 1. Ler estoque externo
  let stock
  try {
    stock = await fetchStock(forceRefresh)
  } catch {
    // D-03, D-16: Google Sheets indisponivel apos retries
    return {
      skus_fardo: 0,
      skus_prateleira: 0,
      fardos_reservados: 0,
      parciais: [],
      indisponivel: true,
    }
  }

  // 2. Calcular demanda por SKU desta importacao (D-07)
  const { data: pedidos } = await supabaseAdmin
    .from('pedidos')
    .select('sku, quantidade')
    .eq('importacao_numero', importacao_numero)

  if (!pedidos || pedidos.length === 0) {
    return {
      skus_fardo: 0,
      skus_prateleira: 0,
      fardos_reservados: 0,
      parciais: [],
      indisponivel: false,
    }
  }

  // Agregar demanda por SKU
  const demandaPorSku = new Map<string, number>()
  for (const p of pedidos) {
    demandaPorSku.set(p.sku, (demandaPorSku.get(p.sku) ?? 0) + p.quantidade)
  }

  // 3. Buscar reservas existentes com status 'reservado' (D-04: visao global)
  const { data: reservasExistentes } = await supabaseAdmin
    .from('reservas')
    .select('codigo_in')
    .eq('status', 'reservado')

  const fardosJaReservados = new Set(
    (reservasExistentes ?? []).map(r => r.codigo_in)
  )

  // 4. Para cada SKU com demanda, tentar reservar
  let skus_fardo = 0
  let skus_prateleira = 0
  let fardos_reservados = 0
  const parciais: string[] = []

  for (const [sku, demanda] of Array.from(demandaPorSku)) {
    // Filtrar fardos do estoque que tem esse SKU E nao estao ja reservados
    const fardosDisponiveis = stock.filter(
      item => item.sku === sku && !fardosJaReservados.has(item.codigo_in)
    )

    if (fardosDisponiveis.length === 0) {
      // D-06: sem fardo disponivel -> prateleira
      skus_prateleira++
      continue
    }

    // Executar subset sum
    const resultado = findOptimalCombination(fardosDisponiveis, demanda)

    if (resultado.cobertura === 'nenhuma' || resultado.fardos.length === 0) {
      skus_prateleira++
      continue
    }

    // Persistir reservas no Supabase
    const reservas = resultado.fardos.map(f => ({
      codigo_in: f.codigo_in,
      sku: f.sku,
      quantidade: f.quantidade,
      endereco: f.endereco,
      status: 'reservado' as const,
      importacao_numero,
    }))

    const { error } = await supabaseAdmin.from('reservas').insert(reservas)

    if (error) {
      // T-04-05: Tratar erro 23505 (unique_violation) como "fardo ja reservado"
      if (error.code === '23505') {
        console.warn(`[reserva] Fardo ja reservado para SKU ${sku} (unique_violation), pulando`)
      } else {
        console.error(`[reserva] Erro ao reservar SKU ${sku}:`, error)
      }
      continue
    }

    // Sucesso: contabilizar e adicionar codigos ao set de ja reservados
    skus_fardo++
    fardos_reservados += resultado.fardos.length

    // Adicionar codigos_in ao set para proximo SKU (D-04: unicidade global)
    for (const f of resultado.fardos) {
      fardosJaReservados.add(f.codigo_in)
    }

    if (resultado.cobertura === 'parcial') {
      parciais.push(sku)
    }
  }

  return {
    skus_fardo,
    skus_prateleira,
    fardos_reservados,
    parciais,
    indisponivel: false,
  }
}

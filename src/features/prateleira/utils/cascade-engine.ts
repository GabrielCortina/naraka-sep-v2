import type { StockItem } from '@/features/fardos/types'

/** Resultado do algoritmo de cascata para um SKU */
export interface CascadeResult {
  fardos: StockItem[]
  quantidade_coberta: number
  quantidade_transformacao: number
}

/**
 * Seleciona fardos para cascata usando algoritmo de 4 prioridades:
 *
 * 1. Fardo unico que cobre a demanda com menor sobra (closest match)
 * 2. Fardo unico que cobre totalmente mesmo com grande sobra
 * 3. Multiplos fardos greedy descendente ate cobrir ou esgotar
 * 4. Nenhum fardo disponivel -> tudo vai para transformacao
 *
 * Sem regra de 20% (D-06). Sem findOptimalCombination.
 */
export function findCascadeBales(
  stock: StockItem[],
  sku: string,
  demanda: number,
  reservedSet: Set<string>,
  naoEncontradosSet: Set<string>,
): CascadeResult {
  // Filtrar fardos disponiveis para o SKU solicitado
  const disponiveis = stock.filter(
    (item) =>
      item.sku === sku &&
      !reservedSet.has(item.codigo_in) &&
      !naoEncontradosSet.has(item.codigo_in),
  )

  // Priority 4: nenhum fardo disponivel
  if (disponiveis.length === 0) {
    return { fardos: [], quantidade_coberta: 0, quantidade_transformacao: demanda }
  }

  // Sort by distance to demand (ascending) for Priority 1/2
  const sortedByCloseness = [...disponiveis].sort(
    (a, b) => Math.abs(a.quantidade - demanda) - Math.abs(b.quantidade - demanda),
  )

  // Priority 1/2: single bale that covers demand
  if (sortedByCloseness[0].quantidade >= demanda) {
    return {
      fardos: [sortedByCloseness[0]],
      quantidade_coberta: demanda,
      quantidade_transformacao: 0,
    }
  }

  // Priority 3: greedy descending - take largest bales first
  const sortedDesc = [...disponiveis].sort((a, b) => b.quantidade - a.quantidade)
  const selected: StockItem[] = []
  let coberta = 0

  for (const bale of sortedDesc) {
    selected.push(bale)
    coberta += bale.quantidade
    if (coberta >= demanda) break
  }

  const remainder = Math.max(0, demanda - coberta)
  return {
    fardos: selected,
    quantidade_coberta: Math.min(coberta, demanda),
    quantidade_transformacao: remainder,
  }
}

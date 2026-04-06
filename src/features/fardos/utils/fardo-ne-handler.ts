import { findOptimalCombination } from './subset-sum'
import type { StockItem } from '../types'

/**
 * Busca fardo alternativo para o mesmo SKU (D-20).
 * - Importacao normal: usa regra dos 20% (subset sum)
 * - Cascata (Phase 7): aceita qualquer fardo
 * Na Phase 6, is_cascata e sempre false -- implementar ambos os caminhos
 */
export function findAlternativeBale(
  stock: StockItem[],
  sku: string,
  quantidade: number,
  reservedCodigosIn: Set<string>,
  isCascata: boolean,
  currentCodigoIn?: string,
  naoEncontradosCodigosIn?: Set<string>
): StockItem | null {
  const disponiveis = stock.filter(
    item =>
      item.sku === sku &&
      !reservedCodigosIn.has(item.codigo_in) &&
      item.codigo_in !== currentCodigoIn &&
      !(naoEncontradosCodigosIn?.has(item.codigo_in))
  )

  if (disponiveis.length === 0) return null

  if (isCascata) {
    // Phase 7: qualquer fardo serve
    return disponiveis[0]
  }

  // Importacao normal: subset sum com 20% margem
  const resultado = findOptimalCombination(disponiveis, quantidade)
  if (resultado.fardos.length === 0) return null
  // Retornar o primeiro fardo da combinacao otima
  return resultado.fardos[0]
}

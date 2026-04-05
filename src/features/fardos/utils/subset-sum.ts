import type { StockItem, SubsetResult } from '../types'

/** Cap maximo do alvo para evitar tabela DP gigante (T-04-02) */
const MAX_TARGET_CAP = 10000

interface DpEntry {
  fardos: StockItem[]
  count: number
}

/**
 * Encontra a melhor combinacao de fardos para atender a demanda.
 *
 * Prioridade (D-10, D-11):
 * 1. Soma exata (== demanda) -- preferida, desempate por menos fardos
 * 2. Soma por cima dentro de 20% (>= demanda e <= demanda * 1.20) -- menor soma vence, desempate por menos fardos
 * 3. Melhor soma abaixo da demanda -- cobertura parcial
 * 4. Nenhuma soma possivel -- cobertura nenhuma
 *
 * Funcao pura: sem side effects, sem dependencias externas.
 */
export function findOptimalCombination(
  fardos: StockItem[],
  demanda: number
): SubsetResult {
  // Filtrar fardos invalidos (T-04-01: quantidade deve ser > 0)
  const validFardos = fardos.filter(f => f.quantidade > 0)

  if (validFardos.length === 0) {
    return { fardos: [], soma: 0, cobertura: 'nenhuma' }
  }

  // Calcular maxTarget com cap (T-04-02)
  const maxTarget = Math.min(
    Math.ceil(demanda * 1.20),
    MAX_TARGET_CAP
  )

  // DP: Map<soma, DpEntry> -- para cada soma possivel, guardar a combinacao com menos fardos
  const dp = new Map<number, DpEntry>()
  dp.set(0, { fardos: [], count: 0 })

  for (const fardo of validFardos) {
    // Iterar de tras para frente para evitar usar o mesmo fardo duas vezes
    // Converter para array para iterar snapshot (Map muda durante iteracao)
    const entries = Array.from(dp.entries())

    for (const [soma, entry] of entries) {
      const novaSoma = soma + fardo.quantidade

      // So rastrear somas ate maxTarget (para por cima) e todas abaixo da demanda (para parcial)
      // Na pratica, guardar tudo ate maxTarget cobre ambos os casos
      if (novaSoma > maxTarget) continue

      const novaEntry: DpEntry = {
        fardos: [...entry.fardos, fardo],
        count: entry.count + 1,
      }

      const existing = dp.get(novaSoma)
      if (!existing || novaEntry.count < existing.count) {
        dp.set(novaSoma, novaEntry)
      }
    }
  }

  // Selecionar melhor resultado

  // 4a. Soma exata
  const exata = dp.get(demanda)
  if (exata && exata.count > 0) {
    return {
      fardos: exata.fardos,
      soma: demanda,
      cobertura: 'total',
    }
  }

  // 4b. Menor soma no range [demanda, maxTarget]
  let melhorPorCima: { soma: number; entry: DpEntry } | null = null
  for (const [soma, entry] of Array.from(dp)) {
    if (soma >= demanda && soma <= maxTarget) {
      if (
        !melhorPorCima ||
        soma < melhorPorCima.soma ||
        (soma === melhorPorCima.soma && entry.count < melhorPorCima.entry.count)
      ) {
        melhorPorCima = { soma, entry }
      }
    }
  }

  if (melhorPorCima) {
    return {
      fardos: melhorPorCima.entry.fardos,
      soma: melhorPorCima.soma,
      cobertura: 'total',
    }
  }

  // 4c. Maior soma abaixo da demanda (parcial)
  let melhorAbaixo: { soma: number; entry: DpEntry } | null = null
  for (const [soma, entry] of Array.from(dp)) {
    if (soma > 0 && soma < demanda) {
      if (
        !melhorAbaixo ||
        soma > melhorAbaixo.soma ||
        (soma === melhorAbaixo.soma && entry.count < melhorAbaixo.entry.count)
      ) {
        melhorAbaixo = { soma, entry }
      }
    }
  }

  if (melhorAbaixo) {
    return {
      fardos: melhorAbaixo.entry.fardos,
      soma: melhorAbaixo.soma,
      cobertura: 'parcial',
    }
  }

  // 4d. Nenhuma soma possivel
  return { fardos: [], soma: 0, cobertura: 'nenhuma' }
}

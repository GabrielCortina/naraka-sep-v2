import { describe, it, expect } from 'vitest'
import type { FardoItem, FardoStatus, FardoFilters, FardoCounters } from '../../types'

describe('Fardo domain types', () => {
  it('Test 1: FardoItem type tem campos obrigatorios', () => {
    const item: FardoItem = {
      reserva_id: 'uuid-1',
      codigo_in: 'ABC123',
      sku: 'SKU-001',
      quantidade: 500,
      endereco: 'A-01',
      status: 'pendente',
      fardista_id: null,
      fardista_nome: null,
      card_key: null,
      separador_nome: null,
      importacao_numero: 1,
      is_cascata: false,
    }

    expect(item.reserva_id).toBe('uuid-1')
    expect(item.codigo_in).toBe('ABC123')
    expect(item.sku).toBe('SKU-001')
    expect(item.quantidade).toBe(500)
    expect(item.endereco).toBe('A-01')
    expect(item.status).toBe('pendente')
    expect(item.fardista_nome).toBeNull()
    expect(item.card_key).toBeNull()
    expect(item.separador_nome).toBeNull()
    expect(item.importacao_numero).toBe(1)
    expect(item.is_cascata).toBe(false)
  })

  it('Test 2: FardoStatus type aceita pendente | encontrado | nao_encontrado', () => {
    const s1: FardoStatus = 'pendente'
    const s2: FardoStatus = 'encontrado'
    const s3: FardoStatus = 'nao_encontrado'

    expect(s1).toBe('pendente')
    expect(s2).toBe('encontrado')
    expect(s3).toBe('nao_encontrado')
  })

  it('Test 3: FardoFilters type tem campos search, statusFilter, assignFilter, sortBy', () => {
    const filters: FardoFilters = {
      search: 'ABC',
      statusFilter: 'pendentes',
      assignFilter: 'todos',
      sortBy: 'endereco',
    }

    expect(filters.search).toBe('ABC')
    expect(filters.statusFilter).toBe('pendentes')
    expect(filters.assignFilter).toBe('todos')
    expect(filters.sortBy).toBe('endereco')
  })

  it('Test 4: FardoCounters type tem campos pendentes, encontrados, nao_encontrados', () => {
    const counters: FardoCounters = {
      pendentes: 10,
      encontrados: 5,
      nao_encontrados: 2,
    }

    expect(counters.pendentes).toBe(10)
    expect(counters.encontrados).toBe(5)
    expect(counters.nao_encontrados).toBe(2)
  })
})

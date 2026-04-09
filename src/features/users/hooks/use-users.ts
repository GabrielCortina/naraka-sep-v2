'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UserRow {
  id: string
  nome: string
  role: string
  ativo: boolean
  created_at: string
}

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Erro ao carregar usuarios')
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao carregar usuarios. Tente recarregar a pagina.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const createUser = async (body: {
    nome: string
    pin: string
    role: string
  }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok)
      throw new Error(
        data.error ||
          'Erro ao salvar usuario. Verifique os dados e tente novamente.'
      )
    await fetchUsers()
    return data
  }

  const updateUser = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok)
      throw new Error(
        data.error ||
          'Erro ao salvar usuario. Verifique os dados e tente novamente.'
      )
    await fetchUsers()
    return data
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar status')
    await fetchUsers()
    return data
  }

  return { users, loading, error, fetchUsers, createUser, updateUser, toggleAtivo }
}

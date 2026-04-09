import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { BaixadoItem } from '@/features/baixa/lib/baixa-utils'

export async function GET() {
  // 1. Auth: createClient -> getUser -> role check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (!userData || !['fardista', 'admin', 'lider'].includes(userData.role)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // 2. Query baixados for today, ordered by most recent
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeISO = hoje.toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: baixados, error: queryError } = await (supabaseAdmin as any)
    .from('baixados')
    .select('id, codigo_in, sku, quantidade, endereco, baixado_em')
    .gte('baixado_em', hojeISO)
    .order('baixado_em', { ascending: false })

  if (queryError) {
    console.error('[baixa/hoje] Erro ao buscar baixados:', queryError)
    return NextResponse.json({ error: 'Erro ao buscar baixados' }, { status: 500 })
  }

  if (!baixados || baixados.length === 0) {
    return NextResponse.json([])
  }

  // 3. For each baixado, build full BaixadoItem with entregas
  const items: BaixadoItem[] = []

  for (const baixado of baixados as { id: string; codigo_in: string; sku: string | null; quantidade: number | null; endereco: string | null; baixado_em: string }[]) {
    const sku = baixado.sku ?? ''
    const quantidade = baixado.quantidade ?? 0
    const endereco = baixado.endereco ?? null

    // Build entregas: reservas -> pedidos -> atribuicoes -> users
    const entregas: { card_key: string; separador_nome: string | null }[] = []
    const seenCardKeys = new Set<string>()

    const { data: reservas } = await supabaseAdmin
      .from('reservas')
      .select('sku, importacao_numero')
      .eq('codigo_in', baixado.codigo_in)
      .eq('status', 'reservado')

    if (reservas && reservas.length > 0) {
      for (const reserva of reservas) {
        let pedidosQuery = supabaseAdmin
          .from('pedidos')
          .select('card_key')
          .eq('sku', reserva.sku)

        if (reserva.importacao_numero != null) {
          pedidosQuery = pedidosQuery.eq('importacao_numero', reserva.importacao_numero)
        }

        const { data: pedidos } = await pedidosQuery

        if (pedidos) {
          const uniqueCardKeys = Array.from(new Set(pedidos.map(p => p.card_key)))

          for (const cardKey of uniqueCardKeys) {
            if (seenCardKeys.has(cardKey)) continue
            seenCardKeys.add(cardKey)

            // Lookup separador
            const { data: atribuicao } = await supabaseAdmin
              .from('atribuicoes')
              .select('user_id')
              .eq('card_key', cardKey)
              .eq('tipo', 'separador')
              .maybeSingle()

            let separadorNome: string | null = null
            if (atribuicao) {
              const { data: separadorUser } = await supabaseAdmin
                .from('users')
                .select('nome')
                .eq('id', atribuicao.user_id)
                .single()
              separadorNome = separadorUser?.nome ?? null
            }

            entregas.push({ card_key: cardKey, separador_nome: separadorNome })
          }
        }
      }
    }

    items.push({
      codigo_in: baixado.codigo_in,
      sku,
      quantidade,
      endereco,
      entregas,
      baixado_em: baixado.baixado_em,
    })
  }

  return NextResponse.json(items)
}

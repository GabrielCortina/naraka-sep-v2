import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getMarketplaceColor } from '@/features/baixa/lib/baixa-utils'
import type { BaixaFardoResult, EntregaInfo } from '@/features/baixa/lib/baixa-utils'

export async function GET(request: NextRequest) {
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

  // 2. Read codigo_in from query params
  const codigoIn = request.nextUrl.searchParams.get('codigo_in')?.trim()
  if (!codigoIn) {
    return NextResponse.json({ error: 'codigo_in obrigatorio' }, { status: 400 })
  }

  // 3. Duplicate check: already baixado?
  const { data: existingBaixa } = await supabaseAdmin
    .from('baixados')
    .select('id')
    .eq('codigo_in', codigoIn)
    .maybeSingle()

  if (existingBaixa) {
    return NextResponse.json({ error: 'Fardo ja teve baixa', duplicado: true }, { status: 409 })
  }

  // 4. Lookup trafego_fardos with status='encontrado'
  const { data: trafego } = await supabaseAdmin
    .from('trafego_fardos')
    .select('id, codigo_in, sku, quantidade, endereco')
    .eq('codigo_in', codigoIn)
    .eq('status', 'encontrado')
    .maybeSingle()

  if (!trafego) {
    return NextResponse.json({ error: 'Fardo nao encontrado no trafego' }, { status: 404 })
  }

  // 5. Query reservas for this codigo_in
  const { data: reservas } = await supabaseAdmin
    .from('reservas')
    .select('sku, importacao_numero')
    .eq('codigo_in', codigoIn)
    .eq('status', 'reservado')

  // 6. Build entregas from reservas -> pedidos -> atribuicoes -> users
  const entregas: EntregaInfo[] = []
  const seenCardKeys = new Set<string>()

  if (reservas && reservas.length > 0) {
    for (const reserva of reservas) {
      // Query pedidos by sku + importacao_numero
      let pedidosQuery = supabaseAdmin
        .from('pedidos')
        .select('card_key, grupo_envio')
        .eq('sku', reserva.sku)

      if (reserva.importacao_numero != null) {
        pedidosQuery = pedidosQuery.eq('importacao_numero', reserva.importacao_numero)
      }

      const { data: pedidos } = await pedidosQuery

      if (pedidos) {
        // Deduplicate card_keys
        const uniqueCardKeys = Array.from(new Set(pedidos.map(p => p.card_key)))

        for (const cardKey of uniqueCardKeys) {
          if (seenCardKeys.has(cardKey)) continue
          seenCardKeys.add(cardKey)

          const grupoEnvio = pedidos.find(p => p.card_key === cardKey)?.grupo_envio ?? ''

          // Lookup separador for this card_key
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

          entregas.push({
            card_key: cardKey,
            grupo_envio: grupoEnvio,
            separador_nome: separadorNome,
          })
        }
      }
    }
  }

  // 7. Determine marketplace color from first grupo_envio
  const firstGrupoEnvio = entregas.length > 0 ? entregas[0].grupo_envio : ''
  const marketplaceColor = getMarketplaceColor(firstGrupoEnvio)

  const result: BaixaFardoResult = {
    trafego_id: trafego.id,
    codigo_in: trafego.codigo_in,
    sku: trafego.sku,
    quantidade: trafego.quantidade,
    endereco: trafego.endereco,
    marketplace_color: marketplaceColor,
    entregas,
  }

  return NextResponse.json(result)
}

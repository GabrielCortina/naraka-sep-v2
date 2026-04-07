import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchStock } from '@/features/fardos/utils/stock-parser'
import { findCascadeBales } from '@/features/prateleira/utils/cascade-engine'

export async function POST(request: NextRequest) {
  // 1. Auth: createClient -> getUser -> role check
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (!userData || !['separador', 'admin', 'lider'].includes(userData.role)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const {
    pedido_ids,
    sku,
    quantidade_confirmada,
    quantidade_restante,
    tipo,
    card_key,
  } = body as {
    pedido_ids: unknown
    sku: unknown
    quantidade_confirmada: unknown
    quantidade_restante: unknown
    tipo: unknown
    card_key: unknown
  }

  // 3. Validation
  if (
    !Array.isArray(pedido_ids) ||
    pedido_ids.length === 0 ||
    !pedido_ids.every((id) => typeof id === 'string' && id.length > 0)
  ) {
    return NextResponse.json(
      { error: 'pedido_ids deve ser array nao-vazio de strings' },
      { status: 400 },
    )
  }
  if (!sku || typeof sku !== 'string') {
    return NextResponse.json({ error: 'sku invalido' }, { status: 400 })
  }
  if (
    typeof quantidade_confirmada !== 'number' ||
    quantidade_confirmada < 0
  ) {
    return NextResponse.json(
      { error: 'quantidade_confirmada deve ser >= 0' },
      { status: 400 },
    )
  }
  if (typeof quantidade_restante !== 'number' || quantidade_restante <= 0) {
    return NextResponse.json(
      { error: 'quantidade_restante deve ser > 0' },
      { status: 400 },
    )
  }
  if (tipo !== 'parcial' && tipo !== 'ne') {
    return NextResponse.json(
      { error: 'tipo deve ser parcial ou ne' },
      { status: 400 },
    )
  }
  if (!card_key || typeof card_key !== 'string') {
    return NextResponse.json({ error: 'card_key invalido' }, { status: 400 })
  }
  if (quantidade_confirmada + quantidade_restante <= 0) {
    return NextResponse.json(
      { error: 'quantidade total deve ser > 0' },
      { status: 400 },
    )
  }

  // Step 1 - Update progresso for each pedido_id
  // Distribute quantidade_confirmada proportionally across pedido_ids
  // using floor + remainder to preserve exact total
  const pids = pedido_ids as string[]
  const confirmada = (quantidade_confirmada as number)

  // Fetch each pedido's quantidade for proportional distribution
  const pedidoQtds: { pid: string; quantidade: number }[] = []
  for (const pid of pids) {
    const { data: ped } = await supabaseAdmin
      .from('pedidos')
      .select('quantidade')
      .eq('id', pid)
      .single()
    pedidoQtds.push({ pid, quantidade: ped?.quantidade ?? 0 })
  }
  const totalPedidoQtd = pedidoQtds.reduce((s, p) => s + p.quantidade, 0)

  // Proportional distribution: floor each share, give remainders to largest pedidos first
  let distributed = 0
  const shares = pedidoQtds.map((p, i) => {
    if (tipo !== 'parcial') return { pid: p.pid, qSeparada: 0 }
    const isLast = i === pedidoQtds.length - 1
    const share = isLast
      ? confirmada - distributed
      : totalPedidoQtd > 0
        ? Math.floor((p.quantidade / totalPedidoQtd) * confirmada)
        : Math.floor(confirmada / pids.length)
    distributed += share
    return { pid: p.pid, qSeparada: share }
  })

  for (const { pid, qSeparada } of shares) {
    const progressStatus = tipo === 'parcial' ? 'parcial' : 'nao_encontrado'

    // Select-then-insert/update pattern (no UNIQUE on pedido_id)
    const { data: existing } = await supabaseAdmin
      .from('progresso')
      .select('id')
      .eq('pedido_id', pid)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('progresso')
        .update({
          quantidade_separada: qSeparada,
          status: progressStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('progresso').insert({
        pedido_id: pid,
        quantidade_separada: qSeparada,
        status: progressStatus,
        updated_at: new Date().toISOString(),
      })
    }
  }

  // Step 2 - Build exclusion sets
  const { data: reservasAtivas } = await supabaseAdmin
    .from('reservas')
    .select('codigo_in')
    .eq('status', 'reservado')
  const reservedSet = new Set((reservasAtivas ?? []).map((r) => r.codigo_in))

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const { data: naoEncontradosHoje } = await supabaseAdmin
    .from('fardos_nao_encontrados')
    .select('codigo_in')
    .gte('reportado_em', hoje.toISOString())
  const naoEncontradosSet = new Set(
    (naoEncontradosHoje ?? []).map((r) => r.codigo_in),
  )

  // Step 3 - Fetch stock (force refresh per Pitfall 5)
  let stock
  try {
    stock = await fetchStock(true)
  } catch (error) {
    console.error('[cascata] Erro ao buscar estoque:', error)
    return NextResponse.json(
      { error: 'Erro ao acessar estoque' },
      { status: 502 },
    )
  }

  // Step 4 - Run cascade
  const result = findCascadeBales(
    stock,
    sku as string,
    quantidade_restante as number,
    reservedSet,
    naoEncontradosSet,
  )

  // Step 5 - Process result
  // Get importacao_numero from first pedido
  const { data: firstPedido } = await supabaseAdmin
    .from('pedidos')
    .select('importacao_numero, numero_pedido')
    .eq('id', (pedido_ids as string[])[0])
    .single()

  const importacaoNumero = firstPedido?.importacao_numero ?? 0

  if (result.fardos.length > 0) {
    // Reserve each cascade bale
    for (const bale of result.fardos) {
      const { data: newReserva, error: insertError } = await supabaseAdmin
        .from('reservas')
        .insert({
          codigo_in: bale.codigo_in,
          sku: bale.sku,
          quantidade: bale.quantidade,
          endereco: bale.endereco,
          status: 'reservado',
          importacao_numero: importacaoNumero,
        })
        .select('id')
        .single()

      if (insertError) {
        // Handle unique constraint violation (23505)
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Fardo ja reservado, tente novamente' },
            { status: 409 },
          )
        }
        console.error('[cascata] Erro ao inserir reserva:', insertError)
        return NextResponse.json(
          { error: 'Erro ao reservar fardo' },
          { status: 500 },
        )
      }

      // Insert trafego_fardos with is_cascata=true (cast as any for migration 00006 cols)
      // Note: trafego_fardos has no card_key column — card_key lives on pedidos/atribuicoes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabaseAdmin.from('trafego_fardos').insert({
        codigo_in: bale.codigo_in,
        sku: bale.sku,
        quantidade: bale.quantidade,
        endereco: bale.endereco,
        status: 'pendente',
        reserva_id: newReserva.id,
        is_cascata: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    }

    // Update progresso status to 'aguardar_fardista' for pedido_ids
    // For tipo='parcial': quantidade_separada stays at confirmed value, only status changes
    for (const pid of pedido_ids as string[]) {
      const { data: existing } = await supabaseAdmin
        .from('progresso')
        .select('id')
        .eq('pedido_id', pid)
        .maybeSingle()

      if (existing) {
        await supabaseAdmin
          .from('progresso')
          .update({
            status: 'aguardar_fardista',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
    }
  }

  if (result.quantidade_transformacao > 0) {
    // Get separador info for this card_key
    const { data: sepAtrib } = await supabaseAdmin
      .from('atribuicoes')
      .select('user_id, users(nome)')
      .eq('card_key', card_key as string)
      .eq('tipo', 'separador')
      .maybeSingle()

    const separadorId = sepAtrib?.user_id ?? null
    const separadorNome =
      (sepAtrib?.users as { nome: string } | null)?.nome ?? null

    // Insert transformacao record (cast as any for migration 00006 cols)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any).from('transformacoes').insert({
      sku: sku as string,
      quantidade: result.quantidade_transformacao,
      card_key: card_key as string,
      numero_pedido: firstPedido?.numero_pedido ?? null,
      separador_id: separadorId,
      separador_nome: separadorNome,
      status: 'pendente',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Update progresso status for pedido_ids
    // If both bales found AND transformacao: status stays 'parcial' (one progresso row per pedido_id)
    // If only transformacao (no bales): status = 'transformacao'
    const transformacaoStatus =
      result.fardos.length > 0 ? 'parcial' : 'transformacao'

    for (const pid of pedido_ids as string[]) {
      const { data: existing } = await supabaseAdmin
        .from('progresso')
        .select('id')
        .eq('pedido_id', pid)
        .maybeSingle()

      if (existing) {
        await supabaseAdmin
          .from('progresso')
          .update({
            status: transformacaoStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      }
    }
  }

  // Step 6 - Return
  return NextResponse.json({
    found_alternative: result.fardos.length > 0,
    bales: result.fardos.map((f) => ({
      codigo_in: f.codigo_in,
      quantidade: f.quantidade,
    })),
    transformacao: result.quantidade_transformacao > 0,
    quantidade_transformacao: result.quantidade_transformacao,
  })
}

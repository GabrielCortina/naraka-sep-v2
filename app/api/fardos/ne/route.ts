import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchStock } from '@/features/fardos/utils/stock-parser'
import { findAlternativeBale } from '@/features/fardos/utils/fardo-ne-handler'
import { findCascadeBales } from '@/features/prateleira/utils/cascade-engine'

export async function POST(request: NextRequest) {
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

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const { reserva_id, codigo_in } = body as {
    reserva_id: unknown
    codigo_in: unknown
  }

  if (!reserva_id || typeof reserva_id !== 'string') {
    return NextResponse.json({ error: 'reserva_id invalido' }, { status: 400 })
  }
  if (!codigo_in || typeof codigo_in !== 'string') {
    return NextResponse.json({ error: 'codigo_in invalido' }, { status: 400 })
  }

  // 3. Buscar reserva original (T-06-07: validar que existe com status='reservado')
  const { data: reserva } = await supabaseAdmin
    .from('reservas')
    .select('*')
    .eq('id', reserva_id)
    .eq('status', 'reservado')
    .single()

  if (!reserva) {
    return NextResponse.json({ error: 'Reserva nao encontrada ou ja cancelada' }, { status: 404 })
  }

  // 3b. Detect if this bale is a cascade bale
  const { data: trafegoEntry } = await supabaseAdmin
    .from('trafego_fardos')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('is_cascata, card_key' as any)
    .eq('codigo_in', codigo_in as string)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCascataBale = (trafegoEntry as any)?.is_cascata === true

  // 4. Buscar estoque atualizado (forceRefresh para dados frescos)
  let stock
  try {
    stock = await fetchStock(true)
  } catch (error) {
    console.error('[fardos/ne] Erro ao buscar estoque:', error)
    return NextResponse.json({ error: 'Erro ao acessar estoque' }, { status: 502 })
  }

  // 5. Buscar todas as reservas ativas para montar Set de ja reservados
  const { data: reservasAtivas } = await supabaseAdmin
    .from('reservas')
    .select('codigo_in')
    .eq('status', 'reservado')

  const reservedSet = new Set(
    (reservasAtivas ?? []).map(r => r.codigo_in)
  )

  // 5b. Buscar fardos ja marcados como nao encontrados hoje para excluir da busca
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const { data: naoEncontradosHoje } = await supabaseAdmin
    .from('fardos_nao_encontrados')
    .select('codigo_in')
    .gte('reportado_em', hoje.toISOString())

  const naoEncontradosSet = new Set(
    (naoEncontradosHoje ?? []).map(r => r.codigo_in)
  )

  // 6. Register original bale as nao encontrado BEFORE searching for alternative
  // (D-10: ensures exclusion from future searches, prevents loops)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const neDataOriginal: Record<string, any> = {
    codigo_in: codigo_in,
    trafego_id: null,
    reportado_por: user.id,
    sku: reserva.sku,
    quantidade: reserva.quantidade,
    endereco: reserva.endereco,
    fardista_nome: userData.nome,
    fardista_id: user.id,
  }

  const { error: neOrigError } = await supabaseAdmin
    .from('fardos_nao_encontrados')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(neDataOriginal as any)

  if (neOrigError) {
    console.error('[fardos/ne] Erro ao registrar N/E do fardo original:', neOrigError)
  }

  // Refresh naoEncontradosSet after registering current bale
  naoEncontradosSet.add(codigo_in as string)

  if (isCascataBale) {
    // === CASCADE CHAIN PATH (D-09/D-10/D-11) ===
    // Use findCascadeBales instead of findAlternativeBale for cascade bales
    const cascadeResult = findCascadeBales(
      stock,
      reserva.sku,
      reserva.quantidade,
      reservedSet,
      naoEncontradosSet,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cascadeCardKey = (trafegoEntry as any)?.card_key ?? null

    if (cascadeResult.fardos.length > 0) {
      // Found cascade alternative bales
      for (const bale of cascadeResult.fardos) {
        const { data: newReserva, error: insertError } = await supabaseAdmin
          .from('reservas')
          .insert({
            codigo_in: bale.codigo_in,
            sku: bale.sku,
            quantidade: bale.quantidade,
            endereco: bale.endereco,
            status: 'reservado',
            importacao_numero: reserva.importacao_numero,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('[fardos/ne] Erro ao inserir reserva cascata:', insertError)
          return NextResponse.json({ error: 'Erro ao reservar fardo cascata' }, { status: 500 })
        }

        // Insert trafego_fardos with is_cascata=true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabaseAdmin.from('trafego_fardos').insert({
          codigo_in: bale.codigo_in,
          sku: bale.sku,
          quantidade: bale.quantidade,
          endereco: bale.endereco,
          status: 'pendente',
          reserva_id: newReserva.id,
          is_cascata: true,
          card_key: cascadeCardKey,
        } as any)
      }

      // Cancel original reserva
      const { error: cancelError } = await supabaseAdmin
        .from('reservas')
        .update({ status: 'cancelado' })
        .eq('id', reserva_id)

      if (cancelError) {
        console.error('[fardos/ne] Erro ao cancelar reserva original:', cancelError)
      }

      return NextResponse.json({
        found_alternative: true,
        novo_codigo_in: cascadeResult.fardos[0].codigo_in,
      })
    }

    // D-11: No bales left -- create transformacao record
    if (cascadeResult.quantidade_transformacao > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any).from('transformacoes').insert({
        sku: reserva.sku,
        quantidade: cascadeResult.quantidade_transformacao,
        card_key: cascadeCardKey,
        status: 'pendente',
      } as any)

      // Update progresso for pedidos with this SKU to 'transformacao'
      const { data: pedidos } = await supabaseAdmin
        .from('pedidos')
        .select('id')
        .eq('sku', reserva.sku)

      if (pedidos?.length) {
        await supabaseAdmin
          .from('progresso')
          .update({ status: 'transformacao' as any, updated_at: new Date().toISOString() })
          .in('pedido_id', pedidos.map(p => p.id))
          .eq('status', 'aguardar_fardista')
      }
    }

    // Cancel original reserva
    const { error: cancelError } = await supabaseAdmin
      .from('reservas')
      .update({ status: 'cancelado' })
      .eq('id', reserva_id)

    if (cancelError) {
      console.error('[fardos/ne] Erro ao cancelar reserva cascata:', cancelError)
    }

    return NextResponse.json({ found_alternative: false, transformacao: true })
  }

  // === NORMAL (NON-CASCADE) PATH ===
  // 6b. Buscar alternativo (is_cascata=false -- Phase 6 flow)
  const alternativo = findAlternativeBale(
    stock,
    reserva.sku,
    reserva.quantidade,
    reservedSet,
    false,
    codigo_in as string,
    naoEncontradosSet
  )

  if (alternativo) {
    // 6a. Encontrou alternativo (D-21)

    // Inserir nova reserva com o fardo alternativo
    const { error: insertError } = await supabaseAdmin
      .from('reservas')
      .insert({
        codigo_in: alternativo.codigo_in,
        sku: alternativo.sku,
        quantidade: alternativo.quantidade,
        endereco: alternativo.endereco,
        status: 'reservado',
        importacao_numero: reserva.importacao_numero,
      })

    if (insertError) {
      console.error('[fardos/ne] Erro ao inserir reserva alternativa:', insertError)
      return NextResponse.json({ error: 'Erro ao reservar alternativo' }, { status: 500 })
    }

    // Cancelar reserva original
    const { error: cancelError } = await supabaseAdmin
      .from('reservas')
      .update({ status: 'cancelado' })
      .eq('id', reserva_id)

    if (cancelError) {
      console.error('[fardos/ne] Erro ao cancelar reserva original:', cancelError)
    }

    return NextResponse.json({
      found_alternative: true,
      novo_codigo_in: alternativo.codigo_in,
    })
  }

  // 7. NAO encontrou alternativo (D-22)
  // N/E already registered above (before alternative search)

  // 7b. Cancelar reserva
  const { error: cancelError } = await supabaseAdmin
    .from('reservas')
    .update({ status: 'cancelado' })
    .eq('id', reserva_id)

  if (cancelError) {
    console.error('[fardos/ne] Erro ao cancelar reserva:', cancelError)
  }

  // 7c. Liberar para prateleira (D-22): desbloquear pedidos com status='aguardar_fardista'
  let pedidoQuery = supabaseAdmin
    .from('pedidos')
    .select('id')
    .eq('sku', reserva.sku)

  if (reserva.importacao_numero != null) {
    pedidoQuery = pedidoQuery.eq('importacao_numero', reserva.importacao_numero)
  }

  const { data: pedidos } = await pedidoQuery

  if (pedidos && pedidos.length > 0) {
    const pedidoIds = pedidos.map(p => p.id)
    const { error: progressoError } = await supabaseAdmin
      .from('progresso')
      .update({ status: 'pendente' })
      .in('pedido_id', pedidoIds)
      .eq('status', 'aguardar_fardista')

    if (progressoError) {
      console.error('[fardos/ne] Erro ao liberar prateleira:', progressoError)
    }
  }

  // NAO apagar nada da planilha externa no fluxo N/E (D-22)

  return NextResponse.json({ found_alternative: false })
}

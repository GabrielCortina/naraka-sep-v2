import { NextRequest } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { classifyOrders, generateCardKey } from '@/features/upload/lib/classify'
import { classifyEnvio } from '@/features/upload/lib/envio-groups'
import { executeReservation } from '@/features/fardos/utils/reservation-engine'
import type { ParsedRow } from '@/features/upload/lib/parse-xlsx'
import type { TablesInsert } from '@/types/database.types'
import type { TipoPedido } from '@/types'

function getTodayBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function POST(request: NextRequest) {
  const authSupabase = await createAuthClient()

  // 1. Autenticacao
  const { data: { user }, error: authError } = await authSupabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // 2. Verificar role (admin ou lider)
  const { data: userData } = await authSupabase
    .from('users').select('role').eq('id', user.id).single()
  if (!userData || !['admin', 'lider'].includes(userData.role)) {
    return Response.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // Service role client para operações de escrita (bypassa RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Validar body
  let body: { rows: ParsedRow[]; filtered_status: number; filtered_envio: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body invalido' }, { status: 400 })
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return Response.json({ error: 'Nenhuma linha para processar' }, { status: 400 })
  }

  const today = getTodayBrasilia()
  let dayReset = false

  // 4. Virada de dia
  const { data: dataConfig } = await supabase
    .from('config').select('valor').eq('chave', 'ultima_importacao_data').single()

  if (!dataConfig || dataConfig.valor !== today) {
    // Snapshot historico before cleanup (D-13)
    const [snapPedidos, snapProgresso, snapAtrib, snapBaixados, snapTransf, snapUsers] = await Promise.all([
      supabase.from('pedidos').select('id, card_key, grupo_envio, tipo, sku, quantidade, importacao_numero'),
      supabase.from('progresso').select('pedido_id, quantidade_separada, status'),
      supabase.from('atribuicoes').select('card_key, user_id, tipo'),
      supabase.from('baixados').select('codigo_in, baixado_por'),
      supabase.from('transformacoes').select('card_key, quantidade'),
      supabase.from('users').select('id, role, nome'),
    ])

    // Guard: only snapshot if previous day had actual work (Research Pitfall 2)
    if (snapPedidos.data && snapProgresso.data && snapProgresso.data.length > 0 && snapUsers.data) {
      const { buildSnapshotRows } = await import('@/features/dashboard/lib/snapshot')
      const snapshotRows = buildSnapshotRows({
        pedidos: snapPedidos.data,
        progresso: snapProgresso.data,
        atribuicoes: snapAtrib.data ?? [],
        baixados: snapBaixados.data ?? [],
        transformacoes: snapTransf.data ?? [],
        users: snapUsers.data,
      }, dataConfig?.valor ?? today)
      if (snapshotRows.length > 0) {
        await supabase.from('historico_diario').insert(snapshotRows)
      }
    }

    // WARNING: Deleting reservas CASCADE-deletes trafego_fardos (FK ON DELETE CASCADE).
    // baixados survives (FK dropped in 00010_baixados_full_data.sql).
    // The snapshot above MUST run before these deletes to capture trafego_fardos data.

    // Limpar tabelas na ordem FK-safe
    // NAO limpar: trafego_fardos, baixados, fardos_nao_encontrados (historico de fardos preservado)
    await supabase.from('atribuicoes').delete().neq('id', '')
    await supabase.from('progresso').delete().neq('id', '')
    await supabase.from('reservas').delete().neq('id', '')
    await supabase.from('pedidos').delete().neq('id', '')

    // Atualizar ou inserir config de data
    await supabase
      .from('config')
      .upsert({ chave: 'ultima_importacao_data', valor: today }, { onConflict: 'chave' })

    // Resetar contador de importacao
    await supabase
      .from('config')
      .upsert({ chave: 'ultimo_importacao_numero', valor: '0' }, { onConflict: 'chave' })

    dayReset = true
  }

  // 5. Incrementar numero de importacao
  const { data: numConfig } = await supabase
    .from('config').select('valor').eq('chave', 'ultimo_importacao_numero').single()

  const importacao_numero = numConfig ? Number(numConfig.valor) + 1 : 1

  // 6. Classificar pedidos (agrupa por numero_pedido e determina tipo)
  const groups = classifyOrders(body.rows)

  // 7. Classificar metodo de envio para cada item
  const groupsWithEnvio = groups.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      grupo_envio: classifyEnvio(item.metodo_envio),
    })),
  }))

  // 8. Deduplicar contra banco (entre importacoes, nunca dentro da mesma planilha)
  const uniqueNums = Array.from(new Set(groupsWithEnvio.map(g => g.numero_pedido)))

  const existingNums = new Set<string>()
  if (uniqueNums.length > 0) {
    // Consultar em chunks de 500 para evitar limites
    for (let i = 0; i < uniqueNums.length; i += 500) {
      const chunk = uniqueNums.slice(i, i + 500)
      const { data: existing } = await supabase
        .from('pedidos')
        .select('numero_pedido')
        .in('numero_pedido', chunk)

      if (existing) {
        for (const row of existing) {
          existingNums.add(row.numero_pedido)
        }
      }
    }
  }

  const duplicados = groupsWithEnvio.filter(g => existingNums.has(g.numero_pedido)).length
  const newGroups = groupsWithEnvio.filter(g => !existingNums.has(g.numero_pedido))

  // Se tudo duplicado, retornar sem inserir e sem criar importacao
  if (newGroups.length === 0) {
    return Response.json({
      success: true,
      dayReset,
      importacao_numero: importacao_numero - 1, // nao incrementou
      summary: {
        total_validos: 0,
        filtered_status: body.filtered_status ?? 0,
        filtered_envio: body.filtered_envio ?? 0,
        duplicados,
        por_tipo: { unitario: 0, kit: 0, combo: 0 },
        por_grupo: {},
      },
    })
  }

  // 9. Gerar records para insert
  const records: TablesInsert<'pedidos'>[] = []
  const porTipo: Record<TipoPedido, number> = { unitario: 0, kit: 0, combo: 0 }
  const porGrupo: Record<string, number> = {}

  for (const group of newGroups) {
    porTipo[group.tipo]++

    for (const item of group.items) {
      const grupo_envio = (item as ParsedRow & { grupo_envio: string }).grupo_envio
      porGrupo[grupo_envio] = (porGrupo[grupo_envio] ?? 0) + 1

      const card_key = generateCardKey(grupo_envio, group.tipo, importacao_numero)

      records.push({
        numero_pedido: group.numero_pedido,
        numero_pedido_plataforma: item.numero_pedido_plataforma,
        plataforma: item.plataforma,
        loja: item.loja,
        prazo_envio: item.prazo_envio || null,
        sku: item.sku,
        quantidade: item.quantidade,
        variacao: item.variacao,
        nome_produto: item.nome_produto,
        metodo_envio: item.metodo_envio,
        grupo_envio,
        tipo: group.tipo,
        card_key,
        importacao_numero,
        importacao_data: today,
      })
    }
  }

  // 10. Persistir no Supabase (chunked insert de 500)
  console.log(`[upload] Inserindo ${records.length} registros em chunks de 500`)
  console.log(`[upload] Primeiro registro:`, JSON.stringify(records[0], null, 2))
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500)
    const { error: insertError } = await supabase.from('pedidos').insert(chunk)
    if (insertError) {
      console.error(`[upload] ERRO ao inserir chunk ${i / 500 + 1}:`, insertError)
      console.error(`[upload] Código:`, insertError.code)
      console.error(`[upload] Mensagem:`, insertError.message)
      console.error(`[upload] Detalhes:`, insertError.details)
      console.error(`[upload] Hint:`, insertError.hint)
      return Response.json(
        { error: 'Erro ao inserir pedidos', details: insertError.message, code: insertError.code, hint: insertError.hint },
        { status: 500 }
      )
    }
  }

  // 11. Atualizar config com novo numero de importacao
  await supabase
    .from('config')
    .upsert({ chave: 'ultimo_importacao_numero', valor: String(importacao_numero) }, { onConflict: 'chave' })

  // 12. Reserva automatica de fardos (D-01)
  let estoque: { skus_fardo: number; skus_prateleira: number; fardos_reservados: number; parciais: string[]; indisponivel: boolean } | undefined

  try {
    const reservaResult = await executeReservation(importacao_numero)
    estoque = {
      skus_fardo: reservaResult.skus_fardo,
      skus_prateleira: reservaResult.skus_prateleira,
      fardos_reservados: reservaResult.fardos_reservados,
      parciais: reservaResult.parciais,
      indisponivel: reservaResult.indisponivel,
    }
  } catch (error) {
    console.error('[upload] Erro na reserva automatica:', error)
    estoque = {
      skus_fardo: 0,
      skus_prateleira: 0,
      fardos_reservados: 0,
      parciais: [],
      indisponivel: true,
    }
  }

  // 13. Retornar resultado
  return Response.json({
    success: true,
    dayReset,
    importacao_numero,
    summary: {
      total_validos: newGroups.length,
      filtered_status: body.filtered_status ?? 0,
      filtered_envio: body.filtered_envio ?? 0,
      duplicados,
      por_tipo: porTipo,
      por_grupo: porGrupo,
    },
    estoque,
  })
}

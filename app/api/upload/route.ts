import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyOrders, generateCardKey } from '@/features/upload/lib/classify'
import { classifyEnvio } from '@/features/upload/lib/envio-groups'
import type { ParsedRow } from '@/features/upload/lib/parse-xlsx'
import type { TablesInsert } from '@/types/database.types'
import type { TipoPedido } from '@/types'

function getTodayBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Autenticacao
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // 2. Verificar role (admin ou lider)
  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!userData || !['admin', 'lider'].includes(userData.role)) {
    return Response.json({ error: 'Sem permissao' }, { status: 403 })
  }

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
        prazo_envio: item.prazo_envio,
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
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500)
    const { error: insertError } = await supabase.from('pedidos').insert(chunk)
    if (insertError) {
      return Response.json(
        { error: 'Erro ao inserir pedidos', details: insertError.message },
        { status: 500 }
      )
    }
  }

  // 11. Atualizar config com novo numero de importacao
  await supabase
    .from('config')
    .upsert({ chave: 'ultimo_importacao_numero', valor: String(importacao_numero) }, { onConflict: 'chave' })

  // 12. Retornar resultado
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
  })
}

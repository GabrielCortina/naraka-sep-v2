import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
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

  // 3. Obter ultimo importacao_numero da config
  const { data: config } = await supabase
    .from('config').select('valor').eq('chave', 'ultimo_importacao_numero').single()

  if (!config || config.valor === '0') {
    return Response.json({ error: 'Nenhuma importacao para desfazer' }, { status: 404 })
  }

  const importacao_numero = Number(config.valor)

  // 4. Contar pedidos que serao removidos
  const { count } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('importacao_numero', importacao_numero)

  // 5. Buscar IDs dos pedidos da importacao para limpar dependencias FK
  const { data: pedidoIds } = await supabase
    .from('pedidos')
    .select('id')
    .eq('importacao_numero', importacao_numero)

  if (pedidoIds && pedidoIds.length > 0) {
    const ids = pedidoIds.map(p => p.id)

    // Limpar progresso e reservas (FK-safe antes de deletar pedidos)
    await supabase.from('progresso').delete().in('pedido_id', ids)
    await supabase.from('reservas').delete().in('pedido_id', ids)
  }

  // 6. Deletar pedidos da importacao
  await supabase
    .from('pedidos')
    .delete()
    .eq('importacao_numero', importacao_numero)

  // 7. Decrementar importacao_numero na config
  await supabase
    .from('config')
    .update({ valor: String(importacao_numero - 1) })
    .eq('chave', 'ultimo_importacao_numero')

  return Response.json({
    success: true,
    importacao_numero,
    pedidos_removidos: count ?? 0,
  })
}

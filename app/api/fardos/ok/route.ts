import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSheetData, clearSheetRange } from '@/lib/google-sheets'
import {
  findBaleInSheet,
  mapRowToTrafegoFields,
  validateRowMatch,
} from '@/features/fardos/utils/fardo-ok-handler'

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

  const trimmedCodigoIn = codigo_in.trim()

  // 3. Prevencao de duplicata (Pitfall 1): verificar se trafego_fardos ja tem este codigo_in com status='encontrado'
  const { data: existingTrafego } = await supabaseAdmin
    .from('trafego_fardos')
    .select('id')
    .eq('codigo_in', trimmedCodigoIn)
    .eq('status', 'encontrado')
    .maybeSingle()

  if (existingTrafego) {
    return NextResponse.json({ error: 'Fardo ja processado' }, { status: 409 })
  }

  // 4. Passo 1 (D-15): Buscar na planilha de estoque
  let rows: string[][] | null | undefined
  try {
    rows = await getSheetData('Estoque')
  } catch (error) {
    console.error('[fardos/ok] Erro ao ler planilha:', error)
    return NextResponse.json({ error: 'Erro ao acessar planilha de estoque' }, { status: 502 })
  }

  if (!rows || rows.length < 2) {
    return NextResponse.json({ error: 'Planilha de estoque vazia' }, { status: 404 })
  }

  const result = findBaleInSheet(rows, trimmedCodigoIn)
  if (!result) {
    return NextResponse.json({ error: 'Fardo nao encontrado na planilha' }, { status: 404 })
  }

  // 5. Passo 2 (D-16): Mapear e inserir no trafego_fardos
  const mapped = mapRowToTrafegoFields(result.rowData, result.headers)

  // Validar campos obrigatorios do trafego_fardos
  if (!mapped.sku) {
    return NextResponse.json({ error: 'SKU nao encontrado na planilha' }, { status: 422 })
  }

  // Campos extras da migration 00005 nao estao nos types gerados ainda
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: Record<string, any> = {
    reserva_id: reserva_id,
    codigo_in: trimmedCodigoIn,
    sku: mapped.sku,
    quantidade: mapped.quantidade,
    endereco: mapped.endereco,
    status: 'encontrado',
    fardista_id: user.id,
    fardista_nome: userData.nome,
    clicked_at: new Date().toISOString(),
    prioridade: mapped.prioridade,
    prateleira: mapped.prateleira,
    posicao: mapped.posicao,
    altura: mapped.altura,
    data_entrada: mapped.data_entrada,
    hora_entrada: mapped.hora_entrada,
    operador: mapped.operador,
    transferencia: mapped.transferencia,
    data_transferencia: mapped.data_transferencia,
    operador_transferencia: mapped.operador_transferencia,
  }

  const { error: insertError } = await supabaseAdmin
    .from('trafego_fardos')
    // Migration 00005 columns not yet in generated types — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertData as any)

  // D-18: Se insert falhar, retornar 500 SEM tocar na planilha
  if (insertError) {
    console.error('[fardos/ok] Erro ao inserir trafego_fardos:', insertError)
    return NextResponse.json({ error: 'Erro ao registrar fardo' }, { status: 500 })
  }

  // 6. Passo 3 (D-17): Dupla verificacao - re-ler linha e confirmar
  const sheetRow = result.rowIndex + 1 // 1-indexed para Google Sheets
  let recheckRows: string[][] | null | undefined
  try {
    recheckRows = await getSheetData(`Estoque!A${sheetRow}:N${sheetRow}`)
  } catch (error) {
    console.error('[fardos/ok] Erro na dupla verificacao:', error)
    // D-18: manter registro no trafego, retornar erro de conflito
    return NextResponse.json({ error: 'Erro ao verificar planilha' }, { status: 502 })
  }

  if (!recheckRows || recheckRows.length === 0) {
    console.error('[fardos/ok] Linha nao encontrada na re-leitura')
    return NextResponse.json({ error: 'Conflito na planilha - linha removida' }, { status: 409 })
  }

  const isValid = validateRowMatch(trimmedCodigoIn, recheckRows[0], result.headers)
  if (!isValid) {
    // D-18: manter registro no trafego mas nao apagar da planilha
    return NextResponse.json({ error: 'Conflito na planilha' }, { status: 409 })
  }

  // 7. Apagar colunas F+ (index 5 em diante): clearSheetRange
  let sheetCleared = false
  try {
    await clearSheetRange(`Estoque!F${sheetRow}:N${sheetRow}`)
    sheetCleared = true
  } catch (error) {
    // D-18: logar erro mas NAO desfazer o insert no trafego
    console.error('[fardos/ok] Erro ao apagar colunas F+ da planilha:', error)
  }

  // 8. Nao atualizar status da reserva pois CHECK constraint so permite 'reservado'|'cancelado'
  // O status 'encontrado' e rastreado via trafego_fardos, nao na reserva

  return NextResponse.json({ success: true, sheet_cleared: sheetCleared })
}

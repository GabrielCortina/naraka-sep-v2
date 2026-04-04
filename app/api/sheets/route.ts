import { getSheetData } from '@/lib/google-sheets'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await getSheetData('Estoque!A:F')
    return NextResponse.json({
      success: true,
      rows: data?.length ?? 0,
      data,
    })
  } catch (error) {
    console.error('Erro ao acessar planilha:', error)
    return NextResponse.json(
      { success: false, error: 'Falha ao acessar planilha de estoque' },
      { status: 500 }
    )
  }
}

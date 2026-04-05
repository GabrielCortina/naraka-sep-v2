import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FardoItem } from '../types'

/**
 * Gera PDF com lista de fardos (D-26, D-27).
 * Se fardos selecionados, imprime selecionados. Se vazio, imprime todos.
 * Conteudo: Codigo IN, SKU, Endereco, Qtd, Entregar para (nome separador ou "---")
 */
export function generateFardosPdf(fardos: FardoItem[]): void {
  const doc = new jsPDF()

  // Titulo (UI-SPEC: 14pt, top-left, y=20mm)
  doc.setFontSize(14)
  doc.text('Lista de Fardos', 14, 20)

  // Tabela (UI-SPEC: y=30mm, colunas com proporcoes definidas)
  autoTable(doc, {
    startY: 30,
    head: [['Codigo IN', 'SKU', 'Endereco', 'Qtd', 'Entregar para']],
    body: fardos.map((f) => [
      f.codigo_in,
      f.sku,
      f.endereco ?? '',
      String(f.quantidade),
      f.separador_nome ?? '---',
    ]),
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 18 },
      4: { cellWidth: 37 },
    },
  })

  doc.save('fardos.pdf')
}

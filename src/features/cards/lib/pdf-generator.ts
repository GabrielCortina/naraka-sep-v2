import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CardData } from '../types'

export function generateChecklist(card: CardData): void {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(
    `${card.grupo_envio} - ${card.tipo} - Importacao #${card.importacao_numero}`,
    14,
    20
  )

  autoTable(doc, {
    startY: 30,
    head: [['SKU', 'Qtd', 'Check']],
    body: card.items.map((item) => [
      item.sku,
      String(item.quantidade_necessaria),
      '[ ]',
    ]),
    styles: { fontSize: 10 },
  })

  doc.save(`checklist-${card.card_key}.pdf`)
}

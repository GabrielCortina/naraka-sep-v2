import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CardData } from '../../types'

const mockText = vi.fn()
const mockSave = vi.fn()
const mockSetFontSize = vi.fn()

vi.mock('jspdf', () => {
  const MockJsPDF = vi.fn(function (this: Record<string, unknown>) {
    this.text = mockText
    this.save = mockSave
    this.setFontSize = mockSetFontSize
  })
  return { default: MockJsPDF }
})

const mockAutoTable = vi.fn()

vi.mock('jspdf-autotable', () => {
  return {
    default: mockAutoTable,
  }
})

describe('generateChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const card: CardData = {
    card_key: 'Shopee SPX|Unitario|1',
    grupo_envio: 'Shopee SPX',
    tipo: 'Unitario',
    importacao_numero: 1,
    items: [
      {
        sku: 'SKU-001',
        quantidade_necessaria: 10,
        quantidade_separada: 0,
        status: 'pendente',
        pedido_ids: ['P1'],
        reservas: [],
      },
      {
        sku: 'SKU-002',
        quantidade_necessaria: 5,
        quantidade_separada: 0,
        status: 'pendente',
        pedido_ids: ['P2'],
        reservas: [],
      },
    ],
    total_pecas: 15,
    pecas_separadas: 0,
    atribuido_a: null,
    urgency: 'ok',
  }

  it('calls doc.text with title containing grupo_envio', async () => {
    const { generateChecklist } = await import('../pdf-generator')
    generateChecklist(card)

    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining('Shopee SPX'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('calls autoTable with head SKU, Qtd, Check', async () => {
    const { generateChecklist } = await import('../pdf-generator')
    generateChecklist(card)

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        head: [['SKU', 'Qtd', 'Check']],
      })
    )
  })

  it('creates body with one row per item containing sku, quantity, and checkbox', async () => {
    const { generateChecklist } = await import('../pdf-generator')
    generateChecklist(card)

    const callArgs = mockAutoTable.mock.calls[0][1]
    expect(callArgs.body).toEqual([
      ['SKU-001', '10', '[ ]'],
      ['SKU-002', '5', '[ ]'],
    ])
  })

  it('calls doc.save with filename containing card_key', async () => {
    const { generateChecklist } = await import('../pdf-generator')
    generateChecklist(card)

    expect(mockSave).toHaveBeenCalledWith(
      expect.stringContaining('Shopee SPX|Unitario|1')
    )
  })
})

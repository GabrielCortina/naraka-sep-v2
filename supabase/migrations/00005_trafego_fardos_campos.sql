-- Migration 00005: Adicionar campos da planilha de estoque na tabela trafego_fardos (D-31)
-- Phase 06: Lista de Fardos - campos necessarios para lista plana do fardista

ALTER TABLE trafego_fardos
  ADD COLUMN IF NOT EXISTS prioridade TEXT,
  ADD COLUMN IF NOT EXISTS prateleira TEXT,
  ADD COLUMN IF NOT EXISTS posicao TEXT,
  ADD COLUMN IF NOT EXISTS altura TEXT,
  ADD COLUMN IF NOT EXISTS data_entrada TEXT,
  ADD COLUMN IF NOT EXISTS hora_entrada TEXT,
  ADD COLUMN IF NOT EXISTS operador TEXT,
  ADD COLUMN IF NOT EXISTS transferencia TEXT,
  ADD COLUMN IF NOT EXISTS data_transferencia TEXT,
  ADD COLUMN IF NOT EXISTS operador_transferencia TEXT,
  ADD COLUMN IF NOT EXISTS fardista_nome TEXT,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- Index para busca por status (filtros da lista)
CREATE INDEX IF NOT EXISTS idx_trafego_status ON trafego_fardos(status);

-- Adicionar campos em fardos_nao_encontrados para registro completo do N/E (D-22, Research Pitfall 4)
-- Schema atual: codigo_in, trafego_id (NOT NULL), reportado_por, reportado_em
-- D-22 exige: sku, quantidade, endereco, fardista_nome, fardista_id + trafego_id nullable
ALTER TABLE fardos_nao_encontrados
  ALTER COLUMN trafego_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS quantidade INTEGER,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS fardista_nome TEXT,
  ADD COLUMN IF NOT EXISTS fardista_id UUID REFERENCES users(id);

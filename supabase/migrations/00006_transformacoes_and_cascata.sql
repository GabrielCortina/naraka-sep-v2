-- Migration 00006: Tabela transformacoes + coluna is_cascata em trafego_fardos
-- Phase 07: Lista de Prateleira e Cascata

-- 1. New table: transformacoes (per D-17)
CREATE TABLE transformacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  card_key TEXT NOT NULL,
  numero_pedido TEXT,
  lider_id UUID REFERENCES users(id),
  lider_nome TEXT,
  separador_id UUID REFERENCES users(id),
  separador_nome TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atribuido', 'concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_at TIMESTAMPTZ
);

-- 2. Add is_cascata to trafego_fardos (per D-04, D-14)
ALTER TABLE trafego_fardos
  ADD COLUMN IF NOT EXISTS is_cascata BOOLEAN NOT NULL DEFAULT false;

-- 3. Enable realtime for transformacoes
ALTER PUBLICATION supabase_realtime ADD TABLE transformacoes;

-- 4. RLS for transformacoes
ALTER TABLE transformacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read transformacoes"
  ON transformacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage transformacoes"
  ON transformacoes FOR ALL TO service_role USING (true);

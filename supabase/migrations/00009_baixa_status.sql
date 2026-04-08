-- Migration 00009: Add 'baixado' to trafego_fardos status CHECK constraint
-- Phase 08: Baixa de Fardos

-- Drop existing CHECK constraint and recreate with 'baixado' added
ALTER TABLE trafego_fardos DROP CONSTRAINT IF EXISTS trafego_fardos_status_check;
ALTER TABLE trafego_fardos ADD CONSTRAINT trafego_fardos_status_check
  CHECK (status IN ('pendente', 'encontrado', 'nao_encontrado', 'baixado'));

-- Add UNIQUE constraint on baixados.codigo_in to prevent duplicate baixas at DB level (Pitfall 1)
ALTER TABLE baixados ADD CONSTRAINT baixados_codigo_in_unique UNIQUE (codigo_in);

-- RLS write policy for baixados (fardista/admin/lider can insert)
CREATE POLICY "Authenticated users can read baixados"
  ON baixados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage baixados"
  ON baixados FOR ALL TO service_role USING (true);

-- Add baixados to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE baixados;

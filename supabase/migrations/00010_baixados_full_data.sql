-- Migration 00010: Restructure baixados to hold full trafego_fardos data
-- Phase 08: Baixa de Fardos - baixados stores complete fardo data,
-- trafego_fardos row is deleted after baixa

-- 1. Drop FK on trafego_id (row will be deleted after copy)
ALTER TABLE baixados DROP CONSTRAINT IF EXISTS baixados_trafego_id_fkey;

-- 2. Make trafego_id nullable (historical reference only)
ALTER TABLE baixados ALTER COLUMN trafego_id DROP NOT NULL;

-- 3. Add full trafego_fardos columns to baixados
ALTER TABLE baixados
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS quantidade INTEGER,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS reserva_id UUID,
  ADD COLUMN IF NOT EXISTS fardista_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS fardista_nome TEXT;

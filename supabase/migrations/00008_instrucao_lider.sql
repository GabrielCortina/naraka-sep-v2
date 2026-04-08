-- Add instrucao_lider column to transformacoes table
-- Nullable text field for leader instructions per SKU
ALTER TABLE transformacoes ADD COLUMN instrucao_lider text;

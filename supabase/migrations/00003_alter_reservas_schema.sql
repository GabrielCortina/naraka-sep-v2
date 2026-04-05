-- Migration: Alterar tabela reservas para schema por SKU puro (D-09)
-- Remove FK pedido_id, adiciona importacao_numero, partial unique index

-- 1. Remover FK constraint e coluna pedido_id
ALTER TABLE reservas DROP CONSTRAINT reservas_pedido_id_fkey;
ALTER TABLE reservas DROP COLUMN pedido_id;

-- 2. Remover index que referenciava pedido_id
DROP INDEX IF EXISTS idx_reservas_pedido;

-- 3. Adicionar coluna importacao_numero para rastreabilidade
ALTER TABLE reservas ADD COLUMN importacao_numero INTEGER;

-- 4. Partial unique index: cada fardo (codigo_in) so pode ser reservado uma vez enquanto ativo (D-04, D-09)
CREATE UNIQUE INDEX idx_reservas_codigo_in_reservado
  ON reservas(codigo_in)
  WHERE (status = 'reservado');

-- 5. Index por SKU para queries de demanda (criar se nao existe)
CREATE INDEX IF NOT EXISTS idx_reservas_sku ON reservas(sku);

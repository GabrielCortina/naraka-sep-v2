-- Migration 00007: Add numero_transformacao column to transformacoes table
-- Phase 07.1: Aba de Transformacao

ALTER TABLE transformacoes
  ADD COLUMN numero_transformacao INTEGER NOT NULL DEFAULT 1;

-- Index for efficient grouping by card_key + numero_transformacao
CREATE INDEX idx_transformacoes_card_key_numero ON transformacoes(card_key, numero_transformacao);

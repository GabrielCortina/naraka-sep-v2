CREATE TABLE historico_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  grupo_envio TEXT NOT NULL,
  pecas_separadas INTEGER NOT NULL DEFAULT 0,
  cards_concluidos INTEGER NOT NULL DEFAULT 0,
  fardos_confirmados INTEGER NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_historico_data ON historico_diario(data);
CREATE INDEX idx_historico_user_data ON historico_diario(user_id, data);

ALTER TABLE historico_diario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura autenticada" ON historico_diario FOR SELECT TO authenticated USING (true);

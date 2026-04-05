-- RLS write policies para Phase 5: Cards e UI Foundation
-- Sem estas policies, upserts do browser client sao bloqueados pelo RLS

-- progresso: qualquer usuario autenticado pode inserir/atualizar progresso
-- Validacao de role e quantidade e feita no API route handler, nao no RLS
CREATE POLICY "Escrita autenticada progresso" ON progresso
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Atualizacao autenticada progresso" ON progresso
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- atribuicoes: apenas lider e admin podem inserir/atualizar atribuicoes
-- Usa claim user_role do JWT (injetado pelo Custom Access Token Hook da Phase 2)
CREATE POLICY "Escrita lider/admin atribuicoes" ON atribuicoes
  FOR INSERT TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('admin', 'lider')
  );

CREATE POLICY "Atualizacao lider/admin atribuicoes" ON atribuicoes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('admin', 'lider')
  );

-- DELETE para atribuicoes (permitir reatribuicao via delete + insert)
CREATE POLICY "Delete lider/admin atribuicoes" ON atribuicoes
  FOR DELETE TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'user_role') IN ('admin', 'lider')
  );

-- Habilitar Realtime publication para tabelas usadas nos cards
-- Pitfall 1 do RESEARCH.md: sem isso, subscriptions conectam mas nao recebem eventos
ALTER PUBLICATION supabase_realtime ADD TABLE progresso;
ALTER PUBLICATION supabase_realtime ADD TABLE atribuicoes;
ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
ALTER PUBLICATION supabase_realtime ADD TABLE trafego_fardos;

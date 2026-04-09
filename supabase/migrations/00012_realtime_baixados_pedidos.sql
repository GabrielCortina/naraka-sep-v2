-- Add pedidos to realtime publication for dashboard subscriptions
-- NOTE: baixados already added in 00009_baixa_status.sql -- do NOT re-add
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;

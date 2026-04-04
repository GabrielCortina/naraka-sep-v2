-- Seed: usuario admin para desenvolvimento
-- PIN: 1234 -> SHA-256: 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
INSERT INTO users (nome, pin_hash, role) VALUES
  ('Admin Dev', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'admin');
